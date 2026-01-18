import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// AWS S3 Client Initialization
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-central-1', // Default to Frankfurt
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || ''
const CLOUDFRONT_URL = process.env.AWS_CLOUDFRONT_URL || ''

/**
 * Uploads a file buffer to AWS S3
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable', // Cache for 1 year (CloudFront optimization)
  })

  try {
    await s3Client.send(command)
    // Return the CloudFront URL if available, otherwise S3 URL (though S3 direct access is usually blocked)
    return key
  } catch (error) {
    console.error('S3 Upload Error:', error)
    throw new Error('Failed to upload image to storage')
  }
}

/**
 * Deletes a file from AWS S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  try {
    await s3Client.send(command)
  } catch (error) {
    console.error('S3 Delete Error:', error)
    // Don't throw here, just log. We don't want to break the whole flow if deletion fails.
  }
}

/**
 * Generates the full public URL for an image
 */
export function getImageUrl(key: string): string {
  if (!key) return ''
  if (key.startsWith('http')) return key // Already a full URL
  
  // Remove leading slash if present
  const cleanKey = key.startsWith('/') ? key.substring(1) : key

  if (CLOUDFRONT_URL) {
    // Ensure CLOUDFRONT_URL doesn't end with slash and key doesn't start with slash
    const baseUrl = CLOUDFRONT_URL.endsWith('/') ? CLOUDFRONT_URL.slice(0, -1) : CLOUDFRONT_URL
    return `${baseUrl}/${cleanKey}`
  }
  
  // Fallback (Not recommended for production, but useful for debug)
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${cleanKey}`
}
