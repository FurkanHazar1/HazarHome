import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Tüm kategorileri listele (hiyerarşik)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')
    const level = searchParams.get('level')
    const flat = searchParams.get('flat') === 'true'

    if (flat) {
      // Düz liste (parent-child ilişkisi olmadan)
      const categories = await prisma.category.findMany({
        where: {
          isActive: true,
          ...(level && { categoryLevel: parseInt(level) }),
          ...(parentId && { parentId: parseInt(parentId) })
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
        },
        orderBy: [
          { categoryLevel: 'asc' },
          { categoryName: 'asc' }
        ]
      })

      return NextResponse.json({
        success: true,
        data: categories,
        count: categories.length
      })
    }

    // Hiyerarşik yapı (varsayılan)
    const categories = await prisma.category.findMany({
      where: {
        categoryLevel: 1,
        isActive: true
      },
      include: {
        children: {
          where: { isActive: true },
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

    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Kategoriler getirilemedi'
    }, { status: 500 })
  }
}

// POST - Yeni kategori ekle
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const { categoryName, description, parentId } = data

    if (!categoryName) {
      return NextResponse.json({
        success: false,
        error: 'Kategori adı zorunludur'
      }, { status: 400 })
    }

    // Parent kontrolü ve level hesaplama
    let categoryLevel = 1
    let categoryPath = `/${categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
    
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
      
      categoryLevel = parent.categoryLevel + 1
      categoryPath = `${parent.categoryPath}/${categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
    }

    const category = await prisma.category.create({
      data: {
        categoryName,
        description,
        parentId,
        categoryLevel,
        categoryPath,
        isActive: true
      },
      include: {
        parent: true,
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
    return NextResponse.json({
      success: false,
      error: 'Kategori eklenemedi'
    }, { status: 500 })
  }
}