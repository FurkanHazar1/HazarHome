import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { toPublicUrl, uploadSingleImage } from '@/lib/image-utils'
import { revalidateTag, revalidatePath } from 'next/cache'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const features = await prisma.feature.findMany({
      where: activeOnly ? { isActive: true } : {},
      include: {
        image: true,
        pins: {
          include: {
            furniture: {
              include: {
                images: {
                  where: { imageType: 'main' },
                  include: { image: true }
                }
              }
            },
            furnitureSet: {
              include: {
                furnitureSetImages: {
                  where: { imageType: 'main' },
                  include: { image: true }
                }
              }
            }
          }
        }
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    // Process URLs
    const processedFeatures = features.map(feature => ({
      ...feature,
      image: feature.image ? {
        ...feature.image,
        url: toPublicUrl(feature.image.filePath)
      } : null,
      pins: feature.pins.map(pin => ({
        ...pin,
        furniture: pin.furniture ? {
          ...pin.furniture,
          images: pin.furniture.images.map(fi => ({
            ...fi,
            image: {
              ...fi.image,
              url: toPublicUrl(fi.image.filePath)
            }
          }))
        } : null,
        furnitureSet: pin.furnitureSet ? {
          ...pin.furnitureSet,
          furnitureSetImages: pin.furnitureSet.furnitureSetImages.map(fsi => ({
            ...fsi,
            image: {
              ...fsi.image,
              url: toPublicUrl(fsi.image.filePath)
            }
          }))
        } : null
      }))
    }))

    return NextResponse.json(processedFeatures)
  } catch (error) {
    console.error('Error fetching features:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    let data: any = {}
    let imageFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      data = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        isActive: formData.get('isActive') === 'true',
        sortOrder: formData.get('sortOrder') as string,
        pins: formData.get('pins') as string,
        imageId: formData.get('imageId') as string,
      }
      imageFile = formData.get('image') as File
    } else {
      data = await request.json()
    }

    let { title, description, imageId, isActive, sortOrder, pins, s3Key } = data

    // Parse pins if string
    if (typeof pins === 'string') {
      try {
        pins = JSON.parse(pins)
      } catch (e) {
        pins = []
      }
    }

    // Handle image upload if provided
    if (s3Key) {
      // Use the already uploaded S3 Key
      const newImage = await prisma.image.create({
        data: {
          fileName: s3Key.split('/').pop() || 'image.webp',
          filePath: s3Key,
          fileType: 'webp',
          altText: title || 'Feature image'
        }
      })
      imageId = newImage.imageId
    } else if (imageFile && imageFile.size > 0) {
      const uploadResult = await uploadSingleImage(imageFile, 'features')
      
      const newImage = await prisma.image.create({
        data: {
          fileName: uploadResult.fileName,
          filePath: uploadResult.key,
          fileType: 'webp',
          fileSize: imageFile.size,
          altText: title || 'Feature image'
        }
      })
      imageId = newImage.imageId
    }

    // Transaction to create feature and pins
    const feature = await prisma.$transaction(async (tx) => {
      // 1. Create Feature
      const newFeature = await tx.feature.create({
        data: {
          title,
          description,
          imageId: imageId ? parseInt(String(imageId)) : null,
          isActive: isActive ?? true,
          sortOrder: sortOrder ? parseInt(String(sortOrder)) : 0
        }
      })

      // 2. Create Pins if provided
      if (pins && pins.length > 0) {
        await tx.featurePin.createMany({
          data: pins.map((pin: any) => ({
            featureId: newFeature.featureId,
            furnitureId: pin.furnitureId || null,
            furnitureSetId: pin.furnitureSetId || null,
            xPosition: parseFloat(String(pin.xPosition)),
            yPosition: parseFloat(String(pin.yPosition))
          }))
        })
      }

      return feature
    })

    try {
      (revalidateTag as any)('features');
      (revalidatePath as any)('/');
    } catch (e) {
      console.error('Revalidation error:', e);
    }

    return NextResponse.json(feature)
  } catch (error) {
    console.error('Error creating feature:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
