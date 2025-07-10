// app/api/images/route.ts - Fiziksel Dosya Yükleme ile Images API
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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

// File upload utility functions for Images
class ImageFileUploadService {
  private static readonly UPLOAD_DIR = 'uploads/images'
  private static readonly MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB (images için daha büyük limit)
  private static readonly ALLOWED_TYPES = [
    'image/jpeg', 
    'image/png', 
    'image/webp', 
    'image/gif', 
    'image/svg+xml',
    'image/bmp',
    'image/tiff'
  ]

  static async createUploadDirectories() {
    const baseDir = join(process.cwd(), 'public', this.UPLOAD_DIR)
    const generalDir = join(baseDir, 'general')
    
    if (!existsSync(baseDir)) {
      await mkdir(baseDir, { recursive: true })
    }
    
    if (!existsSync(generalDir)) {
      await mkdir(generalDir, { recursive: true })
    }
    
    return generalDir
  }

  static validateFile(file: File): { isValid: boolean; error?: string } {
    if (!file) {
      return { isValid: false, error: 'Dosya bulunamadı' }
    }

    if (file.size === 0) {
      return { isValid: false, error: 'Dosya boş olamaz' }
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { isValid: false, error: 'Dosya boyutu 20MB\'dan büyük olamaz' }
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { 
        isValid: false, 
        error: 'Sadece JPG, PNG, WebP, GIF, SVG, BMP ve TIFF dosyaları kabul edilir' 
      }
    }

    // Dosya adı güvenlik kontrolü
    const fileName = file.name
    if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
      return { 
        isValid: false, 
        error: 'Dosya adı sadece harf, rakam, nokta, tire ve alt çizgi içerebilir' 
      }
    }

    // Dosya uzantısı kontrolü
    const extension = fileName.split('.').pop()?.toLowerCase()
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'tiff', 'tif']
    if (!extension || !validExtensions.includes(extension)) {
      return { 
        isValid: false, 
        error: 'Geçersiz dosya uzantısı' 
      }
    }

    return { isValid: true }
  }

  static generateFileName(originalName: string, imageId?: number): string {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
    const sanitizedName = originalName.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
    
    const prefix = imageId ? `image_${imageId}` : `temp_${randomId}`
    
    return `${prefix}_${sanitizedName}_${timestamp}.${extension}`
  }

  static async saveFile(file: File, filePath: string): Promise<{ width?: number; height?: number }> {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await writeFile(filePath, buffer)
    
    // Görsel boyutlarını almaya çalış
    try {
      // Bu örnekte basit boyut tespiti yapıyoruz
      // Gerçek projede sharp, jimp veya image-size kütüphanesi kullanılabilir
      if (file.type === 'image/svg+xml') {
        return {  width: undefined, height: undefined} // SVG için boyut dinamik
      }
      
      // Diğer formatlar için boyut tespiti yapmaya çalış
      return await this.getImageDimensions(buffer, file.type)
    } catch (error) {
      console.warn('Görsel boyutları alınamadı:', error)
      return {}
    }
  }

  static async getImageDimensions(buffer: Buffer, mimeType: string): Promise<{ width?: number; height?: number }> {
    // Bu basit bir implementasyon. Gerçek projede image-size veya sharp kullanın
    try {
      // Temel JPEG ve PNG boyut okuma
      if (mimeType === 'image/jpeg') {
        // JPEG boyut okuma (basitleştirilmiş)
        return {  width: undefined, height: undefined}
      } else if (mimeType === 'image/png') {
        // PNG boyut okuma (basitleştirilmiş)
        return {  width: undefined, height: undefined }
      }
      
      return {}
    } catch (error) {
      return {}
    }
  }

  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (!filePath) return false
      
      // Relative path'i absolute path'e çevir
      const fullPath = filePath.startsWith('/') 
        ? join(process.cwd(), 'public', filePath) 
        : join(process.cwd(), 'public', '/', filePath)
      
      await unlink(fullPath)
      return true
    } catch (error) {
      console.error('Dosya silinirken hata:', error)
      return false
    }
  }

  static getRelativePath(fileName: string): string {
    return `/${this.UPLOAD_DIR}/general/${fileName}`
  }

  static async moveFile(oldPath: string, newPath: string): Promise<boolean> {
    try {
      const oldFullPath = join(process.cwd(), 'public', oldPath)
      const newFullPath = join(process.cwd(), 'public', newPath)
      
      // Eski dosyayı yeni konuma kopyala
      const buffer = await require('fs/promises').readFile(oldFullPath)
      await writeFile(newFullPath, buffer)
      
      // Eski dosyayı sil
      await unlink(oldFullPath)
      
      return true
    } catch (error) {
      console.error('Dosya taşınırken hata:', error)
      return false
    }
  }
}

