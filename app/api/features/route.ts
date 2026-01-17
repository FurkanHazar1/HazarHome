import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    return NextResponse.json(features)
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
    
    // Debug log
    if (!session) {
      console.log('POST /api/features - No session found')
    } else {
      console.log('POST /api/features - Session found for user:', session.user?.email, 'Role:', session.user?.role)
    }

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, imageId, isActive, sortOrder, pins } = body

    // Transaction to create feature and pins
    const feature = await prisma.$transaction(async (tx) => {
      // 1. Create Feature
      const newFeature = await tx.feature.create({
        data: {
          title,
          description,
          imageId,
          isActive: isActive ?? true,
          sortOrder: sortOrder ?? 0
        }
      })

      // 2. Create Pins if provided
      if (pins && pins.length > 0) {
        await tx.featurePin.createMany({
          data: pins.map((pin: any) => ({
            featureId: newFeature.featureId,
            furnitureId: pin.furnitureId || null,
            furnitureSetId: pin.furnitureSetId || null,
            xPosition: pin.xPosition,
            yPosition: pin.yPosition
          }))
        })
      }

      return newFeature
    })

    return NextResponse.json(feature)
  } catch (error) {
    console.error('Error creating feature:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}