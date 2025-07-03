// app/api/categories/setup/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Önce mevcut kategorileri temizle
    await prisma.$transaction(async (tx) => {
      // İlişkili kayıtları temizle
      await tx.furnitureProperty.deleteMany()
      await tx.furnitureColor.deleteMany()
      await tx.furnitureImage.deleteMany()
      await tx.furniture.deleteMany()
      
      // Kategorileri temizle
      await tx.category.deleteMany()
    })

    // Yeni kategori yapısını oluştur
    const result = await prisma.$transaction(async (tx) => {
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
        }),

      ])

      // 3. YATAK ODASI TAKIMI ALT KATEGORİLERİ
      const yatakOdasiAltKategoriler = await Promise.all([
        tx.category.create({
          data: {
            categoryName: 'Çift Kişilik Yatak',
            description: 'Çift kişilik',
            parentId: yatakOdasiTakimi.categoryId,
            categoryLevel: 2,
            categoryPath: '/yatak-odasi-takimi/cift-kisilik-yatak',
            isActive: true
          }
        }),
        tx.category.create({
          data: {
            categoryName: 'Tek Kişilik Yatak',
            description: 'tek kişilik',
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
        }),

      ])

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

      return {
        anaKategoriler: [salonTakimi, yatakOdasiTakimi, yemekOdasiTakimi],
        salonAltKategoriler,
        yatakOdasiAltKategoriler,
        yemekOdasiAltKategoriler,
        toplamKategori: 3 + salonAltKategoriler.length + yatakOdasiAltKategoriler.length + yemekOdasiAltKategoriler.length
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Kategori yapısı başarıyla oluşturuldu',
      data: result
    })

  } catch (error) {
    console.error('Kategori setup hatası:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// GET metodu - Mevcut kategori yapısını görüntüle
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
    const stats = await prisma.category.aggregate({
      _count: {
        categoryId: true
      },
      where: { isActive: true }
    })

    // Her seviyedeki kategori sayıları
    const seviyeIstatistikleri = await Promise.all([
      prisma.category.count({ 
        where: { categoryLevel: 1, isActive: true } 
      }),
      prisma.category.count({ 
        where: { categoryLevel: 2, isActive: true } 
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        anaKategoriler,
        istatistikler: {
          toplamKategori: stats._count.categoryId,
          anaKategori: seviyeIstatistikleri[0],
          altKategori: seviyeIstatistikleri[1]
        }
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Kategori verisi getirme hatası'
    }, { status: 500 })
  }
}