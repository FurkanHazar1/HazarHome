// GET - Tek özellik detayı
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = parseInt(params.id)

    const property = await prisma.property.findUnique({
      where: { propertyId },
      include: {
        furnitureProperties: {
          include: {
            furniture: {
              select: {
                furnitureId: true,
                furnitureName: true,
                furnitureType: true,
                isActive: true
              }
            }
          },
          take: 10,
          orderBy: { furniture: { furnitureName: 'asc' } }
        },
        furnitureSetProperties: {
          include: {
            furnitureSet: {
              select: {
                setId: true,
                setName: true,
                isActive: true
              }
            }
          },
          take: 10,
          orderBy: { furnitureSet: { setName: 'asc' } }
        },
        _count: {
          select: {
            furnitureProperties: true,
            furnitureSetProperties: true
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json({
        success: false,
        error: 'Özellik bulunamadı'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: property
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Özellik getirilemedi'
    }, { status: 500 })
  }
}

// PUT - Özellik güncelle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = parseInt(params.id)
    const data = await request.json()
    const { propertyName, propertyType, description, isActive } = data

    // Mevcut özelliği kontrol et
    const existingProperty = await prisma.property.findUnique({
      where: { propertyId }
    })

    if (!existingProperty) {
      return NextResponse.json({
        success: false,
        error: 'Özellik bulunamadı'
      }, { status: 404 })
    }

    // Özellik tipi kontrolü
    if (propertyType) {
      const validTypes = ['text', 'number', 'date', 'boolean']
      if (!validTypes.includes(propertyType)) {
        return NextResponse.json({
          success: false,
          error: `Geçerli özellik tipleri: ${validTypes.join(', ')}`
        }, { status: 400 })
      }
    }

    // Özellik adı benzersizlik kontrolü (kendisi hariç)
    if (propertyName && propertyName !== existingProperty.propertyName) {
      const duplicateProperty = await prisma.property.findFirst({
        where: { 
          propertyName: { 
            equals: propertyName, 
            mode: 'insensitive' 
          },
          propertyId: { not: propertyId }
        }
      })

      if (duplicateProperty) {
        return NextResponse.json({
          success: false,
          error: 'Bu özellik adı zaten başka bir özellik tarafından kullanılıyor'
        }, { status: 400 })
      }
    }

    const updatedProperty = await prisma.property.update({
      where: { propertyId },
      data: {
        ...(propertyName && { propertyName: propertyName.trim() }),
        ...(propertyType && { propertyType }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive !== undefined && { isActive })
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
      message: 'Özellik başarıyla güncellendi',
      data: updatedProperty
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Özellik güncellenemedi'
    }, { status: 500 })
  }
}

// DELETE - Özellik sil
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = parseInt(params.id)

    // Özelliği ve kullanım durumunu kontrol et
    const property = await prisma.property.findUnique({
      where: { propertyId },
      include: {
        furnitureProperties: true,
        furnitureSetProperties: true
      }
    })

    if (!property) {
      return NextResponse.json({
        success: false,
        error: 'Özellik bulunamadı'
      }, { status: 404 })
    }

    if (property.furnitureProperties.length > 0 || property.furnitureSetProperties.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Bu özellik mobilyalarda kullanılıyor. Önce bu özelliği kullanan mobilyaları güncelleyin.',
        usage: {
          furnitureCount: property.furnitureProperties.length,
          furnitureSetCount: property.furnitureSetProperties.length
        }
      }, { status: 400 })
    }

    await prisma.property.delete({
      where: { propertyId }
    })

    return NextResponse.json({
      success: true,
      message: 'Özellik başarıyla silindi'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Özellik silinemedi'
    }, { status: 500 })
  }
}