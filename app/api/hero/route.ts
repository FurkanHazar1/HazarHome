import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadSingleImage, toPublicUrl } from '@/lib/image-utils'
import { revalidateTag, revalidatePath } from 'next/cache'

export async function GET(request: Request) {
// ...
}

export async function POST(request: Request) {
  try {
    // ... (existing logic)

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

    // Clear cache
    revalidateTag('hero-slides')
    revalidatePath('/')

    return NextResponse.json({
      ...slide,
      imageUrl: toPublicUrl(slide.imageUrl)
    }, { status: 201 })
  } catch (error) {
    // ...
  }
}
