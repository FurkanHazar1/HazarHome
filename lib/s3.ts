import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// AWS S3 Client Initialization
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME || process.env.AWS_BUCKET_NAME || ''
const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL || process.env.AWS_CLOUDFRONT_URL || ''
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || 'us-east-1'

/**
 * Uploads a file buffer to AWS S3 (Server-side)
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
    CacheControl: 'public, max-age=31536000, immutable',
  })

  try {
    await s3Client.send(command)
    return key
  } catch (error) {
    console.error('S3 Upload Error:', error)
    throw new Error('Failed to upload image to storage')
  }
}

/**
 * Generates a pre-signed URL for direct upload from the client (Client-side bypass)
 */
export async function createPresignedUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  })

  try {
    // URL expires in 1 hour
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 })
  } catch (error) {
    console.error('S3 Presigned URL Error:', error)
    throw new Error('Failed to generate upload ticket')
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
  }
}

/**
 * Generates the full public URL for an image
 */
export function getImageUrl(key: string): string {
  if (!key) return ''
  
  // If it's already a full URL, return it
  if (key.startsWith('http')) return key
  
  // If it starts with a slash, it's a LOCAL static asset in the public folder
  if (key.startsWith('/')) return key

  // Otherwise, it's an S3 object key
  if (CLOUDFRONT_URL) {
    const baseUrl = CLOUDFRONT_URL.endsWith('/') ? CLOUDFRONT_URL.slice(0, -1) : CLOUDFRONT_URL
    return `${baseUrl}/${key}`
  }
  
  if (!BUCKET_NAME) {
    return `/${key}` 
  }

  return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`
}