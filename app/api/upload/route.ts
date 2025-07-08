// app/api/upload/route.ts - Next.js 15+ Compatible Upload API (Updated)
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import sharp from 'sharp'
import { prisma } from '@/lib/prisma'

// TypeScript interfaces for Next.js 15+
interface UploadedFile {
  imageId: number
  fileName: string
  originalFileName: string
  filePath: string
  webPath: string
  fileSize: number
  fileType: string
  width: number
  height: number
  optimized: boolean
}

interface ImageListItem {
  imageId: number
  fileName: string
  originalFileName?: string
  webPath: string
  fileSize?: number
  fileType?: string
  width?: number
  height?: number
  description?: string
  altText?: string
  sortOrder: number
  imageType: string
}

// Response types with proper union types for Next.js 15+
type UploadSuccessResponse = {
  success: true
  message: string
  data: UploadedFile[]
}

type UploadErrorResponse = {
  success: false
  error: string
  details?: string
}

type UploadResponse = UploadSuccessResponse | UploadErrorResponse

type GetSuccessResponse = {
  success: true
  data: ImageListItem[]
}

type GetErrorResponse = {
  success: false
  error: string
  details?: string
}

type GetResponse = GetSuccessResponse | GetErrorResponse

type DeleteSuccessResponse = {
  success: true
  message: string
  fileDeleted?: boolean
  filePath?: string
}

type DeleteErrorResponse = {
  success: false
  error: string
  usage?: {
    furnitureUsage: number
    furnitureSetUsage: number
    totalUsage: number
  }
  message?: string
  details?: string
}

type DeleteResponse = DeleteSuccessResponse | DeleteErrorResponse

type UpdateSuccessResponse = {
  success: true
  message: string
  data: any
}

type UpdateErrorResponse = {
  success: false
  error: string
  validationErrors?: string[]
  details?: string
}

type UpdateResponse = UpdateSuccessResponse | UpdateErrorResponse

type BulkSuccessResponse = {
  success: true
  message: string
  deletedCount?: number
  updatedCount?: number
  physicalDeletion?: {
    deleted: number
    failed: number
    failedFiles: string[]
  }
}

type BulkErrorResponse = {
  success: false
  error: string
  details?: string
}

type BulkResponse = BulkSuccessResponse | BulkErrorResponse

// Constants
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// Helper Functions
const createFolderStructure = async (furnitureId: number): Promise<{ folderPath: string; webFolderPath: string }> => {
  // Use furnitureId instead of names for consistent folder structure
  const folderPath = path.join(process.cwd(), 'public', 'uploads', 'furniture', `furniture_${furnitureId}`)
  const webFolderPath = `/uploads/furniture/furniture_${furnitureId}`
  
  try {
    if (!existsSync(folderPath)) {
      await mkdir(folderPath, { recursive: true })
    }
    return { folderPath, webFolderPath }
  } catch (error) {
    console.error('Folder creation error:', error)
    throw new Error('Klasör oluşturulamadı')
  }
}

