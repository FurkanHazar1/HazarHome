// app/api/properties/route.ts - Özellik CRUD işlemleri
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Tüm özellikleri listele
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('active')
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const category = searchParams.get('category')

    let whereClause: any = {}
    
    // Aktif/pasif filtresi
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    // Arama filtresi
    if (search) {
      whereClause.OR = [
        { propertyName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Tip filtresi
    if (type) {
      whereClause.propertyType = type
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

    const properties = await prisma.property.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            furnitureProperties: true,
            furnitureSetProperties: true
          }
        }
      },
      orderBy: { propertyName: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: properties,
      count: properties.length,
      filters: { isActive, search, type, category }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Özellikler getirilemedi'
    }, { status: 500 })
  }
}

// POST - Yeni özellik ekle
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { propertyName, propertyType, description, isActive = true } = data

    if (!propertyName || !propertyType) {
      return NextResponse.json({
        success: false,
        error: 'Özellik adı ve tipi zorunludur'
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

    // Özellik adı benzersizlik kontrolü
    const existingProperty = await prisma.property.findFirst({
      where: { 
        propertyName: { 
          equals: propertyName, 
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
    return NextResponse.json({
      success: false,
      error: 'Özellik eklenemedi'
    }, { status: 500 })
  }
}

// app/api/properties/[id]/route.ts - Tekil özellik işlemleri
