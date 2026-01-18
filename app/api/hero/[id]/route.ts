import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { toPublicUrl, uploadSingleImage } from '@/lib/image-utils'
import { deleteFromS3 } from '@/lib/s3'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    const contentType = request.headers.get('content-type') || ''
    let data: any = {}
    let imageFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      data = {
        title: formData.get('title') as string,
        subtitle: formData.get('subtitle') as string,
        link: formData.get('link') as string,
        buttonText: formData.get('buttonText') as string,
        backgroundColor: formData.get('backgroundColor') as string,
        isActive: formData.get('isActive') === 'true',
        sortOrder: formData.get('sortOrder') as string,
      }
      imageFile = formData.get('image') as File
    } else {
      data = await request.json()
    }

    const { title, subtitle, link, buttonText, backgroundColor, isActive, sortOrder, s3Key } = data
    let { imageUrl } = data

    // Check if hero slide exists
    const existingSlide = await prisma.heroSlide.findUnique({
      where: { id }
    })

    if (!existingSlide) {
      return NextResponse.json({ error: 'Hero slide not found' }, { status: 404 })
    }

    if (s3Key) {
      // If we have a new direct S3 key, delete old one
      if (existingSlide.imageUrl && existingSlide.imageUrl !== s3Key) {
        await deleteFromS3(existingSlide.imageUrl)
      }
      imageUrl = s3Key
    } else if (imageFile && imageFile.size > 0) {
      // Delete old image from S3 if it exists
      if (existingSlide.imageUrl) {
        await deleteFromS3(existingSlide.imageUrl)
      }
      
      const uploadResult = await uploadSingleImage(imageFile, 'hero')
      imageUrl = uploadResult.key
    }

    const slide = await prisma.heroSlide.update({
      where: { id },
      data: {
        title,
        subtitle,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        link,
        buttonText,
        backgroundColor,
        isActive,
        sortOrder: sortOrder ? parseInt(sortOrder) : undefined,
      },
    })

    return NextResponse.json({
      ...slide,
      imageUrl: toPublicUrl(slide.imageUrl)
    })
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete hero slide:', error)
    return NextResponse.json(
      { error: 'Failed to delete hero slide' },
      { status: 500 }
    )
  }
}