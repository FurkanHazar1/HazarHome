// app/api/categories/route.ts - Geliştirilmiş Kategori API
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Kategorileri listele (geliştirilmiş)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parametreleri
    const parentId = searchParams.get('parentId')
    const level = searchParams.get('level')
    const flat = searchParams.get('flat') === 'true'
    const isActive = searchParams.get('active')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortBy = searchParams.get('sortBy') || 'categoryName'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // Where koşulları
    let whereClause: any = {}

    // Aktif/pasif filtresi
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    // Parent ID filtresi
    if (parentId) {
      whereClause.parentId = parentId === 'null' ? null : parseInt(parentId)
    }

    // Level filtresi
    if (level) {
      whereClause.categoryLevel = parseInt(level)
    }

    // Arama filtresi
    if (search) {
      whereClause.OR = [
        { categoryName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { categoryPath: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Sıralama seçenekleri
    const validSortFields = ['categoryName', 'createdAt', 'categoryLevel', 'categoryId']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'categoryName'
    const orderBy: any = {}
    orderBy[sortField] = sortOrder === 'desc' ? 'desc' : 'asc'

    if (flat) {
      // Düz liste (sayfalama ile)
      const skip = (page - 1) * limit

      const [categories, total] = await Promise.all([
        prisma.category.findMany({
          where: whereClause,
          include: {
            parent: {
              select: {
                categoryId: true,
                categoryName: true
              }
            },
            _count: {
              select: {
                furnitures: true,
                children: true
              }
            }
          },
          orderBy,
          skip,
          take: limit
        }),
        prisma.category.count({ where: whereClause })
      ])

      return NextResponse.json({
        success: true,
        data: categories,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        filters: { parentId, level, isActive, search },
        sort: { sortBy: sortField, sortOrder }
      })
    }

    // Hiyerarşik yapı (ana kategoriler + alt kategoriler)
    const categories = await prisma.category.findMany({
      where: {
        categoryLevel: 1,
        ...(isActive !== null && { isActive: isActive === 'true' }),
        ...(search && {
          OR: [
            { categoryName: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        })
      },
      include: {
        children: {
          where: {
            ...(isActive !== null && { isActive: isActive === 'true' }),
            ...(search && {
              OR: [
                { categoryName: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
              ]
            })
          },
          include: {
            _count: {
              select: { furnitures: true }
            }
          },
          orderBy: { categoryName: 'asc' }
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

    // İstatistikler
    const stats = await prisma.category.groupBy({
      by: ['categoryLevel'],
      _count: {
        categoryId: true
      },
      where: { isActive: true }
    })

    return NextResponse.json({
      success: true,
      data: categories,
      stats: {
        totalCategories: stats.reduce((sum, item) => sum + item._count.categoryId, 0),
        byLevel: stats.reduce((acc, item) => {
          acc[`level${item.categoryLevel}`] = item._count.categoryId
          return acc
        }, {} as any)
      },
      filters: { isActive, search }
    })

  } catch (error) {
    console.error('Kategori listesi hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Kategoriler getirilemedi'
    }, { status: 500 })
  }
}

// POST - Yeni kategori ekle (geliştirilmiş)
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const { 
      categoryName, 
      description, 
      parentId, 
      isActive = true 
    } = data

    // Validasyon
    if (!categoryName || categoryName.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Kategori adı zorunludur ve boş olamaz'
      }, { status: 400 })
    }

    if (categoryName.length > 100) {
      return NextResponse.json({
        success: false,
        error: 'Kategori adı 100 karakterden uzun olamaz'
      }, { status: 400 })
    }

    // Kategori adı benzersizlik kontrolü (aynı seviyede)
    const existingCategory = await prisma.category.findFirst({
      where: {
        categoryName: {
          equals: categoryName.trim(),
          mode: 'insensitive'
        },
        parentId: parentId || null
      }
    })

    if (existingCategory) {
      return NextResponse.json({
        success: false,
        error: 'Bu kategoride aynı isimde bir kategori zaten mevcut'
      }, { status: 400 })
    }

    // Parent kontrolü ve level hesaplama
    let categoryLevel = 1
    let categoryPath = `/${categoryName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-üğıöşç]/g, '')
      .replace(/--+/g, '-')}`
    
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { categoryId: parentId }
      })
      
      if (!parent) {
        return NextResponse.json({
          success: false,
          error: 'Ana kategori bulunamadı'
        }, { status: 400 })
      }

      if (!parent.isActive) {
        return NextResponse.json({
          success: false,
          error: 'Pasif bir kategorinin altına kategori eklenemez'
        }, { status: 400 })
      }

      // Maksimum 3 seviye kontrolü
      if (parent.categoryLevel >= 3) {
        return NextResponse.json({
          success: false,
          error: 'Maksimum 3 seviye kategori oluşturulabilir'
        }, { status: 400 })
      }
      
      categoryLevel = parent.categoryLevel + 1
      categoryPath = `${parent.categoryPath}/${categoryName.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-üğıöşç]/g, '')
        .replace(/--+/g, '-')}`
    }

    const category = await prisma.category.create({
      data: {
        categoryName: categoryName.trim(),
        description: description?.trim() || null,
        parentId,
        categoryLevel,
        categoryPath,
        isActive
      },
      include: {
        parent: {
          select: {
            categoryId: true,
            categoryName: true
          }
        },
        _count: {
          select: {
            furnitures: true,
            children: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Kategori başarıyla eklendi',
      data: category
    }, { status: 201 })

  } catch (error) {
    console.error('Kategori ekleme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Kategori eklenemedi'
    }, { status: 500 })
  }
}

// DELETE - Toplu kategori silme
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    
    if (!idsParam) {
      return NextResponse.json({
        success: false,
        error: 'Silinecek kategori ID\'leri belirtilmeli'
      }, { status: 400 })
    }

    const ids = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    
    if (ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçerli kategori ID\'si bulunamadı'
      }, { status: 400 })
    }

    // Kategorileri ve bağımlılıklarını kontrol et
    const categories = await prisma.category.findMany({
      where: { categoryId: { in: ids } },
      include: {
        children: true,
        furnitures: true
      }
    })

    const issues = []
    for (const category of categories) {
      if (category.children.length > 0) {
        issues.push(`"${category.categoryName}" kategorisinin ${category.children.length} alt kategorisi var`)
      }
      if (category.furnitures.length > 0) {
        issues.push(`"${category.categoryName}" kategorisinde ${category.furnitures.length} mobilya var`)
      }
    }

    if (issues.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Bazı kategoriler silinemez',
        issues
      }, { status: 400 })
    }

    const deleted = await prisma.category.deleteMany({
      where: { categoryId: { in: ids } }
    })

    return NextResponse.json({
      success: true,
      message: `${deleted.count} kategori başarıyla silindi`,
      deletedCount: deleted.count
    })

  } catch (error) {
    console.error('Toplu kategori silme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Kategoriler silinemedi'
    }, { status: 500 })
  }
}

// PATCH - Toplu kategori durumu değiştirme
export async function PATCH(request: Request) {
  try {
    const data = await request.json()
    const { ids, isActive } = data

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Güncellenecek kategori ID\'leri belirtilmeli'
      }, { status: 400 })
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'isActive değeri boolean olmalı (true/false)'
      }, { status: 400 })
    }

    const updated = await prisma.category.updateMany({
      where: { categoryId: { in: ids } },
      data: { isActive }
    })

    return NextResponse.json({
      success: true,
      message: `${updated.count} kategori durumu ${isActive ? 'aktif' : 'pasif'} olarak güncellendi`,
      updatedCount: updated.count
    })

  } catch (error) {
    console.error('Toplu kategori güncelleme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Kategori durumları güncellenemedi'
    }, { status: 500 })
  }
}