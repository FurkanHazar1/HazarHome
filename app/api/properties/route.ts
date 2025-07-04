// app/api/properties/route.ts - Geliştirilmiş Özellik API
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Özellikleri listele (geliştirilmiş)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parametreleri
    const isActive = searchParams.get('active')
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const usage = searchParams.get('usage') // 'used', 'unused', 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortBy = searchParams.get('sortBy') || 'propertyName'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const includeStats = searchParams.get('includeStats') === 'true'

    // Where koşulları
    let whereClause: any = {}

    // Aktif/pasif filtresi
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    // Tip filtresi
    if (type) {
      whereClause.propertyType = type
    }

    // Arama filtresi
    if (search) {
      whereClause.OR = [
        { propertyName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Kategori filtresi
    if (category) {
      const categoryProperties: { [key: string]: string[] } = {
        'temel': ['Malzeme', 'Boyut', 'Ağırlık', 'Renk'],
        'ticari': ['Marka', 'Model', 'Garanti', 'Üretim Yılı'],
        'koltuk': ['Koltuk Sayısı', 'Döşeme', 'Yastık Tipi'],
        'yatak': ['Yatak Boyutu', 'Başlık Tipi', 'Baza Tipi'],
        'dolap': ['Kapı Sayısı', 'Çekmece Sayısı', 'Askılık', 'Ayna'],
        'masa': ['Masa Şekli', 'Kişi Kapasitesi', 'Açılabilir'],
        'genel': ['Stil', 'Montaj', 'Kargo', 'Özel Özellik']
      }

      if (categoryProperties[category]) {
        whereClause.propertyName = { in: categoryProperties[category] }
      }
    }

    // Sıralama seçenekleri
    const validSortFields = ['propertyName', 'propertyType', 'createdAt', 'propertyId']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'propertyName'
    const orderBy: any = {}
    orderBy[sortField] = sortOrder === 'desc' ? 'desc' : 'asc'

    // Sayfalama
    const skip = (page - 1) * limit

    // Properties'leri getir
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              furnitureProperties: true,
              furnitureSetProperties: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.property.count({ where: whereClause })
    ])

    // Kullanım durumu filtresi (sonradan uygula)
    let filteredProperties = properties
    if (usage) {
      if (usage === 'used') {
        filteredProperties = properties.filter(p => 
          p._count.furnitureProperties > 0 || p._count.furnitureSetProperties > 0
        )
      } else if (usage === 'unused') {
        filteredProperties = properties.filter(p => 
          p._count.furnitureProperties === 0 && p._count.furnitureSetProperties === 0
        )
      }
    }

    // İstatistikler (istenirse)
    let stats = null
    if (includeStats) {
      const [typeStats, usageStats, categoryStats] = await Promise.all([
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
        ]),
        // En çok kullanılan özellikler
        prisma.property.findMany({
          select: {
            propertyId: true,
            propertyName: true,
            _count: {
              select: {
                furnitureProperties: true,
                furnitureSetProperties: true
              }
            }
          },
          where: { isActive: true },
          orderBy: [
            { furnitureProperties: { _count: 'desc' } },
            { furnitureSetProperties: { _count: 'desc' } }
          ],
          take: 5
        })
      ])

      stats = {
        byType: typeStats.reduce((acc, item) => {
          acc[item.propertyType] = item._count.propertyId
          return acc
        }, {} as any),
        usage: {
          used: usageStats[0],
          unused: usageStats[1],
          total: usageStats[0] + usageStats[1]
        },
        mostUsed: categoryStats.map(p => ({
          propertyId: p.propertyId,
          propertyName: p.propertyName,
          totalUsage: p._count.furnitureProperties + p._count.furnitureSetProperties,
          furnitureUsage: p._count.furnitureProperties,
          furnitureSetUsage: p._count.furnitureSetProperties
        }))
      }
    }

    return NextResponse.json({
      success: true,
      data: filteredProperties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      filters: { isActive, search, type, category, usage },
      sort: { sortBy: sortField, sortOrder },
      ...(stats && { stats })
    })

  } catch (error) {
    console.error('Özellik listesi hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Özellikler getirilemedi'
    }, { status: 500 })
  }
}

