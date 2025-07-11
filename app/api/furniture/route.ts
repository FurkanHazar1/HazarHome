// app/api/furniture/route.ts - Optimized Furniture API
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Type definitions
interface PropertyInput {
  propertyId: number;
  propertyValue: string;
}

interface ImageFileData {
  file: File;
  sortOrder: number;
  imageType: string;
  altText?: string;
}

// Helper function to process image files and convert to base64
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

    // File'ı buffer'a çevir
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
      imageType: i === 0 ? 'main_image' : 'gallery_image'
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
      } else {
        console.warn(`Image ${imageData.imageData.fileName} oluşturulamadı:`, result.error)
      }
    } catch (error) {
      console.warn(`Image ${imageData.imageData.fileName} oluşturulurken hata:`, error)
    }
  }

  return results
}

// GET - Mobilyaları listele (same as before)
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

    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    if (categoryId && !isNaN(parseInt(categoryId))) {
      whereClause.categoryId = parseInt(categoryId)
    }

    if (furnitureType?.trim()) {
      whereClause.furnitureType = {
        contains: furnitureType.trim(),
        mode: 'insensitive'
      }
    }

    if (minPrice || maxPrice) {
      whereClause.price = {}
      if (minPrice && !isNaN(parseFloat(minPrice))) {
        whereClause.price.gte = parseFloat(minPrice)
      }
      if (maxPrice && !isNaN(parseFloat(maxPrice))) {
        whereClause.price.lte = parseFloat(maxPrice)
      }
    }

    if (search?.trim()) {
      whereClause.OR = [
        { furnitureName: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { furnitureType: { contains: search.trim(), mode: 'insensitive' } }
      ]
    }

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

    const validSortFields = ['furnitureName', 'price', 'createdAt', 'furnitureType', 'furnitureId']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const orderBy: any = {}
    orderBy[sortField] = sortOrder === 'asc' ? 'asc' : 'desc'

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
        }
      }
      includeOptions.images = {
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

    return NextResponse.json({
      success: true,
      data: furnitures,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Mobilya listesi hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Mobilyalar getirilemedi'
    }, { status: 500 })
  }
}

