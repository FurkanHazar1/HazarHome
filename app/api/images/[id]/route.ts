// app/api/images/[id]/route.ts - Tekil Image API (Fiziksel Dosya İşlemleri ile)
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// File upload utility functions (Images ID route için)
class ImageFileUploadService {
  private static readonly UPLOAD_DIR = 'uploads/images'
  private static readonly MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
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

    return { isValid: true }
  }

  static generateFileName(originalName: string, imageId: number): string {
    const timestamp = Date.now()
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
    const sanitizedName = originalName.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
    
    return `image_${imageId}_${sanitizedName}_${timestamp}.${extension}`
  }

  static async saveFile(file: File, filePath: string): Promise<{ width?: number; height?: number }> {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await writeFile(filePath, buffer)
    
    // Görsel boyutlarını almaya çalış
    try {
      if (file.type === 'image/svg+xml') {
        return {  width: undefined, height: undefined }
      }
      
      return await this.getImageDimensions(buffer, file.type)
    } catch (error) {
      console.warn('Görsel boyutları alınamadı:', error)
      return {}
    }
  }

  static async getImageDimensions(buffer: Buffer, mimeType: string): Promise<{ width?: number; height?: number }> {
    // Basit implementasyon - gerçek projede image-size veya sharp kullanın
    try {
      return {  width: undefined, height: undefined}
    } catch (error) {
      return {}
    }
  }

  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (!filePath) return false
      
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
}

