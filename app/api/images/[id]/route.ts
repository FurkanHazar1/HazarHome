// app/api/images/[id]/route.ts - Tekil Image API
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Tek image detayı
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

    // Dosya boyutu formatı (human readable)
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

// PUT - Image güncelle
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
      sortOrder,
      isActive
    } = data

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

    if (fileName !== undefined) {
      if (!fileName || typeof fileName !== 'string' || fileName.trim().length === 0) {
        validationErrors.push('Dosya adı boş olamaz')
      } else if (fileName.trim().length > 255) {
        validationErrors.push('Dosya adı 255 karakterden uzun olamaz')
      }
    }

    if (filePath !== undefined) {
      if (!filePath || typeof filePath !== 'string' || filePath.trim().length === 0) {
        validationErrors.push('Dosya yolu boş olamaz')
      } else if (filePath.trim().length > 500) {
        validationErrors.push('Dosya yolu 500 karakterden uzun olamaz')
      }
    }

    if (fileSize !== undefined && fileSize !== null) {
      if (isNaN(parseInt(String(fileSize))) || parseInt(String(fileSize)) < 0) {
        validationErrors.push('Dosya boyutu geçerli bir sayı olmalıdır')
      } else if (parseInt(String(fileSize)) > 104857600) {
        validationErrors.push('Dosya boyutu 100MB\'dan büyük olamaz')
      }
    }

    if (fileType !== undefined && fileType !== null && (typeof fileType !== 'string' || fileType.trim().length > 10)) {
      validationErrors.push('Dosya tipi 10 karakterden uzun olamaz')
    }

    if (description !== undefined && description !== null && typeof description === 'string' && description.length > 1000) {
      validationErrors.push('Açıklama 1000 karakterden uzun olamaz')
    }

    if (altText !== undefined && altText !== null && (typeof altText !== 'string' || altText.length > 255)) {
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

    if (originalFileName !== undefined && originalFileName !== null && (typeof originalFileName !== 'string' || originalFileName.length > 255)) {
      validationErrors.push('Orijinal dosya adı 255 karakterden uzun olamaz')
    }

    if (sortOrder !== undefined && sortOrder !== null && (isNaN(parseInt(String(sortOrder))) || parseInt(String(sortOrder)) < 0)) {
      validationErrors.push('Sıralama değeri geçerli bir pozitif sayı olmalıdır')
    }

    // Dosya yolu değişiyorsa, aynı yolu kullanıp kullanmadığını kontrol et
    if (filePath !== undefined && filePath.trim() !== existingImage.filePath) {
      const duplicateImage = await prisma.image.findFirst({
        where: {
          filePath: {
            equals: filePath.trim(),
            mode: 'insensitive'
          },
          imageId: { not: imageId }
        }
      })

      if (duplicateImage) {
        validationErrors.push('Bu dosya yolu başka bir image tarafından kullanılıyor')
      }
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
    
    if (fileName !== undefined) updateData.fileName = fileName.trim()
    if (filePath !== undefined) updateData.filePath = filePath.trim()
    if (fileSize !== undefined) updateData.fileSize = fileSize ? parseInt(String(fileSize)) : null
    if (fileType !== undefined) updateData.fileType = fileType?.trim() || null
    if (description !== undefined) updateData.description = description?.trim() || null
    if (altText !== undefined) updateData.altText = altText?.trim() || null
    if (width !== undefined) updateData.width = width ? parseInt(String(width)) : null
    if (height !== undefined) updateData.height = height ? parseInt(String(height)) : null
    if (originalFileName !== undefined) updateData.originalFileName = originalFileName?.trim() || null
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder ? parseInt(String(sortOrder)) : 1
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    const result = await prisma.image.update({
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

    return NextResponse.json({
      success: true,
      message: 'Image başarıyla güncellendi',
      data: result
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

// DELETE - Image sil
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
      forceDelete
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

// PATCH - Image durumu değiştir veya meta veri güncelle
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