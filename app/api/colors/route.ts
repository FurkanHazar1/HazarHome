// app/api/colors/route.ts - Geliştirilmiş Renk API (Kısa)
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Renkleri listele
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isActive = searchParams.get('active')
    const includeStats = searchParams.get('includeStats') === 'true'

    let whereClause: any = {}
    
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    if (search) {
      whereClause.OR = [
        { colorName: { contains: search, mode: 'insensitive' } },
        { colorCode: { contains: search, mode: 'insensitive' } }
      ]
    }

    const colors = await prisma.color.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            furnitureColors: true,
            furnitureSetColors: true
          }
        }
      },
      orderBy: { colorName: 'asc' }
    })

    let stats = null
    if (includeStats) {
      stats = {
        total: colors.length,
        active: colors.filter(c => c.isActive).length,
        used: colors.filter(c => c._count.furnitureColors > 0 || c._count.furnitureSetColors > 0).length
      }
    }

    return NextResponse.json({
      success: true,
      data: colors,
      ...(stats && { stats })
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Renkler getirilemedi'
    }, { status: 500 })
  }
}

// POST - Yeni renk ekle
export async function POST(request: Request) {
  try {
    const { colorName, colorCode, isActive = true } = await request.json()

    // Validasyon
    if (!colorName?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Renk adı zorunludur'
      }, { status: 400 })
    }

    if (colorCode && !/^#[0-9A-Fa-f]{6}$/.test(colorCode)) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz renk kodu (örnek: #FF0000)'
      }, { status: 400 })
    }

    // Benzersizlik kontrolü
    const existing = await prisma.color.findFirst({
      where: { 
        colorName: { equals: colorName.trim(), mode: 'insensitive' } 
      }
    })

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'Bu renk adı zaten mevcut'
      }, { status: 400 })
    }

    const color = await prisma.color.create({
      data: {
        colorName: colorName.trim(),
        colorCode: colorCode || null,
        isActive
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Renk başarıyla eklendi',
      data: color
    }, { status: 201 })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Renk eklenemedi'
    }, { status: 500 })
  }
}

// DELETE - Toplu renk silme
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    
    if (!idsParam) {
      return NextResponse.json({
        success: false,
        error: 'Silinecek renk ID\'leri belirtilmeli'
      }, { status: 400 })
    }

    const ids = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    
    // Kullanım kontrolü
    const colors = await prisma.color.findMany({
      where: { colorId: { in: ids } },
      include: {
        furnitureColors: true,
        furnitureSetColors: true
      }
    })

    const usedColors = colors.filter(c => 
      c.furnitureColors.length > 0 || c.furnitureSetColors.length > 0
    )

    if (usedColors.length > 0) {
      return NextResponse.json({
        success: false,
        error: `${usedColors.length} renk kullanımda olduğu için silinemez`,
        usedColors: usedColors.map(c => c.colorName)
      }, { status: 400 })
    }

    const deleted = await prisma.color.deleteMany({
      where: { colorId: { in: ids } }
    })

    return NextResponse.json({
      success: true,
      message: `${deleted.count} renk silindi`,
      deletedCount: deleted.count
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Renkler silinemedi'
    }, { status: 500 })
  }
}

// PATCH - Toplu aktif/pasif
export async function PATCH(request: Request) {
  try {
    const { ids, isActive } = await request.json()

    if (!ids?.length || typeof isActive !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz parametreler'
      }, { status: 400 })
    }

    const updated = await prisma.color.updateMany({
      where: { colorId: { in: ids } },
      data: { isActive }
    })

    return NextResponse.json({
      success: true,
      message: `${updated.count} renk ${isActive ? 'aktif' : 'pasif'} yapıldı`,
      updatedCount: updated.count
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Toplu güncelleme başarısız'
    }, { status: 500 })
  }
}