// GET - Tek image detayı (aynı kalır)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const imageId = parseInt(params.id)

    if (isNaN(imageId) || imageId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz image ID\'si'
      }, { status: 400 })
    }

    const image = await prisma.image.findUnique({
      where: { imageId },
      include: {
        furnitureImages: {
          include: {
            furniture: {
              select: {
                furnitureId: true,
                furnitureName: true,
                furnitureType: true,
                price: true,
                isActive: true,
                category: {
                  select: {
                    categoryId: true,
                    categoryName: true
                  }
                }
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        },
        furnitureSetImages: {
          include: {
            furnitureSet: {
              select: {
                setId: true,
                setName: true,
                price: true,
                isActive: true,
                category: {
                  select: {
                    categoryId: true,
                    categoryName: true
                  }
                }
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: {
            furnitureImages: true,
            furnitureSetImages: true
          }
        }
      }
    })

    if (!image) {
      return NextResponse.json({
        success: false,
        error: 'Image bulunamadı'
      }, { status: 404 })
    }

    // Kullanım istatistikleri
    const usageStats = {
      totalUsage: image._count.furnitureImages + image._count.furnitureSetImages,
      furnitureUsage: image._count.furnitureImages,
      furnitureSetUsage: image._count.furnitureSetImages,
      activeFurnitureUsage: image.furnitureImages.filter(fi => fi.furniture.isActive).length,
      activeFurnitureSetUsage: image.furnitureSetImages.filter(fsi => fsi.furnitureSet.isActive).length
    }

    // Dosya boyutu formatı
    const formatFileSize = (bytes: number | null): string => {
      if (!bytes) return 'Bilinmiyor'
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
    }

    // Çözünürlük bilgisi
    const resolution = image.width && image.height 
      ? `${image.width} x ${image.height} pixels`
      : 'Bilinmiyor'

    // Aspect ratio
    const aspectRatio = image.width && image.height
      ? (image.width / image.height).toFixed(2)
      : null

    return NextResponse.json({
      success: true,
      data: {
        ...image,
        usageStats,
        fileInfo: {
          formattedSize: formatFileSize(image.fileSize),
          resolution,
          aspectRatio
        }
      }
    })

  } catch (error) {
    console.error('Image detay hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Image getirilemedi',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}

// PUT - Image güncelle (FormData ile dosya güncelleme)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const imageId = parseInt(params.id)
    
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

    if (file && file.size > 0) {
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
      
      if (file && file.size > 0) {
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

      return { updatedImage, oldFilePath, fileChanged: !!(file && file.size > 0) }
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

// DELETE - Image sil (Fiziksel dosyayı da siler)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const imageId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const forceDelete = searchParams.get('force') === 'true'

    if (isNaN(imageId) || imageId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz image ID\'si'
      }, { status: 400 })
    }

    // Image'ı kontrol et
    const image = await prisma.image.findUnique({
      where: { imageId },
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

    if (!image) {
      return NextResponse.json({
        success: false,
        error: 'Image bulunamadı'
      }, { status: 404 })
    }

    // Kullanımda olup olmadığını kontrol et
    const totalUsage = image._count.furnitureImages + image._count.furnitureSetImages
    
    if (totalUsage > 0 && !forceDelete) {
      return NextResponse.json({
        success: false,
        error: 'Image hala kullanımda',
        usage: {
          furnitureUsage: image._count.furnitureImages,
          furnitureSetUsage: image._count.furnitureSetImages,
          totalUsage
        },
        message: 'Zorla silmek için force=true parametresini kullanın'
      }, { status: 400 })
    }

    // Transaction ile sil
    await prisma.$transaction(async (tx) => {
      // İlişkili kayıtları sil (force delete durumunda)
      if (forceDelete && totalUsage > 0) {
        await tx.furnitureImage.deleteMany({
          where: { imageId }
        })
        
        await tx.furnitureSetImage.deleteMany({
          where: { imageId }
        })
      }

      // Image'ı sil
      await tx.image.delete({
        where: { imageId }
      })
    })

    // Transaction başarılı olduktan sonra fiziksel dosyayı sil
    let fileDeleted = false
    if (image.filePath) {
      fileDeleted = await ImageFileUploadService.deleteFile(image.filePath)
    }

    return NextResponse.json({
      success: true,
      message: `"${image.fileName}" image'ı başarıyla silindi`,
      deletedItem: {
        imageId: image.imageId,
        fileName: image.fileName,
        filePath: image.filePath,
        previousUsage: {
          furnitureUsage: image._count.furnitureImages,
          furnitureSetUsage: image._count.furnitureSetImages,
          totalUsage
        }
      },
      forceDelete,
      fileDeleted
    })

  } catch (error) {
    console.error('Image silme hatası:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Image silinirken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
    }, { status: 500 })
  }
}

// PATCH - Image durumu değiştir veya meta veri güncelle (JSON ile, dosya işlemi yok)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const imageId = parseInt(params.id)
    
    if (isNaN(imageId) || imageId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz image ID\'si'
      }, { status: 400 })
    }

    const data = await request.json()
    const { isActive, description, altText, sortOrder } = data

    // Mevcut image'ı kontrol et
    const existingImage = await prisma.image.findUnique({
      where: { imageId }
    })

    if (!existingImage) {
      return NextResponse.json({
        success: false,
        error: 'Image bulunamadı'
      }, { status: 404 })
    }

    // Validasyonlar
    const validationErrors = []

    if (isActive !== undefined && typeof isActive !== 'boolean') {
      validationErrors.push('isActive değeri boolean olmalı (true/false)')
    }

    if (description !== undefined && description !== null && typeof description === 'string' && description.length > 1000) {
      validationErrors.push('Açıklama 1000 karakterden uzun olamaz')
    }

    if (altText !== undefined && altText !== null && (typeof altText !== 'string' || altText.length > 255)) {
      validationErrors.push('Alt text 255 karakterden uzun olamaz')
    }

    if (sortOrder !== undefined && sortOrder !== null && (isNaN(parseInt(String(sortOrder))) || parseInt(String(sortOrder)) < 0)) {
      validationErrors.push('Sıralama değeri geçerli bir pozitif sayı olmalıdır')
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validasyon hatası',
        validationErrors
      }, { status: 400 })
    }

    // Güncelle
    const updateData: any = {}
    
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)
    if (description !== undefined) updateData.description = description?.trim() || null
    if (altText !== undefined) updateData.altText = altText?.trim() || null
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder ? parseInt(String(sortOrder)) : 1

    const result = await prisma.image.update({
      where: { imageId },
      data: updateData,
      include: {
        _count: {
          select: {
            furnitureImages: true,
            furnitureSetImages: true
          }
        }
      }
    })

    // Güncellenen alanları belirle
    const updatedFields = Object.keys(updateData)
    
    return NextResponse.json({
      success: true,
      message: `Image meta verileri başarıyla güncellendi`,
      data: result,
      updatedFields
    })

  } catch (error) {
    console.error('Image meta veri güncelleme hatası:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Image meta verileri güncellenirken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
    }, { status: 500 })
  }
}