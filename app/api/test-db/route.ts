import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Veritabanı bağlantısını test et
    await prisma.$connect()
    
    // Kategorileri say (basit test sorgusu)
    const categoryCount = await prisma.category.count()
    const furnitureCount = await prisma.furniture.count()
    
    console.log('✅ Veritabanı bağlantısı başarılı!')
    
    return NextResponse.json({ 
      message: 'Veritabanı bağlantısı başarılı!',
      status: 'connected',
      stats: {
        categories: categoryCount,
        furniture: furnitureCount
      }
    })
  } catch (error) {
    console.error('❌ Veritabanı bağlantı hatası:', error)
    return NextResponse.json({ 
      message: 'Veritabanı bağlantı hatası',
      error: error 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}