// POST - Yeni mobilya ekle (Optimized with proper transaction handling)
export async function POST(request: Request) {
  let createdFurnitureId: number | null = null
  let imageFiles: File[] = []

  try {
    const contentType = request.headers.get('content-type') || ''
    let data: any = {}

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
      }

      // Image dosyaları
      const files = formData.getAll('images') as File[]
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
      isActive = true,
      colorIds = [],
      properties = []
    } = data

    // JSON string'leri parse et
    let parsedColorIds = colorIds
    let parsedProperties = properties

    if (typeof colorIds === 'string') {
      parsedColorIds = colorIds ? JSON.parse(colorIds) : []
    }
    if (typeof properties === 'string') {
      parsedProperties = properties ? JSON.parse(properties) : []
    }

    // Validasyonlar
    const validationErrors = []

    if (!furnitureName || typeof furnitureName !== 'string' || furnitureName.trim().length === 0) {
      validationErrors.push('Mobilya adı zorunludur')
    } else if (furnitureName.trim().length > 100) {
      validationErrors.push('Mobilya adı 100 karakterden uzun olamaz')
    }

    if (!furnitureType || typeof furnitureType !== 'string' || furnitureType.trim().length === 0) {
      validationErrors.push('Mobilya tipi zorunludur')
    }

    if (price === undefined || price === null || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      validationErrors.push('Geçerli bir fiyat girilmelidir')
    }

    if (categoryId && (isNaN(parseInt(categoryId)) || parseInt(categoryId) <= 0)) {
      validationErrors.push('Geçerli bir kategori ID\'si girilmelidir')
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

    // Image dosyalarını işle (eğer varsa)
    let processedImages: any[] = []
    if (imageFiles.length > 0) {
      processedImages = await processImageFiles(imageFiles, furnitureName.trim())
    }

    // Ana transaction - Sadece mobilya ve ilişkili kayıtları oluştur
    const furniture = await prisma.$transaction(async (tx) => {
      // 1. Mobilyayı oluştur
      const newFurniture = await tx.furniture.create({
        data: {
          furnitureName: furnitureName.trim(),
          furnitureType: furnitureType.trim(),
          categoryId: categoryId ? parseInt(String(categoryId)) : null,
          description: description?.trim() || null,
          price: parseFloat(String(price)),
          isActive: Boolean(isActive === 'true' || isActive === true)
        }
      })

      createdFurnitureId = newFurniture.furnitureId

      // 2. Renkleri ekle
      if (parsedColorIds && parsedColorIds.length > 0) {
        const colorIdNumbers = parsedColorIds.map((id: number) => parseInt(String(id))).filter((id: number) => !isNaN(id))
        
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
              furnitureId: newFurniture.furnitureId,
              colorId: colorId,
              isAvailable: true
            }))
          })
        }
      }

      // 3. Özellikleri ekle
      if (parsedProperties && parsedProperties.length > 0) {
        const propertyIds = parsedProperties.map((p: PropertyInput) => parseInt(String(p.propertyId))).filter((id: number) => !isNaN(id))
        
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
            data: parsedProperties.map((prop: PropertyInput) => ({
              furnitureId: newFurniture.furnitureId,
              propertyId: parseInt(String(prop.propertyId)),
              propertyValue: prop.propertyValue.trim(),
              isActive: true
            }))
          })
        }
      }

      return newFurniture
    }, {
      timeout: 30000
    })

    // Transaction başarılı olduktan sonra image'ları oluştur
    let imageResults: any[] = []
    if (processedImages.length > 0) {
      try {
        imageResults = await createImagesForFurniture(furniture.furnitureId, processedImages)
      } catch (imageError) {
        console.warn('Image oluşturma hatası:', imageError)
        // Image hatası mobilya oluşturmayı engellemez, sadece uyarı verir
      }
    }

    // Oluşturulan mobilyayı tüm ilişkili verilerle getir
    const createdFurniture = await prisma.furniture.findUnique({
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
      message: 'Mobilya başarıyla eklendi',
      data: createdFurniture
    }

    // Image upload sonuçlarını ekle
    if (imageFiles.length > 0) {
      response.imageResults = {
        uploaded: imageResults.length,
        total: imageFiles.length,
        details: imageResults
      }
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Mobilya ekleme hatası:', error)
    
    // Eğer mobilya oluşturulduysa ama sonrasında hata olmuşsa, temizlik yap
    if (createdFurnitureId) {
      try {
        await prisma.$transaction(async (tx) => {
          if (createdFurnitureId !== null) {
            await tx.furnitureImage.deleteMany({
              where: { furnitureId: createdFurnitureId! }
            })
          }
          if (createdFurnitureId !== null) {
            await tx.furnitureProperty.deleteMany({
              where: { furnitureId: createdFurnitureId! }
            })
          }
          await tx.furnitureColor.deleteMany({
            where: { furnitureId: createdFurnitureId! }
          })
          await tx.furniture.delete({
            where: { furnitureId: createdFurnitureId! }
          })
        })
      } catch (cleanupError) {
        console.error('Cleanup hatası:', cleanupError)
      }
    }
    
    return NextResponse.json({
      success: false,
      message: 'Mobilya eklenirken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// DELETE - Toplu mobilya silme
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

    // Mobilyaları ve ilişkili image'ları kontrol et
    const furnitures = await prisma.furniture.findMany({
      where: { furnitureId: { in: ids } },
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
        }
      }
    })

    if (furnitures.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Belirtilen ID\'lerde mobilya bulunamadı'
      }, { status: 404 })
    }

    // Image'ları topla
    const allImageIds: number[] = []
    furnitures.forEach(furniture => {
      furniture.images.forEach(fi => {
        allImageIds.push(fi.image.imageId)
      })
    })

    // Transaction ile mobilyaları sil
    const result = await prisma.$transaction(async (tx) => {
      const foundIds = furnitures.map((f) => f.furnitureId)
      
      // İlişkili kayıtları sil
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
      return await tx.furniture.deleteMany({
        where: { furnitureId: { in: foundIds } }
      })
    })

    // Transaction başarılı olduktan sonra image'ları sil
    let imageDeleteResults = []
    if (allImageIds.length > 0) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/images?ids=${allImageIds.join(',')}&force=true`, {
          method: 'DELETE'
        })
        const imageResult = await response.json()
        imageDeleteResults.push(imageResult)
      } catch (error) {
        console.warn('Image silme hatası:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} mobilya başarıyla silindi`,
      deletedCount: result.count,
      deletedItems: furnitures.map((f) => ({ 
        id: f.furnitureId, 
        name: f.furnitureName 
      })),
      imageDeleteResults
    })

  } catch (error) {
    console.error('Toplu mobilya silme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Mobilyalar silinemedi'
    }, { status: 500 })
  }
}

// PATCH - Toplu mobilya durumu değiştirme
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

    const validIds = ids.map((id: number) => parseInt(String(id))).filter((id: number) => !isNaN(id) && id > 0)
    
    if (validIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçerli mobilya ID\'si bulunamadı'
      }, { status: 400 })
    }

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
      error: 'Mobilya durumları güncellenemedi'
    }, { status: 500 })
  }
}