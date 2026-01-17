import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const where = activeOnly ? { isActive: true } : {}

    const slides = await prisma.heroSlide.findMany({
      where,
      orderBy: {
        sortOrder: 'asc',
      },
    })

    return NextResponse.json(slides)
  } catch (error) {
    console.error('Failed to fetch hero slides:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hero slides' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, subtitle, imageUrl, link, buttonText, backgroundColor, isActive, sortOrder } = body

    const slide = await prisma.heroSlide.create({
      data: {
        title,
        subtitle,
        imageUrl,
        link,
        buttonText,
        backgroundColor: backgroundColor || 'bg_light-grey-3',
        isActive: isActive ?? true,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      },
    })

    return NextResponse.json(slide, { status: 201 })
  } catch (error) {
    console.error('Failed to create hero slide:', error)
    return NextResponse.json(
      { error: 'Failed to create hero slide' },
      { status: 500 }
    )
  }
}
