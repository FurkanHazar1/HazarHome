// app/api/furniture-sets/[id]/route.ts - Tekil Furniture Set API
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Type definitions
interface FurnitureSetItem {
  furnitureId: number;
  quantity: number;
  sortOrder?: number;
}

interface PropertyInput {
  propertyId: number;
  propertyValue: string;
}

interface ImageInput {
  imageId?: number;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  fileType?: string;
  description?: string;
  altText?: string;
  width?: number;
  height?: number;
  originalFileName?: string;
  sortOrder?: number;
  imageType?: string;
}

// GET - Tek furniture set detayı
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const setId = parseInt(params.id)

    if (isNaN(setId) || setId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz furniture set ID\'si'
      }, { status: 400 })
    }

    const furnitureSet = await prisma.furnitureSet.findUnique({
      where: { setId },
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
        furnitureSetColors: {
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
        furnitureSetProperties: {
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
        furnitureSetImages: {
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
        furnitureSetItems: {
          include: {
            furniture: {
              select: {
                furnitureId: true,
                furnitureName: true,
                furnitureType: true,
                price: true,
                description: true,
                isActive: true,
                furnitureImages: {
                  where: { isActive: true, imageType: 'main_image' },
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
                  take: 1
                }
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: {
            furnitureSetColors: true,
            furnitureSetProperties: true,
            furnitureSetImages: true,
            furnitureSetItems: true
          }
        }
      }
    })

    if (!furnitureSet) {
      return NextResponse.json({
        success: false,
        error: 'Furniture Set bulunamadı'
      }, { status: 404 })
    }

    // Breadcrumb oluştur
    const breadcrumb = []
    if (furnitureSet.category) {
      if (furnitureSet.category.parent) {
        breadcrumb.push({
          categoryId: furnitureSet.category.parent.categoryId,
          categoryName: furnitureSet.category.parent.categoryName
        })
      }
      breadcrumb.push({
        categoryId: furnitureSet.category.categoryId,
        categoryName: furnitureSet.category.categoryName
      })
    }

    // Ana görsel ve galeri ayır
    const mainImages = furnitureSet.furnitureSetImages.filter(fi => fi.imageType === 'main_image')
    const galleryImages = furnitureSet.furnitureSetImages.filter(fi => fi.imageType !== 'main_image')

    // Set içindeki mobilyaların toplam değeri
    const totalFurnitureValue = furnitureSet.furnitureSetItems.reduce((total, item) => {
      return total + (item.furniture.price.toNumber() * item.quantity)
    }, 0)

    return NextResponse.json({
      success: true,
      data: {
        ...furnitureSet,
        breadcrumb,
        imageGallery: {
          mainImages,
          galleryImages,
          totalImages: furnitureSet._count.furnitureSetImages
        },
        stats: {
          totalColors: furnitureSet._count.furnitureSetColors,
          totalProperties: furnitureSet._count.furnitureSetProperties,
          totalImages: furnitureSet._count.furnitureSetImages,
          totalItems: furnitureSet._count.furnitureSetItems,
          totalFurnitureValue: totalFurnitureValue,
          totalQuantity: furnitureSet.furnitureSetItems.reduce((total, item) => total + item.quantity, 0)
        }
      }
    })

  } catch (error) {
    console.error('Furniture Set detay hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Furniture Set getirilemedi',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}

// PUT - Furniture Set güncelle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const setId = parseInt(params.id)
    
    if (isNaN(setId) || setId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz furniture set ID\'si'
      }, { status: 400 })
    }

    const data = await request.json()
    const {
      setName,
      categoryId,
      description,
      price,
      isActive,
      colorIds,
      properties,
      images,
      furnitureItems
    } = data

    // Mevcut furniture set'i kontrol et
    const existingSet = await prisma.furnitureSet.findUnique({
      where: { setId },
      include: {
        furnitureSetColors: true,
        furnitureSetProperties: true,
        furnitureSetImages: true,
        furnitureSetItems: true
      }
    })

    if (!existingSet) {
      return NextResponse.json({
        success: false,
        error: 'Furniture Set bulunamadı'
      }, { status: 404 })
    }

    // Validasyonlar
    const validationErrors = []

    if (setName !== undefined) {
      if (!setName || typeof setName !== 'string' || setName.trim().length === 0) {
        validationErrors.push('Set adı boş olamaz')
      } else if (setName.trim().length > 150) {
        validationErrors.push('Set adı 150 karakterden uzun olamaz')
      }
    }

    if (categoryId !== undefined && categoryId !== null) {
      if (isNaN(parseInt(String(categoryId))) || parseInt(String(categoryId)) <= 0) {
        validationErrors.push('Geçerli bir kategori ID\'si girilmelidir')
      }
    }

    if (price !== undefined) {
      if (price === null || isNaN(parseFloat(String(price))) || parseFloat(String(price)) <= 0) {
        validationErrors.push('Geçerli bir fiyat girilmelidir')
      } else if (parseFloat(String(price)) > 999999999.99) {
        validationErrors.push('Fiyat çok yüksek')
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

    // furnitureItems validasyonu
    if (furnitureItems !== undefined && furnitureItems !== null) {
      if (!Array.isArray(furnitureItems) || furnitureItems.length === 0) {
        validationErrors.push('En az bir mobilya seçilmelidir')
      } else {
        furnitureItems.forEach((item: FurnitureSetItem, index: number) => {
          if (!item.furnitureId || isNaN(parseInt(String(item.furnitureId)))) {
            validationErrors.push(`Mobilya ${index + 1}: Geçerli bir mobilya ID\'si gerekli`)
          }
          if (!item.quantity || isNaN(parseInt(String(item.quantity))) || parseInt(String(item.quantity)) <= 0) {
            validationErrors.push(`Mobilya ${index + 1}: Geçerli bir miktar girilmelidir`)
          }
        })
      }
    }

    // Aynı isimde başka furniture set var mı kontrol et (sadece setName değişiyorsa)
    if (setName !== undefined && setName?.trim() !== existingSet.setName) {
      const duplicateSet = await prisma.furnitureSet.findFirst({
        where: {
          setName: {
            equals: setName.trim(),
            mode: 'insensitive'
          },
          setId: { not: setId }
        }
      })

      if (duplicateSet) {
        validationErrors.push('Bu isimde başka bir furniture set zaten mevcut')
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
        where: { categoryId: parseInt(String(categoryId)) }
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
          error: 'Pasif kategoriye furniture set atanamaz'
        }, { status: 400 })
      }
    }

    // Mobilyaların varlığını kontrol et (eğer güncelleme varsa)
    if (furnitureItems !== undefined) {
      const furnitureIds = furnitureItems.map((item: FurnitureSetItem) => parseInt(String(item.furnitureId)))
      const existingFurnitures = await prisma.furniture.findMany({
        where: { 
          furnitureId: { in: furnitureIds },
          isActive: true 
        }
      })

      if (existingFurnitures.length !== furnitureIds.length) {
        return NextResponse.json({
          success: false,
          error: 'Bazı mobilyalar bulunamadı veya pasif durumda'
        }, { status: 400 })
      }
    }

    // Transaction ile güncelle
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ana furniture set bilgilerini güncelle
      const updateData: any = {}
      
      if (setName !== undefined) updateData.setName = setName?.trim() || null
      if (categoryId !== undefined) updateData.categoryId = categoryId ? parseInt(String(categoryId)) : null
      if (description !== undefined) updateData.description = description?.trim() || null
      if (price !== undefined) updateData.price = parseFloat(String(price))
      if (isActive !== undefined) updateData.isActive = Boolean(isActive)

      const updatedSet = await tx.furnitureSet.update({
        where: { setId },
        data: updateData
      })

      // 2. Mobilyaları güncelle
      if (furnitureItems !== undefined) {
        // Mevcut mobilyaları sil
        await tx.furnitureSetAndFurniture.deleteMany({
          where: { furnitureSetId: setId }
        })

        // Yeni mobilyaları ekle
        if (Array.isArray(furnitureItems) && furnitureItems.length > 0) {
          await tx.furnitureSetAndFurniture.createMany({
            data: furnitureItems.map((item: FurnitureSetItem, index: number) => ({
              furnitureSetId: setId,
              furnitureId: parseInt(String(item.furnitureId)),
              quantity: parseInt(String(item.quantity)),
              sortOrder: item.sortOrder || index + 1
            }))
          })
        }
      }

      // 3. Renkleri güncelle
      if (colorIds !== undefined) {
        // Mevcut renkleri sil
        await tx.furnitureSetColor.deleteMany({
          where: { furnitureSetId: setId }
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

            await tx.furnitureSetColor.createMany({
              data: colorIdNumbers.map((colorId: number) => ({
                furnitureSetId: setId,
                colorId,
                isAvailable: true
              }))
            })
          }
        }
      }

      // 4. Özellikleri güncelle
      if (properties !== undefined) {
        // Mevcut özellikleri sil
        await tx.furnitureSetProperty.deleteMany({
          where: { furnitureSetId: setId }
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

            await tx.furnitureSetProperty.createMany({
              data: properties.map((prop: PropertyInput) => ({
                furnitureSetId: setId,
                propertyId: parseInt(String(prop.propertyId)),
                propertyValue: prop.propertyValue.trim(),
                isActive: true
              }))
            })
          }
        }
      }

      // 5. Görselleri güncelle
      if (images !== undefined) {
        // Mevcut görsel ilişkilerini pasif yap
        await tx.furnitureSetImage.updateMany({
          where: { furnitureSetId: setId },
          data: { isActive: false }
        })

        // Yeni görsel ilişkileri ekle
        if (Array.isArray(images) && images.length > 0) {
          for (const imageData of images) {
            if (imageData.imageId && !isNaN(parseInt(String(imageData.imageId)))) {
              // Önce mevcut ilişkiyi kontrol et
              const existingRelation = await tx.furnitureSetImage.findFirst({
                where: {
                  furnitureSetId: setId,
                  imageId: parseInt(String(imageData.imageId))
                }
              })

              if (existingRelation) {
                // Mevcut ilişkiyi güncelle
                await tx.furnitureSetImage.update({
                  where: { id: existingRelation.id },
                  data: {
                    isActive: true,
                    sortOrder: imageData.sortOrder ? parseInt(String(imageData.sortOrder)) : 1,
                    imageType: imageData.imageType?.trim() || 'main_image'
                  }
                })
              } else {
                // Yeni ilişki oluştur
                await tx.furnitureSetImage.create({
                  data: {
                    furnitureSetId: setId,
                    imageId: parseInt(String(imageData.imageId)),
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

      // Güncellenmiş furniture set'i getir
      const finalSet = await tx.furnitureSet.findUnique({
        where: { setId },
        include: {
          category: {
            select: {
              categoryId: true,
              categoryName: true,
              categoryPath: true
            }
          },
          furnitureSetColors: {
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
          furnitureSetProperties: {
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
          furnitureSetImages: {
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
          furnitureSetItems: {
            include: {
              furniture: {
                select: {
                  furnitureId: true,
                  furnitureName: true,
                  furnitureType: true,
                  price: true
                }
              }
            },
            orderBy: { sortOrder: 'asc' }
          },
          _count: {
            select: {
              furnitureSetColors: true,
              furnitureSetProperties: true,
              furnitureSetImages: true,
              furnitureSetItems: true
            }
          }
        }
      })

      return finalSet
    }, {
      timeout: 30000
    })

    return NextResponse.json({
      success: true,
      message: 'Furniture Set başarıyla güncellendi',
      data: result
    })

  } catch (error) {
    console.error('Furniture Set güncelleme hatası:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Furniture Set güncellenirken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
    }, { status: 500 })
  }
}

// DELETE - Furniture Set sil
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const setId = parseInt(params.id)

    if (isNaN(setId) || setId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz furniture set ID\'si'
      }, { status: 400 })
    }

    // Furniture set'i kontrol et
    const furnitureSet = await prisma.furnitureSet.findUnique({
      where: { setId },
      select: {
        setId: true,
        setName: true,
        _count: {
          select: {
            furnitureSetColors: true,
            furnitureSetProperties: true,
            furnitureSetImages: true,
            furnitureSetItems: true
          }
        }
      }
    })

    if (!furnitureSet) {
      return NextResponse.json({
        success: false,
        error: 'Furniture Set bulunamadı'
      }, { status: 404 })
    }

    // Transaction ile sil
    await prisma.$transaction(async (tx) => {
      // İlişkili kayıtları sil
      await tx.furnitureSetImage.deleteMany({
        where: { furnitureSetId: setId }
      })
      
      await tx.furnitureSetProperty.deleteMany({
        where: { furnitureSetId: setId }
      })
      
      await tx.furnitureSetColor.deleteMany({
        where: { furnitureSetId: setId }
      })

      await tx.furnitureSetAndFurniture.deleteMany({
        where: { furnitureSetId: setId }
      })

      // Furniture set'i sil
      await tx.furnitureSet.delete({
        where: { setId }
      })
    })

    return NextResponse.json({
      success: true,
      message: `"${furnitureSet.setName || 'İsimsiz Set'}" furniture set'i başarıyla silindi`,
      deletedItem: {
        setId: furnitureSet.setId,
        setName: furnitureSet.setName,
        relatedData: {
          colors: furnitureSet._count.furnitureSetColors,
          properties: furnitureSet._count.furnitureSetProperties,
          images: furnitureSet._count.furnitureSetImages,
          items: furnitureSet._count.furnitureSetItems
        }
      }
    })

  } catch (error) {
    console.error('Furniture Set silme hatası:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Furniture Set silinirken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
    }, { status: 500 })
  }
}