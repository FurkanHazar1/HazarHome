import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { toPublicUrl, uploadSingleImage, deleteImage } from '@/lib/image-utils'
import { revalidateTag, revalidatePath } from 'next/cache'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const featureId = parseInt(idParam)

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
            image: { ...fi.image, url: toPublicUrl(fi.image.filePath) }
          }))
        } : null,
        furnitureSet: pin.furnitureSet ? {
          ...pin.furnitureSet,
          furnitureSetImages: pin.furnitureSet.furnitureSetImages.map(fsi => ({
            ...fsi,
            image: { ...fsi.image, url: toPublicUrl(fsi.image.filePath) }
          }))
        } : null
      }))
    }

    return NextResponse.json(processedFeature)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
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
        title: formData.get('title'),
        description: formData.get('description'),
        isActive: formData.get('isActive') === 'true',
        sortOrder: formData.get('sortOrder'),
        pins: formData.get('pins'),
        imageId: formData.get('imageId'),
        s3Key: formData.get('s3Key')
      }
      imageFile = formData.get('image') as File
    } else {
      data = await request.json()
    }

    let { title, description, imageId, isActive, sortOrder, pins, s3Key } = data

    if (s3Key || (imageFile && imageFile.size > 0)) {
      const existing = await prisma.feature.findUnique({ where: { featureId } })
      if (existing?.imageId) await deleteImage(existing.imageId)
      
      let filePath = s3Key
      if (imageFile && imageFile.size > 0) {
        const upload = await uploadSingleImage(imageFile, 'features')
        filePath = upload.key
      }

      const newImg = await prisma.image.create({
        data: { fileName: filePath.split('/').pop() || 'img.webp', filePath, fileType: 'webp', altText: title || 'Feature' }
      })
      imageId = newImg.imageId
    }

    const updated = await prisma.$transaction(async (tx) => {
      const f = await tx.feature.update({
        where: { featureId },
        data: { title, description, imageId: imageId ? parseInt(String(imageId)) : undefined, isActive, sortOrder: sortOrder ? parseInt(String(sortOrder)) : undefined }
      })
      if (pins) {
        const parsedPins = typeof pins === 'string' ? JSON.parse(pins) : pins
        await tx.featurePin.deleteMany({ where: { featureId } })
        if (parsedPins.length > 0) {
          await tx.featurePin.createMany({
            data: parsedPins.map((p: any) => ({
              featureId, furnitureId: p.furnitureId || null, furnitureSetId: p.furnitureSetId || null,
              xPosition: parseFloat(String(p.xPosition)), yPosition: parseFloat(String(p.yPosition))
            }))
          })
        }
      }
      return f
    })

    // Revalidate
    try {
      (revalidateTag as any)('features');
      (revalidatePath as any)('/');
    } catch (e) {
      console.error('Revalidation error:', e);
    }
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
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

    const { id: idParam } = await params
    const featureId = parseInt(idParam)
    const feature = await prisma.feature.findUnique({ where: { featureId } })
    if (feature?.imageId) await deleteImage(feature.imageId)
    await prisma.feature.delete({ where: { featureId } })

    // Revalidate
    try {
      (revalidateTag as any)('features');
      (revalidatePath as any)('/');
    } catch (e) {
      console.error('Revalidation error:', e);
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}