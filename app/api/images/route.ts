// app/api/images/route.ts - Images API
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Type definitions
interface ImageCreateData {
  fileName: string;
  filePath: string;
  fileSize?: number;
  fileType?: string;
  description?: string;
  altText?: string;
  width?: number;
  height?: number;
  originalFileName?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// GET - Images listele
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parametreleri
    const isActive = searchParams.get('active')
    const search = searchParams.get('search')
    const fileType = searchParams.get('fileType')
    const minSize = searchParams.get('minSize')
    const maxSize = searchParams.get('maxSize')
    const minWidth = searchParams.get('minWidth')
    const maxWidth = searchParams.get('maxWidth')
    const minHeight = searchParams.get('minHeight')
    const maxHeight = searchParams.get('maxHeight')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const sortBy = searchParams.get('sortBy') || 'uploadedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const includeUsage = searchParams.get('includeUsage') === 'true'

    // Where koşulları
    let whereClause: any = {}

    // Aktif/pasif filtresi
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    // Dosya tipi filtresi
    if (fileType?.trim()) {
      whereClause.fileType = {
        equals: fileType.trim(),
        mode: 'insensitive'
      }
    }

    // Dosya boyutu filtresi
    if (minSize || maxSize) {
      whereClause.fileSize = {}
      if (minSize && !isNaN(parseInt(minSize))) {
        whereClause.fileSize.gte = parseInt(minSize)
      }
      if (maxSize && !isNaN(parseInt(maxSize))) {
        whereClause.fileSize.lte = parseInt(maxSize)
      }
    }

    // Genişlik filtresi
    if (minWidth || maxWidth) {
      whereClause.width = {}
      if (minWidth && !isNaN(parseInt(minWidth))) {
        whereClause.width.gte = parseInt(minWidth)
      }
      if (maxWidth && !isNaN(parseInt(maxWidth))) {
        whereClause.width.lte = parseInt(maxWidth)
      }
    }

    // Yükseklik filtresi
    if (minHeight || maxHeight) {
      whereClause.height = {}
      if (minHeight && !isNaN(parseInt(minHeight))) {
        whereClause.height.gte = parseInt(minHeight)
      }
      if (maxHeight && !isNaN(parseInt(maxHeight))) {
        whereClause.height.lte = parseInt(maxHeight)
      }
    }

