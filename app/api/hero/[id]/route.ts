import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { toPublicUrl, uploadSingleImage } from '@/lib/image-utils'
import { deleteFromS3 } from '@/lib/s3'

import { revalidateTag, revalidatePath } from 'next/cache'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    // ... (existing logic)
    
    // After successful update
    revalidateTag('hero-slides')
    revalidatePath('/')

    return NextResponse.json({
      ...slide,
      imageUrl: toPublicUrl(slide.imageUrl)
    })
  } catch (error) {
    // ...
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    const slide = await prisma.heroSlide.findUnique({
      where: { id }
    })

    if (slide?.imageUrl) {
      await deleteFromS3(slide.imageUrl)
    }

    await prisma.heroSlide.delete({
      where: { id },
    })

    // Clear cache immediately
    revalidateTag('hero-slides')
    revalidatePath('/')

    return NextResponse.json({ success: true })
  } catch (error) {
    // ...
  }
}