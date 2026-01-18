import { prisma } from '@/lib/prisma'
import { uploadToS3, deleteFromS3, getImageUrl } from './s3'
import sharp from 'sharp'
import { randomUUID } from 'crypto'

// Re-export client-safe helpers
export { slugifyCategory, toPublicUrl } from './image-helpers'

// Type definitions for image management
export type ItemType = 'furnitures' | 'furniture-sets'
export type ImageExtension = 'jpg' | 'png' | 'webp'

export interface ImageFileInfo {
  fileName: string
  sortOrder: number
  ext: string
}

/**
 * Validates image file
 */
export function validateImage(file: File): { isValid: boolean; error?: string } {
  // Check file size (max 20MB as per requirements)
  if (file.size > 20 * 1024 * 1024) {
    return { isValid: false, error: 'File size cannot exceed 20MB' }
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Only JPEG, PNG and WebP files are allowed' }
  }

  return { isValid: true }
}

/**
 * Get file extension from MIME type
 */
export function extFromMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return 'jpg'
  }
}

/**
 * Process multiple image files for furniture or furniture-sets with S3 and Sharp optimization
 */
export async function processImageFiles(
  files: File[],
  itemId: number,
  categorySlug: string,
  itemType: ItemType = 'furnitures'
): Promise<Array<{ 
  fileName: string
  sortOrder: number
  publicUrl: string
  savedPath: string
  fileSize: number
}>> {
  const results = []

  // Get current max sort order to append new images
  let currentMaxSortOrder = 0
  if (itemType === 'furnitures') {
    const lastImg = await prisma.furnitureImage.findFirst({
      where: { furnitureId: itemId },
      orderBy: { sortOrder: 'desc' }
    })
    currentMaxSortOrder = lastImg?.sortOrder || 0
  } else {
    const lastImg = await prisma.furnitureSetImage.findFirst({
      where: { furnitureSetId: itemId },
      orderBy: { sortOrder: 'desc' }
    })
    currentMaxSortOrder = lastImg?.sortOrder || 0
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const sortOrder = currentMaxSortOrder + i + 1

    // Validate file
    const validation = validateImage(file)
    if (!validation.isValid) {
      throw new Error(`File ${file.name}: ${validation.error}`)
    }

    try {
      // 1. Optimize image with Sharp
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      
      const optimizedBuffer = await sharp(fileBuffer)
        .resize(1920, 1920, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .webp({ quality: 80 })
        .toBuffer()

      // 2. Generate S3 Key
      // Structure: images/furnitures/slug/id/uuid.webp
      const uuid = randomUUID()
      const fileName = `${uuid}.webp`
      const s3Key = `images/${itemType}/${categorySlug}/${itemId}/${fileName}`

      // 3. Upload to S3
      await uploadToS3(optimizedBuffer, s3Key, 'image/webp')

      // 4. Create Database Record
      // We store the S3 Key in filePath
      const imageRecord = await prisma.image.create({
        data: {
          fileName: fileName,
          filePath: s3Key,
          altText: `Image ${sortOrder}`,
          description: null,
          width: null, 
          height: null,
          fileSize: optimizedBuffer.length,
          fileType: 'webp'
        }
      })

      // 5. Create Relation
      if (itemType === 'furnitures') {
        await prisma.furnitureImage.create({
          data: {
            furnitureId: itemId,
            imageId: imageRecord.imageId,
            imageType: sortOrder === 1 ? 'main_image' : 'gallery',
            sortOrder: sortOrder,
            isActive: true
          }
        })
      } else if (itemType === 'furniture-sets') {
        await prisma.furnitureSetImage.create({
          data: {
            furnitureSetId: itemId,
            imageId: imageRecord.imageId,
            imageType: sortOrder === 1 ? 'main_image' : 'gallery',
            sortOrder: sortOrder,
            isActive: true
          }
        })
      }

      results.push({
        fileName: fileName,
        sortOrder: sortOrder,
        publicUrl: getImageUrl(s3Key),
        savedPath: s3Key,
        fileSize: optimizedBuffer.length
      })

    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error)
      throw error
    }
  }

  return results
}

/**
 * Renumber existing images to maintain sequence based on DB sort order
 * S3 Implementation: Only updates DB sort orders, does NOT rename files.
 */
export async function renumberImages(
  diskDir: string, // Unused in S3 version, kept for signature compatibility
  itemId: number,
  itemType: ItemType = 'furnitures'
): Promise<void> {
  try {
    // 1. Fetch images from database in correct order
    let dbImages: any[] = []
    
    if (itemType === 'furnitures') {
      dbImages = await prisma.furnitureImage.findMany({
        where: { furnitureId: itemId, isActive: true },
        include: { image: true },
        orderBy: { sortOrder: 'asc' }
      })
    } else if (itemType === 'furniture-sets') {
      dbImages = await prisma.furnitureSetImage.findMany({
        where: { furnitureSetId: itemId, isActive: true },
        include: { image: true },
        orderBy: { sortOrder: 'asc' }
      })
    }

    if (dbImages.length === 0) return

    // 2. Update sortOrder in DB
    for (let i = 0; i < dbImages.length; i++) {
      const record = dbImages[i]
      const newSortOrder = i + 1
      
      // Only update if changed
      if (record.sortOrder !== newSortOrder) {
        if (itemType === 'furnitures') {
          await prisma.furnitureImage.update({
            where: { id: record.id },
            data: {
              sortOrder: newSortOrder,
              imageType: newSortOrder === 1 ? 'main_image' : 'gallery'
            }
          })
        } else {
          await prisma.furnitureSetImage.update({
            where: { id: record.id },
            data: {
              sortOrder: newSortOrder,
              imageType: newSortOrder === 1 ? 'main_image' : 'gallery'
            }
          })
        }
      }
    }
  } catch (error) {
    console.error('Error renumbering images:', error)
    throw error
  }
}

/**
 * Delete image by ID - handles both database and S3 deletion
 */
export async function deleteImage(
  imageId: number,
  itemType: ItemType = 'furnitures' // Unused but kept for signature
): Promise<boolean> {
  try {
    const image = await prisma.image.findUnique({
      where: { imageId: imageId }
    })

    if (!image) return false

    // Delete from S3
    if (image.filePath) {
      await deleteFromS3(image.filePath)
    }

    // Delete from DB
    await prisma.image.delete({
      where: { imageId: imageId }
    })
    
    return true
  } catch (error) {
    console.error(`❌ Error deleting image ${imageId}:`, error)
    return false
  }
}

/**
 * Uploads and optimizes a single image to S3 (Server-side)
 */
export async function uploadSingleImage(
  file: File,
  folder: string = 'others'
): Promise<{ key: string; publicUrl: string; fileName: string }> {
  const validation = validateImage(file)
  if (!validation.isValid) {
    throw new Error(validation.error)
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer())
  
  const optimizedBuffer = await sharp(fileBuffer)
    .resize(2560, 1440, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .webp({ quality: 85 })
    .toBuffer()

  const uuid = randomUUID()
  const fileName = `${uuid}.webp`
  const s3Key = `images/${folder}/${fileName}`

  await uploadToS3(optimizedBuffer, s3Key, 'image/webp')

  return {
    key: s3Key,
    publicUrl: getImageUrl(s3Key),
    fileName: fileName
  }
}

/**
 * Check if path uses new structure (Legacy check, can be kept)
 */
export function isNewStructurePath(filePath: string): boolean {
  return filePath.includes('images/') 
}