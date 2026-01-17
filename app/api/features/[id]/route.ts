import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
            furniture: true,
            furnitureSet: true
          }
        }
      }
    })

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 })
    }

    return NextResponse.json(feature)
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

    // Debug Log
    console.log('[PUT Feature] Session:', session ? `User: ${session.user?.email}, Role: ${session.user?.role}` : 'No Session')

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const featureId = parseInt(id)
    const body = await request.json()
    const { title, description, imageId, isActive, sortOrder, pins } = body

    // Transaction to update feature and replace pins
    const updatedFeature = await prisma.$transaction(async (tx) => {
      // 1. Update Feature details
      const feature = await tx.feature.update({
        where: { featureId },
        data: {
          title,
          description,
          imageId,
          isActive,
          sortOrder
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
              xPosition: pin.xPosition,
              yPosition: pin.yPosition
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

    // Debug Log
    console.log('[DELETE Feature] Session:', session ? `User: ${session.user?.email}, Role: ${session.user?.role}` : 'No Session')

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const featureId = parseInt(id)

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
