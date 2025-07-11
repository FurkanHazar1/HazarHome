// app/api/furniture/[id]/route.ts - Optimized Single Furniture API
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function to process image files
async function processImageFiles(files: File[], furnitureName: string): Promise<Array<{
  imageData: any;
  fileBuffer: string;
  sortOrder: number;
  imageType: string;
}>> {
  const processedImages = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    // File validasyonu
    if (file.size > 104857600) { // 100MB
      throw new Error(`Dosya ${file.name} 100MB'dan büyük`)
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Desteklenmeyen dosya tipi: ${file.type}`)
    }

    // File'ı base64'e çevir
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')

    processedImages.push({
      imageData: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type.split('/')[1],
        originalFileName: file.name,
        altText: `${furnitureName} - Image ${i + 1}`
      },
      fileBuffer: base64,
      sortOrder: i + 1,
      imageType: 'gallery_image'
    })
  }

  return processedImages
}

// Helper function to create images via internal API
async function createImagesForFurniture(furnitureId: number, processedImages: any[]) {
  const results = []
  
  for (const imageData of processedImages) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          furnitureId,
          imageData: imageData.imageData,
          fileBuffer: imageData.fileBuffer,
          sortOrder: imageData.sortOrder,
          imageType: imageData.imageType
        })
      })

      const result = await response.json()
      if (result.success) {
        results.push(result.data)
      }
    } catch (error) {
      console.warn(`Image oluşturulurken hata:`, error)
    }
  }

  return results
}

// GET - Tek mobilya detayı
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const furnitureId = parseInt(id)

    if (isNaN(furnitureId) || furnitureId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz mobilya ID\'si'
      }, { status: 400 })
    }

    const furniture = await prisma.furniture.findUnique({
      where: { furnitureId },
      include: {
        category: {
          select: {
            categoryId: true,
            categoryName: true,
            categoryPath: true,
            categoryLevel: true,
            parent: {
              select: {
                categoryId: true,
                categoryName: true
              }
            }
          }
        },
        colors: {
          where: { isAvailable: true },
          include: {
            color: {
              select: {
                colorId: true,
                colorName: true,
                colorCode: true,
                isActive: true
              }
            }
          },
          orderBy: { color: { colorName: 'asc' } }
        },
        properties: {
          where: { isActive: true },
          include: {
            property: {
              select: {
                propertyId: true,
                propertyName: true,
                propertyType: true,
                description: true
              }
            }
          },
          orderBy: { property: { propertyName: 'asc' } }
        },
        images: {
          where: { isActive: true },
          include: {
            image: {
              select: {
                imageId: true,
                fileName: true,
                filePath: true,
                fileSize: true,
                fileType: true,
                description: true,
                altText: true,
                width: true,
                height: true,
                originalFileName: true
              }
            }
          },
          orderBy: [
            { imageType: 'asc' },
            { sortOrder: 'asc' }
          ]
        },
        _count: {
          select: {
            colors: true,
            properties: true,
            images: true
          }
        }
      }
    })

    if (!furniture) {
      return NextResponse.json({
        success: false,
        error: 'Mobilya bulunamadı'
      }, { status: 404 })
    }

    // Breadcrumb oluştur
    const breadcrumb = []
    if (furniture.category) {
      if (furniture.category.parent) {
        breadcrumb.push({
          categoryId: furniture.category.parent.categoryId,
          categoryName: furniture.category.parent.categoryName
        })
      }
      breadcrumb.push({
        categoryId: furniture.category.categoryId,
        categoryName: furniture.category.categoryName
      })
    }

    // Ana görsel ve galeri ayır
    const mainImages = furniture.images.filter(fi => fi.imageType === 'main_image')
    const galleryImages = furniture.images.filter(fi => fi.imageType !== 'main_image')

    return NextResponse.json({
      success: true,
      data: {
        ...furniture,
        breadcrumb,
        imageGallery: {
          mainImages,
          galleryImages,
          totalImages: furniture._count.images
        },
        stats: {
          totalColors: furniture._count.colors,
          totalProperties: furniture._count.properties,
          totalImages: furniture._count.images
        }
      }
    })

  } catch (error) {
    console.error('Mobilya detay hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Mobilya getirilemedi'
    }, { status: 500 })
  }
}

// PUT - Mobilya güncelle (Optimized with proper transaction handling)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const furnitureId = parseInt(id)
    
    if (isNaN(furnitureId) || furnitureId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz mobilya ID\'si'
      }, { status: 400 })
    }

    const contentType = request.headers.get('content-type') || ''
    let data: any = {}
    let imageFiles: File[] = []

    // FormData (file uploads) veya JSON
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      
      // Mobilya verileri
      data = {
        furnitureName: formData.get('furnitureName') as string,
        furnitureType: formData.get('furnitureType') as string,
        categoryId: formData.get('categoryId') as string,
        description: formData.get('description') as string,
        price: formData.get('price') as string,
        isActive: formData.get('isActive') as string,
        colorIds: formData.get('colorIds') as string,
        properties: formData.get('properties') as string,
        removeImageIds: formData.get('removeImageIds') as string
      }

      // Yeni image dosyaları
      const files = formData.getAll('newImages') as File[]
      imageFiles = files.filter(file => file.size > 0)

    } else {
      data = await request.json()
    }

    const {
      furnitureName,
      furnitureType,
      categoryId,
      description,
      price,
      isActive,
      colorIds,
      properties,
      removeImageIds
    } = data

    // JSON string'leri parse et
    let parsedColorIds = colorIds
    let parsedProperties = properties
    let parsedRemoveImageIds = removeImageIds

    if (typeof colorIds === 'string') {
      parsedColorIds = colorIds ? JSON.parse(colorIds) : undefined
    }
    if (typeof properties === 'string') {
      parsedProperties = properties ? JSON.parse(properties) : undefined
    }
    if (typeof removeImageIds === 'string') {
      parsedRemoveImageIds = removeImageIds ? JSON.parse(removeImageIds) : []
    }

    // Mevcut mobilyayı kontrol et
    const existingFurniture = await prisma.furniture.findUnique({
      where: { furnitureId }
    })

    if (!existingFurniture) {
      return NextResponse.json({
        success: false,
        error: 'Mobilya bulunamadı'
      }, { status: 404 })
    }

    // Validasyonlar
    const validationErrors = []

    if (furnitureName !== undefined) {
      if (!furnitureName || typeof furnitureName !== 'string' || furnitureName.trim().length === 0) {
        validationErrors.push('Mobilya adı boş olamaz')
      } else if (furnitureName.trim().length > 100) {
        validationErrors.push('Mobilya adı 100 karakterden uzun olamaz')
      }
    }

    if (price !== undefined) {
      if (price === null || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        validationErrors.push('Geçerli bir fiyat girilmelidir')
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validasyon hatası',
        validationErrors
      }, { status: 400 })
    }

    // Kategori kontrolü
    if (categoryId !== undefined && categoryId !== null) {
      const category = await prisma.category.findUnique({
        where: { categoryId: parseInt(categoryId) }
      })
      
      if (!category || !category.isActive) {
        return NextResponse.json({
          success: false,
          error: 'Geçerli bir kategori seçiniz'
        }, { status: 400 })
      }
    }

    // Image dosyalarını işle (eğer varsa)
    let processedImages: any[] = []
    if (imageFiles.length > 0) {
      const furnitureNameForImages = furnitureName?.trim() || existingFurniture.furnitureName
      processedImages = await processImageFiles(imageFiles, furnitureNameForImages)
    }

    // Ana transaction - Sadece mobilya verilerini güncelle
    const updatedFurniture = await prisma.$transaction(async (tx) => {
      // 1. Ana mobilya bilgilerini güncelle
      const updateData: any = {}
      
      if (furnitureName !== undefined) updateData.furnitureName = furnitureName.trim()
      if (furnitureType !== undefined) updateData.furnitureType = furnitureType.trim()
      if (categoryId !== undefined) updateData.categoryId = categoryId ? parseInt(categoryId) : null
      if (description !== undefined) updateData.description = description?.trim() || null
      if (price !== undefined) updateData.price = parseFloat(price)
      if (isActive !== undefined) updateData.isActive = Boolean(isActive === 'true' || isActive === true)

      const furniture = await tx.furniture.update({
        where: { furnitureId },
        data: updateData
      })

      // 2. Renkleri güncelle
      if (parsedColorIds !== undefined) {
        await tx.furnitureColor.deleteMany({
          where: { furnitureId }
        })

        if (Array.isArray(parsedColorIds) && parsedColorIds.length > 0) {
          const colorIdNumbers = parsedColorIds.map((id: number) => parseInt(String(id))).filter((id: number) => !isNaN(id))
          
          if (colorIdNumbers.length > 0) {
            const existingColors = await tx.color.findMany({
              where: { 
                colorId: { in: colorIdNumbers },
                isActive: true 
              }
            })

            if (existingColors.length === colorIdNumbers.length) {
              await tx.furnitureColor.createMany({
                data: colorIdNumbers.map((colorId: number) => ({
                  furnitureId,
                  colorId,
                  isAvailable: true
                }))
              })
            }
          }
        }
      }

      // 3. Özellikleri güncelle
      if (parsedProperties !== undefined) {
        await tx.furnitureProperty.deleteMany({
          where: { furnitureId }
        })

        if (Array.isArray(parsedProperties) && parsedProperties.length > 0) {
          const propertyIds = parsedProperties.map((p: { propertyId: number }) => parseInt(String(p.propertyId))).filter((id: number) => !isNaN(id))
          
          if (propertyIds.length > 0) {
            const existingProperties = await tx.property.findMany({
              where: { 
                propertyId: { in: propertyIds },
                isActive: true 
              }
            })

            if (existingProperties.length === propertyIds.length) {
              await tx.furnitureProperty.createMany({
                data: parsedProperties.map((prop: { propertyId: number; propertyValue: string }) => ({
                  furnitureId,
                  propertyId: parseInt(String(prop.propertyId)),
                  propertyValue: prop.propertyValue.trim(),
                  isActive: true
                }))
              })
            }
          }
        }
      }

      return furniture
    }, {
      timeout: 30000
    })

    // Transaction başarılı olduktan sonra image işlemlerini yap

    // 1. Silinecek image'lar varsa sil
    let imageDeleteResults = []
    if (parsedRemoveImageIds && parsedRemoveImageIds.length > 0) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/images?ids=${parsedRemoveImageIds.join(',')}&force=true`, {
          method: 'DELETE'
        })
        const imageDeleteResult = await response.json()
        imageDeleteResults.push(imageDeleteResult)
      } catch (error) {
        console.warn('Image silme hatası:', error)
      }
    }

    // 2. Yeni image dosyaları varsa ekle
    let imageUploadResults = []
    if (processedImages.length > 0) {
      try {
        imageUploadResults = await createImagesForFurniture(furnitureId, processedImages)
      } catch (error) {
        console.warn('Image yükleme hatası:', error)
      }
    }

    // Güncellenmiş mobilyayı getir
    const finalFurniture = await prisma.furniture.findUnique({
      where: { furnitureId },
      include: {
        category: {
          select: {
            categoryId: true,
            categoryName: true,
            categoryPath: true
          }
        },
        colors: {
          include: {
            color: {
              select: {
                colorId: true,
                colorName: true,
                colorCode: true
              }
            }
          }
        },
        properties: {
          include: {
            property: {
              select: {
                propertyId: true,
                propertyName: true,
                propertyType: true
              }
            }
          }
        },
        images: {
          where: { isActive: true },
          include: {
            image: {
              select: {
                imageId: true,
                fileName: true,
                filePath: true,
                altText: true
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: {
            colors: true,
            properties: true,
            images: true
          }
        }
      }
    })

    const response: any = {
      success: true,
      message: 'Mobilya başarıyla güncellendi',
      data: finalFurniture
    }

    // Image işlem sonuçlarını ekle
    if (imageFiles.length > 0 || (parsedRemoveImageIds && parsedRemoveImageIds.length > 0)) {
      response.imageOperations = {
        uploaded: imageUploadResults.length,
        deleted: imageDeleteResults.length,
        uploadResults: imageUploadResults,
        deleteResults: imageDeleteResults
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Mobilya güncelleme hatası:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Mobilya güncellenirken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// DELETE - Mobilya sil
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const furnitureId = parseInt(id)

    if (isNaN(furnitureId) || furnitureId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz mobilya ID\'si'
      }, { status: 400 })
    }

    // Mobilyayı ve ilişkili image'ları kontrol et
    const furniture = await prisma.furniture.findUnique({
      where: { furnitureId },
      include: {
        images: {
          include: {
            image: {
              select: {
                imageId: true,
                fileName: true
              }
            }
          }
        },
        _count: {
          select: {
            colors: true,
            properties: true,
            images: true
          }
        }
      }
    })

    if (!furniture) {
      return NextResponse.json({
        success: false,
        error: 'Mobilya bulunamadı'
      }, { status: 404 })
    }

    // Image ID'lerini topla
    const imageIds = furniture.images.map(fi => fi.image.imageId)

    // Transaction ile mobilyayı sil
    await prisma.$transaction(async (tx) => {
      // İlişkili kayıtları sil
      await tx.furnitureImage.deleteMany({
        where: { furnitureId }
      })
      
      await tx.furnitureProperty.deleteMany({
        where: { furnitureId }
      })
      
      await tx.furnitureColor.deleteMany({
        where: { furnitureId }
      })

      // Mobilyayı sil
      await tx.furniture.delete({
        where: { furnitureId }
      })
    })

    // Transaction başarılı olduktan sonra image'ları sil
    let imageDeleteResults = []
    if (imageIds.length > 0) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/images?ids=${imageIds.join(',')}&force=true`, {
          method: 'DELETE'
        })
        const imageDeleteResult = await response.json()
        imageDeleteResults.push(imageDeleteResult)
      } catch (error) {
        console.warn('Image silme hatası:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `"${furniture.furnitureName}" mobilyası başarıyla silindi`,
      deletedItem: {
        furnitureId: furniture.furnitureId,
        furnitureName: furniture.furnitureName,
        relatedData: {
          colors: furniture._count.colors,
          properties: furniture._count.properties,
          images: furniture._count.images
        }
      },
      imageDeleteResults
    })

  } catch (error) {
    console.error('Mobilya silme hatası:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Mobilya silinirken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}