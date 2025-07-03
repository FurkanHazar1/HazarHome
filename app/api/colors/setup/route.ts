// app/api/colors/setup/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Mevcut renkleri temizle
    await prisma.$transaction(async (tx) => {
      // İlişkili kayıtları temizle
      await tx.furnitureColor.deleteMany()
      await tx.furnitureSetColor.deleteMany()
      
      // Renkleri temizle
      await tx.color.deleteMany()
    })

    // Sadece temel renkleri ekle
    const result = await prisma.$transaction(async (tx) => {
      const colors = await tx.color.createMany({
        data: [
          {
            colorName: 'Beyaz',
            colorCode: '#FFFFFF',
            isActive: true
          },
          {
            colorName: 'Siyah',
            colorCode: '#000000',
            isActive: true
          },
          {
            colorName: 'Gri',
            colorCode: '#808080',
            isActive: true
          },
          {
            colorName: 'Kahverengi',
            colorCode: '#8B4513',
            isActive: true
          },
          {
            colorName: 'Krem',
            colorCode: '#F5F5DC',
            isActive: true
          },
          {
            colorName: 'Lacivert',
            colorCode: '#000080',
            isActive: true
          },
          {
            colorName: 'Bordo',
            colorCode: '#800020',
            isActive: true
          },
          {
            colorName: 'Yeşil',
            colorCode: '#008000',
            isActive: true
          }
        ],
        skipDuplicates: true
      })

      return {
        colorsAdded: colors.count
      }
    })

    // Eklenen renkleri getir
    const addedColors = await prisma.color.findMany({
      orderBy: [
        { colorName: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      message: 'Renkler başarıyla eklendi',
      stats: result,
      data: {
        colors: addedColors,
        totalColors: addedColors.length
      }
    })

  } catch (error) {
    console.error('Renk setup hatası:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// GET metodu - Mevcut renkleri görüntüle
export async function GET() {
  try {
    const colors = await prisma.color.findMany({
      where: { isActive: true },
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

    // Renk kategorilerine göre grupla (sadece temel renkler)
    const colorsByCategory = {
      temelRenkler: colors.filter(c => 
        ['Beyaz', 'Siyah', 'Gri', 'Kahverengi', 'Krem', 'Lacivert', 'Bordo', 'Yeşil'].includes(c.colorName)
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        allColors: colors,
        colorsByCategory,
        stats: {
          totalColors: colors.length,
          activeColors: colors.filter(c => c.isActive).length,
          usedColors: colors.filter(c => 
            c._count.furnitureColors > 0 || c._count.furnitureSetColors > 0
          ).length
        }
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Renk verisi getirme hatası'
    }, { status: 500 })
  }
}