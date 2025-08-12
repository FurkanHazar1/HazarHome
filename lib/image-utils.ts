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
        description: null,
        width: null, // Could be determined with sharp library
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
 * Renumber existing images to maintain sequence (both DB and disk files)
 * Prevents conflicts by using temporary naming strategy
 */
export async function renumberImages(
  diskDir: string,
  itemId: number,
  itemType: ItemType = 'furnitures'
): Promise<void> {
  try {
    // Read current disk images
    const currentImages = await readDirImages(diskDir)
    if (currentImages.length === 0) return

    // Step 1: Rename all files to temporary names to avoid conflicts
    const tempMappings: Array<{original: string, temp: string, final: string, sortOrder: number}> = []
    
    for (let i = 0; i < currentImages.length; i++) {
      const currentImage = currentImages[i]
      const newSortOrder = i + 1
      const tempFileName = `temp_${Date.now()}_${i}.${currentImage.ext}`
      const finalFileName = `image_${newSortOrder}.${currentImage.ext}`
      
      tempMappings.push({
        original: currentImage.fileName,
        temp: tempFileName,
        final: finalFileName,
        sortOrder: newSortOrder
      })
    }

    // Step 2: Rename all to temp names first
    for (const mapping of tempMappings) {
      const originalPath = path.join(diskDir, mapping.original)
      const tempPath = path.join(diskDir, mapping.temp)
      
      try {
        await fs.rename(originalPath, tempPath)
      } catch (error) {
        console.warn(`Failed to rename ${mapping.original} to temp:`, error)
      }
    }

    // Step 3: Rename temp files to final names
    for (const mapping of tempMappings) {
      const tempPath = path.join(diskDir, mapping.temp)
      const finalPath = path.join(diskDir, mapping.final)
      
      try {
        await fs.rename(tempPath, finalPath)
      } catch (error) {
        console.warn(`Failed to rename temp to ${mapping.final}:`, error)
      }
    }

    // Step 4: Update database records
    if (itemType === 'furnitures') {
      const furnitureImages = await prisma.furnitureImage.findMany({
        where: { furnitureId: itemId, isActive: true },
        include: { image: true },
        orderBy: { sortOrder: 'asc' }
      })

      for (let i = 0; i < furnitureImages.length; i++) {
        const newSortOrder = i + 1
        const furnitureImage = furnitureImages[i]
        const mapping = tempMappings[i]

        if (mapping) {
          const newRelativePath = furnitureImage.image.filePath.replace(
            /image_\d+\.\w+$/,
            mapping.final
          )

          // Update sortOrder and imageType
          await prisma.furnitureImage.update({
            where: { id: furnitureImage.id },
            data: { 
              sortOrder: newSortOrder,
              imageType: newSortOrder === 1 ? 'main' : 'gallery'
            }
          })

          // Update image filePath if needed
          await prisma.image.update({
            where: { imageId: furnitureImage.imageId },
            data: {
              fileName: mapping.final,
              filePath: newRelativePath
            }
          })
        }
      }
    } else if (itemType === 'furniture-sets') {
      const furnitureSetImages = await prisma.furnitureSetImage.findMany({
        where: { furnitureSetId: itemId, isActive: true },
        include: { image: true },
        orderBy: { sortOrder: 'asc' }
      })

      for (let i = 0; i < furnitureSetImages.length; i++) {
        const newSortOrder = i + 1
        const furnitureSetImage = furnitureSetImages[i]
        const mapping = tempMappings[i]

        if (mapping) {
          const newRelativePath = furnitureSetImage.image.filePath.replace(
            /image_\d+\.\w+$/,
            mapping.final
          )

          // Update sortOrder and imageType
          await prisma.furnitureSetImage.update({
            where: { id: furnitureSetImage.id },
            data: { 
              sortOrder: newSortOrder,
              imageType: newSortOrder === 1 ? 'main' : 'gallery'
            }
          })

          // Update image filePath if needed
          await prisma.image.update({
            where: { imageId: furnitureSetImage.imageId },
            data: {
              fileName: mapping.final,
              filePath: newRelativePath
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
 * Delete image file and database records with new system
 */
/**
 * Delete image by ID - handles both database and file deletion
 */
export async function deleteImage(
  imageId: number,
  itemType: ItemType = 'furnitures'
): Promise<boolean> {
  try {
    console.log(`🗑️ Deleting image ID: ${imageId} for ${itemType}`)
    
    // First get the image record to find file path
    const image = await prisma.image.findUnique({
      where: { imageId: imageId }
    })

    if (!image) {
      console.warn(`❌ Image ${imageId} not found in database`)
      return false
    }

    // Delete physical file
    const filePath = path.join(process.cwd(), 'public', image.filePath)
    try {
      await fs.unlink(filePath)
      console.log(`✅ Physical file deleted: ${filePath}`)
    } catch (error) {
      console.warn(`⚠️ File deletion error (file might not exist): ${error}`)
    }

    // Delete from database - Prisma will handle cascading due to onDelete: Cascade
    await prisma.image.delete({
      where: { imageId: imageId }
    })
    
    console.log(`✅ Image ${imageId} deleted from database`)
    return true
    
  } catch (error) {
    console.error(`❌ Error deleting image ${imageId}:`, error)
    return false
  }
}

/**
 * Recursively delete directory and all contents
 */
export async function deleteDirRecursive(dirPath: string): Promise<void> {
  try {
    const stat = await fs.stat(dirPath)
    if (!stat.isDirectory()) {
      await fs.unlink(dirPath)
      return
    }

    const files = await fs.readdir(dirPath)
    await Promise.all(
      files.map(file => deleteDirRecursive(path.join(dirPath, file)))
    )
    await fs.rmdir(dirPath)
  } catch (error) {
    // Directory might not exist, which is fine
    console.warn('Directory deletion warning:', error)
  }
}

/**
 * Move directory from old location to new location (for category changes)
 */
export async function moveDir(oldDir: string, newDir: string): Promise<void> {
  try {
    // Ensure new directory parent exists
    await ensureDir(path.dirname(newDir))
    
    // Move directory
    await fs.rename(oldDir, newDir)
  } catch (error) {
    console.error('Directory move error:', error)
    throw error
  }
}

/**
 * Convert image type from old system to new system
 */
export function convertImageType(oldType: string): string {
  switch (oldType.toLowerCase()) {
    case 'main_image':
    case 'main':
    case 'cover':
      return 'main'
    case 'gallery_image':
    case 'gallery':
      return 'gallery'
    case 'thumbnail':
      return 'thumbnail'
    default:
      return 'gallery'
  }
}

/**
 * Normalize file path for cross-platform compatibility
 */
export function normalizeFilePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/\/+/g, '/')
}

/**
 * Generate legacy paths for backward compatibility
 */
export function generateLegacyPaths(categoryName: string, itemId: number, itemName: string): string[] {
  const normalizedName = itemName.toLowerCase().replace(/\s+/g, '-')
  const categorySlug = slugifyCategory(categoryName)
  
  return [
    `uploads/furniture/${categorySlug}/${itemId}_${normalizedName}`,
    `uploads/furniture/${categoryName.toLowerCase()}/${itemId}_${normalizedName}`,
    `uploads/furniture/${normalizedName}`
  ]
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
  // If already starts with /, return as is
  if (filePath.startsWith('/')) {
    return filePath
  }
  
  // If doesn't start with uploads/, add it
  if (!filePath.startsWith('uploads/')) {
    return `/uploads/${filePath}`
  }
  
  // Add leading slash
  return `/${filePath}`
}
