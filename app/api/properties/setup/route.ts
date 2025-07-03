// app/api/properties/setup/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Mevcut özellikleri temizle
    await prisma.$transaction(async (tx) => {
      // İlişkili kayıtları temizle
      await tx.furnitureProperty.deleteMany()
      await tx.furnitureSetProperty.deleteMany()
      
      // Özellikleri temizle
      await tx.property.deleteMany()
    })

    // Yeni özellikleri ekle
    const result = await prisma.$transaction(async (tx) => {
      const properties = await tx.property.createMany({
        data: [
          // Temel Fiziksel Özellikler
          {
            propertyName: 'Malzeme',
            propertyType: 'text',
            description: 'Mobilyanın yapıldığı ana malzeme (ahşap, metal, kumaş vb.)',
            isActive: true
          },
          {
            propertyName: 'Boyut',
            propertyType: 'text',
            description: 'Genişlik x Derinlik x Yükseklik (cm cinsinden)',
            isActive: true
          },
          {
            propertyName: 'Ağırlık',
            propertyType: 'number',
            description: 'Mobilyanın ağırlığı (kg cinsinden)',
            isActive: true
          },
          {
            propertyName: 'Renk',
            propertyType: 'text',
            description: 'Ana renk bilgisi',
            isActive: true
          },

          // Ticari Özellikler
          {
            propertyName: 'Marka',
            propertyType: 'text',
            description: 'Üretici firma adı',
            isActive: true
          },
          {
            propertyName: 'Model',
            propertyType: 'text',
            description: 'Model adı veya kodu',
            isActive: true
          },

          // Koltuk/Kanepe Özellikleri
          {
            propertyName: 'Koltuk Sayısı',
            propertyType: 'text',
            description: 'Koltuk takımlarında kişi kapasitesi (örn: 3+2+1)',
            isActive: true
          },
          {
            propertyName: 'Döşeme',
            propertyType: 'text',
            description: 'Döşeme malzemesi (deri, kumaş, suni deri vb.)',
            isActive: true
          },
          {
            propertyName: 'Yastık Tipi',
            propertyType: 'text',
            description: 'Yastık ve minderlerin özellikleri',
            isActive: true
          },

          // Yatak Özellikleri
          {
            propertyName: 'Yatak Boyutu',
            propertyType: 'text',
            description: 'Yatak ölçüsü (150x200, 160x200 vb.)',
            isActive: true
          },
          {
            propertyName: 'Başlık Tipi',
            propertyType: 'text',
            description: 'Yatak başlığının özellikleri',
            isActive: true
          },
          {
            propertyName: 'Baza Tipi',
            propertyType: 'text',
            description: 'Baza özellikleri (çekmeceli, sandıklı vb.)',
            isActive: true
          },

          // Dolap/Gardırop Özellikleri
          {
            propertyName: 'Kapı Sayısı',
            propertyType: 'number',
            description: 'Dolap kapı sayısı',
            isActive: true
          },
          {
            propertyName: 'Çekmece Sayısı',
            propertyType: 'number',
            description: 'Çekmece sayısı',
            isActive: true
          },
          {
            propertyName: 'Askılık',
            propertyType: 'text',
            description: 'Askılık özellikleri (sabit, çıkarılabilir vb.)',
            isActive: true
          },
          {
            propertyName: 'Ayna',
            propertyType: 'text',
            description: 'Ayna varlığı ve özellikleri',
            isActive: true
          },

          // Masa Özellikleri
          {
            propertyName: 'Masa Şekli',
            propertyType: 'text',
            description: 'Masa şekli (yuvarlak, dikdörtgen, oval vb.)',
            isActive: true
          },
          {
            propertyName: 'Kişi Kapasitesi',
            propertyType: 'number',
            description: 'Kaç kişilik masa',
            isActive: true
          },
          {
            propertyName: 'Açılabilir',
            propertyType: 'text',
            description: 'Masanın açılıp kapanabilirliği',
            isActive: true
          },

          // Genel Özellikler
          {
            propertyName: 'Stil',
            propertyType: 'text',
            description: 'Mobilya stili (modern, klasik, rustik vb.)',
            isActive: true
          },

          {
            propertyName: 'Özel Özellik',
            propertyType: 'text',
            description: 'Diğer özel özellikler ve notlar',
            isActive: true
          }
        ],
        skipDuplicates: true
      })

      return {
        propertiesAdded: properties.count
      }
    })

    // Eklenen özellikleri getir
    const addedProperties = await prisma.property.findMany({
      orderBy: { propertyName: 'asc' }
    })

    // Kategorilere göre grupla
    const propertiesByCategory = {
      temelOzellikler: addedProperties.filter(p => 
        ['Malzeme', 'Boyut', 'Ağırlık', 'Renk'].includes(p.propertyName)
      ),
      ticariOzellikler: addedProperties.filter(p => 
        ['Marka', 'Model', 'Garanti', 'Üretim Yılı'].includes(p.propertyName)
      ),
      koltukOzellikleri: addedProperties.filter(p => 
        ['Koltuk Sayısı', 'Döşeme', 'Yastık Tipi'].includes(p.propertyName)
      ),
      yatakOzellikleri: addedProperties.filter(p => 
        ['Yatak Boyutu', 'Başlık Tipi', 'Baza Tipi'].includes(p.propertyName)
      ),
      dolapOzellikleri: addedProperties.filter(p => 
        ['Kapı Sayısı', 'Çekmece Sayısı', 'Askılık', 'Ayna'].includes(p.propertyName)
      ),
      masaOzellikleri: addedProperties.filter(p => 
        ['Masa Şekli', 'Kişi Kapasitesi', 'Açılabilir'].includes(p.propertyName)
      ),
      genelOzellikler: addedProperties.filter(p => 
        ['Stil', 'Montaj', 'Kargo', 'Özel Özellik'].includes(p.propertyName)
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Özellikler başarıyla eklendi',
      stats: result,
      data: {
        allProperties: addedProperties,
        propertiesByCategory,
        totalProperties: addedProperties.length
      }
    })

  } catch (error) {
    console.error('Özellik setup hatası:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// GET metodu - Mevcut özellikleri görüntüle
export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            furnitureProperties: true,
            furnitureSetProperties: true
          }
        }
      },
      orderBy: { propertyName: 'asc' }
    })

    // Kullanım istatistikleri
    const stats = {
      totalProperties: properties.length,
      activeProperties: properties.filter(p => p.isActive).length,
      usedInFurniture: properties.filter(p => p._count.furnitureProperties > 0).length,
      usedInFurnitureSets: properties.filter(p => p._count.furnitureSetProperties > 0).length,
      totalUsage: properties.reduce((sum, p) => 
        sum + p._count.furnitureProperties + p._count.furnitureSetProperties, 0
      )
    }

    // Özellik tiplerine göre grupla
    const propertiesByType = {
      textProperties: properties.filter(p => p.propertyType === 'text'),
      numberProperties: properties.filter(p => p.propertyType === 'number'),
      dateProperties: properties.filter(p => p.propertyType === 'date'),
      booleanProperties: properties.filter(p => p.propertyType === 'boolean')
    }

    return NextResponse.json({
      success: true,
      data: {
        properties,
        propertiesByType,
        stats
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Özellik verisi getirme hatası'
    }, { status: 500 })
  }
}