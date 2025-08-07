// lib/image-utils.ts - New Category-Based Image Management System
import path from 'path'

// Type definitions
export interface FilePathResult {
  directory: string;
  filePath: string;
  fileName: string;
  fullPath: string;
}

export interface ImageMetadata {
  itemType?: 'furniture' | 'furnitureSet';
  itemId?: number;
  categoryName?: string;
  itemName?: string;
  imageType?: 'main' | 'gallery' | 'thumbnail';
  sortOrder?: number;
  uploadedAt?: string;
  originalFileName?: string;
}

export interface ThumbnailConfig {
  width: number;
  height: number;
  quality: number;
}

// Thumbnail configurations
export const THUMBNAIL_CONFIGS: Record<string, ThumbnailConfig> = {
  main_thumb: { width: 500, height: 500, quality: 80 },
  gallery_thumb: { width: 400, height: 400, quality: 75 },
  small_thumb: { width: 250, height: 250, quality: 70 }
}

/**
 * Create URL-friendly slug from text
 */
export function createSlug(text: string): string {
  if (!text || typeof text !== 'string') return 'unknown'
  
  return text
    .toLowerCase()
    .trim()
    // Turkish characters
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    // Remove special characters except letters, numbers, spaces, and hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove multiple hyphens
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length
    .substring(0, 50)
}

/**
 * Generate category-based file path for furniture or furniture sets
 */
export function generateCategoryBasedPath(
  itemType: 'furniture' | 'furnitureSet',
  itemId: number,
  itemName: string,
  categoryName: string,
  imageType: 'main' | 'gallery' | 'thumbnail',
  originalFileName: string,
  sortOrder: number = 1
): FilePathResult {
  const extension = path.extname(originalFileName)
  const categorySlug = createSlug(categoryName)
  const itemSlug = createSlug(itemName)
  
  // Create item directory name: {id}_{name_slug}
  const itemDirName = `${itemId}_${itemSlug}`
  
  // Base path structure
  const basePath = itemType === 'furniture' 
    ? path.join('uploads', 'furniture', categorySlug, itemDirName)
    : path.join('uploads', 'furniture-sets', categorySlug, itemDirName)
  
  let fileName: string
  let subDirectory: string
  
  switch (imageType) {
    case 'main':
      fileName = `main${extension}`
      subDirectory = ''
      break
      
    case 'gallery':
      fileName = `${sortOrder}${extension}`
      subDirectory = 'gallery'
      break
      
    case 'thumbnail':
      // Determine thumbnail type based on sortOrder
      if (sortOrder === 0) {
        fileName = `main_thumb${extension}`
      } else {
        fileName = `${sortOrder}_thumb${extension}`
      }
      subDirectory = 'thumbnails'
      break
      
    default:
      fileName = `${sortOrder}${extension}`
      subDirectory = 'gallery'
  }
  
  const directory = subDirectory 
    ? path.join(basePath, subDirectory)
    : basePath
  
  const filePath = path.join(directory, fileName)
  
  return {
    directory,
    filePath,
    fileName,
    fullPath: path.resolve(filePath)
  }
}

/**
 * Generate thumbnail path from main image path
 */
export function generateThumbnailPath(
  mainImagePath: string,
  thumbnailType: 'main_thumb' | 'gallery_thumb' = 'main_thumb'
): FilePathResult {
  const parsedPath = path.parse(mainImagePath)
  const directory = parsedPath.dir.replace('/gallery', '/thumbnails')
  
  let thumbnailFileName: string
  if (thumbnailType === 'main_thumb') {
    thumbnailFileName = `main_thumb${parsedPath.ext}`
  } else {
    // For gallery images, use the original name with _thumb suffix
    thumbnailFileName = `${parsedPath.name}_thumb${parsedPath.ext}`
  }
  
  const filePath = path.join(directory, thumbnailFileName)
  
  return {
    directory,
    filePath,
    fileName: thumbnailFileName,
    fullPath: path.resolve(filePath)
  }
}

