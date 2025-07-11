// app/api/images/route.ts - Optimized Images API
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

// Type definitions
interface ImageCreateData {
  fileName: string;
  fileSize: number;
  fileType: string;
  description?: string;
  altText?: string;
  width?: number;
  height?: number;
  originalFileName: string;
  sortOrder?: number;
  isActive?: boolean;
}

// Helper function to generate file path (synchronous for better performance)
function generateFilePath(furnitureId: number, imageId: number, fileName: string) {
  const extension = path.extname(fileName)
  const newFileName = `${imageId}${extension}`
  
  return {
    directory: path.join('uploads', 'furniture', `furniture_${furnitureId}`),
    filePath: path.join('uploads', 'furniture', `furniture_${furnitureId}`, newFileName),
    fileName: newFileName
  }
}

// Helper function to ensure directory exists
async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

// Helper function to save physical file
async function savePhysicalFile(filePath: string, fileBuffer: Buffer) {
  const directory = path.dirname(filePath)
  await ensureDirectoryExists(directory)
  await fs.writeFile(filePath, fileBuffer)
}

// Helper function to delete physical file
async function deletePhysicalFile(filePath: string) {
  try {
    await fs.unlink(filePath)
    
    // Try to remove empty directories
    const directory = path.dirname(filePath)
    try {
      const files = await fs.readdir(directory)
      if (files.length === 0) {
        await fs.rmdir(directory)
      }
    } catch {}
  } catch (error) {
    console.warn(`Could not delete file ${filePath}:`, error)
  }
}

// GET - Images listele (same as before, optimized)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parametreleri
    const isActive = searchParams.get('active')
    const search = searchParams.get('search')
    const fileType = searchParams.get('fileType')
    const minSize = searchParams.get('minSize')
    const maxSize = searchParams.get('maxSize')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const sortBy = searchParams.get('sortBy') || 'uploadedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const includeUsage = searchParams.get('includeUsage') === 'true'

    // Where koşulları
    let whereClause: any = {}

    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    if (fileType?.trim()) {
      whereClause.fileType = {
        equals: fileType.trim(),
        mode: 'insensitive'
      }
    }

    if (minSize || maxSize) {
      whereClause.fileSize = {}
      if (minSize && !isNaN(parseInt(minSize))) {
        whereClause.fileSize.gte = parseInt(minSize)
      }
      if (maxSize && !isNaN(parseInt(maxSize))) {
        whereClause.fileSize.lte = parseInt(maxSize)
      }
    }

    if (search?.trim()) {
      whereClause.OR = [
        { fileName: { contains: search.trim(), mode: 'insensitive' } },
        { originalFileName: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { altText: { contains: search.trim(), mode: 'insensitive' } }
      ]
    }

    // Sıralama
    const validSortFields = ['fileName', 'fileSize', 'uploadedAt', 'imageId']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'uploadedAt'
    const orderBy: any = {}
    orderBy[sortField] = sortOrder === 'asc' ? 'asc' : 'desc'

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

    return NextResponse.json({
      success: true,
      data: images,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Images listesi hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Images getirilemedi'
    }, { status: 500 })
  }
}

// POST - INTERNAL ONLY - Sadece furniture API'sinden çağrılır
export async function POST(request: Request) {
  try {
    // Bu endpoint sadece internal kullanım için
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    
    // Internal çağrı kontrolü (localhost veya aynı host)
    if (origin && !origin.includes(host || 'localhost')) {
      return NextResponse.json({
        success: false,
        error: 'Bu endpoint sadece internal kullanım içindir'
      }, { status: 403 })
    }

    const data = await request.json()
    const { 
      furnitureId, 
      imageData, 
      fileBuffer, 
      sortOrder = 1, 
      imageType = 'gallery_image' 
    } = data

    if (!furnitureId || !imageData || !fileBuffer) {
      return NextResponse.json({
        success: false,
        error: 'Gerekli veriler eksik'
      }, { status: 400 })
    }

    // Validasyonlar
    if (imageData.fileSize > 104857600) { // 100MB
      return NextResponse.json({
        success: false,
        error: 'Dosya boyutu 100MB\'dan büyük olamaz'
      }, { status: 400 })
    }

    const allowedTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp']
    if (!allowedTypes.includes(imageData.fileType.toLowerCase())) {
      return NextResponse.json({
        success: false,
        error: 'Desteklenmeyen dosya tipi'
      }, { status: 400 })
    }

    // Transaction ile image oluştur
    const result = await prisma.$transaction(async (tx) => {
      // 1. Image kaydı oluştur
      const image = await tx.image.create({
        data: {
          fileName: imageData.fileName,
          filePath: '', // Geçici
          fileSize: imageData.fileSize,
          fileType: imageData.fileType,
          description: imageData.description || null,
          altText: imageData.altText || imageData.fileName,
          width: imageData.width || null,
          height: imageData.height || null,
          originalFileName: imageData.originalFileName,
          sortOrder: sortOrder,
          isActive: true
        }
      })

      // 2. File path oluştur ve güncelle
      const { filePath, fileName } = generateFilePath(furnitureId, image.imageId, imageData.fileName)
      
      const updatedImage = await tx.image.update({
        where: { imageId: image.imageId },
        data: {
          fileName: fileName,
          filePath: filePath
        }
      })

      // 3. FurnitureImage ilişkisi oluştur
      await tx.furnitureImage.create({
        data: {
          furnitureId: furnitureId,
          imageId: image.imageId,
          sortOrder: sortOrder,
          imageType: imageType,
          isActive: true
        }
      })

      return updatedImage
    })

    // 4. Transaction başarılı olduktan SONRA fiziksel dosyayı kaydet
    try {
      const buffer = Buffer.from(fileBuffer, 'base64')
      await savePhysicalFile(result.filePath, buffer)
    } catch (fileError) {
      // Fiziksel dosya kaydedilemezse database kaydını geri al
      await prisma.furnitureImage.deleteMany({
        where: { imageId: result.imageId }
      })
      await prisma.image.delete({
        where: { imageId: result.imageId }
      })
      
      throw new Error(`Dosya kaydedilemedi: ${fileError}`)
    }

    return NextResponse.json({
      success: true,
      data: result
    }, { status: 201 })

  } catch (error) {
    console.error('Image oluşturma hatası:', error)
    return NextResponse.json({
      success: false,
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
        filePath: true,
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

    // Kullanımda olan image'ları kontrol et
    if (!forceDelete) {
      const imagesInUse = images.filter((img: any) => 
        img._count.furnitureImages > 0 || img._count.furnitureSetImages > 0
      )

      if (imagesInUse.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'Bazı image\'lar hala kullanımda',
          message: 'Zorla silmek için force=true parametresini kullanın'
        }, { status: 400 })
      }
    }

    // Transaction ile sil
    const result = await prisma.$transaction(async (tx) => {
      const foundIds = images.map((img: { imageId: number }) => img.imageId)
      
      if (forceDelete) {
        await tx.furnitureImage.deleteMany({
          where: { imageId: { in: foundIds } }
        })
        
        await tx.furnitureSetImage.deleteMany({
          where: { imageId: { in: foundIds } }
        })
      }

      return await tx.image.deleteMany({
        where: { imageId: { in: foundIds } }
      })
    })

    // Transaction başarılı olduktan sonra fiziksel dosyaları sil
    for (const image of images) {
      if (image.filePath) {
        await deletePhysicalFile(image.filePath)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} image başarıyla silindi`,
      deletedCount: result.count
    })

  } catch (error) {
    console.error('Toplu image silme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Image\'lar silinemedi'
    }, { status: 500 })
  }
}