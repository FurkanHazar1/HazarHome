// app/api/properties/setup/route.ts - Güncellenmiş Özellik Setup API
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    console.log('🏷️ Özellik sistemi oluşturma işlemi başlatılıyor...')

    // Mevcut özellikleri temizle
    const cleanupResult = await prisma.$transaction(async (tx) => {
      // İlişkili kayıtları temizle
      const deletedFurnitureProperties = await tx.furnitureProperty.deleteMany()
      const deletedFurnitureSetProperties = await tx.furnitureSetProperty.deleteMany()
      
      // Özellikleri temizle
      const deletedProperties = await tx.property.deleteMany()
      
      console.log('🧹 Mevcut özellik verileri temizlendi:', {
        ozellikler: deletedProperties.count,
        mobilyaOzellikleri: deletedFurnitureProperties.count,
        mobilyaSetOzellikleri: deletedFurnitureSetProperties.count
      })

      return {
        deletedProperties: deletedProperties.count,
        deletedFurnitureProperties: deletedFurnitureProperties.count,
        deletedFurnitureSetProperties: deletedFurnitureSetProperties.count
      }
    })

    // Yeni özellikleri ekle
    const result = await prisma.$transaction(async (tx) => {
      console.log('📝 Özellik kategorileri oluşturuluyor...')

      const allProperties = [
        // Temel Fiziksel Özellikler
        {
          propertyName: 'Malzeme',
          propertyType: 'text',
          description: 'Mobilyanın yapıldığı ana malzeme (ahşap, metal, kumaş vb.)',
          category: 'temel'
        },
        {
          propertyName: 'Boyut',
          propertyType: 'text',
          description: 'Genişlik x Derinlik x Yükseklik (cm cinsinden)',
          category: 'temel'
        },
        {
          propertyName: 'Ağırlık',
          propertyType: 'number',
          description: 'Mobilyanın ağırlığı (kg cinsinden)',
          category: 'temel'
        },
        {
          propertyName: 'Renk',
          propertyType: 'text',
          description: 'Ana renk bilgisi',
          category: 'temel'
        },

        // Ticari Özellikler
        {
          propertyName: 'Marka',
          propertyType: 'text',
          description: 'Üretici firma adı',
          category: 'ticari'
        },
        {
          propertyName: 'Model',
          propertyType: 'text',
          description: 'Model adı veya kodu',
          category: 'ticari'
        },
        {
          propertyName: 'Garanti',
          propertyType: 'text',
          description: 'Garanti süresi (örn: 2 Yıl)',
          category: 'ticari'
        },
        {
          propertyName: 'Üretim Yılı',
          propertyType: 'text',
          description: 'Üretim yılı',
          category: 'ticari'
        },

        // Koltuk/Kanepe Özellikleri
        {
          propertyName: 'Koltuk Sayısı',
          propertyType: 'text',
          description: 'Koltuk takımlarında kişi kapasitesi (örn: 3+2+1)',
          category: 'koltuk'
        },
        {
          propertyName: 'Döşeme',
          propertyType: 'text',
          description: 'Döşeme malzemesi (deri, kumaş, suni deri vb.)',
          category: 'koltuk'
        },
        {
          propertyName: 'Yastık Tipi',
          propertyType: 'text',
          description: 'Yastık ve minderlerin özellikleri',
          category: 'koltuk'
        },

        // Yatak Özellikleri
        {
          propertyName: 'Yatak Boyutu',
          propertyType: 'text',
          description: 'Yatak ölçüsü (150x200, 160x200 vb.)',
          category: 'yatak'
        },
        {
          propertyName: 'Başlık Tipi',
          propertyType: 'text',
          description: 'Yatak başlığının özellikleri',
          category: 'yatak'
        },
        {
          propertyName: 'Baza Tipi',
          propertyType: 'text',
          description: 'Baza özellikleri (çekmeceli, sandıklı vb.)',
          category: 'yatak'
        },

        // Dolap/Gardırop Özellikleri
        {
          propertyName: 'Kapı Sayısı',
          propertyType: 'number',
          description: 'Dolap kapı sayısı',
          category: 'dolap'
        },
        {
          propertyName: 'Çekmece Sayısı',
          propertyType: 'number',
          description: 'Çekmece sayısı',
          category: 'dolap'
        },
        {
          propertyName: 'Askılık',
          propertyType: 'text',
          description: 'Askılık özellikleri (sabit, çıkarılabilir vb.)',
          category: 'dolap'
        },
        {
          propertyName: 'Ayna',
          propertyType: 'text',
          description: 'Ayna varlığı ve özellikleri',
          category: 'dolap'
        },

        // Masa Özellikleri
        {
          propertyName: 'Masa Şekli',
          propertyType: 'text',
          description: 'Masa şekli (yuvarlak, dikdörtgen, oval vb.)',
          category: 'masa'
        },
        {
          propertyName: 'Kişi Kapasitesi',
          propertyType: 'number',
          description: 'Kaç kişilik masa',
          category: 'masa'
        },
        {
          propertyName: 'Açılabilir',
          propertyType: 'text',
          description: 'Masanın açılıp kapanabilirliği',
          category: 'masa'
        },

        // Genel Özellikler
        {
          propertyName: 'Stil',
          propertyType: 'text',
          description: 'Mobilya stili (modern, klasik, rustik vb.)',
          category: 'genel'
        },
        {
          propertyName: 'Montaj',
          propertyType: 'text',
          description: 'Montaj gerekliliği (hazır, demonte vb.)',
          category: 'genel'
        },
        {
          propertyName: 'Kargo',
          propertyType: 'text',
          description: 'Kargo ve teslimat bilgileri',
          category: 'genel'
        },
        {
          propertyName: 'Özel Özellik',
          propertyType: 'text',
          description: 'Diğer özel özellikler ve notlar',
          category: 'genel'
        }
      ]

      console.log('📝 Temel özellikler oluşturuluyor...')
      const temelOzellikler = await tx.property.createMany({
        data: allProperties
          .filter(p => p.category === 'temel')
          .map(p => ({
            propertyName: p.propertyName,
            propertyType: p.propertyType,
            description: p.description,
            isActive: true
          }))
      })

      console.log('💼 Ticari özellikler oluşturuluyor...')
      const ticariOzellikler = await tx.property.createMany({
        data: allProperties
          .filter(p => p.category === 'ticari')
          .map(p => ({
            propertyName: p.propertyName,
            propertyType: p.propertyType,
            description: p.description,
            isActive: true
          }))
      })

      console.log('🛋️ Koltuk özellikleri oluşturuluyor...')
      const koltukOzellikleri = await tx.property.createMany({
        data: allProperties
          .filter(p => p.category === 'koltuk')
          .map(p => ({
            propertyName: p.propertyName,
            propertyType: p.propertyType,
            description: p.description,
            isActive: true
          }))
      })

      console.log('🛏️ Yatak özellikleri oluşturuluyor...')
      const yatakOzellikleri = await tx.property.createMany({
        data: allProperties
          .filter(p => p.category === 'yatak')
          .map(p => ({
            propertyName: p.propertyName,
            propertyType: p.propertyType,
            description: p.description,
            isActive: true
          }))
      })

      console.log('🚪 Dolap özellikleri oluşturuluyor...')
      const dolapOzellikleri = await tx.property.createMany({
        data: allProperties
          .filter(p => p.category === 'dolap')
          .map(p => ({
            propertyName: p.propertyName,
            propertyType: p.propertyType,
            description: p.description,
            isActive: true
          }))
      })

      console.log('🪑 Masa özellikleri oluşturuluyor...')
      const masaOzellikleri = await tx.property.createMany({
        data: allProperties
          .filter(p => p.category === 'masa')
          .map(p => ({
            propertyName: p.propertyName,
            propertyType: p.propertyType,
            description: p.description,
            isActive: true
          }))
      })

      console.log('⚙️ Genel özellikler oluşturuluyor...')
      const genelOzellikler = await tx.property.createMany({
        data: allProperties
          .filter(p => p.category === 'genel')
          .map(p => ({
            propertyName: p.propertyName,
            propertyType: p.propertyType,
            description: p.description,
            isActive: true
          }))
      })

      const toplamOzellik = temelOzellikler.count + ticariOzellikler.count + 
                           koltukOzellikleri.count + yatakOzellikleri.count + 
                           dolapOzellikleri.count + masaOzellikleri.count + 
                           genelOzellikler.count

      console.log('✅ Tüm özellikler oluşturuldu:', {
        temel: temelOzellikler.count,
        ticari: ticariOzellikler.count,
        koltuk: koltukOzellikleri.count,
        yatak: yatakOzellikleri.count,
        dolap: dolapOzellikleri.count,
        masa: masaOzellikleri.count,
        genel: genelOzellikler.count,
        toplam: toplamOzellik
      })

      return {
        byCategory: {
          temel: temelOzellikler.count,
          ticari: ticariOzellikler.count,
          koltuk: koltukOzellikleri.count,
          yatak: yatakOzellikleri.count,
          dolap: dolapOzellikleri.count,
          masa: masaOzellikleri.count,
          genel: genelOzellikler.count
        },
        toplamOzellik
      }
    }, {
      timeout: 30000 // 30 saniye timeout
    })

    console.log('🎉 Özellik sistemi başarıyla oluşturuldu!')

    return NextResponse.json({
      success: true,
      message: 'Özellik sistemi başarıyla oluşturuldu',
      data: {
        cleanup: cleanupResult,
        created: result
      },
      stats: {
        beforeCleanup: {
          properties: cleanupResult.deletedProperties,
          furnitureProperties: cleanupResult.deletedFurnitureProperties,
          furnitureSetProperties: cleanupResult.deletedFurnitureSetProperties
        },
        afterCreation: {
          totalProperties: result.toplamOzellik,
          byCategory: result.byCategory
        }
      }
    })

  } catch (error) {
    console.error('❌ Özellik setup hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'Özellik sistemi oluşturulurken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// GET metodu - Mevcut özellik sistemini görüntüle (geliştirilmiş)
export async function GET() {
  try {
    // Tüm özellikleri kategorilere göre getir
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

    // Kategorilere göre grupla
    const propertiesByCategory = {
      temelOzellikler: properties.filter(p => 
        ['Malzeme', 'Boyut', 'Ağırlık', 'Renk'].includes(p.propertyName)
      ),
      ticariOzellikler: properties.filter(p => 
        ['Marka', 'Model', 'Garanti', 'Üretim Yılı'].includes(p.propertyName)
      ),
      koltukOzellikleri: properties.filter(p => 
        ['Koltuk Sayısı', 'Döşeme', 'Yastık Tipi'].includes(p.propertyName)
      ),
      yatakOzellikleri: properties.filter(p => 
        ['Yatak Boyutu', 'Başlık Tipi', 'Baza Tipi'].includes(p.propertyName)
      ),
      dolapOzellikleri: properties.filter(p => 
        ['Kapı Sayısı', 'Çekmece Sayısı', 'Askılık', 'Ayna'].includes(p.propertyName)
      ),
      masaOzellikleri: properties.filter(p => 
        ['Masa Şekli', 'Kişi Kapasitesi', 'Açılabilir'].includes(p.propertyName)
      ),
      genelOzellikler: properties.filter(p => 
        ['Stil', 'Montaj', 'Kargo', 'Özel Özellik'].includes(p.propertyName)
      )
    }

    // İstatistikler
    const [typeStats, usageStats] = await Promise.all([
      // Tip bazında istatistikler
      prisma.property.groupBy({
        by: ['propertyType'],
        _count: { propertyId: true },
        where: { isActive: true }
      }),
      // Kullanım istatistikleri
      Promise.all([
        prisma.property.count({
          where: {
            isActive: true,
            OR: [
              { furnitureProperties: { some: {} } },
              { furnitureSetProperties: { some: {} } }
            ]
          }
        }),
        prisma.property.count({
          where: {
            isActive: true,
            AND: [
              { furnitureProperties: { none: {} } },
              { furnitureSetProperties: { none: {} } }
            ]
          }
        })
      ])
    ])

    // En çok kullanılan özellikler
    const mostUsedProperties = properties
      .map(p => ({
        propertyId: p.propertyId,
        propertyName: p.propertyName,
        propertyType: p.propertyType,
        totalUsage: p._count.furnitureProperties + p._count.furnitureSetProperties,
        furnitureUsage: p._count.furnitureProperties,
        furnitureSetUsage: p._count.furnitureSetProperties
      }))
      .sort((a, b) => b.totalUsage - a.totalUsage)
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      data: {
        allProperties: properties,
        propertiesByCategory,
        istatistikler: {
          toplamOzellik: properties.length,
          byType: typeStats.reduce((acc, item) => {
            acc[item.propertyType] = item._count.propertyId
            return acc
          }, {} as any),
          byCategory: {
            temel: propertiesByCategory.temelOzellikler.length,
            ticari: propertiesByCategory.ticariOzellikler.length,
            koltuk: propertiesByCategory.koltukOzellikleri.length,
            yatak: propertiesByCategory.yatakOzellikleri.length,
            dolap: propertiesByCategory.dolapOzellikleri.length,
            masa: propertiesByCategory.masaOzellikleri.length,
            genel: propertiesByCategory.genelOzellikler.length
          },
          usage: {
            used: usageStats[0],
            unused: usageStats[1],
            total: properties.length
          },
          mostUsed: mostUsedProperties
        }
      }
    })

  } catch (error) {
    console.error('❌ Özellik verisi getirme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Özellik verisi getirilemedi'
    }, { status: 500 })
  }
}