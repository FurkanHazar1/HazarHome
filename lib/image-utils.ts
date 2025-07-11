// lib/image-utils.ts
export function getImageUrl(filePath: string): string {
  if (!filePath) return ''
  
  // Remove 'uploads/' prefix if exists
  const cleanPath = filePath.replace(/^uploads\//, '')
  
  return `/api/images/serve/${cleanPath}`
}

export function getImageUrlWithFallback(filePath: string, fallbackUrl?: string): string {
  if (!filePath) return fallbackUrl || ''
  
  return getImageUrl(filePath)
}