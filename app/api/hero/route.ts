import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadSingleImage, toPublicUrl } from '@/lib/image-utils'
import { revalidateTag, revalidatePath } from 'next/cache'

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

    // Process URLs
    const processedSlides = slides.map(slide => ({
      ...slide,
      imageUrl: toPublicUrl(slide.imageUrl)
    }))

    return NextResponse.json(processedSlides)
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

    if (s3Key) {
      imageUrl = s3Key
    } else if (imageFile && imageFile.size > 0) {
      const uploadResult = await uploadSingleImage(imageFile, 'hero')
      imageUrl = uploadResult.key
    }

    if (!imageUrl && !imageFile) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      )
    }

    const slide = await prisma.heroSlide.create({
      data: {
        title,
        subtitle,
        imageUrl: imageUrl || '',
        link,
        buttonText: buttonText || 'İncele',
        backgroundColor: backgroundColor || 'bg_light-grey-3',
        isActive: isActive ?? true,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      },
    })

    // Clear cache with TS-safe revalidation
    try {
      (revalidateTag as any)('hero-slides');
      (revalidatePath as any)('/');
    } catch (e) {
      console.error('Revalidation error:', e);
    }

    return NextResponse.json({
      ...slide,
      imageUrl: toPublicUrl(slide.imageUrl)
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create hero slide:', error)
    return NextResponse.json(
      { error: 'Failed to create hero slide' },
      { status: 500 }
    )
  }
}