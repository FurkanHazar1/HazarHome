// app/api/furniture-sets/route.ts - Furniture Sets API
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
  imageType?: string;
}

// GET - Furniture Sets listele
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parametreleri
    const categoryId = searchParams.get('categoryId')
    const isActive = searchParams.get('active')
    const search = searchParams.get('search')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const colorIds = searchParams.get('colorIds')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const includeDetails = searchParams.get('includeDetails') === 'true'

    // Where koşulları
    let whereClause: any = {}

    // Aktif/pasif filtresi
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    // Kategori filtresi
    if (categoryId && !isNaN(parseInt(categoryId))) {
      whereClause.categoryId = parseInt(categoryId)
    }

    // Fiyat aralığı filtresi
    if (minPrice || maxPrice) {
      whereClause.price = {}
      if (minPrice && !isNaN(parseFloat(minPrice))) {
        whereClause.price.gte = parseFloat(minPrice)
      }
      if (maxPrice && !isNaN(parseFloat(maxPrice))) {
        whereClause.price.lte = parseFloat(maxPrice)
      }
    }

    // Arama filtresi
    if (search?.trim()) {
      whereClause.OR = [
        { setName: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } }
      ]
    }

    // Renk filtresi (set içindeki mobilyaların renklerine göre)
    if (colorIds?.trim()) {
      const colorIdArray = colorIds.split(',')
        .map((id: string) => parseInt(id.trim()))
        .filter((id: number) => !isNaN(id))
      
      if (colorIdArray.length > 0) {
        whereClause.furnitureSetColors = {
          some: {
            colorId: { in: colorIdArray },
            isAvailable: true
          }
        }
      }
    }

    // Sıralama seçenekleri
    const validSortFields = ['setName', 'price', 'createdAt', 'setId']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const orderBy: any = {}
    orderBy[sortField] = sortOrder === 'asc' ? 'asc' : 'desc'

    // Sayfalama
    const skip = (page - 1) * limit

    // Include seçenekleri
    const includeOptions: any = {
      category: {
        select: {
          categoryId: true,
          categoryName: true,
          categoryPath: true
        }
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

    if (includeDetails) {
      includeOptions.furnitureSetColors = {
        where: { isAvailable: true },
        include: {
          color: {
            select: {
              colorId: true,
              colorName: true,
              colorCode: true
            }
          }
        }
      }
      includeOptions.furnitureSetProperties = {
        where: { isActive: true },
        include: {
          property: {
            select: {
              propertyId: true,
              propertyName: true,
              propertyType: true
            }
          }
        },
        orderBy: { property: { propertyName: 'asc' } }
      }
      includeOptions.furnitureSetImages = {
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
      }
      includeOptions.furnitureSetItems = {
        include: {
          furniture: {
            select: {
              furnitureId: true,
              furnitureName: true,
              furnitureType: true,
              price: true,
              isActive: true
            }
          }
        },
        orderBy: { sortOrder: 'asc' }
      }
    }

    const [furnitureSets, total] = await Promise.all([
      prisma.furnitureSet.findMany({
        where: whereClause,
        include: includeOptions,
        orderBy,
        skip,
        take: limit
      }),
      prisma.furnitureSet.count({ where: whereClause })
    ])

    // İstatistikler
    const stats = await prisma.furnitureSet.aggregate({
      where: whereClause,
      _count: { setId: true },
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true }
    })

    return NextResponse.json({
      success: true,
      data: furnitureSets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      stats: {
        total: stats._count.setId,
        averagePrice: stats._avg.price,
        minPrice: stats._min.price,
        maxPrice: stats._max.price
      },
      filters: {
        categoryId: categoryId ? parseInt(categoryId) : null,
        isActive,
        search,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        colorIds
      },
      sort: { sortBy: sortField, sortOrder }
    })

  } catch (error) {
    console.error('Furniture Sets listesi hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Furniture Sets getirilemedi',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}

// POST - Yeni Furniture Set ekle
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const {
      setName,
      categoryId,
      description,
      price,
      isActive = true,
      colorIds = [],
      properties = [],
      images = [],
      furnitureItems = []
    } = data

    // Temel validasyonlar
    const validationErrors = []

    if (!setName || typeof setName !== 'string' || setName.trim().length === 0) {
      validationErrors.push('Set adı zorunludur')
    } else if (setName.trim().length > 150) {
      validationErrors.push('Set adı 150 karakterden uzun olamaz')
    }

    if (!categoryId || isNaN(parseInt(String(categoryId))) || parseInt(String(categoryId)) <= 0) {
      validationErrors.push('Geçerli bir kategori ID\'si girilmelidir')
    }

    if (price === undefined || price === null || isNaN(parseFloat(String(price))) || parseFloat(String(price)) <= 0) {
      validationErrors.push('Geçerli bir fiyat girilmelidir')
    } else if (parseFloat(String(price)) > 999999999.99) {
      validationErrors.push('Fiyat çok yüksek')
    }

    if (description && typeof description === 'string' && description.length > 1000) {
      validationErrors.push('Açıklama 1000 karakterden uzun olamaz')
    }

    // colorIds validasyonu
    if (colorIds && (!Array.isArray(colorIds) || colorIds.some((id: number) => isNaN(parseInt(String(id)))))) {
      validationErrors.push('Renk ID\'leri geçerli sayılar olmalıdır')
    }

    // properties validasyonu
    if (properties && Array.isArray(properties)) {
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
    if (!furnitureItems || !Array.isArray(furnitureItems) || furnitureItems.length === 0) {
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

    // images validasyonu
    if (images && Array.isArray(images)) {
      images.forEach((img: ImageInput, index: number) => {
        if (!img.fileName || typeof img.fileName !== 'string' || img.fileName.trim().length === 0) {
          validationErrors.push(`Görsel ${index + 1}: Dosya adı gerekli`)
        }
        if (!img.filePath || typeof img.filePath !== 'string' || img.filePath.trim().length === 0) {
          validationErrors.push(`Görsel ${index + 1}: Dosya yolu gerekli`)
        }
      })
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validasyon hatası',
        validationErrors
      }, { status: 400 })
    }

    // Kategori kontrolü
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
        error: 'Pasif kategoriye furniture set eklenemez'
      }, { status: 400 })
    }

    // Mobilyaların varlığını kontrol et
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

    // Aynı isimde furniture set kontrolü
    if (setName) {
      const existingSet = await prisma.furnitureSet.findFirst({
        where: {
          setName: {
            equals: setName.trim(),
            mode: 'insensitive'
          }
        }
      })

      if (existingSet) {
        return NextResponse.json({
          success: false,
          error: 'Bu isimde bir furniture set zaten mevcut'
        }, { status: 400 })
      }
    }

    // Transaction ile furniture set oluştur
    const result = await prisma.$transaction(async (tx) => {
      // 1. Furniture Set'i oluştur
      const furnitureSet = await tx.furnitureSet.create({
        data: {
          setName: setName?.trim() || null,
          categoryId: parseInt(String(categoryId)),
          description: description?.trim() || null,
          price: parseFloat(String(price)),
          isActive: Boolean(isActive)
        }
      })

      // 2. Mobilyaları ekle
      if (furnitureItems && furnitureItems.length > 0) {
        await tx.furnitureSetAndFurniture.createMany({
          data: furnitureItems.map((item: FurnitureSetItem, index: number) => ({
            furnitureSetId: furnitureSet.setId,
            furnitureId: parseInt(String(item.furnitureId)),
            quantity: parseInt(String(item.quantity)),
            sortOrder: item.sortOrder || index + 1
          }))
        })
      }

      // 3. Renkleri ekle
      if (colorIds && colorIds.length > 0) {
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
              furnitureSetId: furnitureSet.setId,
              colorId: colorId,
              isAvailable: true
            }))
          })
        }
      }

      // 4. Özellikleri ekle
      if (properties && properties.length > 0) {
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
              furnitureSetId: furnitureSet.setId,
              propertyId: parseInt(String(prop.propertyId)),
              propertyValue: prop.propertyValue.trim(),
              isActive: true
            }))
          })
        }
      }

      // 5. Görselleri ekle
      if (images && images.length > 0) {
        for (const imageData of images as ImageInput[]) {
          // Önce image tablosuna ekle
          const image = await tx.image.create({
            data: {
              fileName: imageData.fileName.trim(),
              filePath: imageData.filePath.trim(),
              fileSize: imageData.fileSize ? parseInt(String(imageData.fileSize)) : null,
              fileType: imageData.fileType?.trim() || null,
              description: imageData.description?.trim() || null,
              altText: imageData.altText?.trim() || setName?.trim() || 'Furniture Set',
              width: imageData.width ? parseInt(String(imageData.width)) : null,
              height: imageData.height ? parseInt(String(imageData.height)) : null,
              originalFileName: imageData.originalFileName?.trim() || imageData.fileName.trim(),
              sortOrder: imageData.sortOrder ? parseInt(String(imageData.sortOrder)) : 1,
              isActive: true
            }
          })

          // Sonra furniture_set_images tablosuna bağla
          await tx.furnitureSetImage.create({
            data: {
              furnitureSetId: furnitureSet.setId,
              imageId: image.imageId,
              sortOrder: imageData.sortOrder ? parseInt(String(imageData.sortOrder)) : 1,
              imageType: imageData.imageType?.trim() || 'main_image',
              isActive: true
            }
          })
        }
      }

      // Oluşturulan furniture set'i tüm ilişkili verilerle getir
      const createdFurnitureSet = await tx.furnitureSet.findUnique({
        where: { setId: furnitureSet.setId },
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

      return createdFurnitureSet
    }, {
      timeout: 30000
    })

    return NextResponse.json({
      success: true,
      message: 'Furniture Set başarıyla eklendi',
      data: result
    }, { status: 201 })

  } catch (error) {
    console.error('Furniture Set ekleme hatası:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Furniture Set eklenirken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// DELETE - Toplu furniture set silme
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    
    if (!idsParam?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Silinecek furniture set ID\'leri belirtilmeli'
      }, { status: 400 })
    }

    const ids = idsParam.split(',')
      .map((id: string) => parseInt(id.trim()))
      .filter((id: number) => !isNaN(id) && id > 0)
    
    if (ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçerli furniture set ID\'si bulunamadı'
      }, { status: 400 })
    }

    // Furniture set'leri kontrol et
    const furnitureSets = await prisma.furnitureSet.findMany({
      where: { setId: { in: ids } },
      select: {
        setId: true,
        setName: true
      }
    })

    if (furnitureSets.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Belirtilen ID\'lerde furniture set bulunamadı'
      }, { status: 404 })
    }

    if (furnitureSets.length !== ids.length) {
      const foundIds = furnitureSets.map((f: { setId: number }) => f.setId)
      const notFoundIds = ids.filter((id: number) => !foundIds.includes(id))
      
      return NextResponse.json({
        success: false,
        error: `Bazı furniture set'ler bulunamadı: ${notFoundIds.join(', ')}`
      }, { status: 400 })
    }

    // Transaction ile sil
    const result = await prisma.$transaction(async (tx) => {
      const foundIds = furnitureSets.map((f: { setId: number }) => f.setId)
      
      // İlişkili kayıtları sil
      await tx.furnitureSetImage.deleteMany({
        where: { furnitureSetId: { in: foundIds } }
      })
      
      await tx.furnitureSetProperty.deleteMany({
        where: { furnitureSetId: { in: foundIds } }
      })
      
      await tx.furnitureSetColor.deleteMany({
        where: { furnitureSetId: { in: foundIds } }
      })

      await tx.furnitureSetAndFurniture.deleteMany({
        where: { furnitureSetId: { in: foundIds } }
      })

      // Furniture set'leri sil
      const deleted = await tx.furnitureSet.deleteMany({
        where: { setId: { in: foundIds } }
      })

      return deleted
    })

    return NextResponse.json({
      success: true,
      message: `${result.count} furniture set başarıyla silindi`,
      deletedCount: result.count,
      deletedItems: furnitureSets.map((f: { setId: number; setName: string | null }) => ({ id: f.setId, name: f.setName }))
    })

  } catch (error) {
    console.error('Toplu furniture set silme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Furniture set\'ler silinemedi',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}

// PATCH - Toplu furniture set durumu değiştirme
export async function PATCH(request: Request) {
  try {
    const data = await request.json()
    const { ids, isActive } = data

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Güncellenecek furniture set ID\'leri belirtilmeli'
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
        error: 'Geçerli furniture set ID\'si bulunamadı'
      }, { status: 400 })
    }

    if (validIds.length !== ids.length) {
      return NextResponse.json({
        success: false,
        error: 'Bazı ID\'ler geçersiz'
      }, { status: 400 })
    }

    // Furniture set'leri kontrol et
    const existingSets = await prisma.furnitureSet.findMany({
      where: { setId: { in: validIds } },
      select: { setId: true }
    })

    if (existingSets.length !== validIds.length) {
      return NextResponse.json({
        success: false,
        error: 'Bazı furniture set\'ler bulunamadı'
      }, { status: 400 })
    }

    const updated = await prisma.furnitureSet.updateMany({
      where: { setId: { in: validIds } },
      data: { isActive }
    })

    return NextResponse.json({
      success: true,
      message: `${updated.count} furniture set durumu ${isActive ? 'aktif' : 'pasif'} olarak güncellendi`,
      updatedCount: updated.count
    })

  } catch (error) {
    console.error('Toplu furniture set güncelleme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Furniture set durumları güncellenemedi',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}