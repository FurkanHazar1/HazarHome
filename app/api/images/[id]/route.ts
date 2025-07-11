// app/api/images/[id]/route.ts - Updated Tekil Image API with File Management
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

// Helper function to generate file path
async function generateFilePath(furnitureId: number, imageId: number, fileName: string) {
  const furniture = await prisma.furniture.findUnique({
    where: { furnitureId },
    include: {
      category: {
        include: {
          parent: {
            select: {
              categoryName: true
            }
          }
        }
      }
    }
  })

  if (!furniture) {
    throw new Error('Furniture not found')
  }

  const level1 = furniture.category?.parent?.categoryName || 'uncategorized'
  const level2 = furniture.category?.categoryName || 'uncategorized'
  const furnitureFolderName = `furniture_${furnitureId}_${furniture.furnitureName.replace(/[^a-zA-Z0-9]/g, '_')}`
  
  const extension = path.extname(fileName)
  const newFileName = `${imageId}${extension}`
  
  return {
    directory: path.join('uploads', 'furniture', level1, level2, furnitureFolderName),
    filePath: path.join('uploads', 'furniture', level1, level2, furnitureFolderName, newFileName),
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
        
        // Try to remove parent directories if empty
        const parentDir = path.dirname(directory)
        try {
          const parentFiles = await fs.readdir(parentDir)
          if (parentFiles.length === 0) {
            await fs.rmdir(parentDir)
          }
        } catch {}
      }
    } catch {}
  } catch (error) {
    console.warn(`Could not delete file ${filePath}:`, error)
  }
}

// Helper function to move physical file
async function movePhysicalFile(oldPath: string, newPath: string) {
  try {
    const directory = path.dirname(newPath)
    await ensureDirectoryExists(directory)
    await fs.rename(oldPath, newPath)
    
    // Clean up old directory if empty
    await deletePhysicalFile(oldPath + '.temp') // This will trigger directory cleanup
  } catch (error) {
    console.warn(`Could not move file from ${oldPath} to ${newPath}:`, error)
    throw error
  }
}

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

    // File exists check
    let fileExists = false
    if (image.filePath) {
      try {
        await fs.access(image.filePath)
        fileExists = true
      } catch {
        fileExists = false
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...image,
        usageStats,
        fileInfo: {
          formattedSize: formatFileSize(image.fileSize),
          resolution,
          aspectRatio,
          fileExists
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

// PUT - Image güncelle with file replacement
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

    const contentType = request.headers.get('content-type') || ''
    let data: any = {}
    let file: File | null = null

    // FormData (file upload) veya JSON güncelleme
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      file = formData.get('file') as File
      data = {
        description: formData.get('description') as string,
        altText: formData.get('altText') as string,
        imageType: formData.get('imageType') as string,
        sortOrder: formData.get('sortOrder') as string,
        isActive: formData.get('isActive') as string
      }
    } else {
      data = await request.json()
    }

    const {
      description,
      altText,
      width,
      height,
      sortOrder,
      isActive
    } = data

    // Mevcut image'ı kontrol et
    const existingImage = await prisma.image.findUnique({
      where: { imageId },
      include: {
        furnitureImages: {
          include: {
            furniture: {
              include: {
                category: {
                  include: {
                    parent: {
                      select: {
                        categoryName: true
                      }
                    }
                  }
                }
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

    if (!existingImage) {
      return NextResponse.json({
        success: false,
        error: 'Image bulunamadı'
      }, { status: 404 })
    }

    // Validasyonlar
    const validationErrors = []

    if (file) {
      if (file.size > 104857600) { // 100MB limit
        validationErrors.push('Dosya boyutu 100MB\'dan büyük olamaz')
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        validationErrors.push('Desteklenmeyen dosya tipi. Sadece JPEG, PNG, GIF, WebP dosyaları kabul edilir')
      }
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

    // Transaction ile güncelle
    const result = await prisma.$transaction(async (tx) => {
      let updateData: any = {}
      let oldFilePath = existingImage.filePath
      
      // Meta data güncellemeleri
      if (description !== undefined) updateData.description = description?.trim() || null
      if (altText !== undefined) updateData.altText = altText?.trim() || null
      if (width !== undefined) updateData.width = width ? parseInt(String(width)) : null
      if (height !== undefined) updateData.height = height ? parseInt(String(height)) : null
      if (sortOrder !== undefined) updateData.sortOrder = sortOrder ? parseInt(String(sortOrder)) : 1
      if (isActive !== undefined) updateData.isActive = Boolean(isActive === 'true' || isActive === true)

      // Eğer yeni dosya varsa
      if (file) {
        // İlk furniture ilişkisini al (dosya yolu için)
        const firstFurnitureRelation = existingImage.furnitureImages[0]
        if (firstFurnitureRelation) {
          const furnitureId = firstFurnitureRelation.furnitureId
          
          // Yeni dosya yolu oluştur
          const { filePath: newFilePath, fileName: newFileName } = await generateFilePath(
            furnitureId,
            imageId,
            file.name
          )

          // Fiziksel dosyayı kaydet
          const fileBuffer = Buffer.from(await file.arrayBuffer())
          await savePhysicalFile(newFilePath, fileBuffer)

          // Database güncellemeleri
          updateData.fileName = newFileName
          updateData.filePath = newFilePath
          updateData.fileSize = file.size
          updateData.fileType = file.type.split('/')[1]
          updateData.originalFileName = file.name
        }
      }

      // Database'i güncelle
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

      // Eski dosyayı sil (eğer yeni dosya yüklendiyse)
      if (file && oldFilePath && oldFilePath !== updatedImage.filePath) {
        await deletePhysicalFile(oldFilePath)
      }

      return updatedImage
    })

    return NextResponse.json({
      success: true,
      message: 'Image başarıyla güncellendi',
      data: result,
      fileReplaced: !!file
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

// DELETE - Image sil with physical file deletion
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

      // Database'den image'ı sil
      await tx.image.delete({
        where: { imageId }
      })
    })

    // Fiziksel dosyayı sil
    if (image.filePath) {
      await deletePhysicalFile(image.filePath)
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