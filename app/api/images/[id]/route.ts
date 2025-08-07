// app/api/images/[id]/route.ts - FIXED: Removed duplications and import errors
import { NextResponse } from 'next/server'
import path from 'path' // FIXED: Added missing path import
import { prisma } from '@/lib/prisma'
import { 
  generateCategoryBasedPath,
  generateThumbnailPath,
  parseImageMetadata,
  createImageMetadata,
  isValidImageMetadata,
  savePhysicalFile,
  deletePhysicalFile,
  formatFileSize,
  getImageResolution,
  getAspectRatio,
  THUMBNAIL_CONFIGS
} from '@/lib/image-utils'
import { 
  reorganizeFurnitureImages,
  generatePhysicalUpdatePlan,
  executePhysicalUpdates
} from '@/lib/image-physical-update'
import sharp from 'sharp'
import { convertImageType } from '@/lib/image-utils'

// GET - Enhanced single image details with category metadata
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const imageId = parseInt(id)

    if (isNaN(imageId) || imageId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid image ID'
      }, { status: 400 })
    }

    const image = await prisma.image.findUnique({
      where: { imageId },
      include: {
        furnitureImages: {
          include: {
            furniture: {
              select: {
                furnitureId: true,
                furnitureName: true,
                furnitureType: true,
                price: true,
                isActive: true,
                category: {
                  select: {
                    categoryId: true,
                    categoryName: true,
                    categoryPath: true
                  }
                }
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        },
        furnitureSetImages: {
          include: {
            furnitureSet: {
              select: {
                setId: true,
                setName: true,
                price: true,
                isActive: true,
                category: {
                  select: {
                    categoryId: true,
                    categoryName: true,
                    categoryPath: true
                  }
                }
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: {
            furnitureImages: true,
            furnitureSetImages: true
          }
        }
      }
    })

    if (!image) {
      return NextResponse.json({
        success: false,
        error: 'Image not found'
      }, { status: 404 })
    }

    // Parse category metadata from description
    const categoryMetadata = parseImageMetadata(image.description)

    // Usage statistics
    const usageStats = {
      totalUsage: image._count.furnitureImages + image._count.furnitureSetImages,
      furnitureUsage: image._count.furnitureImages,
      furnitureSetUsage: image._count.furnitureSetImages,
      activeFurnitureUsage: image.furnitureImages.filter(fi => fi.furniture.isActive).length,
      activeFurnitureSetUsage: image.furnitureSetImages.filter(fsi => fsi.furnitureSet.isActive).length
    }

    // File exists check
    let fileExists = false
    if (image.filePath) {
      try {
        const fs = await import('fs/promises')
        await fs.access(image.filePath)
        fileExists = true
      } catch {
        fileExists = false
      }
    }

    // Get related thumbnails if this is a main or gallery image
    let relatedThumbnails: any[] = []
    if (categoryMetadata && categoryMetadata.imageType !== 'thumbnail') {
      try {
        const thumbnailSearchPattern = `"itemId":${categoryMetadata.itemId},"categoryName":"${categoryMetadata.categoryName}","itemName":"${categoryMetadata.itemName}","imageType":"thumbnail"`
        
        const thumbnails = await prisma.image.findMany({
          where: {
            description: {
              contains: thumbnailSearchPattern,
              mode: 'insensitive'
            },
            isActive: true
          },
          select: {
            imageId: true,
            fileName: true,
            filePath: true,
            width: true,
            height: true,
            fileSize: true,
            sortOrder: true
          },
          orderBy: { sortOrder: 'asc' }
        })

        relatedThumbnails = thumbnails.map(thumb => ({
          ...thumb,
          url: thumb.filePath ? `/api/images/serve/${thumb.filePath.replace('uploads/', '')}` : null,
          size: `${thumb.width}x${thumb.height}`,
          formattedSize: formatFileSize(thumb.fileSize)
        }))
      } catch (error) {
        console.warn('Error fetching related thumbnails:', error)
      }
    }

    // Get category info from relationships
    let categoryInfo = null
    if (image.furnitureImages.length > 0) {
      const furnitureCategory = image.furnitureImages[0].furniture.category
      if (furnitureCategory) {
        categoryInfo = {
          type: 'furniture',
          categoryId: furnitureCategory.categoryId,
          categoryName: furnitureCategory.categoryName,
          categoryPath: furnitureCategory.categoryPath
        }
      }
    } else if (image.furnitureSetImages.length > 0) {
      const setCategory = image.furnitureSetImages[0].furnitureSet.category
      if (setCategory) {
        categoryInfo = {
          type: 'furnitureSet',
          categoryId: setCategory.categoryId,
          categoryName: setCategory.categoryName,
          categoryPath: setCategory.categoryPath
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...image,
        categoryMetadata,
        categoryInfo,
        usageStats,
        relatedThumbnails,
        fileInfo: {
          formattedSize: formatFileSize(image.fileSize),
          resolution: getImageResolution(image.width, image.height),
          aspectRatio: getAspectRatio(image.width, image.height),
          fileExists,
          url: image.filePath ? `/api/images/serve/${image.filePath.replace('uploads/', '')}` : null
        }
      }
    })

  } catch (error) {
    console.error('Image detail error:', error)
    return NextResponse.json({
      success: false,
      error: 'Image could not be retrieved',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}

// PUT - Enhanced image update with category-based system
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const imageId = parseInt(id)
    
    if (isNaN(imageId) || imageId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid image ID'
      }, { status: 400 })
    }

    const contentType = request.headers.get('content-type') || ''
    let data: any = {}
    let file: File | null = null

    // Parse request data
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      file = formData.get('file') as File
      data = {
        description: formData.get('description') as string,
        altText: formData.get('altText') as string,
        categoryName: formData.get('categoryName') as string,
        itemName: formData.get('itemName') as string,
        imageType: formData.get('imageType') as string,
        sortOrder: formData.get('sortOrder') as string,
        isActive: formData.get('isActive') as string,
        generateThumbnails: formData.get('generateThumbnails') as string,
        updateFileName: formData.get('updateFileName') as string,
        reorganizeFiles: formData.get('reorganizeFiles') as string,
        updateRelatedFiles: formData.get('updateRelatedFiles') as string
      }
    } else {
      data = await request.json()
    }

    const {
      description,
      altText,
      categoryName,
      itemName,
      imageType,
      width,
      height,
      sortOrder,
      isActive,
      generateThumbnails = false,
      updateFileName = 'false',
      reorganizeFiles = 'false',
      updateRelatedFiles = 'false'
    } = data

    // Check existing image
    const existingImage = await prisma.image.findUnique({
      where: { imageId },
      include: {
        furnitureImages: {
          include: {
            furniture: {
              select: {
                furnitureId: true,
                furnitureName: true,
                category: {
                  select: {
                    categoryName: true
                  }
                }
              }
            }
          }
        },
        furnitureSetImages: {
          include: {
            furnitureSet: {
              select: {
                setId: true,
                setName: true,
                category: {
                  select: {
                    categoryName: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            furnitureImages: true,
            furnitureSetImages: true
          }
        }
      }
    })

    if (!existingImage) {
      return NextResponse.json({
        success: false,
        error: 'Image not found'
      }, { status: 404 })
    }

    // Validations
    const validationErrors = []
    
    if (file) {
      if (file.size > 104857600) {
        validationErrors.push('File size cannot exceed 100MB')
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        validationErrors.push('Unsupported file type. Only JPEG, PNG, GIF, WebP files are accepted')
      }
    }

    if (description !== undefined && description !== null && typeof description === 'string' && description.length > 1000) {
      validationErrors.push('Description cannot exceed 1000 characters')
    }

    if (altText !== undefined && altText !== null && (typeof altText !== 'string' || altText.length > 255)) {
      validationErrors.push('Alt text cannot exceed 255 characters')
    }

    if (width !== undefined && width !== null) {
      if (isNaN(parseInt(String(width))) || parseInt(String(width)) <= 0) {
        validationErrors.push('Width must be a valid positive number')
      } else if (parseInt(String(width)) > 10000) {
        validationErrors.push('Width cannot exceed 10000 pixels')
      }
    }

    if (height !== undefined && height !== null) {
      if (isNaN(parseInt(String(height))) || parseInt(String(height)) <= 0) {
        validationErrors.push('Height must be a valid positive number')
      } else if (parseInt(String(height)) > 10000) {
        validationErrors.push('Height cannot exceed 10000 pixels')
      }
    }

    if (sortOrder !== undefined && sortOrder !== null && (isNaN(parseInt(String(sortOrder))) || parseInt(String(sortOrder)) < 0)) {
      validationErrors.push('Sort order must be a valid positive number')
    }

    if (imageType !== undefined && imageType !== null && !['main', 'gallery', 'thumbnail'].includes(imageType)) {
      validationErrors.push('Image type must be "main", "gallery", or "thumbnail"')
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        validationErrors
      }, { status: 400 })
    }

    // Determine if we need physical file operations
    let needsPhysicalUpdate = false
    let needsFileReorganization = false
    let physicalUpdateResults: any = null

    // Check what triggers physical updates
    if (file || 
        updateFileName === 'true' || 
        reorganizeFiles === 'true' ||
        (categoryName && categoryName !== existingImage.description) ||
        (itemName && itemName !== existingImage.description) ||
        (imageType && imageType !== existingImage.description) ||
        (sortOrder && parseInt(sortOrder) !== existingImage.sortOrder)) {
      needsPhysicalUpdate = true
    }

    if (reorganizeFiles === 'true' || updateRelatedFiles === 'true') {
      needsFileReorganization = true
    }

    // Transaction to update image
    const result = await prisma.$transaction(async (tx) => {
      let updateData: any = {}
      let oldFilePath = existingImage.filePath
      
      // Parse existing metadata
      const existingMetadata = parseImageMetadata(existingImage.description) || {}
      
      // Build new metadata with physical file considerations
      let newMetadata = existingMetadata
      let finalCategoryName = categoryName || existingMetadata.categoryName || 'uncategorized'
      let finalItemName = itemName || existingMetadata.itemName || 'unknown'
      let finalImageType = imageType || existingMetadata.imageType || 'gallery'
      let finalSortOrder = sortOrder ? parseInt(String(sortOrder)) : existingImage.sortOrder

      // Update metadata if category information is provided
      if (categoryName !== undefined || itemName !== undefined || imageType !== undefined) {
        if (isValidImageMetadata(existingMetadata)) {
          const finalItemType = existingMetadata.itemType
          const finalItemId = existingMetadata.itemId
          
          updateData.description = createImageMetadata(
            finalItemType,
            finalItemId,
            finalCategoryName,
            finalItemName,
            finalImageType,
            existingImage.originalFileName || existingImage.fileName,
            finalSortOrder
          )
          newMetadata = parseImageMetadata(updateData.description) || existingMetadata
        }
      }

      // Regular metadata updates
      if (description !== undefined && categoryName === undefined && itemName === undefined && imageType === undefined) {
        updateData.description = description?.trim() || null
      }
      if (altText !== undefined) updateData.altText = altText?.trim() || null
      if (width !== undefined) updateData.width = width ? parseInt(String(width)) : null
      if (height !== undefined) updateData.height = height ? parseInt(String(height)) : null
      if (sortOrder !== undefined) updateData.sortOrder = finalSortOrder
      if (isActive !== undefined) updateData.isActive = Boolean(isActive === 'true' || isActive === true)

      // Handle file replacement with new physical path logic
      if (file) {
        const currentMetadata = parseImageMetadata(updateData.description || existingImage.description)
        
        if (currentMetadata && currentMetadata.itemType && currentMetadata.itemId && currentMetadata.categoryName && currentMetadata.itemName) {
          // Generate new category-based path
          const pathResult = generateCategoryBasedPath(
            currentMetadata.itemType,
            currentMetadata.itemId,
            currentMetadata.itemName,
            currentMetadata.categoryName,
            currentMetadata.imageType as 'main' | 'gallery' | 'thumbnail',
            file.name,
            finalSortOrder
          )

          // Smart filename generation
          let newFileName = pathResult.fileName
          
          if (updateFileName === 'true') {
            // Generate optimized filename based on type and order
            const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
            
            switch (currentMetadata.imageType) {
              case 'main':
                newFileName = `main.${fileExtension}`
                break
              case 'gallery':
                newFileName = `${finalSortOrder}.${fileExtension}`
                break
              case 'thumbnail':
                newFileName = finalSortOrder === 0 
                  ? `main_thumb.${fileExtension}`
                  : `${finalSortOrder}_thumb.${fileExtension}`
                break
              default:
                newFileName = `${finalSortOrder}.${fileExtension}`
            }
          }

          // Update path with new filename
          const optimizedPath = pathResult.filePath.replace(pathResult.fileName, newFileName)

          // Save physical file
          const fileBuffer = Buffer.from(await file.arrayBuffer())
          await savePhysicalFile(optimizedPath, fileBuffer)

          // Update database
          updateData.fileName = newFileName
          updateData.filePath = optimizedPath
          updateData.fileSize = file.size
          updateData.fileType = file.type.split('/')[1]
          updateData.originalFileName = file.name
          
          // Get image dimensions
          try {
            const imageInfo = await sharp(fileBuffer).metadata()
            updateData.width = imageInfo.width || null
            updateData.height = imageInfo.height || null
          } catch (error) {
            console.warn('Could not get image dimensions:', error)
          }
        }
      }

      // Handle filename update without file replacement
      else if (needsPhysicalUpdate && !file) {
        const currentMetadata = parseImageMetadata(updateData.description || existingImage.description)
        
        if (currentMetadata && isValidImageMetadata(currentMetadata)) {
          // Generate new path with updated metadata
          const pathResult = generateCategoryBasedPath(
            currentMetadata.itemType,
            currentMetadata.itemId,
            finalItemName,
            finalCategoryName,
            finalImageType as 'main' | 'gallery' | 'thumbnail',
            existingImage.originalFileName || existingImage.fileName,
            finalSortOrder
          )

          // Check if path actually changed
          if (pathResult.filePath !== existingImage.filePath) {
            try {
              // Move existing file to new location
              const fs = await import('fs/promises')
              
              // FIXED: Use path.dirname correctly
              await fs.mkdir(path.dirname(pathResult.filePath), { recursive: true })
              
              // Move file
              await fs.rename(existingImage.filePath, pathResult.filePath)
              
              // Update database with new path
              updateData.fileName = pathResult.fileName
              updateData.filePath = pathResult.filePath
              
              console.log(`📁 Moved file: ${existingImage.filePath} → ${pathResult.filePath}`)
              
            } catch (error) {
              console.error('File move error:', error)
              // Don't fail the update for file move errors
            }
          }
        }
      }

      // Update database
      const updatedImage = await tx.image.update({
        where: { imageId },
        data: updateData,
        include: {
          furnitureImages: {
            include: {
              furniture: {
                select: {
                  furnitureId: true,
                  furnitureName: true,
                  furnitureType: true,
                  isActive: true,
                  category: {
                    select: {
                      categoryName: true
                    }
                  }
                }
              }
            }
          },
          furnitureSetImages: {
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
          },
          _count: {
            select: {
              furnitureImages: true,
              furnitureSetImages: true
            }
          }
        }
      })

      // Delete old file if new file was uploaded and path changed
      if (file && oldFilePath && oldFilePath !== updatedImage.filePath) {
        await deletePhysicalFile(oldFilePath)
      }

      return updatedImage
    })

    // Post-transaction physical file reorganization
    if (needsFileReorganization && result.furnitureImages.length > 0) {
      try {
        const furniture = result.furnitureImages[0].furniture
        
        console.log('🔄 Starting related file reorganization...')
        
        // Get all images for this furniture
        const allFurnitureImages = await prisma.furnitureImage.findMany({
          where: { furnitureId: furniture.furnitureId },
          include: {
            image: {
              select: {
                imageId: true,
                filePath: true,
                sortOrder: true
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        })

        // Prepare reorganization plan
const imageUpdates = allFurnitureImages.map(fi => ({
  imageId: fi.image.imageId,
  currentPath: fi.image.filePath,
  newSortOrder: fi.sortOrder,
  newImageType: convertImageType(fi.imageType || 'gallery')
}))

        // Execute reorganization
        physicalUpdateResults = await reorganizeFurnitureImages(
          furniture.furnitureId,
          furniture.furnitureName,
          furniture.category?.categoryName || 'uncategorized',
          imageUpdates
        )
        
        console.log('📁 Related file reorganization result:', physicalUpdateResults)
        
      } catch (error) {
        console.error('❌ Related file reorganization failed:', error)
        physicalUpdateResults = {
          success: false,
          message: 'Related file reorganization failed',
          errors: [error instanceof Error ? error.message : 'Unknown error']
        }
      }
    }

    // Generate thumbnails if requested and file was uploaded
    let thumbnailResults: any[] = []
    if (file && generateThumbnails) {
      const metadata = parseImageMetadata(result.description)
      if (metadata && metadata.imageType !== 'thumbnail') {
        try {
          const fileBuffer = Buffer.from(await file.arrayBuffer())
          if (metadata.itemType && metadata.itemId && metadata.itemName && metadata.categoryName && metadata.imageType) {
            thumbnailResults = await generateImageThumbnails(
              fileBuffer,
              result.filePath,
              metadata.itemType as 'furniture' | 'furnitureSet',
              metadata.itemId,
              metadata.itemName,
              metadata.categoryName,
              metadata.imageType as 'main' | 'gallery',
              result.sortOrder
            )
          }
        } catch (error) {
          console.warn('Thumbnail generation failed:', error)
        }
      }
    }

    const response: any = {
      success: true,
      message: 'Image successfully updated',
      data: {
        ...result,
        url: result.filePath ? `/api/images/serve/${result.filePath.replace('uploads/', '')}` : null,
        categoryMetadata: parseImageMetadata(result.description)
      },
      fileReplaced: !!file,
      thumbnailsGenerated: thumbnailResults.length > 0,
      thumbnails: thumbnailResults
    }

    // Add physical update results
    if (physicalUpdateResults) {
      response.physicalUpdates = {
        enabled: needsFileReorganization,
        success: physicalUpdateResults.success,
        message: physicalUpdateResults.message,
        updatedFiles: physicalUpdateResults.updatedFiles?.length || 0,
        errors: physicalUpdateResults.errors || []
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Image update error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Error occurred while updating image',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
    }, { status: 500 })
  }
}

// DELETE - Enhanced image deletion
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const imageId = parseInt(id)
    const { searchParams } = new URL(request.url)
    const forceDelete = searchParams.get('force') === 'true'
    const deleteThumbnails = searchParams.get('deleteThumbnails') === 'true'

    if (isNaN(imageId) || imageId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid image ID'
      }, { status: 400 })
    }

    // Check image
    const image = await prisma.image.findUnique({
      where: { imageId },
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

    if (!image) {
      return NextResponse.json({
        success: false,
        error: 'Image not found'
      }, { status: 404 })
    }

    // Check usage
    const totalUsage = image._count.furnitureImages + image._count.furnitureSetImages
    
    if (totalUsage > 0 && !forceDelete) {
      const categoryMetadata = parseImageMetadata(image.description)
      
      return NextResponse.json({
        success: false,
        error: 'Image is still in use',
        usage: {
          furnitureUsage: image._count.furnitureImages,
          furnitureSetUsage: image._count.furnitureSetImages,
          totalUsage
        },
        categoryInfo: categoryMetadata ? {
          itemType: categoryMetadata.itemType,
          itemId: categoryMetadata.itemId,
          categoryName: categoryMetadata.categoryName,
          imageType: categoryMetadata.imageType
        } : null,
        message: 'Use force=true parameter to force delete'
      }, { status: 400 })
    }

    // Find related thumbnails if deleteThumbnails is true
    let relatedThumbnails: any[] = []
    if (deleteThumbnails) {
      const metadata = parseImageMetadata(image.description)
      if (metadata && metadata.imageType !== 'thumbnail') {
        try {
          const thumbnailSearchPattern = `"itemId":${metadata.itemId},"categoryName":"${metadata.categoryName}","itemName":"${metadata.itemName}","imageType":"thumbnail"`
          
          relatedThumbnails = await prisma.image.findMany({
            where: {
              description: {
                contains: thumbnailSearchPattern,
                mode: 'insensitive'
              },
              isActive: true
            },
            select: {
              imageId: true,
              fileName: true,
              filePath: true,
              sortOrder: true
            }
          })
        } catch (error) {
          console.warn('Error finding related thumbnails:', error)
        }
      }
    }

    // Transaction to delete
    const deletedThumbnailIds: number[] = []
    await prisma.$transaction(async (tx) => {
      // Delete related thumbnails first
      if (relatedThumbnails.length > 0) {
        const thumbnailIds = relatedThumbnails.map(thumb => thumb.imageId)
        
        await tx.furnitureImage.deleteMany({
          where: { imageId: { in: thumbnailIds } }
        })
        
        await tx.furnitureSetImage.deleteMany({
          where: { imageId: { in: thumbnailIds } }
        })
        
        await tx.image.deleteMany({
          where: { imageId: { in: thumbnailIds } }
        })
        
        deletedThumbnailIds.push(...thumbnailIds)
      }

      // Delete main image related records if force delete
      if (forceDelete && totalUsage > 0) {
        await tx.furnitureImage.deleteMany({
          where: { imageId }
        })
        
        await tx.furnitureSetImage.deleteMany({
          where: { imageId }
        })
      }

      // Delete main image from database
      await tx.image.delete({
        where: { imageId }
      })
    })

    // Delete physical files
    const deletedFiles = []
    
    // Delete main image file
    if (image.filePath) {
      await deletePhysicalFile(image.filePath)
      deletedFiles.push(image.filePath)
    }
    
    // Delete thumbnail files
    for (const thumbnail of relatedThumbnails) {
      if (thumbnail.filePath) {
        await deletePhysicalFile(thumbnail.filePath)
        deletedFiles.push(thumbnail.filePath)
      }
    }

    return NextResponse.json({
      success: true,
      message: `"${image.fileName}" image successfully deleted`,
      deletedItem: {
        imageId: image.imageId,
        fileName: image.fileName,
        filePath: image.filePath,
        categoryMetadata: parseImageMetadata(image.description),
        previousUsage: {
          furnitureUsage: image._count.furnitureImages,
          furnitureSetUsage: image._count.furnitureSetImages,
          totalUsage
        }
      },
      deletedThumbnails: {
        count: deletedThumbnailIds.length,
        ids: deletedThumbnailIds,
        files: relatedThumbnails.map(thumb => thumb.fileName)
      },
      deletedFiles,
      forceDelete,
      thumbnailsDeleted: deleteThumbnails
    })

  } catch (error) {
    console.error('Image deletion error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Error occurred while deleting image',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
    }, { status: 500 })
  }
}

// PATCH - Enhanced image metadata update with category-based system
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const imageId = parseInt(id)
    
    if (isNaN(imageId) || imageId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid image ID'
      }, { status: 400 })
    }

    const data = await request.json()
    const { isActive, description, altText, sortOrder, categoryName, itemName, imageType } = data

    // Check existing image
    const existingImage = await prisma.image.findUnique({
      where: { imageId },
      include: {
        furnitureImages: {
          select: {
            furnitureId: true,
            furniture: {
              select: {
                furnitureName: true,
                category: {
                  select: {
                    categoryName: true
                  }
                }
              }
            }
          }
        },
        furnitureSetImages: {
          select: {
            furnitureSetId: true,
            furnitureSet: {
              select: {
                setName: true,
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
    })

    if (!existingImage) {
      return NextResponse.json({
        success: false,
        error: 'Image not found'
      }, { status: 404 })
    }

    // Validations
    const validationErrors = []

    if (isActive !== undefined && typeof isActive !== 'boolean') {
      validationErrors.push('isActive value must be boolean (true/false)')
    }

    if (description !== undefined && description !== null && typeof description === 'string' && description.length > 1000) {
      validationErrors.push('Description cannot exceed 1000 characters')
    }

    if (altText !== undefined && altText !== null && (typeof altText !== 'string' || altText.length > 255)) {
      validationErrors.push('Alt text cannot exceed 255 characters')
    }

    if (sortOrder !== undefined && sortOrder !== null && (isNaN(parseInt(String(sortOrder))) || parseInt(String(sortOrder)) < 0)) {
      validationErrors.push('Sort order must be a valid positive number')
    }

    if (imageType !== undefined && imageType !== null && !['main', 'gallery', 'thumbnail'].includes(imageType)) {
      validationErrors.push('Image type must be "main", "gallery", or "thumbnail"')
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        validationErrors
      }, { status: 400 })
    }

    // Update
    const updateData: any = {}
    
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)
    if (altText !== undefined) updateData.altText = altText?.trim() || null
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder ? parseInt(String(sortOrder)) : 1

    // Handle description and category metadata
    if (description !== undefined || categoryName !== undefined || itemName !== undefined || imageType !== undefined) {
      if (categoryName !== undefined || itemName !== undefined || imageType !== undefined) {
        // Update category metadata
        const existingMetadata = parseImageMetadata(existingImage.description)
        
        if (isValidImageMetadata(existingMetadata)) {
          const finalCategoryName = categoryName || existingMetadata.categoryName
          const finalItemName = itemName || existingMetadata.itemName
          const finalImageType = imageType || existingMetadata.imageType
          const finalItemType = existingMetadata.itemType
          const finalItemId = existingMetadata.itemId

          updateData.description = createImageMetadata(
            finalItemType,
            finalItemId,
            finalCategoryName,
            finalItemName,
            finalImageType,
            existingImage.originalFileName || existingImage.fileName,
            updateData.sortOrder || existingImage.sortOrder
          )
        } else {
          console.warn('Cannot update category metadata: existing metadata is invalid or missing')
        }
      } else if (description !== undefined) {
        updateData.description = description?.trim() || null
      }
    }

    const result = await prisma.image.update({
      where: { imageId },
      data: updateData,
      include: {
        _count: {
          select: {
            furnitureImages: true,
            furnitureSetImages: true
          }
        }
      }
    })

    // Determine updated fields
    const updatedFields = Object.keys(updateData)
    
    return NextResponse.json({
      success: true,
      message: `Image metadata successfully updated`,
      data: {
        ...result,
        categoryMetadata: parseImageMetadata(result.description),
        url: result.filePath ? `/api/images/serve/${result.filePath.replace('uploads/', '')}` : null
      },
      updatedFields,
      categoryUpdated: categoryName !== undefined || itemName !== undefined || imageType !== undefined
    })

  } catch (error) {
    console.error('Image metadata update error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Error occurred while updating image metadata',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
    }, { status: 500 })
  }
}

// FIXED: Single helper function to generate thumbnails (removed duplications)
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
      
      // Generate optimized thumbnail path
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