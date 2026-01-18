import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPresignedUploadUrl } from '@/lib/s3'
import { randomUUID } from 'crypto'
import { slugifyCategory } from '@/lib/image-utils'

/**
 * POST /api/images/presigned
 * Generates a pre-signed S3 URL for direct client-side upload.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fileName, fileType, itemType, categoryName, itemId } = body

    if (!fileName || !fileType || !itemType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Sanitize inputs for path generation
    const categorySlug = categoryName ? slugifyCategory(categoryName) : 'others'
    const finalItemId = itemId ? itemId.toString() : 'temp'
    
    // Generate a unique key for S3
    const uuid = randomUUID()
    const ext = fileType.split('/')[1] || 'webp'
    const s3Key = `images/${itemType}/${categorySlug}/${finalItemId}/${uuid}.${ext}`

    const uploadUrl = await createPresignedUploadUrl(s3Key, fileType)

    return NextResponse.json({
      uploadUrl,
      s3Key,
      publicUrl: s3Key // Will be transformed via getImageUrl on the client if needed
    })

  } catch (error) {
    console.error('Presigned URL API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
