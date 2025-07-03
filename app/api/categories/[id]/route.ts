import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Tek kategori detayı
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id)

    const category = await prisma.category.findUnique({
      where: { categoryId },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          include: {
            _count: {
              select: { furnitures: true }
            }
          }
        },
        furnitures: {
          where: { isActive: true },
          take: 10,
          include: {
            furnitureColors: {
              include: { color: true }
            }
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

    if (!category) {
      return NextResponse.json({
        success: false,
        error: 'Kategori bulunamadı'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: category
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Kategori getirilemedi'
    }, { status: 500 })
  }
}

// PUT - Kategori güncelle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id)
    const data = await request.json()

    const { categoryName, description, isActive } = data

    // Mevcut kategoriyi kontrol et
    const existingCategory = await prisma.category.findUnique({
      where: { categoryId }
    })

    if (!existingCategory) {
      return NextResponse.json({
        success: false,
        error: 'Kategori bulunamadı'
      }, { status: 404 })
    }

    // Kategori path'ini güncelle
    let categoryPath = existingCategory.categoryPath
    if (categoryName && categoryName !== existingCategory.categoryName) {
      const pathParts = existingCategory.categoryPath?.split('/') || []
      pathParts[pathParts.length - 1] = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      categoryPath = pathParts.join('/')
    }

    const updatedCategory = await prisma.category.update({
      where: { categoryId },
      data: {
        ...(categoryName && { categoryName }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(categoryPath && { categoryPath })
      },
      include: {
        parent: true,
        children: true,
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
      message: 'Kategori başarıyla güncellendi',
      data: updatedCategory
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Kategori güncellenemedi'
    }, { status: 500 })
  }
}

// DELETE - Kategori sil
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id)

    // Kategoriyi ve bağımlılıklarını kontrol et
    const category = await prisma.category.findUnique({
      where: { categoryId },
      include: {
        children: true,
        furnitures: true
      }
    })

    if (!category) {
      return NextResponse.json({
        success: false,
        error: 'Kategori bulunamadı'
      }, { status: 404 })
    }

    if (category.children.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Bu kategorinin alt kategorileri var. Önce alt kategorileri silmelisiniz.'
      }, { status: 400 })
    }

    if (category.furnitures.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Bu kategoride mobilyalar var. Önce mobilyaları başka kategoriye taşıyın.'
      }, { status: 400 })
    }

    await prisma.category.delete({
      where: { categoryId }
    })

    return NextResponse.json({
      success: true,
      message: 'Kategori başarıyla silindi'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Kategori silinemedi'
    }, { status: 500 })
  }
}