/**
 * Create comprehensive image metadata
 */
export function createImageMetadata(
  itemType: 'furniture' | 'furnitureSet',
  itemId: number,
  categoryName: string,
  itemName: string,
  imageType: 'main' | 'gallery' | 'thumbnail',
  originalFileName: string | null,
  sortOrder: number = 1
): string {
  const metadata: ImageMetadata = {
    itemType,
    itemId,
    categoryName,
    itemName,
    imageType,
    sortOrder,
    uploadedAt: new Date().toISOString(),
    originalFileName: originalFileName || 'unknown.jpg'
  }
  
  return JSON.stringify(metadata)
}

/**
 * Parse image metadata from description field
 */
export function parseImageMetadata(description: string | null): ImageMetadata | null {
  if (!description) return null
  
  try {
    const parsed = JSON.parse(description)
    
    // Validate required fields
    if (!parsed.itemType || !parsed.itemId || !parsed.imageType) {
      return null
    }
    
    // Validate itemType
    if (parsed.itemType !== 'furniture' && parsed.itemType !== 'furnitureSet') {
      return null
    }
    
    return parsed as ImageMetadata
  } catch {
    return null
  }
}

/**
 * Check if metadata is valid and complete
 */
export function isValidImageMetadata(metadata: ImageMetadata | null): metadata is ImageMetadata & {
  itemType: 'furniture' | 'furnitureSet';
  itemId: number;
  categoryName: string;
  itemName: string;
  imageType: 'main' | 'gallery' | 'thumbnail';
} {
  return !!(
    metadata &&
    metadata.itemType &&
    metadata.itemId &&
    metadata.categoryName &&
    metadata.itemName &&
    metadata.imageType &&
    (metadata.itemType === 'furniture' || metadata.itemType === 'furnitureSet') &&
    ['main', 'gallery', 'thumbnail'].includes(metadata.imageType)
  )
}

/**
 * Get image directory structure for item
 */
export function getImageDirectory(
  itemType: 'furniture' | 'furnitureSet',
  itemId: number,
  itemName: string,
  categoryName: string
): {
  baseDir: string;
  mainImageDir: string;
  galleryDir: string;
  thumbnailDir: string;
} {
  const categorySlug = createSlug(categoryName)
  const itemSlug = createSlug(itemName)
  const itemDirName = `${itemId}_${itemSlug}`
  
  const baseDir = itemType === 'furniture' 
    ? path.join('uploads', 'furniture', categorySlug, itemDirName)
    : path.join('uploads', 'furniture-sets', categorySlug, itemDirName)
  
  return {
    baseDir,
    mainImageDir: baseDir,
    galleryDir: path.join(baseDir, 'gallery'),
    thumbnailDir: path.join(baseDir, 'thumbnails')
  }
}

/**
 * Normalize file path - handle Windows/Unix separators
 */
export function normalizeFilePath(filePath: string): string {
  if (!filePath) return ''
  
  // Convert Windows separators to Unix
  let normalized = filePath.replace(/\\/g, '/')
  
  // Remove multiple slashes
  normalized = normalized.replace(/\/+/g, '/')
  
  // Remove leading slash if exists
  normalized = normalized.replace(/^\/+/, '')
  
  return normalized
}

/**
 * Get clean path without uploads prefix for URL generation
 */
export function getCleanPathForUrl(filePath: string): string {
  const normalized = normalizeFilePath(filePath)
  
  // Remove uploads prefix if exists
  if (normalized.startsWith('uploads/')) {
    return normalized.substring('uploads/'.length)
  }
  
  return normalized
}

/**
 * Generate image URL for serving
 */
export function getImageUrl(filePath: string): string {
  try {
    if (!filePath || typeof filePath !== 'string') return ''
    
    const cleanPath = getCleanPathForUrl(filePath)
    
    if (!cleanPath) return ''
    
    // Ensure proper URL encoding for special characters
    const encodedPath = cleanPath
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/')
    
    return `/api/images/serve/${encodedPath}`
  } catch (error) {
    console.warn('Error generating image URL:', error)
    return ''
  }
}