// GET - Images listele (aynı kalır)
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

// POST - Yeni image ekle (Fiziksel dosya yükleme ile)
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    
    // Dosyayı al
    const file = formData.get('file') as File
    
    // Diğer verileri al
    const description = formData.get('description') as string
    const altText = formData.get('altText') as string
    const sortOrder = formData.get('sortOrder') as string
    const isActive = formData.get('isActive') === 'true'

    // Temel validasyonlar
    const validationErrors = []

    if (!file) {
      validationErrors.push('Dosya zorunludur')
    } else {
      const validation = ImageFileUploadService.validateFile(file)
      if (!validation.isValid) {
        validationErrors.push(validation.error!)
      }
    }

    if (description && typeof description === 'string' && description.length > 1000) {
      validationErrors.push('Açıklama 1000 karakterden uzun olamaz')
    }

    if (altText && (typeof altText !== 'string' || altText.length > 255)) {
      validationErrors.push('Alt text 255 karakterden uzun olamaz')
    }

    if (sortOrder && (isNaN(parseInt(sortOrder)) || parseInt(sortOrder) < 0)) {
      validationErrors.push('Sıralama değeri geçerli bir pozitif sayı olmalıdır')
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validasyon hatası',
        validationErrors
      }, { status: 400 })
    }

    // Upload klasörünü oluştur
    await ImageFileUploadService.createUploadDirectories()

    // Transaction ile image oluştur
    const result = await prisma.$transaction(async (tx) => {
      // Önce veritabanına kayıt oluştur (dosya adını almak için)
      const tempImage = await tx.image.create({
        data: {
          fileName: 'temp_' + Date.now(),
          filePath: 'temp',
          fileSize: file.size,
          fileType: file.type,
          description: description?.trim() || null,
          altText: altText?.trim() || file.name.split('.')[0],
          width: null,
          height: null,
          originalFileName: file.name,
          sortOrder: sortOrder ? parseInt(sortOrder) : 1,
          isActive: Boolean(isActive)
        }
      })

      // Dosya adını oluştur
      const fileName = ImageFileUploadService.generateFileName(file.name, tempImage.imageId)
      const relativePath = ImageFileUploadService.getRelativePath(fileName)
      const fullPath = join(process.cwd(), 'public', relativePath)

      // Dosyayı kaydet
      const dimensions = await ImageFileUploadService.saveFile(file, fullPath)

      // Veritabanı kaydını güncelle
      const updatedImage = await tx.image.update({
        where: { imageId: tempImage.imageId },
        data: {
          fileName: fileName,
          filePath: relativePath,
          width: dimensions.width || null,
          height: dimensions.height || null
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

      return updatedImage
    }, {
      timeout: 60000 // 60 saniye timeout
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

// DELETE - Toplu image silme (Fiziksel dosyaları da siler)
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

    if (images.length !== ids.length) {
      const foundIds = images.map((img: any) => img.imageId)
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
      const foundIds = images.map((img: any) => img.imageId)
      
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

    // Transaction başarılı olduktan sonra fiziksel dosyaları sil
    let deletedFilesCount = 0
    for (const image of images) {
      if (image.filePath) {
        const success = await ImageFileUploadService.deleteFile(image.filePath)
        if (success) deletedFilesCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} image başarıyla silindi`,
      deletedCount: result.count,
      deletedItems: images.map((img: any) => ({ 
        id: img.imageId, 
        fileName: img.fileName 
      })),
      forceDelete,
      filesDeletionSummary: {
        totalFiles: images.length,
        deletedFiles: deletedFilesCount,
        failedDeletions: images.length - deletedFilesCount
      }
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

// PATCH - Toplu image durumu değiştirme (aynı kalır, fiziksel dosya işlemi yok)
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

// PUT - Image güncelle (Dosya değiştirme ile)
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const imageId = parseInt(searchParams.get('id') || '0')
    
    if (isNaN(imageId) || imageId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz image ID\'si'
      }, { status: 400 })
    }

    const formData = await request.formData()
    
    // Yeni dosya (opsiyonel)
    const file = formData.get('file') as File
    
    // Diğer güncelleme verileri
    const description = formData.get('description') as string
    const altText = formData.get('altText') as string
    const sortOrder = formData.get('sortOrder') as string
    const isActive = formData.get('isActive')

    // Mevcut image'ı kontrol et
    const existingImage = await prisma.image.findUnique({
      where: { imageId },
      include: {
        _count: {
          select: {
            furnitureImages: true,
            furnitureSetImages: true
          }
        }
      }
    })

    if (!existingImage) {
      return NextResponse.json({
        success: false,
        error: 'Image bulunamadı'
      }, { status: 404 })
    }

    // Validasyonlar
    const validationErrors = []

    if (file) {
      const validation = ImageFileUploadService.validateFile(file)
      if (!validation.isValid) {
        validationErrors.push(validation.error!)
      }
    }

    if (description && typeof description === 'string' && description.length > 1000) {
      validationErrors.push('Açıklama 1000 karakterden uzun olamaz')
    }

    if (altText && (typeof altText !== 'string' || altText.length > 255)) {
      validationErrors.push('Alt text 255 karakterden uzun olamaz')
    }

    if (sortOrder && (isNaN(parseInt(sortOrder)) || parseInt(sortOrder) < 0)) {
      validationErrors.push('Sıralama değeri geçerli bir pozitif sayı olmalıdır')
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validasyon hatası',
        validationErrors
      }, { status: 400 })
    }

    // Transaction ile güncelle
    const result = await prisma.$transaction(async (tx) => {
      let newFilePath = existingImage.filePath
      let newFileName = existingImage.fileName
      let newFileSize = existingImage.fileSize
      let newFileType = existingImage.fileType
      let newWidth = existingImage.width
      let newHeight = existingImage.height
      let oldFilePath = existingImage.filePath

      // Eğer yeni dosya varsa
      if (file && file.size > 0) {
        // Yeni dosya adını oluştur
        newFileName = ImageFileUploadService.generateFileName(file.name, imageId)
        newFilePath = ImageFileUploadService.getRelativePath(newFileName)
        const fullPath = join(process.cwd(), 'public', newFilePath)

        // Yeni dosyayı kaydet
        await ImageFileUploadService.createUploadDirectories()
        const dimensions = await ImageFileUploadService.saveFile(file, fullPath)

        newFileSize = file.size
        newFileType = file.type
        newWidth = dimensions.width || null
        newHeight = dimensions.height || null
      }

      // Güncelleme verilerini hazırla
      const updateData: any = {}
      
      if (file) {
        updateData.fileName = newFileName
        updateData.filePath = newFilePath
        updateData.fileSize = newFileSize
        updateData.fileType = newFileType
        updateData.width = newWidth
        updateData.height = newHeight
        updateData.originalFileName = file.name
      }

      if (description !== undefined) updateData.description = description?.trim() || null
      if (altText !== undefined) updateData.altText = altText?.trim() || null
      if (sortOrder !== undefined) updateData.sortOrder = sortOrder ? parseInt(sortOrder) : 1
      if (isActive !== undefined) updateData.isActive = isActive === 'true'

      // Veritabanını güncelle
      const updatedImage = await tx.image.update({
        where: { imageId },
        data: updateData,
        include: {
          furnitureImages: {
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
          },
          furnitureSetImages: {
            include: {
              furnitureSet: {
                select: {
                  setId: true,
                  setName: true,
                  isActive: true
                }
              }
            }
          },
          _count: {
            select: {
              furnitureImages: true,
              furnitureSetImages: true
            }
          }
        }
      })

      return { updatedImage, oldFilePath, fileChanged: !!file }
    }, {
      timeout: 60000
    })

    // Transaction başarılı olduktan sonra eski dosyayı sil (yeni dosya yüklendiğinde)
    if (result.fileChanged && result.oldFilePath && result.oldFilePath !== result.updatedImage.filePath) {
      await ImageFileUploadService.deleteFile(result.oldFilePath)
    }

    return NextResponse.json({
      success: true,
      message: 'Image başarıyla güncellendi',
      data: result.updatedImage,
      fileChanged: result.fileChanged
    })

  } catch (error) {
    console.error('Image güncelleme hatası:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Image güncellenirken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
    }, { status: 500 })
  }
}