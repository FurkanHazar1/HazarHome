// app/api/images/route.ts - Updated Images API with Category-Based System
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  generateCategoryBasedPath,
  generateThumbnailPath,
  createImageMetadata,
  parseImageMetadata,
  validateItemType,
  savePhysicalFile,
  deletePhysicalFile,
  THUMBNAIL_CONFIGS
} from '@/lib/image-utils'
import sharp from 'sharp'
import path from 'path'
// Type definitions
interface ImageCreateData {
  fileName: string;
  fileSize: number;
  fileType: string;
  description?: string;
  altText?: string;
  width?: number;
  height?: number;
  originalFileName: string;
  sortOrder?: number;
  isActive?: boolean;
}

// GET - Enhanced images list with category-based filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const isActive = searchParams.get('active')
    const search = searchParams.get('search')
    const fileType = searchParams.get('fileType')
    const itemType = searchParams.get('itemType') // 'furniture' | 'furnitureSet'
    const itemId = searchParams.get('itemId')
    const categoryName = searchParams.get('categoryName')
    const imageType = searchParams.get('imageType') // 'main' | 'gallery' | 'thumbnail'
    const minSize = searchParams.get('minSize')
    const maxSize = searchParams.get('maxSize')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const sortBy = searchParams.get('sortBy') || 'uploadedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const includeUsage = searchParams.get('includeUsage') === 'true'
    const includeMetadata = searchParams.get('includeMetadata') === 'true'

    // Where conditions
    let whereClause: any = {}

    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    if (fileType?.trim()) {
      whereClause.fileType = {
        equals: fileType.trim(),
        mode: 'insensitive'
      }
    }

    if (minSize || maxSize) {
      whereClause.fileSize = {}
      if (minSize && !isNaN(parseInt(minSize))) {
        whereClause.fileSize.gte = parseInt(minSize)
      }
      if (maxSize && !isNaN(parseInt(maxSize))) {
        whereClause.fileSize.lte = parseInt(maxSize)
      }
    }

    if (search?.trim()) {
      whereClause.OR = [
        { fileName: { contains: search.trim(), mode: 'insensitive' } },
        { originalFileName: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { altText: { contains: search.trim(), mode: 'insensitive' } }
      ]
    }

    // Metadata-based filtering (from description JSON)
    if (itemType || itemId || categoryName || imageType) {
      const metadataFilters = []
      
      if (itemType) {
        metadataFilters.push(`"itemType":"${itemType}"`)
      }
      if (itemId) {
        metadataFilters.push(`"itemId":${itemId}`)
      }
      if (categoryName) {
        metadataFilters.push(`"categoryName":"${categoryName}"`)
      }
      if (imageType) {
        metadataFilters.push(`"imageType":"${imageType}"`)
      }
      
      if (metadataFilters.length > 0) {
        whereClause.description = {
          contains: metadataFilters.join(','),
          mode: 'insensitive'
        }
      }
    }

    // Sorting
    const validSortFields = ['fileName', 'fileSize', 'uploadedAt', 'imageId', 'sortOrder']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'uploadedAt'
    const orderBy: any = {}
    orderBy[sortField] = sortOrder === 'asc' ? 'asc' : 'desc'

    const skip = (page - 1) * limit

    // Include options
    const includeOptions: any = {
      _count: {
        select: {
          furnitureImages: true,
          furnitureSetImages: true
        }
      }
    }

    if (includeUsage) {
      includeOptions.furnitureImages = {
        include: {
          furniture: {
            select: {
              furnitureId: true,
              furnitureName: true,
              isActive: true,
              category: {
                select: {
                  categoryName: true
                }
              }
            }
          }
        }
      }
      
      includeOptions.furnitureSetImages = {
        include: {
          furnitureSet: {
            select: {
              setId: true,
              setName: true,
              isActive: true,
              category: {
                select: {
                  categoryName: true
                }
              }
            }
          }
        }
      }
    }

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where: whereClause,
        include: includeOptions,
        orderBy,
        skip,
        take: limit
      }),
      prisma.image.count({ where: whereClause })
    ])

    // Process images with metadata if requested
    const processedImages = images.map(image => {
      const result: any = { ...image }
      
      if (includeMetadata) {
        result.metadata = parseImageMetadata(image.description)
      }
      
      // Add URL for serving
      if (image.filePath) {
        result.url = `/api/images/serve/${image.filePath.replace('uploads/', '')}`
      }
      
      return result
    })

    return NextResponse.json({
      success: true,
      data: processedImages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        isActive: isActive === 'true',
        fileType,
        itemType,
        itemId: itemId ? parseInt(itemId) : null,
        categoryName,
        imageType,
        search
      }
    })

  } catch (error) {
    console.error('Images list error:', error)
    return NextResponse.json({
      success: false,
      error: 'Images could not be retrieved',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - INTERNAL ONLY - Enhanced with category-based system
export async function POST(request: Request) {
  try {
    // Internal call check
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    
    if (origin && !origin.includes(host || 'localhost')) {
      return NextResponse.json({
        success: false,
        error: 'This endpoint is for internal use only'
      }, { status: 403 })
    }

    const data = await request.json()
    const { 
      // New category-based parameters
      itemType,           // 'furniture' | 'furnitureSet'
      itemId,             // furnitureId or setId
      categoryName,       // Category name for path generation
      itemName,           // Item name for path generation
      imageType = 'gallery', // 'main' | 'gallery' | 'thumbnail'
      
      // Legacy parameters (for backward compatibility)
      furnitureId,        
      furnitureSetId,
      
      // Common parameters
      imageData, 
      fileBuffer, 
      sortOrder = 1,
      generateThumbnails = false // Whether to generate thumbnails
    } = data

    // Parameter validation and normalization
    let finalItemType: 'furniture' | 'furnitureSet'
    let finalItemId: number
    let finalCategoryName: string
    let finalItemName: string

    if (itemType && itemId && categoryName && itemName) {
      // New format with category-based system
      if (!validateItemType(itemType)) {
        return NextResponse.json({
          success: false,
          error: 'itemType must be "furniture" or "furnitureSet"'
        }, { status: 400 })
      }
      
      finalItemType = itemType
      finalItemId = parseInt(String(itemId))
      finalCategoryName = categoryName
      finalItemName = itemName
    } else if (furnitureId) {
      // Legacy format - get category and name from database
      const furniture = await prisma.furniture.findUnique({
        where: { furnitureId: parseInt(String(furnitureId)) },
        include: {
          category: {
            select: {
              categoryName: true
            }
          }
        }
      })
      
      if (!furniture) {
        return NextResponse.json({
          success: false,
          error: 'Furniture not found'
        }, { status: 404 })
      }
      
      finalItemType = 'furniture'
      finalItemId = furniture.furnitureId
      finalCategoryName = furniture.category?.categoryName || 'uncategorized'
      finalItemName = furniture.furnitureName
    } else if (furnitureSetId) {
      // Legacy format for furniture sets
      const furnitureSet = await prisma.furnitureSet.findUnique({
        where: { setId: parseInt(String(furnitureSetId)) },
        include: {
          category: {
            select: {
              categoryName: true
            }
          }
        }
      })
      
      if (!furnitureSet) {
        return NextResponse.json({
          success: false,
          error: 'FurnitureSet not found'
        }, { status: 404 })
      }
      
      finalItemType = 'furnitureSet'
      finalItemId = furnitureSet.setId
      finalCategoryName = furnitureSet.category?.categoryName || 'uncategorized'
      finalItemName = furnitureSet.setName || `Set ${furnitureSet.setId}`
    } else {
      return NextResponse.json({
        success: false,
        error: 'Either (itemType + itemId + categoryName + itemName) or (furnitureId) or (furnitureSetId) is required'
      }, { status: 400 })
    }

    if (!imageData || !fileBuffer) {
      return NextResponse.json({
        success: false,
        error: 'imageData and fileBuffer are required'
      }, { status: 400 })
    }

    // Validations
    if (imageData.fileSize > 104857600) { // 100MB
      return NextResponse.json({
        success: false,
        error: 'File size cannot exceed 100MB'
      }, { status: 400 })
    }

    const allowedTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp']
    if (!allowedTypes.includes(imageData.fileType.toLowerCase())) {
      return NextResponse.json({
        success: false,
        error: 'Unsupported file type'
      }, { status: 400 })
    }

    // Validate image type
    if (!['main', 'gallery', 'thumbnail'].includes(imageType)) {
      return NextResponse.json({
        success: false,
        error: 'imageType must be "main", "gallery", or "thumbnail"'
      }, { status: 400 })
    }

    // Check if item exists (already done above for legacy format)
    if (itemType && itemId) {
      if (finalItemType === 'furniture') {
        const furniture = await prisma.furniture.findUnique({
          where: { furnitureId: finalItemId }
        })
        
        if (!furniture) {
          return NextResponse.json({
            success: false,
            error: 'Furniture not found'
          }, { status: 404 })
        }
      } else {
        const furnitureSet = await prisma.furnitureSet.findUnique({
          where: { setId: finalItemId }
        })
        
        if (!furnitureSet) {
          return NextResponse.json({
            success: false,
            error: 'FurnitureSet not found'
          }, { status: 404 })
        }
      }
    }

    // Generate file path using new category-based system
    const pathResult = generateCategoryBasedPath(
      finalItemType,
      finalItemId,
      finalItemName,
      finalCategoryName,
      imageType as 'main' | 'gallery' | 'thumbnail',
      imageData.fileName,
      sortOrder
    )

    // Create metadata
    const metadata = createImageMetadata(
      finalItemType,
      finalItemId,
      finalCategoryName,
      finalItemName,
      imageType as 'main' | 'gallery' | 'thumbnail',
      imageData.originalFileName,
      sortOrder
    )

    // Transaction to create image
    const result = await prisma.$transaction(async (tx) => {
      // Create image record
      const image = await tx.image.create({
        data: {
          fileName: pathResult.fileName,
          filePath: pathResult.filePath,
          fileSize: imageData.fileSize,
          fileType: imageData.fileType,
          description: metadata,
          altText: imageData.altText || `${finalItemName} - ${imageType} image`,
          width: imageData.width || null,
          height: imageData.height || null,
          originalFileName: imageData.originalFileName,
          sortOrder: sortOrder,
          isActive: true
        }
      })

      // Create relationship record
      if (finalItemType === 'furniture') {
        await tx.furnitureImage.create({
          data: {
            furnitureId: finalItemId,
            imageId: image.imageId,
            sortOrder: sortOrder,
            imageType: imageType,
            isActive: true
          }
        })
      } else {
        await tx.furnitureSetImage.create({
          data: {
            furnitureSetId: finalItemId,
            imageId: image.imageId,
            sortOrder: sortOrder,
            imageType: imageType,
            isActive: true
          }
        })
      }

      return image
    })

    // Save physical file after successful transaction
    try {
      const buffer = Buffer.from(fileBuffer, 'base64')
      await savePhysicalFile(result.filePath, buffer)
      
      // Generate thumbnails if requested and this is not already a thumbnail
      let thumbnailResults: any[] = []
      if (generateThumbnails && imageType !== 'thumbnail') {
        thumbnailResults = await generateImageThumbnails(
          buffer,
          result.filePath,
          finalItemType,
          finalItemId,
          finalItemName,
          finalCategoryName,
          imageType as 'main' | 'gallery',
          sortOrder
        )
      }
      
      return NextResponse.json({
        success: true,
        data: {
          ...result,
          url: `/api/images/serve/${result.filePath.replace('uploads/', '')}`,
          thumbnails: thumbnailResults
        }
      }, { status: 201 })
      
    } catch (fileError) {
      // Cleanup database if file save fails
      if (finalItemType === 'furniture') {
        await prisma.furnitureImage.deleteMany({
          where: { imageId: result.imageId }
        })
      } else {
        await prisma.furnitureSetImage.deleteMany({
          where: { imageId: result.imageId }
        })
      }
      await prisma.image.delete({
        where: { imageId: result.imageId }
      })
      
      throw new Error(`Could not save file: ${fileError}`)
    }

  } catch (error) {
    console.error('Image creation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Enhanced bulk image deletion
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    const forceDelete = searchParams.get('force') === 'true'
    
    if (!idsParam?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Image IDs to delete must be specified'
      }, { status: 400 })
    }

    const ids = idsParam.split(',')
      .map((id: string) => parseInt(id.trim()))
      .filter((id: number) => !isNaN(id) && id > 0)
    
    if (ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid image IDs found'
      }, { status: 400 })
    }

    // Check images
    const images = await prisma.image.findMany({
      where: { imageId: { in: ids } },
      select: {
        imageId: true,
        fileName: true,
        filePath: true,
        description: true,
        _count: {
          select: {
            furnitureImages: true,
            furnitureSetImages: true
          }
        }
      }
    })

    if (images.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No images found with specified IDs'
      }, { status: 404 })
    }

    // Check for images in use
    if (!forceDelete) {
      const imagesInUse = images.filter((img: any) => 
        img._count.furnitureImages > 0 || img._count.furnitureSetImages > 0
      )

      if (imagesInUse.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'Some images are still in use',
          message: 'Use force=true parameter to force delete',
          imagesInUse: imagesInUse.map((img: any) => ({
            imageId: img.imageId,
            fileName: img.fileName,
            usageCount: img._count.furnitureImages + img._count.furnitureSetImages,
            metadata: parseImageMetadata(img.description)
          }))
        }, { status: 400 })
      }
    }

    // Transaction to delete
    const result = await prisma.$transaction(async (tx) => {
      const foundIds = images.map((img: { imageId: number }) => img.imageId)
      
      if (forceDelete) {
        await tx.furnitureImage.deleteMany({
          where: { imageId: { in: foundIds } }
        })
        
        await tx.furnitureSetImage.deleteMany({
          where: { imageId: { in: foundIds } }
        })
      }

      return await tx.image.deleteMany({
        where: { imageId: { in: foundIds } }
      })
    })

    // Delete physical files after successful transaction
    const deletedFiles = []
    for (const image of images) {
      if (image.filePath) {
        try {
          await deletePhysicalFile(image.filePath)
          deletedFiles.push(image.filePath)
        } catch (error) {
          console.warn(`Could not delete file ${image.filePath}:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} images successfully deleted`,
      deletedCount: result.count,
      deletedItems: images.map((img: any) => ({
        imageId: img.imageId,
        fileName: img.fileName,
        metadata: parseImageMetadata(img.description)
      })),
      deletedFiles
    })

  } catch (error) {
    console.error('Bulk image deletion error:', error)
    return NextResponse.json({
      success: false,
      error: 'Images could not be deleted',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to generate thumbnails
async function generateImageThumbnails(
  originalBuffer: Buffer,
  originalFilePath: string,
  itemType: 'furniture' | 'furnitureSet',
  itemId: number,
  itemName: string,
  categoryName: string,
  imageType: 'main' | 'gallery',
  sortOrder: number
): Promise<any[]> {
  const thumbnailResults = []
  
  try {
    // Generate different thumbnail sizes
    const thumbnailTypes = imageType === 'main' 
      ? ['main_thumb'] 
      : ['gallery_thumb']
    
    for (const thumbType of thumbnailTypes) {
      const config = THUMBNAIL_CONFIGS[thumbType]
      if (!config) continue
      
      // Generate thumbnail buffer
      const thumbnailBuffer = await sharp(originalBuffer)
        .resize(config.width, config.height, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: config.quality })
        .toBuffer()
      
      // Generate thumbnail path
      const thumbnailPath = generateCategoryBasedPath(
        itemType,
        itemId,
        itemName,
        categoryName,
        'thumbnail',
        originalFilePath,
        imageType === 'main' ? 0 : sortOrder
      )
      
      // Save thumbnail
      await savePhysicalFile(thumbnailPath.filePath, thumbnailBuffer)
      
      // Create thumbnail metadata
      const thumbnailMetadata = createImageMetadata(
        itemType,
        itemId,
        categoryName,
        itemName,
        'thumbnail',
        originalFilePath || 'unknown.jpg',
        imageType === 'main' ? 0 : sortOrder
      )
      
      // Create thumbnail record in database
      const thumbnailImage = await prisma.image.create({
        data: {
          fileName: thumbnailPath.fileName,
          filePath: thumbnailPath.filePath,
          fileSize: thumbnailBuffer.length,
          fileType: 'jpeg',
          description: thumbnailMetadata,
          altText: `${itemName} - ${thumbType}`,
          width: config.width,
          height: config.height,
          originalFileName: originalFilePath,
          sortOrder: imageType === 'main' ? 0 : sortOrder,
          isActive: true
        }
      })
      
      // Create relationship
      if (itemType === 'furniture') {
        await prisma.furnitureImage.create({
          data: {
            furnitureId: itemId,
            imageId: thumbnailImage.imageId,
            sortOrder: imageType === 'main' ? 0 : sortOrder,
            imageType: 'thumbnail',
            isActive: true
          }
        })
      } else {
        await prisma.furnitureSetImage.create({
          data: {
            furnitureSetId: itemId,
            imageId: thumbnailImage.imageId,
            sortOrder: imageType === 'main' ? 0 : sortOrder,
            imageType: 'thumbnail',
            isActive: true
          }
        })
      }
      
      thumbnailResults.push({
        type: thumbType,
        imageId: thumbnailImage.imageId,
        filePath: thumbnailImage.filePath,
        url: `/api/images/serve/${thumbnailImage.filePath.replace('uploads/', '')}`,
        size: `${config.width}x${config.height}`,
        fileSize: thumbnailBuffer.length
      })
    }
    
  } catch (error) {
    console.error('Thumbnail generation error:', error)
  }
  
  return thumbnailResults
}