const optimizeImage = async (buffer: Buffer, filename: string): Promise<{ buffer: Buffer; width: number; height: number }> => {
  try {
    const image = sharp(buffer)
    const metadata = await image.metadata()
    
    let processedImage = image
    
    // Resize if too large
    if (metadata.width && metadata.width > 1920) {
      processedImage = processedImage.resize(1920, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
    }
    
    // Optimize based on format
    if (filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) {
      processedImage = processedImage.jpeg({ quality: 85, progressive: true })
    } else if (filename.toLowerCase().endsWith('.png')) {
      processedImage = processedImage.png({ quality: 85, compressionLevel: 6 })
    }
    
    const optimizedBuffer = await processedImage.toBuffer()
    const optimizedMetadata = await sharp(optimizedBuffer).metadata()
    
    return {
      buffer: optimizedBuffer,
      width: optimizedMetadata.width || 0,
      height: optimizedMetadata.height || 0
    }
  } catch (error) {
    console.error('Image optimization error:', error)
    const metadata = await sharp(buffer).metadata()
    return {
      buffer,
      width: metadata.width || 0,
      height: metadata.height || 0
    }
  }
}

const generateFileName = (imageId: number, originalFileName: string): string => {
  const ext = path.extname(originalFileName)
  const timestamp = Date.now()
  return `img_${imageId}_${timestamp}${ext}`
}

const deletePhysicalFile = async (filePath: string): Promise<boolean> => {
  try {
    // Convert relative web path to absolute file path if needed
    let absoluteFilePath = filePath
    
    // If it's a web path (starts with /uploads), convert to absolute path
    if (filePath.startsWith('/uploads')) {
      absoluteFilePath = path.join(process.cwd(), 'public', filePath)
    }
    
    console.log(`Attempting to delete file: ${absoluteFilePath}`)
    
    if (!existsSync(absoluteFilePath)) {
      console.warn(`Dosya bulunamadı: ${absoluteFilePath}`)
      return false
    }

    // Security check - only delete files in uploads folder
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    const normalizedFilePath = path.normalize(absoluteFilePath)
    const normalizedUploadDir = path.normalize(uploadDir)
    
    if (!normalizedFilePath.startsWith(normalizedUploadDir)) {
      console.error(`Security error: File outside uploads folder: ${absoluteFilePath}`)
      return false
    }

    await unlink(absoluteFilePath)
    console.log(`File successfully deleted: ${absoluteFilePath}`)
    return true
    
  } catch (error) {
    console.error(`File deletion error: ${filePath}`, error)
    return false
  }
}

// POST - Upload new images
export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    const formData = await request.formData()
    
    // Get metadata - now require furnitureId instead of names
    const furnitureId = formData.get('furnitureId') as string
    const description = formData.get('description') as string || null
    const altText = formData.get('altText') as string || null
    
    if (!furnitureId || isNaN(parseInt(furnitureId))) {
      return NextResponse.json({
        success: false,
        error: 'Geçerli bir furniture ID gerekli'
      } satisfies UploadErrorResponse, { status: 400 })
    }
    
    const parsedFurnitureId = parseInt(furnitureId)
    
    // Verify furniture exists
    const furniture = await prisma.furniture.findUnique({
      where: { furnitureId: parsedFurnitureId }
    })
    
    if (!furniture) {
      return NextResponse.json({
        success: false,
        error: 'Mobilya bulunamadı'
      } satisfies UploadErrorResponse, { status: 404 })
    }
    
    // Get files
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Hiç dosya seçilmedi'
      } satisfies UploadErrorResponse, { status: 400 })
    }
    
    if (files.length > 10) {
      return NextResponse.json({
        success: false,
        error: 'Maksimum 10 dosya yüklenebilir'
      } satisfies UploadErrorResponse, { status: 400 })
    }
    
    // Validate files
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type as any)) {
        return NextResponse.json({
          success: false,
          error: `Desteklenmeyen dosya tipi: ${file.type}. Sadece JPEG, PNG ve WebP desteklenir.`
        } satisfies UploadErrorResponse, { status: 400 })
      }
      
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({
          success: false,
          error: `${file.name} dosyası çok büyük. Maksimum ${MAX_FILE_SIZE / 1024 / 1024}MB olabilir.`
        } satisfies UploadErrorResponse, { status: 400 })
      }
    }
    
    // Create folder structure using furnitureId
    const { folderPath, webFolderPath } = await createFolderStructure(parsedFurnitureId)
    
    // Process and save files
    const uploadedFiles: UploadedFile[] = []
    
    // Get current image count for this furniture to determine sort order
    const existingImagesCount = await prisma.furnitureImage.count({
      where: { furnitureId: parsedFurnitureId, isActive: true }
    })
    
    // Use database transaction for consistency
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const buffer = Buffer.from(await file.arrayBuffer())
        
        // Get file extension
        const ext = path.extname(file.name)
        const fileType = ext.replace('.', '').toLowerCase()
        
        // Optimize image
        const { buffer: optimizedBuffer, width, height } = await optimizeImage(buffer, file.name)
        
        // First, create database record to get imageId
        const imageRecord = await tx.image.create({
          data: {
            fileName: '', // Will be updated after file creation
            originalFileName: file.name,
            filePath: '', // Will be updated after file creation
            fileSize: optimizedBuffer.length,
            fileType: fileType,
            description: description,
            altText: altText || `${furniture.furnitureName} görseli`,
            width: width,
            height: height,
            sortOrder: existingImagesCount + i + 1,
            isActive: true
          }
        })
        
        // Generate unique filename using imageId
        const uniqueFileName = generateFileName(imageRecord.imageId, file.name)
        const physicalFilePath = path.join(folderPath, uniqueFileName)
        const webPath = `${webFolderPath}/${uniqueFileName}`
        
        // Save file to disk
        await writeFile(physicalFilePath, optimizedBuffer)
        
        // Update database record with actual file paths
        await tx.image.update({
          where: { imageId: imageRecord.imageId },
          data: {
            fileName: uniqueFileName,
            filePath: webPath // Store web path for consistency
          }
        })
        
        // Create furniture-image relationship
        await tx.furnitureImage.create({
          data: {
            furnitureId: parsedFurnitureId,
            imageId: imageRecord.imageId,
            imageType: (existingImagesCount + i) === 0 ? 'main_image' : 'gallery',
            sortOrder: existingImagesCount + i + 1,
            isActive: true
          }
        })
        
        uploadedFiles.push({
          imageId: imageRecord.imageId,
          fileName: uniqueFileName,
          originalFileName: file.name,
          filePath: physicalFilePath,
          webPath: webPath,
          fileSize: optimizedBuffer.length,
          fileType: fileType,
          width,
          height,
          optimized: optimizedBuffer.length < buffer.length
        })
      }
    })
    
    return NextResponse.json({
      success: true,
      message: `${uploadedFiles.length} dosya başarıyla yüklendi`,
      data: uploadedFiles
    } satisfies UploadSuccessResponse)
    
  } catch (error) {
    console.error('Upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Dosya yükleme hatası'
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : String(error)) 
      : undefined
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: errorDetails
    } satisfies UploadErrorResponse, { status: 500 })
  }
}

