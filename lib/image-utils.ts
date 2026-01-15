import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

// Type definitions for image management
export type ItemType = 'furnitures' | 'furniture-sets'
export type ImageExtension = 'jpg' | 'png' | 'webp'

export interface ImagePathInfo {
  diskDir: string
  fileName: string
  diskPath: string
  publicUrl: string
}

export interface ImageFileInfo {
  fileName: string
  sortOrder: number
  ext: string
}

/**
 * Converts category name to URL-friendly slug
 */
export function slugifyCategory(categoryName: string): string {
  return categoryName
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Builds image paths for furniture or furniture-sets with new simplified structure
 */
export function buildImagePaths({
  itemType,
  itemId,
  categorySlug,
  sortOrder,
  ext = 'jpg'
}: {
  itemType: ItemType
  itemId: number
  categorySlug: string
  sortOrder: number
  ext?: string
}): ImagePathInfo {
  const fileName = `image_${sortOrder}.${ext}`
  const diskDir = path.join(process.cwd(), 'public', 'uploads', 'images', itemType, categorySlug, itemId.toString())
  const diskPath = path.join(diskDir, fileName)
  const publicUrl = `/uploads/images/${itemType}/${categorySlug}/${itemId}/${fileName}`

  return {
    diskDir,
    fileName,
    diskPath,
    publicUrl
  }
}

/**
 * Ensures directory exists, creates if not
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
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
 * Writes image buffer to disk path
 */
export async function writeImage(buffer: Buffer, diskPath: string): Promise<void> {
  const dirPath = path.dirname(diskPath)
  await ensureDir(dirPath)
  await fs.writeFile(diskPath, buffer)
}

/**
 * Reads directory and returns image files info
 */
export async function readDirImages(diskDir: string): Promise<ImageFileInfo[]> {
  try {
    const files = await fs.readdir(diskDir)
    const imageFiles: ImageFileInfo[] = []
    
    for (const file of files) {
      const match = file.match(/^image_(\d+)\.(\w+)$/)
      if (match) {
        imageFiles.push({
          fileName: file,
          sortOrder: parseInt(match[1]),
          ext: match[2]
        })
      }
    }
    
    return imageFiles.sort((a, b) => a.sortOrder - b.sortOrder)
  } catch {
    return []
  }
}

/**
 * Process multiple image files for furniture or furniture-sets with new simplified system
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

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const sortOrder = i + 1

    // Validate file
    const validation = validateImage(file)
    if (!validation.isValid) {
      throw new Error(`File ${file.name}: ${validation.error}`)
    }

    // Get extension from file type
    const extension = extFromMime(file.type)
    
    // Build paths using new system
    const paths = buildImagePaths({
      itemType,
      itemId,
      categorySlug,
      sortOrder,
      ext: extension
    })

    // Save file using new method
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeImage(buffer, paths.diskPath)

    // Create image record in database with relative path for DB storage
    const relativePath = `uploads/images/${itemType}/${categorySlug}/${itemId}/${paths.fileName}`
    const imageRecord = await prisma.image.create({
      data: {
        fileName: paths.fileName,
        filePath: relativePath,
        altText: `Image ${sortOrder}`,
        description: null, // Could be determined with sharp library
        width: null,
        height: null,
        fileSize: file.size
      }
    })

    // Create furniture-image relationship
    if (itemType === 'furnitures') {
      await prisma.furnitureImage.create({
        data: {
          furnitureId: itemId,
          imageId: imageRecord.imageId,
          imageType: sortOrder === 1 ? 'main' : 'gallery', // Use sortOrder logic: image_1 = cover
          sortOrder: sortOrder,
          isActive: true
        }
      })
    } else if (itemType === 'furniture-sets') {
      await prisma.furnitureSetImage.create({
        data: {
          furnitureSetId: itemId,
          imageId: imageRecord.imageId,
          imageType: sortOrder === 1 ? 'main' : 'gallery', // Use sortOrder logic: image_1 = cover
          sortOrder: sortOrder,
          isActive: true
        }
      })
    }

    results.push({
      fileName: paths.fileName,
      sortOrder: sortOrder,
      publicUrl: paths.publicUrl,
      savedPath: paths.diskPath,
      fileSize: file.size
    })
  }

  return results
}

/**
 * Renumber existing images to maintain sequence based on DB sort order
 * Syncs physical file names with database sortOrder
 */
export async function renumberImages(
  diskDir: string,
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

    // 2. Create renaming plan
    // We need to map: DB Record -> Current Physical File -> Temp Name -> Final Name
    const renames: Array<{ 
      imageRecordId: number; // ID in join table (FurnitureImage or FurnitureSetImage)
      imageId: number;       // ID in Image table
      currentFilePath: string;
      tempFilePath: string;
      finalFileName: string;
      finalFilePath: string;
      newSortOrder: number;
      extension: string;
    }> = []

    for (let i = 0; i < dbImages.length; i++) {
      const record = dbImages[i]
      const image = record.image
      const newSortOrder = i + 1
      
      // Get extension from current file or default to jpg
      const ext = image.fileName.split('.').pop() || 'jpg'
      
      const currentFullPath = path.join(process.cwd(), 'public', image.filePath)
      const dirPath = path.dirname(currentFullPath)
      
      const tempFileName = `temp_${Date.now()}_${i}.${ext}`
      const tempFullPath = path.join(dirPath, tempFileName)
      
      const finalFileName = `image_${newSortOrder}.${ext}`
      const finalFullPath = path.join(dirPath, finalFileName)
      
      renames.push({
        imageRecordId: record.id,
        imageId: image.imageId,
        currentFilePath: currentFullPath,
        tempFilePath: tempFullPath,
        finalFileName: finalFileName,
        finalFilePath: finalFullPath,
        newSortOrder: newSortOrder,
        extension: ext
      })
    }

    // 3. Execute Phase 1: Rename all to temporary names
    for (const item of renames) {
      try {
        await fs.access(item.currentFilePath)
        await fs.rename(item.currentFilePath, item.tempFilePath)
      } catch (err) {
        console.warn(`File not found for renaming: ${item.currentFilePath}`)
        continue 
      }
    }

    // 4. Execute Phase 2: Rename temp to final names and update DB
    for (const item of renames) {
      try {
        await fs.access(item.tempFilePath)
        await fs.rename(item.tempFilePath, item.finalFilePath)

        const relativeDir = path.dirname(dbImages.find((img: any) => img.image.imageId === item.imageId).image.filePath)
        const finalRelativePath = `${relativeDir}/${item.finalFileName}`.replace(/\\/g, '/').replace(/^\//, '')

        await prisma.image.update({
          where: { imageId: item.imageId },
          data: {
            fileName: item.finalFileName,
            filePath: finalRelativePath,
            altText: `Image ${item.newSortOrder}`
          }
        })

        if (itemType === 'furnitures') {
          await prisma.furnitureImage.update({
            where: { id: item.imageRecordId },
            data: {
              sortOrder: item.newSortOrder,
              imageType: item.newSortOrder === 1 ? 'main' : 'gallery'
            }
          })
        } else {
          await prisma.furnitureSetImage.update({
            where: { id: item.imageRecordId },
            data: {
              sortOrder: item.newSortOrder,
              imageType: item.newSortOrder === 1 ? 'main' : 'gallery'
            }
          })
        }
      } catch (error) {
        console.error(`Error finalizing rename: ${item.tempFilePath} -> ${item.finalFilePath}`, error)
      }
    }
  } catch (error) {
    console.error('Error renumbering images:', error)
    throw error
  }
}

/**
 * Delete image by ID - handles both database and file deletion
 */
export async function deleteImage(
  imageId: number,
  itemType: ItemType = 'furnitures'
): Promise<boolean> {
  try {
    const image = await prisma.image.findUnique({
      where: { imageId: imageId }
    })

    if (!image) return false

    const filePath = path.join(process.cwd(), 'public', image.filePath)
    try {
      await fs.unlink(filePath)
    } catch (error) {
      console.warn(`⚠️ File deletion error: ${error}`)
    }

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
 * Check if path uses new structure
 */
export function isNewStructurePath(filePath: string): boolean {
  return filePath.includes('/uploads/images/furnitures/') || 
         filePath.includes('/uploads/images/furniture-sets/')
}

/**
 * Convert file path to public URL
 */
export function toPublicUrl(filePath: string): string {
  if (filePath.startsWith('/')) return filePath
  if (!filePath.startsWith('uploads/')) return `/uploads/${filePath}`
  return `/${filePath}`
}
