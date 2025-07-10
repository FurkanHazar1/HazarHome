// app/api/furniture/[id]/route.ts - Image API ile uyumlu Tekil Mobilya API
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Type definitions
interface PropertyInput {
  propertyId: number;
  propertyValue: string;
}

interface ImageRelationInput {
  imageId: number;  // Sadece mevcut image ID'si
  sortOrder?: number;
  imageType?: string;  // 'main_image', 'gallery', etc.
}

// GET - Tek mobilya detayı (aynı kalır)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const furnitureId = parseInt(params.id)

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
      error: 'Mobilya getirilemedi',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}

// PUT - Mobilya güncelle (Image oluşturma kısmı çıkarıldı)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const furnitureId = parseInt(params.id)
    
    if (isNaN(furnitureId) || furnitureId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz mobilya ID\'si'
      }, { status: 400 })
    }

    const data = await request.json()
    const {
      furnitureName,
      furnitureType,
      categoryId,
      description,
      price,
      isActive,
      colorIds,
      properties,
      images  // Sadece mevcut image ID'leri
    } = data

    // Mevcut mobilyayı kontrol et
    const existingFurniture = await prisma.furniture.findUnique({
      where: { furnitureId },
      include: {
        colors: true,
        properties: true,
        images: true
      }
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

    if (furnitureType !== undefined) {
      if (!furnitureType || typeof furnitureType !== 'string' || furnitureType.trim().length === 0) {
        validationErrors.push('Mobilya tipi boş olamaz')
      } else if (furnitureType.trim().length > 50) {
        validationErrors.push('Mobilya tipi 50 karakterden uzun olamaz')
      }
    }

    if (price !== undefined) {
      if (price === null || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        validationErrors.push('Geçerli bir fiyat girilmelidir')
      } else if (parseFloat(price) > 999999999.99) {
        validationErrors.push('Fiyat çok yüksek')
      }
    }

    if (categoryId !== undefined && categoryId !== null) {
      if (isNaN(parseInt(categoryId)) || parseInt(categoryId) <= 0) {
        validationErrors.push('Geçerli bir kategori ID\'si girilmelidir')
      }
    }

    if (description !== undefined && description !== null && typeof description === 'string' && description.length > 1000) {
      validationErrors.push('Açıklama 1000 karakterden uzun olamaz')
    }

    // colorIds validasyonu
    if (colorIds !== undefined && colorIds !== null) {
      if (!Array.isArray(colorIds) || colorIds.some((id: number) => isNaN(parseInt(String(id))))) {
        validationErrors.push('Renk ID\'leri geçerli sayılar olmalıdır')
      }
    }

    // properties validasyonu
    if (properties !== undefined && properties !== null && Array.isArray(properties)) {
      properties.forEach((prop: PropertyInput, index: number) => {
        if (!prop.propertyId || isNaN(parseInt(String(prop.propertyId)))) {
          validationErrors.push(`Özellik ${index + 1}: Geçerli bir özellik ID\'si gerekli`)
        }
        if (!prop.propertyValue || typeof prop.propertyValue !== 'string' || prop.propertyValue.trim().length === 0) {
          validationErrors.push(`Özellik ${index + 1}: Özellik değeri gerekli`)
        } else if (prop.propertyValue.trim().length > 200) {
          validationErrors.push(`Özellik ${index + 1}: Özellik değeri 200 karakterden uzun olamaz`)
        }
      })
    }

    // images validasyonu (Sadece mevcut image ID'leri kontrol et)
    if (images !== undefined && images !== null && Array.isArray(images)) {
      images.forEach((img: ImageRelationInput, index: number) => {
        if (!img.imageId || isNaN(parseInt(String(img.imageId))) || parseInt(String(img.imageId)) <= 0) {
          validationErrors.push(`Görsel ${index + 1}: Geçerli bir image ID\'si gerekli`)
        }
        if (img.sortOrder !== undefined && (isNaN(parseInt(String(img.sortOrder))) || parseInt(String(img.sortOrder)) < 0)) {
          validationErrors.push(`Görsel ${index + 1}: Sıralama değeri geçerli bir pozitif sayı olmalıdır`)
        }
        if (img.imageType && typeof img.imageType !== 'string') {
          validationErrors.push(`Görsel ${index + 1}: Image tipi string olmalıdır`)
        }
      })
    }

    // Aynı isimde başka mobilya var mı kontrol et (sadece furnitureName değişiyorsa)
    if (furnitureName !== undefined && furnitureName.trim() !== existingFurniture.furnitureName) {
      const duplicateFurniture = await prisma.furniture.findFirst({
        where: {
          furnitureName: {
            equals: furnitureName.trim(),
            mode: 'insensitive'
          },
          furnitureId: { not: furnitureId }
        }
      })

      if (duplicateFurniture) {
        validationErrors.push('Bu isimde başka bir mobilya zaten mevcut')
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
      
      if (!category) {
        return NextResponse.json({
          success: false,
          error: 'Belirtilen kategori bulunamadı'
        }, { status: 400 })
      }

      if (!category.isActive) {
        return NextResponse.json({
          success: false,
          error: 'Pasif kategoriye mobilya atanamaz'
        }, { status: 400 })
      }
    }

    // Transaction ile güncelle
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ana mobilya bilgilerini güncelle
      const updateData: any = {}
      
      if (furnitureName !== undefined) updateData.furnitureName = furnitureName.trim()
      if (furnitureType !== undefined) updateData.furnitureType = furnitureType.trim()
      if (categoryId !== undefined) updateData.categoryId = categoryId ? parseInt(categoryId) : null
      if (description !== undefined) updateData.description = description?.trim() || null
      if (price !== undefined) updateData.price = parseFloat(price)
      if (isActive !== undefined) updateData.isActive = Boolean(isActive)

      const updatedFurniture = await tx.furniture.update({
        where: { furnitureId },
        data: updateData
      })

      // 2. Renkleri güncelle
      if (colorIds !== undefined) {
        // Mevcut renkleri sil
        await tx.furnitureColor.deleteMany({
          where: { furnitureId }
        })

        // Yeni renkleri ekle
        if (Array.isArray(colorIds) && colorIds.length > 0) {
          const colorIdNumbers = colorIds.map((id: number) => parseInt(String(id))).filter((id: number) => !isNaN(id))
          
          if (colorIdNumbers.length > 0) {
            const existingColors = await tx.color.findMany({
              where: { 
                colorId: { in: colorIdNumbers },
                isActive: true 
              }
            })

            if (existingColors.length !== colorIdNumbers.length) {
              throw new Error('Bazı renkler bulunamadı veya pasif durumda')
            }

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

      // 3. Özellikleri güncelle
      if (properties !== undefined) {
        // Mevcut özellikleri sil
        await tx.furnitureProperty.deleteMany({
          where: { furnitureId }
        })

        // Yeni özellikleri ekle
        if (Array.isArray(properties) && properties.length > 0) {
          const propertyIds = properties.map((p: PropertyInput) => parseInt(String(p.propertyId))).filter((id: number) => !isNaN(id))
          
          if (propertyIds.length > 0) {
            const existingProperties = await tx.property.findMany({
              where: { 
                propertyId: { in: propertyIds },
                isActive: true 
              }
            })

            if (existingProperties.length !== propertyIds.length) {
              throw new Error('Bazı özellikler bulunamadı veya pasif durumda')
            }

            await tx.furnitureProperty.createMany({
              data: properties.map((prop: PropertyInput) => ({
                furnitureId,
                propertyId: parseInt(String(prop.propertyId)),
                propertyValue: prop.propertyValue.trim(),
                isActive: true
              }))
            })
          }
        }
      }

      // 4. Mevcut görselleri bağla (Yeni görsel oluşturma YOK)
      if (images !== undefined) {
        // Mevcut görsel ilişkilerini pasif yap
        await tx.furnitureImage.updateMany({
          where: { furnitureId },
          data: { isActive: false }
        })

        // Yeni görsel ilişkileri ekle
        if (Array.isArray(images) && images.length > 0) {
          const imageIds = images.map((img: ImageRelationInput) => parseInt(String(img.imageId))).filter((id: number) => !isNaN(id))
          
          if (imageIds.length > 0) {
            // Image'ların varlığını ve aktif olduğunu kontrol et
            const existingImages = await tx.image.findMany({
              where: { 
                imageId: { in: imageIds },
                isActive: true 
              },
              select: { imageId: true }
            })

            if (existingImages.length !== imageIds.length) {
              const foundImageIds = existingImages.map(img => img.imageId)
              const notFoundImageIds = imageIds.filter(id => !foundImageIds.includes(id))
              throw new Error(`Bazı görseller bulunamadı veya pasif durumda: ${notFoundImageIds.join(', ')}`)
            }

            // Her image için ilişki oluştur
            for (const imageData of images as ImageRelationInput[]) {
              const imageId = parseInt(String(imageData.imageId))
              
              // Önce mevcut ilişkiyi kontrol et
              const existingRelation = await tx.furnitureImage.findFirst({
                where: {
                  furnitureId,
                  imageId: imageId
                }
              })

              if (existingRelation) {
                // Mevcut ilişkiyi güncelle
                await tx.furnitureImage.update({
                  where: { id: existingRelation.id },
                  data: {
                    isActive: true,
                    sortOrder: imageData.sortOrder ? parseInt(String(imageData.sortOrder)) : 1,
                    imageType: imageData.imageType?.trim() || 'main_image'
                  }
                })
              } else {
                // Yeni ilişki oluştur
                await tx.furnitureImage.create({
                  data: {
                    furnitureId,
                    imageId: imageId,
                    sortOrder: imageData.sortOrder ? parseInt(String(imageData.sortOrder)) : 1,
                    imageType: imageData.imageType?.trim() || 'main_image',
                    isActive: true
                  }
                })
              }
            }
          }
        }
      }

      // Güncellenmiş mobilyayı getir
      const finalFurniture = await tx.furniture.findUnique({
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
                  altText: true,
                  width: true,
                  height: true
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

      return finalFurniture
    }, {
      timeout: 30000
    })

    return NextResponse.json({
      success: true,
      message: 'Mobilya başarıyla güncellendi',
      data: result
    })

  } catch (error) {
    console.error('Mobilya güncelleme hatası:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Mobilya güncellenirken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
    }, { status: 500 })
  }
}

// DELETE - Mobilya sil (aynı kalır)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const furnitureId = parseInt(params.id)

    if (isNaN(furnitureId) || furnitureId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz mobilya ID\'si'
      }, { status: 400 })
    }

    // Mobilyayı kontrol et
    const furniture = await prisma.furniture.findUnique({
      where: { furnitureId },
      select: {
        furnitureId: true,
        furnitureName: true,
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

    // Transaction ile sil
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
      }
    })

  } catch (error) {
    console.error('Mobilya silme hatası:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Mobilya silinirken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
    }, { status: 500 })
  }
}