// app/api/cleanup/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

// Fiziksel dosyaları sil
async function cleanupPhysicalFiles() {
  try {
    console.log('🗂️ Fiziksel dosyalar temizleniyor...')
    
    const uploadsDir = path.join(process.cwd(), 'uploads')
    const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads')
    
    // uploads klasörünü temizle
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true })
      console.log('   - uploads/ klasörü temizlendi')
    }
    
    // public/uploads klasörünü temizle
    if (fs.existsSync(publicUploadsDir)) {
      fs.rmSync(publicUploadsDir, { recursive: true, force: true })
      console.log('   - public/uploads/ klasörü temizlendi')
    }
    
    return true
  } catch (error) {
    console.error('❌ Fiziksel dosya temizleme hatası:', error)
    return false
  }
}

export async function DELETE() {
  try {
    console.log('🧹 Veritabanı temizleme işlemi başlatılıyor...')

    const result = await prisma.$transaction(async (tx) => {
      // 1. İlişkili tabloları temizle (foreign key sırasına göre)
      console.log('📋 İlişkili tablolar temizleniyor...')
      
      // Furniture Set ilişkili tablolar
      const deletedFurnitureSetAndFurniture = await tx.furnitureSetAndFurniture.deleteMany()
      console.log(`   - furniture_sets__and_furniture: ${deletedFurnitureSetAndFurniture.count} kayıt`)
      
      const deletedFurnitureSetImages = await tx.furnitureSetImage.deleteMany()
      console.log(`   - furniture_set_images: ${deletedFurnitureSetImages.count} kayıt`)
      
      const deletedFurnitureSetProperties = await tx.furnitureSetProperty.deleteMany()
      console.log(`   - furniture_set_properties: ${deletedFurnitureSetProperties.count} kayıt`)
      
      const deletedFurnitureSetColors = await tx.furnitureSetColor.deleteMany()
      console.log(`   - furniture_set_colors: ${deletedFurnitureSetColors.count} kayıt`)

      // Furniture ilişkili tablolar
      const deletedFurnitureImages = await tx.furnitureImage.deleteMany()
      console.log(`   - furniture_images: ${deletedFurnitureImages.count} kayıt`)
      
      const deletedFurnitureProperties = await tx.furnitureProperty.deleteMany()
      console.log(`   - furniture_properties: ${deletedFurnitureProperties.count} kayıt`)
      
      const deletedFurnitureColors = await tx.furnitureColor.deleteMany()
      console.log(`   - furniture_colors: ${deletedFurnitureColors.count} kayıt`)

      // 2. Ana tablolar - Furniture Sets
      console.log('🪑 Mobilya setleri temizleniyor...')
      const deletedFurnitureSets = await tx.furnitureSet.deleteMany()
      console.log(`   - furniture_sets: ${deletedFurnitureSets.count} kayıt`)

      // 3. Ana tablolar - Furniture
      console.log('🛋️ Mobilyalar temizleniyor...')
      const deletedFurniture = await tx.furniture.deleteMany()
      console.log(`   - furnitures: ${deletedFurniture.count} kayıt`)

      // 4. Ana tablolar - Images
      console.log('🖼️ Görseller temizleniyor...')
      const deletedImages = await tx.image.deleteMany()
      console.log(`   - images: ${deletedImages.count} kayıt`)

      // 5. Ana tablolar - Properties
      console.log('🏷️ Özellikler temizleniyor...')
      const deletedProperties = await tx.property.deleteMany()
      console.log(`   - properties: ${deletedProperties.count} kayıt`)

      // 6. Ana tablolar - Colors
      console.log('🎨 Renkler temizleniyor...')
      const deletedColors = await tx.color.deleteMany()
      console.log(`   - colors: ${deletedColors.count} kayıt`)

      // 7. Ana tablolar - Categories (hiyerarşik silme)
      console.log('📂 Kategoriler temizleniyor...')
      
      // Önce alt kategorileri sil (level 2)
      const deletedSubCategories = await tx.category.deleteMany({
        where: { categoryLevel: 2 }
      })
      console.log(`   - Alt kategoriler: ${deletedSubCategories.count} kayıt`)
      
      // Sonra ana kategorileri sil (level 1)
      const deletedMainCategories = await tx.category.deleteMany({
        where: { categoryLevel: 1 }
      })
      console.log(`   - Ana kategoriler: ${deletedMainCategories.count} kayıt`)
      
      // Diğer seviyeler varsa (güvenlik için)
      const deletedOtherCategories = await tx.category.deleteMany()
      console.log(`   - Diğer kategoriler: ${deletedOtherCategories.count} kayıt`)

      return {
        // İlişkili tablolar
        furnitureSetAndFurniture: deletedFurnitureSetAndFurniture.count,
        furnitureSetImages: deletedFurnitureSetImages.count,
        furnitureSetProperties: deletedFurnitureSetProperties.count,
        furnitureSetColors: deletedFurnitureSetColors.count,
        furnitureImages: deletedFurnitureImages.count,
        furnitureProperties: deletedFurnitureProperties.count,
        furnitureColors: deletedFurnitureColors.count,
        
        // Ana tablolar
        furnitureSets: deletedFurnitureSets.count,
        furniture: deletedFurniture.count,
        images: deletedImages.count,
        properties: deletedProperties.count,
        colors: deletedColors.count,
        subCategories: deletedSubCategories.count,
        mainCategories: deletedMainCategories.count,
        otherCategories: deletedOtherCategories.count,
        
        // Toplam
        totalDeleted: deletedFurnitureSetAndFurniture.count +
                     deletedFurnitureSetImages.count +
                     deletedFurnitureSetProperties.count +
                     deletedFurnitureSetColors.count +
                     deletedFurnitureImages.count +
                     deletedFurnitureProperties.count +
                     deletedFurnitureColors.count +
                     deletedFurnitureSets.count +
                     deletedFurniture.count +
                     deletedImages.count +
                     deletedProperties.count +
                     deletedColors.count +
                     deletedSubCategories.count +
                     deletedMainCategories.count +
                     deletedOtherCategories.count
      }
    }, {
      timeout: 30000 // 30 saniye timeout
    })

    console.log('✅ Veritabanı temizleme işlemi tamamlandı!')
    
    // ID sequence'leri sıfırla (PostgreSQL için)
    console.log('🔄 ID sequenceleri sifirlanıyor...')
    try {
      await prisma.$executeRaw`ALTER SEQUENCE "Category_id_seq" RESTART WITH 1;`
      await prisma.$executeRaw`ALTER SEQUENCE "Color_id_seq" RESTART WITH 1;`
      await prisma.$executeRaw`ALTER SEQUENCE "Property_id_seq" RESTART WITH 1;`
      await prisma.$executeRaw`ALTER SEQUENCE "Image_id_seq" RESTART WITH 1;`
      await prisma.$executeRaw`ALTER SEQUENCE "Furniture_id_seq" RESTART WITH 1;`
      await prisma.$executeRaw`ALTER SEQUENCE "FurnitureSet_id_seq" RESTART WITH 1;`
      await prisma.$executeRaw`ALTER SEQUENCE "FurnitureImage_id_seq" RESTART WITH 1;`
      await prisma.$executeRaw`ALTER SEQUENCE "FurnitureProperty_id_seq" RESTART WITH 1;`
      await prisma.$executeRaw`ALTER SEQUENCE "FurnitureColor_id_seq" RESTART WITH 1;`
      await prisma.$executeRaw`ALTER SEQUENCE "FurnitureSetImage_id_seq" RESTART WITH 1;`
      await prisma.$executeRaw`ALTER SEQUENCE "FurnitureSetProperty_id_seq" RESTART WITH 1;`
      await prisma.$executeRaw`ALTER SEQUENCE "FurnitureSetColor_id_seq" RESTART WITH 1;`
      await prisma.$executeRaw`ALTER SEQUENCE "FurnitureSetAndFurniture_id_seq" RESTART WITH 1;`
      console.log('✅ Tum ID sequenceleri 1den baslamak uzere sifirlandi!')
    } catch (sequenceError) {
      console.warn('⚠️ ID sequence sifirlama uyarisi:', sequenceError)
      console.log('💡 SQLite kullaniyorsaniz bu normal bir durumdur.')
    }
    
    // Fiziksel dosyaları temizle
    const filesCleanedUp = await cleanupPhysicalFiles()

    return NextResponse.json({
      success: true,
      message: 'Tüm test verileri, ID sequence\'leri ve fiziksel dosyalar başarıyla sıfırlandı',
      stats: result,
      summary: {
        totalTablesCleared: 13,
        totalRecordsDeleted: result.totalDeleted,
        sequencesReset: true,
        physicalFilesCleanedUp: filesCleanedUp,
        clearedTables: [
          'furniture_sets__and_furniture',
          'furniture_set_images', 
          'furniture_set_properties',
          'furniture_set_colors',
          'furniture_images',
          'furniture_properties', 
          'furniture_colors',
          'furniture_sets',
          'furnitures',
          'images',
          'properties',
          'colors',
          'categories'
        ]
      }
    })

  } catch (error) {
    console.error('❌ Veritabanı temizleme hatası:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Veritabanı temizlenirken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// GET metodu - Mevcut veri durumunu göster
export async function GET() {
  try {
    const stats = await Promise.all([
      prisma.category.count(),
      prisma.color.count(),
      prisma.property.count(),
      prisma.image.count(),
      prisma.furniture.count(),
      prisma.furnitureSet.count(),
      prisma.furnitureColor.count(),
      prisma.furnitureProperty.count(),
      prisma.furnitureImage.count(),
      prisma.furnitureSetColor.count(),
      prisma.furnitureSetProperty.count(),
      prisma.furnitureSetImage.count(),
      prisma.furnitureSetAndFurniture.count()
    ])

    const totalRecords = stats.reduce((sum, count) => sum + count, 0)

    return NextResponse.json({
      success: true,
      message: 'Mevcut veri durumu',
      data: {
        categories: stats[0],
        colors: stats[1], 
        properties: stats[2],
        images: stats[3],
        furniture: stats[4],
        furnitureSets: stats[5],
        furnitureColors: stats[6],
        furnitureProperties: stats[7],
        furnitureImages: stats[8],
        furnitureSetColors: stats[9],
        furnitureSetProperties: stats[10],
        furnitureSetImages: stats[11],
        furnitureSetAndFurniture: stats[12],
        totalRecords
      },
      isEmpty: totalRecords === 0
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Veri durumu getirilemedi'
    }, { status: 500 })
  }
}

// POST metodu - Güvenlik onayı ile temizleme
export async function POST(request: Request) {
  try {
    const { confirm } = await request.json()
    
    if (confirm !== 'DELETE_ALL_DATA') {
      return NextResponse.json({
        success: false,
        error: 'Güvenlik onayı gerekli. Body\'de {"confirm": "DELETE_ALL_DATA"} göndermelisiniz.'
      }, { status: 400 })
    }

    // DELETE metodunu çağır - aynı temizleme işlemini tekrarla
    console.log('🧹 Güvenlik onaylı veritabanı temizleme işlemi başlatılıyor...')

    const result = await prisma.$transaction(async (tx) => {
      // 1. İlişkili tabloları temizle (foreign key sırasına göre)
      console.log('📋 İlişkili tablolar temizleniyor...')
      
      // Furniture Set ilişkili tablolar
      const deletedFurnitureSetAndFurniture = await tx.furnitureSetAndFurniture.deleteMany()
      console.log(`   - furniture_sets__and_furniture: ${deletedFurnitureSetAndFurniture.count} kayıt`)
      
      const deletedFurnitureSetImages = await tx.furnitureSetImage.deleteMany()
      console.log(`   - furniture_set_images: ${deletedFurnitureSetImages.count} kayıt`)
      
      const deletedFurnitureSetProperties = await tx.furnitureSetProperty.deleteMany()
      console.log(`   - furniture_set_properties: ${deletedFurnitureSetProperties.count} kayıt`)
      
      const deletedFurnitureSetColors = await tx.furnitureSetColor.deleteMany()
      console.log(`   - furniture_set_colors: ${deletedFurnitureSetColors.count} kayıt`)

      // Furniture ilişkili tablolar
      const deletedFurnitureImages = await tx.furnitureImage.deleteMany()
      console.log(`   - furniture_images: ${deletedFurnitureImages.count} kayıt`)
      
      const deletedFurnitureProperties = await tx.furnitureProperty.deleteMany()
      console.log(`   - furniture_properties: ${deletedFurnitureProperties.count} kayıt`)
      
      const deletedFurnitureColors = await tx.furnitureColor.deleteMany()
      console.log(`   - furniture_colors: ${deletedFurnitureColors.count} kayıt`)

      // 2. Ana tablolar - Furniture Sets
      console.log('🪑 Mobilya setleri temizleniyor...')
      const deletedFurnitureSets = await tx.furnitureSet.deleteMany()
      console.log(`   - furniture_sets: ${deletedFurnitureSets.count} kayıt`)

      // 3. Ana tablolar - Furniture
      console.log('🛋️ Mobilyalar temizleniyor...')
      const deletedFurniture = await tx.furniture.deleteMany()
      console.log(`   - furnitures: ${deletedFurniture.count} kayıt`)

      // 4. Ana tablolar - Images
      console.log('🖼️ Görseller temizleniyor...')
      const deletedImages = await tx.image.deleteMany()
      console.log(`   - images: ${deletedImages.count} kayıt`)

      // 5. Ana tablolar - Properties
      console.log('🏷️ Özellikler temizleniyor...')
      const deletedProperties = await tx.property.deleteMany()
      console.log(`   - properties: ${deletedProperties.count} kayıt`)

      // 6. Ana tablolar - Colors
      console.log('🎨 Renkler temizleniyor...')
      const deletedColors = await tx.color.deleteMany()
      console.log(`   - colors: ${deletedColors.count} kayıt`)

      // 7. Ana tablolar - Categories (hiyerarşik silme)
      console.log('📂 Kategoriler temizleniyor...')
      
      // Önce alt kategorileri sil (level 2)
      const deletedSubCategories = await tx.category.deleteMany({
        where: { categoryLevel: 2 }
      })
      console.log(`   - Alt kategoriler: ${deletedSubCategories.count} kayıt`)
      
      // Sonra ana kategorileri sil (level 1)
      const deletedMainCategories = await tx.category.deleteMany({
        where: { categoryLevel: 1 }
      })
      console.log(`   - Ana kategoriler: ${deletedMainCategories.count} kayıt`)
      
      // Diğer seviyeler varsa (güvenlik için)
      const deletedOtherCategories = await tx.category.deleteMany()
      console.log(`   - Diğer kategoriler: ${deletedOtherCategories.count} kayıt`)

      return {
        // İlişkili tablolar
        furnitureSetAndFurniture: deletedFurnitureSetAndFurniture.count,
        furnitureSetImages: deletedFurnitureSetImages.count,
        furnitureSetProperties: deletedFurnitureSetProperties.count,
        furnitureSetColors: deletedFurnitureSetColors.count,
        furnitureImages: deletedFurnitureImages.count,
        furnitureProperties: deletedFurnitureProperties.count,
        furnitureColors: deletedFurnitureColors.count,
        
        // Ana tablolar
        furnitureSets: deletedFurnitureSets.count,
        furniture: deletedFurniture.count,
        images: deletedImages.count,
        properties: deletedProperties.count,
        colors: deletedColors.count,
        subCategories: deletedSubCategories.count,
        mainCategories: deletedMainCategories.count,
        otherCategories: deletedOtherCategories.count,
        
        // Toplam
        totalDeleted: deletedFurnitureSetAndFurniture.count +
                     deletedFurnitureSetImages.count +
                     deletedFurnitureSetProperties.count +
                     deletedFurnitureSetColors.count +
                     deletedFurnitureImages.count +
                     deletedFurnitureProperties.count +
                     deletedFurnitureColors.count +
                     deletedFurnitureSets.count +
                     deletedFurniture.count +
                     deletedImages.count +
                     deletedProperties.count +
                     deletedColors.count +
                     deletedSubCategories.count +
                     deletedMainCategories.count +
                     deletedOtherCategories.count
      }
    }, {
      timeout: 30000 // 30 saniye timeout
    })

    console.log('✅ Güvenlik onaylı veritabanı temizleme işlemi tamamlandı!')

    return NextResponse.json({
      success: true,
      message: 'Tüm test verileri güvenlik onayı ile başarıyla temizlendi',
      stats: result,
      summary: {
        totalTablesCleared: 13,
        totalRecordsDeleted: result.totalDeleted,
        clearedTables: [
          'furniture_sets__and_furniture',
          'furniture_set_images', 
          'furniture_set_properties',
          'furniture_set_colors',
          'furniture_images',
          'furniture_properties', 
          'furniture_colors',
          'furniture_sets',
          'furnitures',
          'images',
          'properties',
          'colors',
          'categories'
        ]
      }
    })

  } catch (error) {
    console.error('❌ Güvenlik onaylı veritabanı temizleme hatası:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Güvenlik onaylı veritabanı temizlenirken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}