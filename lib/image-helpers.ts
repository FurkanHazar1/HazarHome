// lib/image-helpers.ts - Client-safe image utilities
import { getImageUrl } from './s3'

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
 * Convert file path to public URL (S3/CloudFront)
 */
export function toPublicUrl(filePath: string): string {
  if (!filePath) return ''
  return getImageUrl(filePath)
}
