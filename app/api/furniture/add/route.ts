// app/api/furniture/add/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface FurnitureCreateRequest {
  // Temel mobilya bilgileri
  furnitureName: string
  furnitureType: string
  categoryId: number
  description?: string
  price: number
  isActive?: boolean

  // Renkler (ID'ler)
  colorIds?: number[]

  // Özellikler
  properties?: {
    propertyId: number
    propertyValue: string
  }[]

  // Görseller
  images?: {
    fileName: string
    filePath: string
    fileSize?: number
    fileType?: string
    description?: string
    altText?: string
    width?: number
    height?: number
    sortOrder?: number
    imageType?: string
  }[]
}

export async function POST(request: Request) {
  try {
    const data: FurnitureCreateRequest = await request.json()

    // Veri doğrulama
    if (!data.furnitureName || !data.furnitureType || !data.price) {
      return NextResponse.json({
        success: false,
        error: 'Gerekli alanlar eksik: furnitureName, furnitureType, price'
      }, { status: 400 })
    }

    // Kategori kontrolü
    if (data.categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { categoryId: data.categoryId }
      })
      
      if (!categoryExists) {
        return NextResponse.json({
          success: false,
          error: 'Belirtilen kategori bulunamadı'
        }, { status: 400 })
      }
    }

    // Transaction kullanarak tüm işlemleri güvenli şekilde yap
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mobilyayı oluştur
      const furniture = await tx.furniture.create({
        data: {
          furnitureName: data.furnitureName,
          furnitureType: data.furnitureType,
          categoryId: data.categoryId,
          description: data.description,
          price: data.price,
          isActive: data.isActive ?? true
        }
      })

      // 2. Renkleri ekle
      if (data.colorIds && data.colorIds.length > 0) {
        // Renklerin var olduğunu kontrol et
        const existingColors = await tx.color.findMany({
          where: { colorId: { in: data.colorIds } }
        })

        if (existingColors.length !== data.colorIds.length) {
          throw new Error('Bazı renkler bulunamadı')
        }

        await tx.furnitureColor.createMany({
          data: data.colorIds.map(colorId => ({
            furnitureId: furniture.furnitureId,
            colorId: colorId,
            isAvailable: true
          }))
        })
      }

      // 3. Özellikleri ekle
      if (data.properties && data.properties.length > 0) {
        // Özelliklerin var olduğunu kontrol et
        const propertyIds = data.properties.map(p => p.propertyId)
        const existingProperties = await tx.property.findMany({
          where: { propertyId: { in: propertyIds } }
        })

        if (existingProperties.length !== propertyIds.length) {
          throw new Error('Bazı özellikler bulunamadı')
        }

        await tx.furnitureProperty.createMany({
          data: data.properties.map(prop => ({
            furnitureId: furniture.furnitureId,
            propertyId: prop.propertyId,
            propertyValue: prop.propertyValue,
            isActive: true
          }))
        })
      }

      // 4. Görselleri ekle
      if (data.images && data.images.length > 0) {
        for (const imageData of data.images) {
          // Önce image tablosuna ekle
          const image = await tx.image.create({
            data: {
              fileName: imageData.fileName,
              filePath: imageData.filePath,
              fileSize: imageData.fileSize,
              fileType: imageData.fileType,
              description: imageData.description,
              altText: imageData.altText,
              width: imageData.width,
              height: imageData.height,
              originalFileName: imageData.fileName,
              sortOrder: imageData.sortOrder ?? 1,
              isActive: true
            }
          })

          // Sonra furniture_images tablosuna bağla
          await tx.furnitureImage.create({
            data: {
              furnitureId: furniture.furnitureId,
              imageId: image.imageId,
              sortOrder: imageData.sortOrder ?? 1,
              imageType: imageData.imageType ?? 'main_image',
              isActive: true
            }
          })
        }
      }

      // Oluşturulan mobilyayı tüm ilişkili verilerle birlikte getir
      const createdFurniture = await tx.furniture.findUnique({
        where: { furnitureId: furniture.furnitureId },
        include: {
          category: true,
          furnitureColors: {
            include: { color: true }
          },
          furnitureProperties: {
            include: { property: true }
          },
          furnitureImages: {
            include: { image: true },
            orderBy: { sortOrder: 'asc' }
          }
        }
      })

      return createdFurniture
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

// GET metodu - Ekleme formu için gerekli verileri getir
export async function GET() {
  try {
    const [categories, colors, properties] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { categoryName: 'asc' }
      }),
      prisma.color.findMany({
        where: { isActive: true },
        orderBy: { colorName: 'asc' }
      }),
      prisma.property.findMany({
        where: { isActive: true },
        orderBy: { propertyName: 'asc' }
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        categories,
        colors,
        properties
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Veri getirme hatası'
    }, { status: 500 })
  }
}