    // Arama filtresi
    if (search?.trim()) {
      whereClause.OR = [
        { fileName: { contains: search.trim(), mode: 'insensitive' } },
        { originalFileName: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { altText: { contains: search.trim(), mode: 'insensitive' } }
      ]
    }

    // Sıralama seçenekleri
    const validSortFields = ['fileName', 'fileSize', 'uploadedAt', 'width', 'height', 'imageId']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'uploadedAt'
    const orderBy: any = {}
    orderBy[sortField] = sortOrder === 'asc' ? 'asc' : 'desc'

    // Sayfalama
    const skip = (page - 1) * limit

    // Include seçenekleri
    const includeOptions: any = {
      _count: {
        select: {
          furnitureImages: true,
          furnitureSetImages: true
        }
      }
    }

    if (includeUsage) {
      includeOptions.furnitureImages = {
        include: {
          furniture: {
            select: {
              furnitureId: true,
              furnitureName: true,
              furnitureType: true,
              isActive: true
            }
          }
        }
      }
      includeOptions.furnitureSetImages = {
        include: {
          furnitureSet: {
            select: {
              setId: true,
              setName: true,
              isActive: true
            }
          }
        }
      }
    }

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where: whereClause,
        include: includeOptions,
        orderBy,
        skip,
        take: limit
      }),
      prisma.image.count({ where: whereClause })
    ])

    // İstatistikler
    const stats = await prisma.image.aggregate({
      where: whereClause,
      _count: { imageId: true },
      _avg: { fileSize: true, width: true, height: true },
      _min: { fileSize: true, width: true, height: true },
      _max: { fileSize: true, width: true, height: true },
      _sum: { fileSize: true }
    })

    // Dosya tipi istatistikleri
    const fileTypeStats = await prisma.image.groupBy({
      by: ['fileType'],
      where: whereClause,
      _count: { imageId: true },
      _sum: { fileSize: true }
    })

    return NextResponse.json({
      success: true,
      data: images,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      stats: {
        total: stats._count.imageId,
        averageFileSize: stats._avg.fileSize,
        minFileSize: stats._min.fileSize,
        maxFileSize: stats._max.fileSize,
        totalFileSize: stats._sum.fileSize,
        averageWidth: stats._avg.width,
        averageHeight: stats._avg.height,
        minWidth: stats._min.width,
        maxWidth: stats._max.width,
        minHeight: stats._min.height,
        maxHeight: stats._max.height,
        fileTypeBreakdown: fileTypeStats
      },
      filters: {
        isActive,
        search,
        fileType,
        minSize: minSize ? parseInt(minSize) : null,
        maxSize: maxSize ? parseInt(maxSize) : null,
        minWidth: minWidth ? parseInt(minWidth) : null,
        maxWidth: maxWidth ? parseInt(maxWidth) : null,
        minHeight: minHeight ? parseInt(minHeight) : null,
        maxHeight: maxHeight ? parseInt(maxHeight) : null
      },
      sort: { sortBy: sortField, sortOrder }
    })

  } catch (error) {
    console.error('Images listesi hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Images getirilemedi',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}

// POST - Yeni image ekle
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const {
      fileName,
      filePath,
      fileSize,
      fileType,
      description,
      altText,
      width,
      height,
      originalFileName,
      sortOrder = 1,
      isActive = true
    } = data

    // Temel validasyonlar
    const validationErrors = []

    if (!fileName || typeof fileName !== 'string' || fileName.trim().length === 0) {
      validationErrors.push('Dosya adı zorunludur')
    } else if (fileName.trim().length > 255) {
      validationErrors.push('Dosya adı 255 karakterden uzun olamaz')
    }

    if (!filePath || typeof filePath !== 'string' || filePath.trim().length === 0) {
      validationErrors.push('Dosya yolu zorunludur')
    } else if (filePath.trim().length > 500) {
      validationErrors.push('Dosya yolu 500 karakterden uzun olamaz')
    }

    if (fileSize !== undefined && fileSize !== null) {
      if (isNaN(parseInt(String(fileSize))) || parseInt(String(fileSize)) < 0) {
        validationErrors.push('Dosya boyutu geçerli bir sayı olmalıdır')
      } else if (parseInt(String(fileSize)) > 104857600) { // 100MB limit
        validationErrors.push('Dosya boyutu 100MB\'dan büyük olamaz')
      }
    }

    if (fileType && (typeof fileType !== 'string' || fileType.trim().length > 10)) {
      validationErrors.push('Dosya tipi 10 karakterden uzun olamaz')
    }

    if (description && typeof description === 'string' && description.length > 1000) {
      validationErrors.push('Açıklama 1000 karakterden uzun olamaz')
    }

    if (altText && (typeof altText !== 'string' || altText.length > 255)) {
      validationErrors.push('Alt text 255 karakterden uzun olamaz')
    }

    if (width !== undefined && width !== null) {
      if (isNaN(parseInt(String(width))) || parseInt(String(width)) <= 0) {
        validationErrors.push('Genişlik geçerli bir pozitif sayı olmalıdır')
      } else if (parseInt(String(width)) > 10000) {
        validationErrors.push('Genişlik 10000 piksel\'den büyük olamaz')
      }
    }

    if (height !== undefined && height !== null) {
      if (isNaN(parseInt(String(height))) || parseInt(String(height)) <= 0) {
        validationErrors.push('Yükseklik geçerli bir pozitif sayı olmalıdır')
      } else if (parseInt(String(height)) > 10000) {
        validationErrors.push('Yükseklik 10000 piksel\'den büyük olamaz')
      }
    }

    if (originalFileName && (typeof originalFileName !== 'string' || originalFileName.length > 255)) {
      validationErrors.push('Orijinal dosya adı 255 karakterden uzun olamaz')
    }

    if (sortOrder !== undefined && (isNaN(parseInt(String(sortOrder))) || parseInt(String(sortOrder)) < 0)) {
      validationErrors.push('Sıralama değeri geçerli bir pozitif sayı olmalıdır')
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validasyon hatası',
        validationErrors
      }, { status: 400 })
    }

    // Aynı dosya yolu kontrolü
    const existingImage = await prisma.image.findFirst({
      where: {
        filePath: {
          equals: filePath.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (existingImage) {
      return NextResponse.json({
        success: false,
        error: 'Bu dosya yolu zaten kullanılıyor'
      }, { status: 400 })
    }

    // Image oluştur
    const result = await prisma.image.create({
      data: {
        fileName: fileName.trim(),
        filePath: filePath.trim(),
        fileSize: fileSize ? parseInt(String(fileSize)) : null,
        fileType: fileType?.trim() || null,
        description: description?.trim() || null,
        altText: altText?.trim() || null,
        width: width ? parseInt(String(width)) : null,
        height: height ? parseInt(String(height)) : null,
        originalFileName: originalFileName?.trim() || fileName.trim(),
        sortOrder: parseInt(String(sortOrder)),
        isActive: Boolean(isActive)
      },
      include: {
        _count: {
          select: {
            furnitureImages: true,
            furnitureSetImages: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Image başarıyla eklendi',
      data: result
    }, { status: 201 })

  } catch (error) {
    console.error('Image ekleme hatası:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Image eklenirken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// DELETE - Toplu image silme
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    const forceDelete = searchParams.get('force') === 'true'
    
    if (!idsParam?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Silinecek image ID\'leri belirtilmeli'
      }, { status: 400 })
    }

    const ids = idsParam.split(',')
      .map((id: string) => parseInt(id.trim()))
      .filter((id: number) => !isNaN(id) && id > 0)
    
    if (ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçerli image ID\'si bulunamadı'
      }, { status: 400 })
    }

    // Image'ları kontrol et
    const images = await prisma.image.findMany({
      where: { imageId: { in: ids } },
      select: {
        imageId: true,
        fileName: true,
        _count: {
          select: {
            furnitureImages: true,
            furnitureSetImages: true
          }
        }
      }
    })

    if (images.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Belirtilen ID\'lerde image bulunamadı'
      }, { status: 404 })
    }

    if (images.length !== ids.length) {
      const foundIds = images.map((img: { imageId: number }) => img.imageId)
      const notFoundIds = ids.filter((id: number) => !foundIds.includes(id))
      
      return NextResponse.json({
        success: false,
        error: `Bazı image'lar bulunamadı: ${notFoundIds.join(', ')}`
      }, { status: 400 })
    }

    // Kullanımda olan image'ları kontrol et
    if (!forceDelete) {
      const imagesInUse = images.filter((img: any) => 
        img._count.furnitureImages > 0 || img._count.furnitureSetImages > 0
      )

      if (imagesInUse.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'Bazı image\'lar hala kullanımda',
          imagesInUse: imagesInUse.map((img: any) => ({
            imageId: img.imageId,
            fileName: img.fileName,
            furnitureUsage: img._count.furnitureImages,
            furnitureSetUsage: img._count.furnitureSetImages
          })),
          message: 'Zorla silmek için force=true parametresini kullanın'
        }, { status: 400 })
      }
    }

    // Transaction ile sil
    const result = await prisma.$transaction(async (tx) => {
      const foundIds = images.map((img: { imageId: number }) => img.imageId)
      
      // İlişkili kayıtları sil (force delete durumunda)
      if (forceDelete) {
        await tx.furnitureImage.deleteMany({
          where: { imageId: { in: foundIds } }
        })
        
        await tx.furnitureSetImage.deleteMany({
          where: { imageId: { in: foundIds } }
        })
      }

      // Image'ları sil
      const deleted = await tx.image.deleteMany({
        where: { imageId: { in: foundIds } }
      })

      return deleted
    })

    return NextResponse.json({
      success: true,
      message: `${result.count} image başarıyla silindi`,
      deletedCount: result.count,
      deletedItems: images.map((img: { imageId: number; fileName: string }) => ({ 
        id: img.imageId, 
        fileName: img.fileName 
      })),
      forceDelete
    })

  } catch (error) {
    console.error('Toplu image silme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Image\'lar silinemedi',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}

// PATCH - Toplu image durumu değiştirme
export async function PATCH(request: Request) {
  try {
    const data = await request.json()
    const { ids, isActive } = data

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Güncellenecek image ID\'leri belirtilmeli'
      }, { status: 400 })
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'isActive değeri boolean olmalı (true/false)'
      }, { status: 400 })
    }

    // ID'leri validasyon
    const validIds = ids.map((id: number) => parseInt(String(id))).filter((id: number) => !isNaN(id) && id > 0)
    
    if (validIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçerli image ID\'si bulunamadı'
      }, { status: 400 })
    }

    if (validIds.length !== ids.length) {
      return NextResponse.json({
        success: false,
        error: 'Bazı ID\'ler geçersiz'
      }, { status: 400 })
    }

    // Image'ları kontrol et
    const existingImages = await prisma.image.findMany({
      where: { imageId: { in: validIds } },
      select: { imageId: true }
    })

    if (existingImages.length !== validIds.length) {
      return NextResponse.json({
        success: false,
        error: 'Bazı image\'lar bulunamadı'
      }, { status: 400 })
    }

    const updated = await prisma.image.updateMany({
      where: { imageId: { in: validIds } },
      data: { isActive }
    })

    return NextResponse.json({
      success: true,
      message: `${updated.count} image durumu ${isActive ? 'aktif' : 'pasif'} olarak güncellendi`,
      updatedCount: updated.count
    })

  } catch (error) {
    console.error('Toplu image güncelleme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Image durumları güncellenemedi',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}