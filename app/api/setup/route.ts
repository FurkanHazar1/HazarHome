// app/api/setup/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Transaction kullanarak tüm test verilerini güvenli şekilde ekle
    const result = await prisma.$transaction(async (tx) => {
      // 1. Kategoriler ekle
      const categories = await tx.category.createMany({
        data: [
          {
            categoryName: 'Oturma Odası',
            description: 'Oturma odası mobilyaları',
            categoryLevel: 1,
            categoryPath: '/oturma-odasi'
          },
          {
            categoryName: 'Yatak Odası', 
            description: 'Yatak odası mobilyaları',
            categoryLevel: 1,
            categoryPath: '/yatak-odasi'
          },
          {
            categoryName: 'Yemek Odası',
            description: 'Yemek odası mobilyaları', 
            categoryLevel: 1,
            categoryPath: '/yemek-odasi'
          },
          {
            categoryName: 'Çalışma Odası',
            description: 'Ofis ve çalışma odası mobilyaları',
            categoryLevel: 1,
            categoryPath: '/calisma-odasi'
          }
        ],
        skipDuplicates: true
      })

      // 2. Renkler ekle
      const colors = await tx.color.createMany({
        data: [
          { colorName: 'Beyaz', colorCode: '#FFFFFF' },
          { colorName: 'Siyah', colorCode: '#000000' },
          { colorName: 'Kahverengi', colorCode: '#8B4513' },
          { colorName: 'Gri', colorCode: '#808080' },
          { colorName: 'Lacivert', colorCode: '#000080' },
          { colorName: 'Krem', colorCode: '#F5F5DC' },
          { colorName: 'Bordo', colorCode: '#800020' },
          { colorName: 'Antrasit', colorCode: '#36454F' }
        ],
        skipDuplicates: true
      })

      // 3. Özellikler ekle
      const properties = await tx.property.createMany({
        data: [
          { 
            propertyName: 'Malzeme', 
            propertyType: 'text', 
            description: 'Mobilyanın yapıldığı ana malzeme' 
          },
          { 
            propertyName: 'Boyut', 
            propertyType: 'text', 
            description: 'Mobilyanın ölçüleri (GxDxY cm)' 
          },
          { 
            propertyName: 'Ağırlık', 
            propertyType: 'number', 
            description: 'Mobilyanın ağırlığı (kg)' 
          },
          { 
            propertyName: 'Garanti', 
            propertyType: 'text', 
            description: 'Garanti süresi' 
          },
          { 
            propertyName: 'Marka', 
            propertyType: 'text', 
            description: 'Mobilya markası' 
          },
          {
            propertyName: 'Renk',
            propertyType: 'text',
            description: 'Ana renk bilgisi'
          },
          {
            propertyName: 'Stil',
            propertyType: 'text', 
            description: 'Mobilya stili (modern, klasik, vb.)'
          },
          {
            propertyName: 'Koltuk Sayısı',
            propertyType: 'number',
            description: 'Koltuk takımlarında kişi kapasitesi'
          },
          {
            propertyName: 'Montaj',
            propertyType: 'text',
            description: 'Montaj gerekliliği'
          },
          {
            propertyName: 'Kargo',
            propertyType: 'text',
            description: 'Kargo bilgileri'
          }
        ],
        skipDuplicates: true
      })

      // Eklenen kayıt sayılarını döndür
      return {
        categoriesAdded: categories.count,
        colorsAdded: colors.count, 
        propertiesAdded: properties.count
      }
    })

    // Eklenen verileri kontrol için getir
    const [categoriesList, colorsList, propertiesList] = await Promise.all([
      prisma.category.findMany({
        orderBy: { categoryId: 'asc' }
      }),
      prisma.color.findMany({
        orderBy: { colorId: 'asc' }
      }),
      prisma.property.findMany({
        orderBy: { propertyId: 'asc' }
      })
    ])

    return NextResponse.json({
      success: true,
      message: 'Test verileri başarıyla eklendi',
      stats: result,
      data: {
        categories: categoriesList,
        colors: colorsList,
        properties: propertiesList
      }
    })

  } catch (error) {
    console.error('Setup hatası:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Test verileri eklenirken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// GET metodu - Mevcut test verilerini görüntüle
export async function GET() {
  try {
    const [categories, colors, properties, furniture] = await Promise.all([
      prisma.category.findMany({
        include: {
          _count: {
            select: { furnitures: true }
          }
        },
        orderBy: { categoryName: 'asc' }
      }),
      prisma.color.findMany({
        include: {
          _count: {
            select: { 
              furnitureColors: true,
              furnitureSetColors: true 
            }
          }
        },
        orderBy: { colorName: 'asc' }
      }),
      prisma.property.findMany({
        include: {
          _count: {
            select: { 
              furnitureProperties: true,
              furnitureSetProperties: true 
            }
          }
        },
        orderBy: { propertyName: 'asc' }
      }),
      prisma.furniture.findMany({
        include: {
          category: true,
          _count: {
            select: {
              furnitureColors: true,
              furnitureProperties: true,
              furnitureImages: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        categories,
        colors, 
        properties,
        recentFurniture: furniture
      },
      stats: {
        totalCategories: categories.length,
        totalColors: colors.length,
        totalProperties: properties.length,
        totalFurniture: furniture.length
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Veri getirme hatası'
    }, { status: 500 })
  }
}

// DELETE metodu - Test verilerini temizle (dikkatli kullanın!)
export async function DELETE() {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Önce bağımlı tabloları temizle
      await tx.furnitureImage.deleteMany()
      await tx.furnitureProperty.deleteMany()
      await tx.furnitureColor.deleteMany()
      await tx.furniture.deleteMany()
      
      // Ana tabloları temizle
      const deletedCategories = await tx.category.deleteMany()
      const deletedColors = await tx.color.deleteMany()
      const deletedProperties = await tx.property.deleteMany()
      const deletedImages = await tx.image.deleteMany()

      return {
        categoriesDeleted: deletedCategories.count,
        colorsDeleted: deletedColors.count,
        propertiesDeleted: deletedProperties.count,
        imagesDeleted: deletedImages.count
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Tüm test verileri temizlendi',
      stats: result
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Veri temizleme hatası'
    }, { status: 500 })
  }
}