// POST - Yeni özellik ekle (geliştirilmiş)
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const { 
      propertyName, 
      propertyType, 
      description, 
      isActive = true 
    } = data

    // Validasyon
    if (!propertyName || propertyName.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Özellik adı zorunludur ve boş olamaz'
      }, { status: 400 })
    }

    if (propertyName.length > 50) {
      return NextResponse.json({
        success: false,
        error: 'Özellik adı 50 karakterden uzun olamaz'
      }, { status: 400 })
    }

    if (!propertyType) {
      return NextResponse.json({
        success: false,
        error: 'Özellik tipi zorunludur'
      }, { status: 400 })
    }

    // Geçerli özellik tipleri
    const validTypes = ['text', 'number', 'date', 'boolean']
    if (!validTypes.includes(propertyType)) {
      return NextResponse.json({
        success: false,
        error: `Geçerli özellik tipleri: ${validTypes.join(', ')}`
      }, { status: 400 })
    }

    if (description && description.length > 500) {
      return NextResponse.json({
        success: false,
        error: 'Açıklama 500 karakterden uzun olamaz'
      }, { status: 400 })
    }

    // Özellik adı benzersizlik kontrolü
    const existingProperty = await prisma.property.findFirst({
      where: { 
        propertyName: { 
          equals: propertyName.trim(), 
          mode: 'insensitive' 
        } 
      }
    })

    if (existingProperty) {
      return NextResponse.json({
        success: false,
        error: 'Bu özellik adı zaten mevcut'
      }, { status: 400 })
    }

    const property = await prisma.property.create({
      data: {
        propertyName: propertyName.trim(),
        propertyType,
        description: description?.trim() || null,
        isActive
      },
      include: {
        _count: {
          select: {
            furnitureProperties: true,
            furnitureSetProperties: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Özellik başarıyla eklendi',
      data: property
    }, { status: 201 })

  } catch (error) {
    console.error('Özellik ekleme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Özellik eklenemedi'
    }, { status: 500 })
  }
}

// DELETE - Toplu özellik silme
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    
    if (!idsParam) {
      return NextResponse.json({
        success: false,
        error: 'Silinecek özellik ID\'leri belirtilmeli'
      }, { status: 400 })
    }

    const ids = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    
    if (ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçerli özellik ID\'si bulunamadı'
      }, { status: 400 })
    }

    // Özellikleri ve bağımlılıklarını kontrol et
    const properties = await prisma.property.findMany({
      where: { propertyId: { in: ids } },
      include: {
        furnitureProperties: true,
        furnitureSetProperties: true
      }
    })

    const issues = []
    for (const property of properties) {
      const totalUsage = property.furnitureProperties.length + property.furnitureSetProperties.length
      if (totalUsage > 0) {
        issues.push(`"${property.propertyName}" özelliği ${totalUsage} yerde kullanılıyor`)
      }
    }

    if (issues.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Bazı özellikler silinemez',
        issues
      }, { status: 400 })
    }

    const deleted = await prisma.property.deleteMany({
      where: { propertyId: { in: ids } }
    })

    return NextResponse.json({
      success: true,
      message: `${deleted.count} özellik başarıyla silindi`,
      deletedCount: deleted.count
    })

  } catch (error) {
    console.error('Toplu özellik silme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Özellikler silinemedi'
    }, { status: 500 })
  }
}

// PATCH - Toplu özellik durumu değiştirme
export async function PATCH(request: Request) {
  try {
    const data = await request.json()
    const { ids, isActive, propertyType } = data

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Güncellenecek özellik ID\'leri belirtilmeli'
      }, { status: 400 })
    }

    const updateData: any = {}

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive
    }

    if (propertyType) {
      const validTypes = ['text', 'number', 'date', 'boolean']
      if (!validTypes.includes(propertyType)) {
        return NextResponse.json({
          success: false,
          error: `Geçerli özellik tipleri: ${validTypes.join(', ')}`
        }, { status: 400 })
      }
      updateData.propertyType = propertyType
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Güncellenecek alan belirtilmeli (isActive veya propertyType)'
      }, { status: 400 })
    }

    const updated = await prisma.property.updateMany({
      where: { propertyId: { in: ids } },
      data: updateData
    })

    let message = `${updated.count} özellik güncellendi`
    if (isActive !== undefined) {
      message = `${updated.count} özellik durumu ${isActive ? 'aktif' : 'pasif'} olarak güncellendi`
    }
    if (propertyType) {
      message = `${updated.count} özellik tipi ${propertyType} olarak güncellendi`
    }

    return NextResponse.json({
      success: true,
      message,
      updatedCount: updated.count
    })

  } catch (error) {
    console.error('Toplu özellik güncelleme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Özellik durumları güncellenemedi'
    }, { status: 500 })
  }
}