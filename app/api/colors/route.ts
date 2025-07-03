// app/api/colors/route.ts - Renk CRUD işlemleri
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Tüm renkleri listele
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('active')
    const search = searchParams.get('search')
    const category = searchParams.get('category')

    let whereClause: any = {}
    
    // Aktif/pasif filtresi
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    // Arama filtresi
    if (search) {
      whereClause.OR = [
        { colorName: { contains: search, mode: 'insensitive' } },
        { colorCode: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Kategori filtresi (sadece temel renkler)
    if (category) {
      const categoryColors: { [key: string]: string[] } = {
        'temel': ['Beyaz', 'Siyah', 'Gri', 'Kahverengi', 'Krem', 'Lacivert', 'Bordo', 'Yeşil']
      }

      if (categoryColors[category]) {
        whereClause.colorName = { in: categoryColors[category] }
      }
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

    return NextResponse.json({
      success: true,
      data: colors,
      count: colors.length,
      filters: { isActive, search, category }
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
    const data = await request.json()
    const { colorName, colorCode, isActive = true } = data

    if (!colorName) {
      return NextResponse.json({
        success: false,
        error: 'Renk adı zorunludur'
      }, { status: 400 })
    }

    // Renk adı benzersizlik kontrolü
    const existingColor = await prisma.color.findFirst({
      where: { 
        colorName: { 
          equals: colorName, 
          mode: 'insensitive' 
        } 
      }
    })

    if (existingColor) {
      return NextResponse.json({
        success: false,
        error: 'Bu renk adı zaten mevcut'
      }, { status: 400 })
    }

    // Renk kodu formatı kontrolü
    if (colorCode && !/^#[0-9A-Fa-f]{6}$/.test(colorCode)) {
      return NextResponse.json({
        success: false,
        error: 'Renk kodu geçersiz format (örnek: #FF0000)'
      }, { status: 400 })
    }

    const color = await prisma.color.create({
      data: {
        colorName: colorName.trim(),
        colorCode: colorCode || null,
        isActive
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

