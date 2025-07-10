// app/api/furniture/route.ts - Image API ile uyumlu Mobilya API
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

// GET - Mobilyaları listele (aynı kalır)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parametreleri
    const categoryId = searchParams.get('categoryId')
    const furnitureType = searchParams.get('type')
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

    // Mobilya tipi filtresi
    if (furnitureType?.trim()) {
      whereClause.furnitureType = {
        contains: furnitureType.trim(),
        mode: 'insensitive'
      }
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
        { furnitureName: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { furnitureType: { contains: search.trim(), mode: 'insensitive' } }
      ]
    }

    // Renk filtresi
    if (colorIds?.trim()) {
      const colorIdArray = colorIds.split(',')
        .map((id: string) => parseInt(id.trim()))
        .filter((id: number) => !isNaN(id))
      
      if (colorIdArray.length > 0) {
        whereClause.colors = {
          some: {
            colorId: { in: colorIdArray },
            isAvailable: true
          }
        }
      }
    }

    // Sıralama seçenekleri
    const validSortFields = ['furnitureName', 'price', 'createdAt', 'furnitureType', 'furnitureId']
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
          colors: true,
          properties: true,
          images: true
        }
      }
    }

    if (includeDetails) {
      includeOptions.colors = {
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
      includeOptions.properties = {
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
      includeOptions.images = {
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
    }

    const [furnitures, total] = await Promise.all([
      prisma.furniture.findMany({
        where: whereClause,
        include: includeOptions,
        orderBy,
        skip,
        take: limit
      }),
      prisma.furniture.count({ where: whereClause })
    ])

    // İstatistikler
    const stats = await prisma.furniture.aggregate({
      where: whereClause,
      _count: { furnitureId: true },
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true }
    })

    return NextResponse.json({
      success: true,
      data: furnitures,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      stats: {
        total: stats._count.furnitureId,
        averagePrice: stats._avg.price,
        minPrice: stats._min.price,
        maxPrice: stats._max.price
      },
      filters: {
        categoryId: categoryId ? parseInt(categoryId) : null,
        furnitureType,
        isActive,
        search,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        colorIds
      },
      sort: { sortBy: sortField, sortOrder }
    })

  } catch (error) {
    console.error('Mobilya listesi hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Mobilyalar getirilemedi',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}

// POST - Yeni mobilya ekle (Image oluşturma kısmı çıkarıldı)
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const {
      furnitureName,
      furnitureType,
      categoryId,
      description,
      price,
      isActive = true,
      colorIds = [],
      properties = [],
      images = []  // Sadece mevcut image ID'leri
    } = data

    // Temel validasyonlar
    const validationErrors = []

    if (!furnitureName || typeof furnitureName !== 'string' || furnitureName.trim().length === 0) {
      validationErrors.push('Mobilya adı zorunludur')
    } else if (furnitureName.trim().length > 100) {
      validationErrors.push('Mobilya adı 100 karakterden uzun olamaz')
    }

    if (!furnitureType || typeof furnitureType !== 'string' || furnitureType.trim().length === 0) {
      validationErrors.push('Mobilya tipi zorunludur')
    } else if (furnitureType.trim().length > 50) {
      validationErrors.push('Mobilya tipi 50 karakterden uzun olamaz')
    }

    if (price === undefined || price === null || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      validationErrors.push('Geçerli bir fiyat girilmelidir')
    } else if (parseFloat(price) > 999999999.99) {
      validationErrors.push('Fiyat çok yüksek')
    }

    if (description && typeof description === 'string' && description.length > 1000) {
      validationErrors.push('Açıklama 1000 karakterden uzun olamaz')
    }

    // categoryId validasyonu
    if (categoryId && (isNaN(parseInt(categoryId)) || parseInt(categoryId) <= 0)) {
      validationErrors.push('Geçerli bir kategori ID\'si girilmelidir')
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

    // images validasyonu (Sadece mevcut image ID'leri kontrol et)
    if (images && Array.isArray(images)) {
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

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validasyon hatası',
        validationErrors
      }, { status: 400 })
    }

    // Kategori kontrolü
    if (categoryId) {
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
          error: 'Pasif kategoriye mobilya eklenemez'
        }, { status: 400 })
      }
    }

    // Aynı isimde mobilya kontrolü
    const existingFurniture = await prisma.furniture.findFirst({
      where: {
        furnitureName: {
          equals: furnitureName.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (existingFurniture) {
      return NextResponse.json({
        success: false,
        error: 'Bu isimde bir mobilya zaten mevcut'
      }, { status: 400 })
    }

    // Transaction ile mobilya oluştur
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mobilyayı oluştur
      const furniture = await tx.furniture.create({
        data: {
          furnitureName: furnitureName.trim(),
          furnitureType: furnitureType.trim(),
          categoryId: categoryId ? parseInt(String(categoryId)) : null,
          description: description?.trim() || null,
          price: parseFloat(String(price)),
          isActive: Boolean(isActive)
        }
      })

      // 2. Renkleri ekle
      if (colorIds && colorIds.length > 0) {
        const colorIdNumbers = colorIds.map((id: number) => parseInt(String(id))).filter((id: number) => !isNaN(id))
        
        if (colorIdNumbers.length > 0) {
          // Renklerin varlığını kontrol et
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
              furnitureId: furniture.furnitureId,
              colorId: colorId,
              isAvailable: true
            }))
          })
        }
      }

      // 3. Özellikleri ekle
      if (properties && properties.length > 0) {
        const propertyIds = properties.map((p: PropertyInput) => parseInt(String(p.propertyId))).filter((id: number) => !isNaN(id))
        
        if (propertyIds.length > 0) {
          // Özelliklerin varlığını kontrol et
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
              furnitureId: furniture.furnitureId,
              propertyId: parseInt(String(prop.propertyId)),
              propertyValue: prop.propertyValue.trim(),
              isActive: true
            }))
          })
        }
      }

      // 4. Mevcut görselleri bağla (Yeni görsel oluşturma YOK)
      if (images && images.length > 0) {
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
            const notFoundImageIds = imageIds.filter((id: number) => !foundImageIds.includes(id))
            throw new Error(`Bazı görseller bulunamadı veya pasif durumda: ${notFoundImageIds.join(', ')}`)
          }

          // Image ilişkilerini oluştur
          await tx.furnitureImage.createMany({
            data: images.map((img: ImageRelationInput) => ({
              furnitureId: furniture.furnitureId,
              imageId: parseInt(String(img.imageId)),
              sortOrder: img.sortOrder ? parseInt(String(img.sortOrder)) : 1,
              imageType: img.imageType?.trim() || 'main_image',
              isActive: true
            }))
          })
        }
      }

      // Oluşturulan mobilyayı tüm ilişkili verilerle getir
      const createdFurniture = await tx.furniture.findUnique({
        where: { furnitureId: furniture.furnitureId },
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

      return createdFurniture
    }, {
      timeout: 30000
    })

    return NextResponse.json({
      success: true,
      message: 'Mobilya başarıyla eklendi',
      data: result
    }, { status: 201 })

  } catch (error) {
    console.error('Mobilya ekleme hatası:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Mobilya eklenirken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// DELETE ve PATCH endpoint'leri aynı kalır...
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    
    if (!idsParam?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Silinecek mobilya ID\'leri belirtilmeli'
      }, { status: 400 })
    }

    const ids = idsParam.split(',')
      .map((id: string) => parseInt(id.trim()))
      .filter((id: number) => !isNaN(id) && id > 0)
    
    if (ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçerli mobilya ID\'si bulunamadı'
      }, { status: 400 })
    }

    // Mobilyaları kontrol et
    const furnitures = await prisma.furniture.findMany({
      where: { furnitureId: { in: ids } },
      select: {
        furnitureId: true,
        furnitureName: true
      }
    })

    if (furnitures.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Belirtilen ID\'lerde mobilya bulunamadı'
      }, { status: 404 })
    }

    if (furnitures.length !== ids.length) {
      const foundIds = furnitures.map((f: { furnitureId: number }) => f.furnitureId)
      const notFoundIds = ids.filter((id: number) => !foundIds.includes(id))
      
      return NextResponse.json({
        success: false,
        error: `Bazı mobilyalar bulunamadı: ${notFoundIds.join(', ')}`
      }, { status: 400 })
    }

    // Transaction ile sil
    const result = await prisma.$transaction(async (tx) => {
      const foundIds = furnitures.map((f: { furnitureId: number }) => f.furnitureId)
      
      // İlişkili kayıtları sil (CASCADE sayesinde otomatik silinecek ama manuel yapalım)
      await tx.furnitureImage.deleteMany({
        where: { furnitureId: { in: foundIds } }
      })
      
      await tx.furnitureProperty.deleteMany({
        where: { furnitureId: { in: foundIds } }
      })
      
      await tx.furnitureColor.deleteMany({
        where: { furnitureId: { in: foundIds } }
      })

      // Mobilyaları sil
      const deleted = await tx.furniture.deleteMany({
        where: { furnitureId: { in: foundIds } }
      })

      return deleted
    })

    return NextResponse.json({
      success: true,
      message: `${result.count} mobilya başarıyla silindi`,
      deletedCount: result.count,
      deletedItems: furnitures.map((f: { furnitureId: number; furnitureName: string }) => ({ 
        id: f.furnitureId, 
        name: f.furnitureName 
      }))
    })

  } catch (error) {
    console.error('Toplu mobilya silme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Mobilyalar silinemedi',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json()
    const { ids, isActive } = data

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Güncellenecek mobilya ID\'leri belirtilmeli'
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
        error: 'Geçerli mobilya ID\'si bulunamadı'
      }, { status: 400 })
    }

    if (validIds.length !== ids.length) {
      return NextResponse.json({
        success: false,
        error: 'Bazı ID\'ler geçersiz'
      }, { status: 400 })
    }

    // Mobilyaları kontrol et
    const existingFurnitures = await prisma.furniture.findMany({
      where: { furnitureId: { in: validIds } },
      select: { furnitureId: true }
    })

    if (existingFurnitures.length !== validIds.length) {
      return NextResponse.json({
        success: false,
        error: 'Bazı mobilyalar bulunamadı'
      }, { status: 400 })
    }

    const updated = await prisma.furniture.updateMany({
      where: { furnitureId: { in: validIds } },
      data: { isActive }
    })

    return NextResponse.json({
      success: true,
      message: `${updated.count} mobilya durumu ${isActive ? 'aktif' : 'pasif'} olarak güncellendi`,
      updatedCount: updated.count
    })

  } catch (error) {
    console.error('Toplu mobilya güncelleme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Mobilya durumları güncellenemedi',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}