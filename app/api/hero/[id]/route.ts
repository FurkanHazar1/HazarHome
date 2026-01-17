import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    const { title, subtitle, imageUrl, link, buttonText, backgroundColor, isActive, sortOrder } = body

    const slide = await prisma.heroSlide.update({
      where: { id },
      data: {
        title,
        subtitle,
        imageUrl,
        link,
        buttonText,
        backgroundColor,
        isActive,
        sortOrder: sortOrder ? parseInt(sortOrder) : undefined,
      },
    })

    return NextResponse.json(slide)
  } catch (error) {
    console.error('Failed to update hero slide:', error)
    return NextResponse.json(
      { error: 'Failed to update hero slide' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    await prisma.heroSlide.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete hero slide:', error)
    return NextResponse.json(
      { error: 'Failed to delete hero slide' },
      { status: 500 }
    )
  }
}
