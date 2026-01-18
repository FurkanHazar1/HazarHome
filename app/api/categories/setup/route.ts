// app/api/categories/setup/route.ts - Güncellenmiş Kategori Setup API
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    console.log('🏗️ Kategori yapısı oluşturma işlemi başlatılıyor...')

    // Önce mevcut kategorileri temizle
    const cleanupResult = await prisma.$transaction(async (tx) => {
      // İlişkili kayıtları temizle
      const deletedFurnitureProperties = await tx.furnitureProperty.deleteMany()
      const deletedFurnitureColors = await tx.furnitureColor.deleteMany()
      const deletedFurnitureImages = await tx.furnitureImage.deleteMany()
      const deletedFurnitureSetImages = await tx.furnitureSetImage.deleteMany()
      const deletedFurnitureSetItems = await tx.furnitureSetAndFurniture.deleteMany()
      const deletedFurnitureSets = await tx.furnitureSet.deleteMany()
      const deletedFurniture = await tx.furniture.deleteMany()
      
      // Resimleri temizle (S3 dosyaları fiziksel olarak kalabilir ama DB temizlenir)
      const deletedImages = await tx.image.deleteMany()
      
      // Kategorileri temizle
      const deletedCategories = await tx.category.deleteMany()
      
      console.log('Sweep: Existing data cleared.', {
        categories: deletedCategories.count,
        furniture: deletedFurniture.count,
        furnitureSets: deletedFurnitureSets.count,
        images: deletedImages.count
      })

      return {
        deletedCategories: deletedCategories.count,
        deletedFurniture: deletedFurniture.count,
        deletedFurnitureProperties: deletedFurnitureProperties.count,
        deletedFurnitureColors: deletedFurnitureColors.count,
        deletedFurnitureImages: deletedFurnitureImages.count
      }
    })

    // Yeni kategori yapısını oluştur
    const result = await prisma.$transaction(async (tx) => {
      console.log('📂 Ana kategoriler oluşturuluyor...')

      // 1. ANA KATEGORİLER
      const salonTakimi = await tx.category.create({
        data: {
          categoryName: 'Salon Takımı',
          description: 'Oturma odası ve salon mobilyaları',
          categoryLevel: 1,
          categoryPath: '/salon-takimi',
          isActive: true
        }
      })

      const yatakOdasiTakimi = await tx.category.create({
        data: {
          categoryName: 'Yatak Odası Takımı',
          description: 'Yatak odası mobilyaları ve aksesuarları',
          categoryLevel: 1,
          categoryPath: '/yatak-odasi-takimi',
          isActive: true
        }
      })

      const yemekOdasiTakimi = await tx.category.create({
        data: {
          categoryName: 'Yemek Odası Takımı',
          description: 'Yemek odası mobilyaları ve aksesuarları',
          categoryLevel: 1,
          categoryPath: '/yemek-odasi-takimi',
          isActive: true
        }
      })

      console.log('✅ Ana kategoriler oluşturuldu:', {
        salonTakimi: salonTakimi.categoryId,
        yatakOdasiTakimi: yatakOdasiTakimi.categoryId,
        yemekOdasiTakimi: yemekOdasiTakimi.categoryId
      })

      console.log('📁 Salon takımı alt kategorileri oluşturuluyor...')

      // 2. SALON TAKIMI ALT KATEGORİLERİ
      const salonAltKategoriler = await Promise.all([
        tx.category.create({
          data: {
            categoryName: 'Üçlü Koltuklar',
            description: '3 lü koltuk modelleri',
            parentId: salonTakimi.categoryId,
            categoryLevel: 2,
            categoryPath: '/salon-takimi/uclu-koltuk-takimlari',
            isActive: true
          }
        }),
        tx.category.create({
          data: {
            categoryName: 'İkili Koltuklar',
            description: '2 li koltuk modelleri',
            parentId: salonTakimi.categoryId,
            categoryLevel: 2,
            categoryPath: '/salon-takimi/ikili-koltuk-takimlari',
            isActive: true
          }
        }),
        tx.category.create({
          data: {
            categoryName: 'Köşe Takımları',
            description: 'L şeklinde ve köşe koltuk takımları',
            parentId: salonTakimi.categoryId,
            categoryLevel: 2,
            categoryPath: '/salon-takimi/kose-takimlari',
            isActive: true
          }
        }),
        tx.category.create({
          data: {
            categoryName: 'Berjer ve Tekli Koltuklar',
            description: 'Berjer, tekli koltuk ve dinlenme koltuğu',
            parentId: salonTakimi.categoryId,
            categoryLevel: 2,
            categoryPath: '/salon-takimi/berjer-tekli',
            isActive: true
          }
        }),
        tx.category.create({
          data: {
            categoryName: 'Orta Sehpa',
            description: 'Salon orta sehpaları ve yan sehpalar',
            parentId: salonTakimi.categoryId,
            categoryLevel: 2,
            categoryPath: '/salon-takimi/orta-sehpa',
            isActive: true
          }
        }),
        tx.category.create({
          data: {
            categoryName: 'TV Ünitesi',
            description: 'Televizyon üniteleri ve medya konsolları',
            parentId: salonTakimi.categoryId,
            categoryLevel: 2,
            categoryPath: '/salon-takimi/tv-unitesi',
            isActive: true
          }
        }),
        tx.category.create({
          data: {
            categoryName: 'Vitrin ve Dolap',
            description: 'Salon vitrinleri ve depolama dolapları',
            parentId: salonTakimi.categoryId,
            categoryLevel: 2,
            categoryPath: '/salon-takimi/vitrin-dolap',
            isActive: true
          }
        })
      ])

      console.log('📁 Yatak odası alt kategorileri oluşturuluyor...')

      // 3. YATAK ODASI TAKIMI ALT KATEGORİLERİ
      const yatakOdasiAltKategoriler = await Promise.all([
        tx.category.create({
          data: {
            categoryName: 'Çift Kişilik Yatak',
            description: 'Çift kişilik yatak modelleri',
            parentId: yatakOdasiTakimi.categoryId,
            categoryLevel: 2,
            categoryPath: '/yatak-odasi-takimi/cift-kisilik-yatak',
            isActive: true
          }
        }),
        tx.category.create({
          data: {
            categoryName: 'Tek Kişilik Yatak',
            description: 'Tek kişilik yatak modelleri',
            parentId: yatakOdasiTakimi.categoryId,
            categoryLevel: 2,
            categoryPath: '/yatak-odasi-takimi/tek-kisilik-yatak',
            isActive: true
          }
        }),
        tx.category.create({
          data: {
            categoryName: 'Gardırop',
            description: 'Sliding, açılır kapılı ve köşe gardıroplar',
            parentId: yatakOdasiTakimi.categoryId,
            categoryLevel: 2,
            categoryPath: '/yatak-odasi-takimi/gardirop',
            isActive: true
          }
        }),
        tx.category.create({
          data: {
            categoryName: 'Şifonyer',
            description: 'Yatak odası şifonyerleri ve çekmeceli dolaplar',
            parentId: yatakOdasiTakimi.categoryId,
            categoryLevel: 2,
            categoryPath: '/yatak-odasi-takimi/sifonyer',
            isActive: true
          }
        }),
        tx.category.create({
          data: {
            categoryName: 'Komodin',
            description: 'Yatak başı komodinleri ve nightstand',
            parentId: yatakOdasiTakimi.categoryId,
            categoryLevel: 2,
            categoryPath: '/yatak-odasi-takimi/komodin',
            isActive: true
          }
        }),
        tx.category.create({
          data: {
            categoryName: 'Makyaj Masası',
            description: 'Aynalı makyaj masaları ve tuvalet masası',
            parentId: yatakOdasiTakimi.categoryId,
            categoryLevel: 2,
            categoryPath: '/yatak-odasi-takimi/makyaj-masasi',
            isActive: true
          }
        })
      ])

      console.log('📁 Yemek odası alt kategorileri oluşturuluyor...')

      // 4. YEMEK ODASI TAKIMI ALT KATEGORİLERİ
      const yemekOdasiAltKategoriler = await Promise.all([
        tx.category.create({
          data: {
            categoryName: 'Yemek Masası',
            description: 'Açılır, sabit ve farklı kişilik yemek masaları',
            parentId: yemekOdasiTakimi.categoryId,
            categoryLevel: 2,
            categoryPath: '/yemek-odasi-takimi/yemek-masasi',
            isActive: true
          }
        }),
        tx.category.create({
          data: {
            categoryName: 'Yemek Sandalyesi',
            description: 'Ahşap, döşemeli ve modern yemek sandalyeleri',
            parentId: yemekOdasiTakimi.categoryId,
            categoryLevel: 2,
            categoryPath: '/yemek-odasi-takimi/yemek-sandalyesi',
            isActive: true
          }
        }),
        tx.category.create({
          data: {
            categoryName: 'Büfe ve Konsol',
            description: 'Yemek odası büfeleri ve konsol masalar',
            parentId: yemekOdasiTakimi.categoryId,
            categoryLevel: 2,
            categoryPath: '/yemek-odasi-takimi/bufe-konsol',
            isActive: true
          }
        }),
        tx.category.create({
          data: {
            categoryName: 'Vitrin',
            description: 'Camlı vitrinler ve sergileme dolapları',
            parentId: yemekOdasiTakimi.categoryId,
            categoryLevel: 2,
            categoryPath: '/yemek-odasi-takimi/vitrin',
            isActive: true
          }
        }),
        tx.category.create({
          data: {
            categoryName: 'Mutfak Masası',
            description: 'Küçük mutfak masaları ve kahvaltı masaları',
            parentId: yemekOdasiTakimi.categoryId,
            categoryLevel: 2,
            categoryPath: '/yemek-odasi-takimi/mutfak-masasi',
            isActive: true
          }
        })
      ])

      const toplamKategori = 3 + salonAltKategoriler.length + yatakOdasiAltKategoriler.length + yemekOdasiAltKategoriler.length

      console.log('✅ Tüm kategoriler oluşturuldu:', {
        anaKategori: 3,
        salonAltKategori: salonAltKategoriler.length,
        yatakOdasiAltKategori: yatakOdasiAltKategoriler.length,
        yemekOdasiAltKategori: yemekOdasiAltKategoriler.length,
        toplam: toplamKategori
      })

      return {
        anaKategoriler: [salonTakimi, yatakOdasiTakimi, yemekOdasiTakimi],
        salonAltKategoriler,
        yatakOdasiAltKategoriler,
        yemekOdasiAltKategoriler,
        toplamKategori
      }
    }, {
      timeout: 30000 // 30 saniye timeout
    })

    console.log('🎉 Kategori yapısı başarıyla oluşturuldu!')

    return NextResponse.json({
      success: true,
      message: 'Kategori yapısı başarıyla oluşturuldu',
      data: {
        cleanup: cleanupResult,
        created: {
          anaKategoriler: result.anaKategoriler.length,
          salonAltKategoriler: result.salonAltKategoriler.length,
          yatakOdasiAltKategoriler: result.yatakOdasiAltKategoriler.length,
          yemekOdasiAltKategoriler: result.yemekOdasiAltKategoriler.length,
          toplamKategori: result.toplamKategori
        }
      },
      stats: {
        beforeCleanup: {
          categories: cleanupResult.deletedCategories,
          furniture: cleanupResult.deletedFurniture
        },
        afterCreation: {
          totalCategories: result.toplamKategori,
          mainCategories: 3,
          subCategories: result.toplamKategori - 3
        }
      }
    })

  } catch (error) {
    console.error('❌ Kategori setup hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'Kategori yapısı oluşturulurken hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// GET metodu - Mevcut kategori yapısını görüntüle (geliştirilmiş)
export async function GET() {
  try {
    // Ana kategoriler ve alt kategorilerini hiyerarşik olarak getir
    const anaKategoriler = await prisma.category.findMany({
      where: { 
        categoryLevel: 1,
        isActive: true 
      },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { categoryName: 'asc' },
          include: {
            _count: {
              select: { furnitures: true }
            }
          }
        },
        _count: {
          select: { 
            furnitures: true,
            children: true 
          }
        }
      },
      orderBy: { categoryName: 'asc' }
    })

    // Toplam istatistikler
    const [totalStats, levelStats] = await Promise.all([
      prisma.category.aggregate({
        _count: { categoryId: true },
        where: { isActive: true }
      }),
      prisma.category.groupBy({
        by: ['categoryLevel'],
        _count: { categoryId: true },
        where: { isActive: true }
      })
    ])

    // Seviye bazında istatistikler
    const levelBreakdown = levelStats.reduce((acc, item) => {
      acc[`level${item.categoryLevel}`] = item._count.categoryId
      return acc
    }, {} as any)

    return NextResponse.json({
      success: true,
      data: {
        anaKategoriler,
        istatistikler: {
          toplamKategori: totalStats._count.categoryId,
          ...levelBreakdown,
          hiyerarsi: {
            anaKategoriler: anaKategoriler.length,
            toplamAltKategori: anaKategoriler.reduce((sum, cat) => sum + cat._count.children, 0),
            toplamMobilya: anaKategoriler.reduce((sum, cat) => 
              sum + cat._count.furnitures + cat.children.reduce((childSum, child) => 
                childSum + child._count.furnitures, 0
              ), 0
            )
          }
        }
      }
    })

  } catch (error) {
    console.error('❌ Kategori verisi getirme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Kategori verisi getirilemedi'
    }, { status: 500 })
  }
}