/**
 * Get image URL with fallback
 */
export function getImageUrlWithFallback(
  filePath: string, 
  fallbackUrl: string = '/images/placeholder.jpg'
): string {
  if (!filePath) return fallbackUrl
  
  const imageUrl = getImageUrl(filePath)
  return imageUrl || fallbackUrl
}

/**
 * Parse path to extract item information
 */
export function parseImagePath(filePath: string): {
  itemType: 'furniture' | 'furnitureSet' | null;
  categoryName: string | null;
  itemId: number | null;
  itemName: string | null;
  imageType: 'main' | 'gallery' | 'thumbnail' | null;
  sortOrder: number | null;
} {
  const normalized = normalizeFilePath(filePath)
  const parts = normalized.split('/')
  
  // Expected structure: uploads/furniture/category/id_name/[gallery|thumbnails]/filename
  // or: uploads/furniture-sets/category/id_name/[gallery|thumbnails]/filename
  
  if (parts.length < 4) {
    return {
      itemType: null,
      categoryName: null,
      itemId: null,
      itemName: null,
      imageType: null,
      sortOrder: null
    }
  }
  
  const itemType = parts[1] === 'furniture' ? 'furniture' : 
                  parts[1] === 'furniture-sets' ? 'furnitureSet' : null
  
  const categoryName = parts[2]
  const itemDirName = parts[3]
  
  // Parse item directory name: {id}_{name_slug}
  const itemDirMatch = itemDirName.match(/^(\d+)_(.+)$/)
  const itemId = itemDirMatch ? parseInt(itemDirMatch[1]) : null
  const itemName = itemDirMatch ? itemDirMatch[2] : null
  
  // Determine image type and sort order
  let imageType: 'main' | 'gallery' | 'thumbnail' | null = null
  let sortOrder: number | null = null
  
  if (parts.length === 5) {
    // Has subdirectory (gallery or thumbnails)
    const subDir = parts[4]
    const fileName = parts[5] || ''
    
    if (subDir === 'gallery') {
      imageType = 'gallery'
      const orderMatch = fileName.match(/^(\d+)\./)
      sortOrder = orderMatch ? parseInt(orderMatch[1]) : 1
    } else if (subDir === 'thumbnails') {
      imageType = 'thumbnail'
      if (fileName.startsWith('main_thumb')) {
        sortOrder = 0
      } else {
        const orderMatch = fileName.match(/^(\d+)_thumb\./)
        sortOrder = orderMatch ? parseInt(orderMatch[1]) : 1
      }
    }
  } else if (parts.length === 4) {
    // Main image (no subdirectory)
    const fileName = parts[4] || ''
    if (fileName.startsWith('main.')) {
      imageType = 'main'
      sortOrder = 0
    }
  }
  
  return {
    itemType,
    categoryName,
    itemId,
    itemName,
    imageType,
    sortOrder
  }
}

/**
 * Format file size for human reading
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get image resolution string
 */
export function getImageResolution(width: number | null, height: number | null): string {
  if (!width || !height) return 'Bilinmiyor'
  return `${width} × ${height} px`
}

/**
 * Calculate aspect ratio
 */
export function getAspectRatio(width: number | null, height: number | null): number | null {
  if (!width || !height) return null
  return Math.round((width / height) * 100) / 100
}

/**
 * Get image type from extension
 */
export function getImageTypeFromExtension(fileName: string): string {
  if (!fileName) return 'unknown'
  
  const ext = path.extname(fileName).toLowerCase().substring(1)
  const imageTypes: Record<string, string> = {
    jpg: 'jpeg',
    jpeg: 'jpeg',
    png: 'png',
    gif: 'gif',
    webp: 'webp',
    svg: 'svg',
    bmp: 'bmp',
    ico: 'icon'
  }
  
  return imageTypes[ext] || ext || 'unknown'
}

