import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Resim bilgisini getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const imageId = parseInt(id)

    if (isNaN(imageId)) {
      return NextResponse.json(
        { error: 'Invalid image ID' },
        { status: 400 }
      )
    }

    // Resim bilgisini getir
    const furnitureImage = await prisma.furnitureImage.findUnique({
      where: { id: imageId },
      include: {
        furniture: {
          include: {
            category: true
          }
        },
        image: true
      }
    })

    if (!furnitureImage) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: furnitureImage.id,
      fileName: furnitureImage.image.fileName,
      filePath: furnitureImage.image.filePath,
      sortOrder: furnitureImage.sortOrder,
      imageType: furnitureImage.imageType,
      furniture: {
        id: furnitureImage.furniture.furnitureId,
        name: furnitureImage.furniture.furnitureName,
        category: furnitureImage.furniture.category?.categoryName
      }
    })

  } catch (error) {
    console.error('Get image error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Resmi sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth kontrol
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const imageId = parseInt(id)

    if (isNaN(imageId)) {
      return NextResponse.json(
        { error: 'Invalid image ID' },
        { status: 400 }
      )
    }

    // Resmi veritabanından sil
    const deletedImage = await prisma.furnitureImage.delete({
      where: { id: imageId },
      include: {
        image: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
      deletedImage: {
        id: deletedImage.id,
        fileName: deletedImage.image.fileName
      }
    })

  } catch (error) {
    console.error('Delete image error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
