import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadSingleImage, toPublicUrl } from '@/lib/image-utils'

// GET - Resim listesini getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const furnitureId = searchParams.get('furnitureId')
    const imageType = searchParams.get('imageType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    let whereClause: any = {
      isActive: true
    }

    if (furnitureId) {
      whereClause.furnitureId = parseInt(furnitureId)
    }

    if (imageType) {
      whereClause.imageType = imageType
    }

    const images = await prisma.furnitureImage.findMany({
      where: whereClause,
      include: {
        image: true,
        furniture: {
          select: {
            furnitureId: true,
            furnitureName: true
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { id: 'asc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.furnitureImage.count({
      where: whereClause
    })

    return NextResponse.json({
      images: images.map(item => ({
        id: item.id,
        fileName: item.image.fileName,
        filePath: item.image.filePath,
        url: toPublicUrl(item.image.filePath),
        sortOrder: item.sortOrder,
        imageType: item.imageType,
        furniture: {
          id: item.furniture.furnitureId,
          name: item.furniture.furnitureName
        }
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get images error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Yeni resim upload (S3 Support)
export async function POST(request: NextRequest) {
  try {
    // Auth kontrol
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File
      const type = formData.get('type') as string || 'others'
      const furnitureId = formData.get('furnitureId') as string

      if (!file) {
        return NextResponse.json({ error: 'File is required' }, { status: 400 })
      }

      const uploadResult = await uploadSingleImage(file, type)
      
      // Create Image record
      const image = await prisma.image.create({
        data: {
          fileName: uploadResult.fileName,
          filePath: uploadResult.key,
          fileType: 'webp',
          fileSize: file.size,
          altText: file.name
        }
      })

      // If furnitureId is provided, also create FurnitureImage relation
      if (furnitureId && !isNaN(parseInt(furnitureId))) {
        await prisma.furnitureImage.create({
          data: {
            furnitureId: parseInt(furnitureId),
            imageId: image.imageId,
            imageType: 'gallery',
            sortOrder: 1
          }
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Image uploaded successfully',
        image: {
          imageId: image.imageId,
          fileName: image.fileName,
          filePath: image.filePath,
          url: uploadResult.publicUrl
        }
      }, { status: 201 })

    } else {
      // Legacy JSON body support
      const body = await request.json()
      const { furnitureId, fileName, filePath, sortOrder, imageType } = body

      if (!fileName || !filePath) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      const image = await prisma.image.create({
        data: {
          fileName,
          filePath,
          fileType: fileName.split('.').pop()?.toLowerCase() || 'jpg',
          sortOrder: sortOrder || 1
        }
      })

      if (furnitureId) {
        await prisma.furnitureImage.create({
          data: {
            furnitureId: parseInt(furnitureId),
            imageId: image.imageId,
            sortOrder: sortOrder || 1,
            imageType: imageType || 'main_image'
          }
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Image record created',
        image: {
          imageId: image.imageId,
          fileName: image.fileName,
          filePath: image.filePath,
          url: toPublicUrl(image.filePath)
        }
      }, { status: 201 })
    }

  } catch (error) {
    console.error('Upload image error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// DELETE - Toplu resim silme
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { imageIds } = body

    if (!imageIds || !Array.isArray(imageIds)) {
      return NextResponse.json({ error: 'Invalid image IDs' }, { status: 400 })
    }

    let deletedCount = 0
    for (const id of imageIds) {
      const success = await deleteImage(parseInt(id))
      if (success) deletedCount++
    }

    return NextResponse.json({
      success: true,
      message: `${deletedCount} images deleted successfully`,
      deletedCount
    })

  } catch (error) {
    console.error('Delete images error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { deleteImage } from '@/lib/image-utils'