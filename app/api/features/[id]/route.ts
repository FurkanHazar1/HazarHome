import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { toPublicUrl, uploadSingleImage, deleteImage } from '@/lib/image-utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const featureId = parseInt(id)

    const feature = await prisma.feature.findUnique({
      where: { featureId },
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
      }
    })

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 })
    }

    // Process URLs
    const processedFeature = {
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
    }

    return NextResponse.json(processedFeature)
  } catch (error) {
    console.error('Error fetching feature:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: idParam } = await params
    const featureId = parseInt(idParam)
    
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
      // Get existing feature to find old image
      const existingFeature = await prisma.feature.findUnique({
        where: { featureId },
        include: { image: true }
      })

      if (existingFeature?.imageId) {
        await deleteImage(existingFeature.imageId)
      }

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
      // Get existing feature to find old image
      const existingFeature = await prisma.feature.findUnique({
        where: { featureId },
        include: { image: true }
      })

      if (existingFeature?.imageId) {
        await deleteImage(existingFeature.imageId)
      }

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

    // Transaction to update feature and replace pins
    const updatedFeature = await prisma.$transaction(async (tx) => {
      // 1. Update Feature details
      const feature = await tx.feature.update({
        where: { featureId },
        data: {
          title,
          description,
          imageId: imageId ? parseInt(String(imageId)) : undefined,
          isActive,
          sortOrder: sortOrder ? parseInt(String(sortOrder)) : undefined
        }
      })

      // 2. Handle Pins if provided
      if (pins) {
        // Delete existing pins
        await tx.featurePin.deleteMany({
          where: { featureId }
        })

        // Create new pins
        if (pins.length > 0) {
          await tx.featurePin.createMany({
            data: pins.map((pin: any) => ({
              featureId,
              furnitureId: pin.furnitureId || null,
              furnitureSetId: pin.furnitureSetId || null,
              xPosition: parseFloat(String(pin.xPosition)),
              yPosition: parseFloat(String(pin.yPosition))
            }))
          })
        }
      }

      return feature
    })

    return NextResponse.json(updatedFeature)
  } catch (error) {
    console.error('Error updating feature:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const featureId = parseInt(id)

    const feature = await prisma.feature.findUnique({
      where: { featureId }
    })

    if (feature?.imageId) {
      await deleteImage(feature.imageId)
    }

    await prisma.feature.delete({
      where: { featureId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting feature:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