// GET - List uploaded files
export async function GET(request: NextRequest): Promise<NextResponse<GetResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const furnitureId = searchParams.get('furnitureId')
    
    if (!furnitureId || isNaN(parseInt(furnitureId))) {
      return NextResponse.json({
        success: false,
        error: 'Geçerli bir furniture ID gerekli'
      } satisfies GetErrorResponse, { status: 400 })
    }
    
    // Get images by furniture ID from database
    const images = await prisma.furnitureImage.findMany({
      where: {
        furnitureId: parseInt(furnitureId),
        isActive: true
      },
      include: {
        image: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })
    
    const imageList: ImageListItem[] = images.map(furnitureImage => ({
      imageId: furnitureImage.image.imageId,
      fileName: furnitureImage.image.fileName,
      originalFileName: furnitureImage.image.originalFileName || undefined,
      webPath: furnitureImage.image.filePath, // Already stored as web path
      fileSize: furnitureImage.image.fileSize || undefined,
      fileType: furnitureImage.image.fileType || undefined,
      width: furnitureImage.image.width || undefined,
      height: furnitureImage.image.height || undefined,
      description: furnitureImage.image.description || undefined,
      altText: furnitureImage.image.altText || undefined,
      sortOrder: furnitureImage.sortOrder,
      imageType: furnitureImage.imageType
    }))
    
    return NextResponse.json({
      success: true,
      data: imageList
    } satisfies GetSuccessResponse)
    
  } catch (error) {
    console.error('List files error:', error)
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : String(error)) 
      : undefined
    
    return NextResponse.json({
      success: false,
      error: 'Dosyalar listelenemedi',
      details: errorDetails
    } satisfies GetErrorResponse, { status: 500 })
  }
}