/**
 * Check if file extension is supported image type
 */
export function isSupportedImageType(fileName: string): boolean {
  const supportedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
  const ext = path.extname(fileName).toLowerCase().substring(1)
  return supportedTypes.includes(ext)
}

/**
 * Validate item type
 */
export function validateItemType(itemType: string): itemType is 'furniture' | 'furnitureSet' {
  return itemType === 'furniture' || itemType === 'furnitureSet'
}

/**
 * Ensure directory exists helper
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  const fs = await import('fs/promises')
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

/**
 * Save physical file helper
 */
export async function savePhysicalFile(filePath: string, fileBuffer: Buffer): Promise<void> {
  const fs = await import('fs/promises')
  const directory = path.dirname(filePath)
  await ensureDirectoryExists(directory)
  await fs.writeFile(filePath, fileBuffer)
}

/**
 * Delete physical file helper
 */
export async function deletePhysicalFile(filePath: string): Promise<void> {
  const fs = await import('fs/promises')
  try {
    await fs.unlink(filePath)
    
    // Try to remove empty directories
    const directory = path.dirname(filePath)
    try {
      const files = await fs.readdir(directory)
      if (files.length === 0) {
        await fs.rmdir(directory)
        
        // Try to remove parent directory if empty
        const parentDir = path.dirname(directory)
        try {
          const parentFiles = await fs.readdir(parentDir)
          if (parentFiles.length === 0) {
            await fs.rmdir(parentDir)
          }
        } catch {}
      }
    } catch {}
  } catch (error) {
    console.warn(`Could not delete file ${filePath}:`, error)
  }
}

/**
 * Generate possible legacy paths for backward compatibility
 */
export function generateLegacyPaths(normalizedPath: string): string[] {
  const pathsToTry: string[] = []
  
  // Original path
  pathsToTry.push(normalizedPath)
  
  // Legacy furniture paths
  if (normalizedPath.includes('furniture/')) {
    pathsToTry.push(normalizedPath.replace('furniture/', 'furniture/'))
  }
  
  // Legacy furniture set paths
  if (normalizedPath.includes('furniture-sets/')) {
    pathsToTry.push(normalizedPath.replace('furniture-sets/', 'furnituresets/'))
  }
  
  // Add uploads prefix variations
  if (!normalizedPath.startsWith('uploads/')) {
    pathsToTry.push(path.join('uploads', normalizedPath))
  }
  
  return [...new Set(pathsToTry)]
}

/**
 * Check if path follows new structure
 */
export function isNewStructurePath(filePath: string): boolean {
  const normalized = normalizeFilePath(filePath)
  
  // Check if it follows the new structure pattern
  const newStructurePattern = /^uploads\/(furniture|furniture-sets)\/[^\/]+\/\d+_[^\/]+\/(main\.|gallery\/\d+\.|thumbnails\/.*_thumb\.)/
  
  return newStructurePattern.test(normalized)
}

/**
 * Migration helper: convert old path to new path
 */
export function convertLegacyPathToNew(
  oldPath: string,
  itemType: 'furniture' | 'furnitureSet',
  itemId: number,
  itemName: string,
  categoryName: string,
  imageType: 'main' | 'gallery' | 'thumbnail',
  sortOrder: number = 1
): FilePathResult {
  const extension = path.extname(oldPath)
  const originalFileName = path.basename(oldPath)
  
  return generateCategoryBasedPath(
    itemType,
    itemId,
    itemName,
    categoryName,
    imageType,
    originalFileName,
    sortOrder
  )
}
export function convertImageType(dbImageType: string): 'main' | 'gallery' | 'thumbnail' {
  switch (dbImageType) {
    case 'main_image':
    case 'main':
      return 'main'
    case 'gallery':
      return 'gallery'
    case 'thumbnail':
      return 'thumbnail'
    default:
      console.warn(`Unknown image type: ${dbImageType}, defaulting to 'gallery'`)
      return 'gallery'
  }
}
