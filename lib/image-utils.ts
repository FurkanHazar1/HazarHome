// lib/image-utils.ts - Fixed Version
import path from 'path'

/**
 * Normalize file path - handle Windows/Unix separators and multiple uploads prefixes
 */
export function normalizeFilePath(filePath: string): string {
  if (!filePath) return ''
  
  // Convert Windows separators to Unix
  let normalized = filePath.replace(/\\/g, '/')
  
  // Remove multiple slashes
  normalized = normalized.replace(/\/+/g, '/')
  
  // Remove leading slash if exists
  normalized = normalized.replace(/^\/+/, '')
  
  // Handle multiple uploads prefixes (uploads/uploads/... -> uploads/...)
  while (normalized.startsWith('uploads/uploads/')) {
    normalized = normalized.replace(/^uploads\//, '')
  }
  
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
export function getImageUrlWithFallback(filePath: string, fallbackUrl: string = '/images/placeholder.jpg'): string {
  if (!filePath) return fallbackUrl
  
  const imageUrl = getImageUrl(filePath)
  return imageUrl || fallbackUrl
}

/**
 * Validate if file path is properly formatted
 */
export function validateFilePath(filePath: string): {
  isValid: boolean
  normalized: string
  errors: string[]
} {
  const errors: string[] = []
  
  if (!filePath || typeof filePath !== 'string') {
    errors.push('File path is required and must be a string')
    return { isValid: false, normalized: '', errors }
  }
  
  let normalized = normalizeFilePath(filePath)
  
  // Check for directory traversal attempts
  if (normalized.includes('../') || normalized.includes('..\\')) {
    errors.push('Directory traversal not allowed')
  }
  
  // Check for invalid characters (improved regex)
  const invalidChars = /[<>:"|?*\x00-\x1f]/
  if (invalidChars.test(normalized)) {
    errors.push('Invalid characters in file path')
  }
  
  // Check for very long paths
  if (normalized.length > 500) {
    errors.push('File path too long (max 500 characters)')
  }
  
  // Ensure uploads prefix exists
  if (!normalized.startsWith('uploads/')) {
    normalized = `uploads/${normalized}`
  }
  
  return {
    isValid: errors.length === 0,
    normalized,
    errors
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
 * Generate thumbnail URL (for future use)
 */
export function getThumbnailUrl(filePath: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
  const baseUrl = getImageUrl(filePath)
  if (!baseUrl) return ''
  
  return `${baseUrl}?thumb=${size}`
}

/**
 * Generate responsive image srcSet
 */
export function getImageSrcSet(filePath: string): string {
  if (!filePath) return ''
  
  const baseUrl = getImageUrl(filePath)
  if (!baseUrl) return ''
  
  // Future: implement different sizes
  return baseUrl
}

// Type definitions for better TypeScript support
export interface ImageInfo {
  url: string
  thumbnailUrl: string
  srcSet: string
  fileName: string
  fileSize: string
  resolution: string
  aspectRatio: number | null
  type: string
}

/**
 * Get comprehensive image info
 */
export function getImageInfo(imageData: {
  filePath?: string
  fileName?: string
  fileSize?: number | null
  width?: number | null
  height?: number | null
}): ImageInfo {
  const { filePath = '', fileName = '', fileSize, width, height } = imageData
  
  // Convert undefined to null for consistency
  const normalizedWidth = width ?? null
  const normalizedHeight = height ?? null
  
  return {
    url: getImageUrl(filePath),
    thumbnailUrl: getThumbnailUrl(filePath),
    srcSet: getImageSrcSet(filePath),
    fileName,
    fileSize: formatFileSize(fileSize),
    resolution: getImageResolution(normalizedWidth, normalizedHeight),
    aspectRatio: getAspectRatio(normalizedWidth, normalizedHeight),
    type: getImageTypeFromExtension(fileName)
  }
}