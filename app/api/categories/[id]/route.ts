// app/api/categories/[id]/route.ts - Güncellenmiş Tekil Kategori API
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Tek kategori detayı (geliştirilmiş)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const categoryId = parseInt(id)

    if (isNaN(categoryId)) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz kategori ID\'si'
      }, { status: 400 })
    }

    const category = await prisma.category.findUnique({
      where: { categoryId },
      include: {
        parent: {
          select: {
            categoryId: true,
            categoryName: true,
            categoryPath: true
          }
        },
        children: {
          where: { isActive: true },
          include: {
            _count: {
              select: { furnitures: true }
            }
          },
          orderBy: { categoryName: 'asc' }
        },
        furnitures: {
          where: { isActive: true },
          take: 10,
          select: {
            furnitureId: true,
            furnitureName: true,
            furnitureType: true,
            price: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
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

    // Kategori yolu (breadcrumb için)
    const breadcrumb = []
    let currentCategory = category
    
    while (currentCategory.parent) {
      breadcrumb.unshift({
        categoryId: currentCategory.parent.categoryId,
        categoryName: currentCategory.parent.categoryName
      })
      // Parent'ın parent'ını almak için ayrı sorgu gerekir, basitlik için burada duruyoruz
      break
    }

    return NextResponse.json({
      success: true,
      data: {
        ...category,
        breadcrumb,
        stats: {
          totalFurniture: category._count.furnitures,
          totalChildren: category._count.children,
          hasParent: !!category.parent,
          level: category.categoryLevel
        }
      }
    })

  } catch (error) {
    console.error('Kategori detay hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Kategori getirilemedi'
    }, { status: 500 })
  }
}

// PUT - Kategori güncelle (geliştirilmiş)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const categoryId = parseInt(id)
    
    if (isNaN(categoryId)) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz kategori ID\'si'
      }, { status: 400 })
    }

    const data = await request.json()
    const { categoryName, description, isActive, parentId } = data

    // Mevcut kategoriyi kontrol et
    const existingCategory = await prisma.category.findUnique({
      where: { categoryId },
      include: {
        children: true,
        parent: true
      }
    })

    if (!existingCategory) {
      return NextResponse.json({
        success: false,
        error: 'Kategori bulunamadı'
      }, { status: 404 })
    }

    // Validasyonlar
    if (categoryName !== undefined) {
      if (!categoryName || categoryName.trim().length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Kategori adı boş olamaz'
        }, { status: 400 })
      }

      if (categoryName.length > 100) {
        return NextResponse.json({
          success: false,
          error: 'Kategori adı 100 karakterden uzun olamaz'
        }, { status: 400 })
      }

      // Aynı seviyede aynı isim kontrolü (kendisi hariç)
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          categoryName: {
            equals: categoryName.trim(),
            mode: 'insensitive'
          },
          parentId: parentId !== undefined ? parentId : existingCategory.parentId,
          categoryId: { not: categoryId }
        }
      })

      if (duplicateCategory) {
        return NextResponse.json({
          success: false,
          error: 'Bu kategoride aynı isimde bir kategori zaten mevcut'
        }, { status: 400 })
      }
    }

    // Parent değişikliği kontrolü
    if (parentId !== undefined && parentId !== existingCategory.parentId) {
      if (parentId !== null) {
        // Yeni parent kontrolü
        const newParent = await prisma.category.findUnique({
          where: { categoryId: parentId }
        })

        if (!newParent) {
          return NextResponse.json({
            success: false,
            error: 'Yeni ana kategori bulunamadı'
          }, { status: 400 })
        }

        // Kendini kendi alt kategorisi yapma kontrolü
        if (parentId === categoryId) {
          return NextResponse.json({
            success: false,
            error: 'Kategori kendisinin alt kategorisi olamaz'
          }, { status: 400 })
        }

        // Alt kategorilerinden birine parent yapma kontrolü
        const childIds = existingCategory.children.map(child => child.categoryId)
        if (childIds.includes(parentId)) {
          return NextResponse.json({
            success: false,
            error: 'Alt kategori, üst kategori olarak atanamaz'
          }, { status: 400 })
        }

        // Maksimum seviye kontrolü
        if (newParent.categoryLevel >= 3) {
          return NextResponse.json({
            success: false,
            error: 'Maksimum 3 seviye kategori oluşturulabilir'
          }, { status: 400 })
        }
      }
    }

    // isActive false yapılırken alt kategoriler kontrolü
    if (isActive === false && existingCategory.children.length > 0) {
      const activeChildren = existingCategory.children.filter(child => child.isActive)
      if (activeChildren.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'Aktif alt kategorileri olan kategori pasif yapılamaz',
          details: `${activeChildren.length} aktif alt kategori var`
        }, { status: 400 })
      }
    }

    // Güncelleme verileri hazırla
    const updateData: any = {}
    
    if (categoryName !== undefined) {
      updateData.categoryName = categoryName.trim()
    }
    
    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }
    
    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    // Parent ve path güncellemesi
    if (parentId !== undefined && parentId !== existingCategory.parentId) {
      updateData.parentId = parentId

      if (parentId === null) {
        // Ana kategori yapılıyor
        updateData.categoryLevel = 1
        updateData.categoryPath = `/${(categoryName || existingCategory.categoryName).toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-üğıöşç]/g, '')
          .replace(/--+/g, '-')}`
      } else {
        // Alt kategori yapılıyor
        const newParent = await prisma.category.findUnique({
          where: { categoryId: parentId }
        })
        updateData.categoryLevel = newParent!.categoryLevel + 1
        updateData.categoryPath = `${newParent!.categoryPath}/${(categoryName || existingCategory.categoryName).toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-üğıöşç]/g, '')
          .replace(/--+/g, '-')}`
      }
    } else if (categoryName !== undefined && categoryName !== existingCategory.categoryName) {
      // Sadece isim değişti, path'i güncelle
      const pathParts = existingCategory.categoryPath?.split('/') || []
      pathParts[pathParts.length - 1] = categoryName.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-üğıöşç]/g, '')
        .replace(/--+/g, '-')
      updateData.categoryPath = pathParts.join('/')
    }

    const updatedCategory = await prisma.category.update({
      where: { categoryId },
      data: updateData,
      include: {
        parent: {
          select: {
            categoryId: true,
            categoryName: true
          }
        },
        children: {
          where: { isActive: true },
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
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Kategori başarıyla güncellendi',
      data: updatedCategory
    })

  } catch (error) {
    console.error('Kategori güncelleme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Kategori güncellenemedi'
    }, { status: 500 })
  }
}

// DELETE - Kategori sil (geliştirilmiş)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const categoryId = parseInt(id)

    if (isNaN(categoryId)) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz kategori ID\'si'
      }, { status: 400 })
    }

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

    // Bağımlılık kontrolleri
    const issues = []
    
    if (category.children.length > 0) {
      issues.push(`${category.children.length} alt kategori var`)
    }
    
    if (category.furnitures.length > 0) {
      issues.push(`${category.furnitures.length} mobilya var`)
    }

    if (issues.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Kategori silinemez',
        issues,
        details: {
          categoryName: category.categoryName,
          childrenCount: category.children.length,
          furnitureCount: category.furnitures.length
        }
      }, { status: 400 })
    }

    await prisma.category.delete({
      where: { categoryId }
    })

    return NextResponse.json({
      success: true,
      message: `"${category.categoryName}" kategorisi başarıyla silindi`
    })

  } catch (error) {
    console.error('Kategori silme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Kategori silinemedi'
    }, { status: 500 })
  }
}