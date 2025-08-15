import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

// POST - Yeni resim upload
export async function POST(request: NextRequest) {
  try {
    // Auth kontrol
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { furnitureId, fileName, filePath, sortOrder, imageType } = body

    if (!furnitureId || !fileName || !filePath) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Önce Image kaydı oluştur
    const image = await prisma.image.create({
      data: {
        fileName,
        filePath,
        fileType: fileName.split('.').pop()?.toLowerCase() || 'jpg',
        sortOrder: sortOrder || 1
      }
    })

    // Sonra FurnitureImage kaydı oluştur
    const furnitureImage = await prisma.furnitureImage.create({
      data: {
        furnitureId: parseInt(furnitureId),
        imageId: image.imageId,
        sortOrder: sortOrder || 1,
        imageType: imageType || 'main_image'
      },
      include: {
        image: true,
        furniture: {
          select: {
            furnitureId: true,
            furnitureName: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      image: {
        id: furnitureImage.id,
        fileName: furnitureImage.image.fileName,
        filePath: furnitureImage.image.filePath,
        sortOrder: furnitureImage.sortOrder,
        imageType: furnitureImage.imageType,
        furniture: {
          id: furnitureImage.furniture.furnitureId,
          name: furnitureImage.furniture.furnitureName
        }
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Upload image error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Toplu resim silme
export async function DELETE(request: NextRequest) {
  try {
    // Auth kontrol
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { imageIds } = body

    if (!imageIds || !Array.isArray(imageIds)) {
      return NextResponse.json(
        { error: 'Invalid image IDs' },
        { status: 400 }
      )
    }

    // Resimleri sil
    const deleteResult = await prisma.furnitureImage.deleteMany({
      where: {
        id: {
          in: imageIds.map((id: string) => parseInt(id))
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `${deleteResult.count} images deleted successfully`,
      deletedCount: deleteResult.count
    })

  } catch (error) {
    console.error('Delete images error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