// DELETE - Delete an image with physical file removal
export async function DELETE(request: NextRequest): Promise<NextResponse<DeleteResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')
    
    if (!imageId) {
      return NextResponse.json({
        success: false,
        error: 'Image ID gerekli'
      } satisfies DeleteErrorResponse, { status: 400 })
    }
    
    // Get image record with usage information
    const imageRecord = await prisma.image.findUnique({
      where: { imageId: parseInt(imageId) },
      include: {
        furnitureImages: {
          where: { isActive: true }
        },
        furnitureSetImages: {
          where: { isActive: true }
        },
        _count: {
          select: {
            furnitureImages: {
              where: { isActive: true }
            },
            furnitureSetImages: {
              where: { isActive: true }
            }
          }
        }
      }
    })
    
    if (!imageRecord) {
      return NextResponse.json({
        success: false,
        error: 'Image bulunamadı'
      } satisfies DeleteErrorResponse, { status: 404 })
    }
    
    console.log(`Deleting image ${imageId}, file path: ${imageRecord.filePath}`)
    
    // Delete physical file first
    const physicalDeleted = await deletePhysicalFile(imageRecord.filePath)
    
    // Use transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Soft delete from furnitureImages
      await tx.furnitureImage.updateMany({
        where: { imageId: parseInt(imageId) },
        data: { isActive: false }
      })
      
      // Soft delete from furnitureSetImages if exists
      await tx.furnitureSetImage.updateMany({
        where: { imageId: parseInt(imageId) },
        data: { isActive: false }
      })
      
      // Soft delete the image itself
      await tx.image.update({
        where: { imageId: parseInt(imageId) },
        data: { isActive: false }
      })
    })
    
    return NextResponse.json({
      success: true,
      message: 'Image başarıyla silindi',
      fileDeleted: physicalDeleted,
      filePath: imageRecord.filePath
    } satisfies DeleteSuccessResponse)
    
  } catch (error) {
    console.error('Delete image error:', error)
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : String(error)) 
      : undefined
    
    return NextResponse.json({
      success: false,
      error: 'Image silinirken hata oluştu',
      details: errorDetails
    } satisfies DeleteErrorResponse, { status: 500 })
  }
}

// PUT - Update image metadata
export async function PUT(request: NextRequest): Promise<NextResponse<UpdateResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')
    
    if (!imageId) {
      return NextResponse.json({
        success: false,
        error: 'Image ID gerekli'
      } satisfies UpdateErrorResponse, { status: 400 })
    }
    
    const data = await request.json()
    const { description, altText, sortOrder } = data
    
    // Get existing image
    const existingImage = await prisma.image.findUnique({
      where: { imageId: parseInt(imageId) }
    })
    
    if (!existingImage) {
      return NextResponse.json({
        success: false,
        error: 'Image bulunamadı'
      } satisfies UpdateErrorResponse, { status: 404 })
    }
    
    // Validations
    const validationErrors: string[] = []
    
    if (description !== undefined && description !== null && typeof description === 'string' && description.length > 1000) {
      validationErrors.push('Açıklama 1000 karakterden uzun olamaz')
    }

    if (altText !== undefined && altText !== null && (typeof altText !== 'string' || altText.length > 255)) {
      validationErrors.push('Alt text 255 karakterden uzun olamaz')
    }

    if (sortOrder !== undefined && sortOrder !== null && (isNaN(parseInt(String(sortOrder))) || parseInt(String(sortOrder)) < 0)) {
      validationErrors.push('Sıralama değeri geçerli bir pozitif sayı olmalıdır')
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validasyon hatası',
        validationErrors
      } satisfies UpdateErrorResponse, { status: 400 })
    }
    
    // Update metadata
    const updateData: Partial<{
      description: string | null
      altText: string | null
      sortOrder: number
    }> = {}
    
    if (description !== undefined) updateData.description = description?.trim() || null
    if (altText !== undefined) updateData.altText = altText?.trim() || null
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(String(sortOrder)) || 1
    
    const updatedImage = await prisma.image.update({
      where: { imageId: parseInt(imageId) },
      data: updateData
    })
    
    return NextResponse.json({
      success: true,
      message: 'Image metadata başarıyla güncellendi',
      data: updatedImage
    } satisfies UpdateSuccessResponse)
    
  } catch (error) {
    console.error('Update image error:', error)
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : String(error)) 
      : undefined
    
    return NextResponse.json({
      success: false,
      error: 'Image güncellenirken hata oluştu',
      details: errorDetails
    } satisfies UpdateErrorResponse, { status: 500 })
  }
}

