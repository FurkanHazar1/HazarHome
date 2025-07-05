// app/api/colors/[id]/route.ts - Tekil Renk API (Kısa)
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Tek renk detayı
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const colorId = parseInt(params.id)

    if (isNaN(colorId)) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz renk ID\'si'
      }, { status: 400 })
    }

    const color = await prisma.color.findUnique({
      where: { colorId },
      include: {
        furnitureColors: {
          include: {
            furniture: {
              select: {
                furnitureId: true,
                furnitureName: true,
                furnitureType: true
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
      data: {
        ...color,
        usage: {
          total: color._count.furnitureColors + color._count.furnitureSetColors,
          canDelete: color._count.furnitureColors === 0 && color._count.furnitureSetColors === 0
        }
      }
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
    const { colorName, colorCode, isActive } = await request.json()

    if (isNaN(colorId)) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz renk ID\'si'
      }, { status: 400 })
    }

    const existing = await prisma.color.findUnique({
      where: { colorId }
    })

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Renk bulunamadı'
      }, { status: 404 })
    }

    // Validasyonlar
    if (colorName !== undefined && !colorName?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Renk adı boş olamaz'
      }, { status: 400 })
    }

    if (colorCode && !/^#[0-9A-Fa-f]{6}$/.test(colorCode)) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz renk kodu'
      }, { status: 400 })
    }

    // İsim benzersizlik kontrolü
    if (colorName && colorName !== existing.colorName) {
      const duplicate = await prisma.color.findFirst({
        where: { 
          colorName: { equals: colorName.trim(), mode: 'insensitive' },
          colorId: { not: colorId }
        }
      })

      if (duplicate) {
        return NextResponse.json({
          success: false,
          error: 'Bu renk adı zaten kullanılıyor'
        }, { status: 400 })
      }
    }

    const updateData: any = {}
    if (colorName !== undefined) updateData.colorName = colorName.trim()
    if (colorCode !== undefined) updateData.colorCode = colorCode
    if (isActive !== undefined) updateData.isActive = isActive

    const updated = await prisma.color.update({
      where: { colorId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: 'Renk güncellendi',
      data: updated
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

    if (isNaN(colorId)) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz renk ID\'si'
      }, { status: 400 })
    }

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
        error: 'Bu renk mobilyalarda kullanılıyor',
        usage: {
          furniture: color.furnitureColors.length,
          furnitureSets: color.furnitureSetColors.length
        }
      }, { status: 400 })
    }

    await prisma.color.delete({
      where: { colorId }
    })

    return NextResponse.json({
      success: true,
      message: `"${color.colorName}" rengi silindi`
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Renk silinemedi'
    }, { status: 500 })
  }
}