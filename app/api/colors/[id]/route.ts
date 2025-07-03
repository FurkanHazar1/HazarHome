// app/api/colors/[id]/route.ts - Tekil renk işlemleri
// GET - Tek renk detayı
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const colorId = parseInt(params.id)

    const color = await prisma.color.findUnique({
      where: { colorId },
      include: {
        furnitureColors: {
          include: {
            furniture: {
              select: {
                furnitureId: true,
                furnitureName: true,
                price: true,
                isActive: true
              }
            }
          },
          take: 10
        },
        furnitureSetColors: {
          include: {
            furnitureSet: {
              select: {
                setId: true,
                setName: true,
                price: true,
                isActive: true
              }
            }
          },
          take: 10
        },
        _count: {
          select: {
            furnitureColors: true,
            furnitureSetColors: true
          }
        }
      }
    })

    if (!color) {
      return NextResponse.json({
        success: false,
        error: 'Renk bulunamadı'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: color
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Renk getirilemedi'
    }, { status: 500 })
  }
}

// PUT - Renk güncelle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const colorId = parseInt(params.id)
    const data = await request.json()
    const { colorName, colorCode, isActive } = data

    // Mevcut rengi kontrol et
    const existingColor = await prisma.color.findUnique({
      where: { colorId }
    })

    if (!existingColor) {
      return NextResponse.json({
        success: false,
        error: 'Renk bulunamadı'
      }, { status: 404 })
    }

    // Renk adı benzersizlik kontrolü (kendisi hariç)
    if (colorName && colorName !== existingColor.colorName) {
      const duplicateColor = await prisma.color.findFirst({
        where: { 
          colorName: { 
            equals: colorName, 
            mode: 'insensitive' 
          },
          colorId: { not: colorId }
        }
      })

      if (duplicateColor) {
        return NextResponse.json({
          success: false,
          error: 'Bu renk adı zaten başka bir renk tarafından kullanılıyor'
        }, { status: 400 })
      }
    }

    // Renk kodu formatı kontrolü
    if (colorCode && !/^#[0-9A-Fa-f]{6}$/.test(colorCode)) {
      return NextResponse.json({
        success: false,
        error: 'Renk kodu geçersiz format (örnek: #FF0000)'
      }, { status: 400 })
    }

    const updatedColor = await prisma.color.update({
      where: { colorId },
      data: {
        ...(colorName && { colorName: colorName.trim() }),
        ...(colorCode !== undefined && { colorCode }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        _count: {
          select: {
            furnitureColors: true,
            furnitureSetColors: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Renk başarıyla güncellendi',
      data: updatedColor
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Renk güncellenemedi'
    }, { status: 500 })
  }
}

// DELETE - Renk sil
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const colorId = parseInt(params.id)

    // Rengi ve kullanım durumunu kontrol et
    const color = await prisma.color.findUnique({
      where: { colorId },
      include: {
        furnitureColors: true,
        furnitureSetColors: true
      }
    })

    if (!color) {
      return NextResponse.json({
        success: false,
        error: 'Renk bulunamadı'
      }, { status: 404 })
    }

    if (color.furnitureColors.length > 0 || color.furnitureSetColors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Bu renk mobilyalarda kullanılıyor. Önce bu rengi kullanan mobilyaları güncelleyin.',
        usage: {
          furnitureCount: color.furnitureColors.length,
          furnitureSetCount: color.furnitureSetColors.length
        }
      }, { status: 400 })
    }

    await prisma.color.delete({
      where: { colorId }
    })

    return NextResponse.json({
      success: true,
      message: 'Renk başarıyla silindi'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Renk silinemedi'
    }, { status: 500 })
  }
}