// PATCH - Bulk operations on images
export async function PATCH(request: NextRequest): Promise<NextResponse<BulkResponse>> {
  try {
    const data = await request.json()
    const { action, imageIds, ...actionData } = data
    
    if (!action || !imageIds || !Array.isArray(imageIds)) {
      return NextResponse.json({
        success: false,
        error: 'Action ve imageIds gerekli'
      } satisfies BulkErrorResponse, { status: 400 })
    }
    
    switch (action) {
      case 'delete':
        // Bulk delete with physical file removal
        const images = await prisma.image.findMany({
          where: { 
            imageId: { in: imageIds },
            isActive: true
          }
        })
        
        const deletedFiles: string[] = []
        const failedFiles: string[] = []
        
        // Delete physical files first
        for (const image of images) {
          console.log(`Bulk deleting image ${image.imageId}, file path: ${image.filePath}`)
          const physicalDeleted = await deletePhysicalFile(image.filePath)
          if (physicalDeleted) {
            deletedFiles.push(image.filePath)
          } else {
            failedFiles.push(image.filePath)
          }
        }
        
        // Update database in transaction
        await prisma.$transaction(async (tx) => {
          // Soft delete from furnitureImages
          await tx.furnitureImage.updateMany({
            where: { imageId: { in: imageIds } },
            data: { isActive: false }
          })
          
          // Soft delete from furnitureSetImages if exists
          await tx.furnitureSetImage.updateMany({
            where: { imageId: { in: imageIds } },
            data: { isActive: false }
          })
          
          // Soft delete images
          await tx.image.updateMany({
            where: { imageId: { in: imageIds } },
            data: { isActive: false }
          })
        })
        
        return NextResponse.json({
          success: true,
          message: `${images.length} image silindi`,
          deletedCount: images.length,
          physicalDeletion: {
            deleted: deletedFiles.length,
            failed: failedFiles.length,
            failedFiles
          }
        } satisfies BulkSuccessResponse)
        
      case 'updateMetadata':
        // Bulk metadata update
        const { description, altText, sortOrder } = actionData
        const updateData: Partial<{
          description: string | null
          altText: string | null
          sortOrder: number
        }> = {}
        
        if (description !== undefined) updateData.description = description
        if (altText !== undefined) updateData.altText = altText
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder
        
        const updateResult = await prisma.image.updateMany({
          where: { imageId: { in: imageIds } },
          data: updateData
        })
        
        return NextResponse.json({
          success: true,
          message: `${updateResult.count} image güncellendi`,
          updatedCount: updateResult.count
        } satisfies BulkSuccessResponse)
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Geçersiz action'
        } satisfies BulkErrorResponse, { status: 400 })
    }
    
  } catch (error) {
    console.error('Bulk operation error:', error)
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : String(error)) 
      : undefined
    
    return NextResponse.json({
      success: false,
      error: 'Bulk işlem sırasında hata oluştu',
      details: errorDetails
    } satisfies BulkErrorResponse, { status: 500 })
  }
}