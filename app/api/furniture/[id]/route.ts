// app/api/furniture/[id]/route.ts - Updated Single Furniture API with New Image System
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  processImageFiles, 
  renumberImages, 
  deleteImage, 
  toPublicUrl,
  slugifyCategory
} from '@/lib/image-utils'
import { revalidateTag, revalidatePath } from 'next/cache'

// Type definitions
interface PropertyInput {
  propertyId: number;
  propertyValue: string;
}

// GET - Enhanced single furniture details with category-based image grouping
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const furnitureId = parseInt(id)

    if (isNaN(furnitureId) || furnitureId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid furniture ID'
      }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const includeFurnitureSets = searchParams.get('includeFurnitureSets') === 'true'
    const groupImagesByType = searchParams.get('groupImagesByType') === 'true'

    const furniture = await prisma.furniture.findUnique({
      where: { furnitureId },
      include: {
        category: {
          select: {
            categoryId: true,
            categoryName: true,
            categoryPath: true,
            categoryLevel: true,
            description: true,
            isActive: true,
            parent: {
              select: {
                categoryId: true,
                categoryName: true,
                categoryPath: true
              }
            },
            children: {
              where: { isActive: true },
              select: {
                categoryId: true,
                categoryName: true
              }
            }
          }
        },
        colors: {
          where: includeInactive ? {} : { isAvailable: true },
          include: {
            color: {
              select: {
                colorId: true,
                colorName: true,
                colorCode: true,
                isActive: true,
                createdAt: true
              }
            }
          },
          orderBy: { color: { colorName: 'asc' } }
        },
        properties: {
          where: includeInactive ? {} : { isActive: true },
          include: {
            property: {
              select: {
                propertyId: true,
                propertyName: true,
                propertyType: true,
                description: true,
                isActive: true
              }
            }
          },
          orderBy: { property: { propertyName: 'asc' } }
        },
        images: {
          where: includeInactive ? {} : { isActive: true },
          include: {
            image: {
              select: {
                imageId: true,
                fileName: true,
                filePath: true,
                fileSize: true,
                fileType: true,
                description: true,
                altText: true,
                width: true,
                height: true,
                originalFileName: true,
                uploadedAt: true,
                sortOrder: true
              }
            }
          },
          orderBy: [
            { imageType: 'asc' }, // main images first
            { sortOrder: 'asc' }
          ]
        },
        furnitureSets: includeFurnitureSets ? {
          include: {
            furnitureSet: {
              select: {
                setId: true,
                setName: true,
                description: true,
                price: true,
                isActive: true,
                createdAt: true
              }
            }
          },
          orderBy: { furnitureSet: { setName: 'asc' } }
        } : false,
        _count: {
          select: {
            colors: true,
            properties: true,
            images: true,
            furnitureSets: true
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

    // Build breadcrumb
    const breadcrumb = []
    if (furniture.category) {
      if (furniture.category.parent) {
        breadcrumb.push({
          categoryId: furniture.category.parent.categoryId,
          categoryName: furniture.category.parent.categoryName,
          categoryPath: furniture.category.parent.categoryPath
        })
      }
      breadcrumb.push({
        categoryId: furniture.category.categoryId,
        categoryName: furniture.category.categoryName,
        categoryPath: furniture.category.categoryPath
      })
    }

    // Process images
    let imageGallery: any = {
      totalImages: furniture._count.images
    }

    if (groupImagesByType) {
      // Group images by type (main, gallery, thumbnails)
      const imagesByType: {
        main: any[];
        gallery: any[];
        thumbnails: any[];
      } = {
        main: [],
        gallery: [],
        thumbnails: []
      }

      furniture.images.forEach(furnitureImage => {
        const processedImage = {
          ...furnitureImage,
          image: {
            ...furnitureImage.image,
            url: toPublicUrl(furnitureImage.image.filePath)
          }
        }

        // Group by image type
        if (furnitureImage.imageType === 'main') {
          imagesByType.main.push(processedImage)
        } else if (furnitureImage.imageType === 'thumbnail') {
          imagesByType.thumbnails.push(processedImage)
        } else {
          imagesByType.gallery.push(processedImage)
        }
      })

      imageGallery = {
        main: imagesByType.main,
        gallery: imagesByType.gallery,
        thumbnails: imagesByType.thumbnails,
        totalImages: furniture._count.images,
        counts: {
          main: imagesByType.main.length,
          gallery: imagesByType.gallery.length,
          thumbnails: imagesByType.thumbnails.length
        }
      }
    } else {
      // Traditional grouping by image type
      const mainImages = furniture.images.filter(fi => fi.imageType === 'main')
      const galleryImages = furniture.images.filter(fi => fi.imageType === 'gallery')
      const thumbnailImages = furniture.images.filter(fi => fi.imageType === 'thumbnail')

      imageGallery = {
        mainImages: mainImages.map(fi => ({
          ...fi,
          image: {
            ...fi.image,
            url: toPublicUrl(fi.image.filePath)
          }
        })),
        galleryImages: galleryImages.map(fi => ({
          ...fi,
          image: {
            ...fi.image,
            url: toPublicUrl(fi.image.filePath)
          }
        })),
        thumbnailImages: thumbnailImages.map(fi => ({
          ...fi,
          image: {
            ...fi.image,
            url: toPublicUrl(fi.image.filePath)
          }
        })),
        totalImages: furniture._count.images
      }
    }

    // Group properties by type
    const propertiesByType = furniture.properties.reduce((acc: any, fp) => {
      const type = fp.property.propertyType
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push({
        propertyId: fp.property.propertyId,
        propertyName: fp.property.propertyName,
        propertyValue: fp.propertyValue,
        description: fp.property.description,
        isActive: fp.isActive
      })
      return acc
    }, {})

    // Prepare response data
    const responseData = {
      ...furniture,
      breadcrumb,
      imageGallery,
      colorOptions: furniture.colors.map(fc => ({
        ...fc.color,
        isAvailable: fc.isAvailable
      })),
      propertiesByType,
      stats: {
        totalColors: furniture._count.colors,
        totalProperties: furniture._count.properties,
        totalImages: furniture._count.images,
        totalFurnitureSets: furniture._count.furnitureSets,
        activeColors: furniture.colors.filter(fc => fc.isAvailable && fc.color.isActive).length,
        activeProperties: furniture.properties.filter(fp => fp.isActive && fp.property.isActive).length,
        activeImages: furniture.images.filter(fi => fi.isActive).length
      },
      metadata: {
        createdAt: furniture.createdAt,
        formattedPrice: new Intl.NumberFormat('tr-TR', {
          style: 'currency',
          currency: 'TRY'
        }).format(Number(furniture.price)),
        categoryLevel: furniture.category?.categoryLevel || null,
        hasMainImage: imageGallery.main?.length > 0 || imageGallery.mainImages?.length > 0,
        hasGalleryImages: imageGallery.gallery?.length > 0 || imageGallery.galleryImages?.length > 0,
        hasThumbnails: imageGallery.thumbnails?.length > 0 || imageGallery.thumbnailImages?.length > 0,
        categoryBasedPath: furniture.category 
          ? `furniture/${furniture.category.categoryName.toLowerCase()}/${furniture.furnitureId}_${furniture.furnitureName.toLowerCase().replace(/\s+/g, '-')}`
          : null
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error('Furniture detail error:', error)
    return NextResponse.json({
      success: false,
      error: 'Furniture could not be retrieved',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT - Enhanced furniture update with category-based image support
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const furnitureId = parseInt(id)
    
    if (isNaN(furnitureId) || furnitureId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid furniture ID'
      }, { status: 400 })
    }

    const contentType = request.headers.get('content-type') || ''
    let data: any = {}
    let imageFiles: File[] = []

    // Parse request data
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      
      data = {
        furnitureName: formData.get('furnitureName') as string,
        furnitureType: formData.get('furnitureType') as string,
        categoryId: formData.get('categoryId') as string,
        description: formData.get('description') as string,
        price: formData.get('price') as string,
        isActive: formData.get('isActive') as string,
        colorIds: formData.get('colorIds') as string,
        properties: formData.get('properties') as string,
        removeImageIds: formData.get('removeImageIds') as string,
        updateImageOrder: formData.get('updateImageOrder') as string,
        imageTypeMappings: formData.get('imageTypeMappings') as string,
        uploadedImages: formData.get('uploadedImages') as string // NEW: Direct S3 metadata
      }

      const files = formData.getAll('newImages') as File[]
      imageFiles = files.filter(file => file.size > 0)

    } else {
      data = await request.json()
    }

    const {
      furnitureName,
      furnitureType,
      categoryId,
      description,
      price,
      isActive,
      colorIds,
      properties,
      removeImageIds,
      updateImageOrder,
      imageTypeMappings,
      uploadedImages // NEW
    } = data

    // Parse JSON strings with debugging
    let parsedColorIds = colorIds
    let parsedProperties = properties
    let parsedRemoveImageIds = removeImageIds
    let parsedUpdateImageOrder = updateImageOrder
    let parsedImageTypeMappings = imageTypeMappings
    let parsedUploadedImages = uploadedImages

    if (typeof colorIds === 'string') {
      parsedColorIds = colorIds ? JSON.parse(colorIds) : undefined
    }
    if (typeof properties === 'string') {
      parsedProperties = properties ? JSON.parse(properties) : undefined
    }
    if (typeof removeImageIds === 'string') {
      parsedRemoveImageIds = removeImageIds ? JSON.parse(removeImageIds) : []
    }
    if (typeof updateImageOrder === 'string') {
      parsedUpdateImageOrder = updateImageOrder ? JSON.parse(updateImageOrder) : []
    }
    if (typeof imageTypeMappings === 'string') {
      parsedImageTypeMappings = imageTypeMappings ? JSON.parse(imageTypeMappings) : {}
    }
    if (typeof uploadedImages === 'string') {
      parsedUploadedImages = uploadedImages ? JSON.parse(uploadedImages) : []
    }

    console.log('🔍 DEBUG - Parsed data:')
    console.log('  removeImageIds (raw):', removeImageIds)
    console.log('  parsedRemoveImageIds:', parsedRemoveImageIds)
    console.log('  imageFiles length:', imageFiles.length)

    // Check if furniture exists
    const existingFurniture = await prisma.furniture.findUnique({
      where: { furnitureId },
      include: {
        category: {
          select: {
            categoryName: true
          }
        },
        colors: {
          select: {
            colorId: true
          }
        },
        _count: {
          select: {
            furnitureSets: true
          }
        }
      }
    })

    if (!existingFurniture) {
      return NextResponse.json({
        success: false,
        error: 'Furniture not found'
      }, { status: 404 })
    }

    // Enhanced validation
    const validationErrors = []

    if (furnitureName !== undefined) {
      if (!furnitureName || typeof furnitureName !== 'string' || furnitureName.trim().length === 0) {
        validationErrors.push('Furniture name cannot be empty')
      } else if (furnitureName.trim().length > 100) {
        validationErrors.push('Furniture name cannot exceed 100 characters')
      }
    }

    if (price !== undefined) {
      if (price === null || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        validationErrors.push('A valid price must be entered')
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        validationErrors
      }, { status: 400 })
    }

    // Get category information for path generation
    let categoryName = existingFurniture.category?.categoryName || 'uncategorized'
    
    // Category validation
    if (categoryId !== undefined && categoryId !== null) {
      const category = await prisma.category.findUnique({
        where: { categoryId: parseInt(categoryId) }
      })
      
      if (!category || !category.isActive) {
        return NextResponse.json({
          success: false,
          error: 'Select a valid and active category'
        }, { status: 400 })
      }
      
      categoryName = category.categoryName
    }

    // Check for duplicate name if name is being updated
    if (furnitureName !== undefined && furnitureName.trim() !== existingFurniture.furnitureName) {
      const duplicateFurniture = await prisma.furniture.findFirst({
        where: {
          furnitureName: {
            equals: furnitureName.trim(),
            mode: 'insensitive'
          },
          furnitureId: {
            not: furnitureId
          }
        }
      })

      if (duplicateFurniture) {
        return NextResponse.json({
          success: false,
          error: 'Another furniture with this name already exists'
        }, { status: 400 })
      }
    }

    // Main transaction - Update furniture data
    const updatedFurniture = await prisma.$transaction(async (tx) => {
      // 1. Update main furniture data
      const updateData: any = {}
      
      if (furnitureName !== undefined) updateData.furnitureName = furnitureName.trim()
      if (furnitureType !== undefined) updateData.furnitureType = furnitureType.trim()
      if (categoryId !== undefined) updateData.categoryId = categoryId ? parseInt(categoryId) : null
      if (description !== undefined) updateData.description = description?.trim() || null
      if (price !== undefined) updateData.price = parseFloat(price)
      if (isActive !== undefined) updateData.isActive = Boolean(isActive === 'true' || isActive === true)

      const furniture = await tx.furniture.update({
        where: { furnitureId },
        data: updateData
      })

      // 2. Update colors (optional)
      if (parsedColorIds !== undefined) {
        await tx.furnitureColor.deleteMany({
          where: { furnitureId }
        })

        if (Array.isArray(parsedColorIds) && parsedColorIds.length > 0) {
          const colorIdNumbers = parsedColorIds.map((id: number) => parseInt(String(id))).filter((id: number) => !isNaN(id))
          
          if (colorIdNumbers.length > 0) {
            const existingColors = await tx.color.findMany({
              where: { 
                colorId: { in: colorIdNumbers },
                isActive: true 
              }
            })

            if (existingColors.length === colorIdNumbers.length) {
              await tx.furnitureColor.createMany({
                data: colorIdNumbers.map((colorId: number) => ({
                  furnitureId,
                  colorId,
                  isAvailable: true
                }))
              })
            }
          }
        }
      }

      // 3. Update properties
      if (parsedProperties !== undefined) {
        await tx.furnitureProperty.deleteMany({
          where: { furnitureId }
        })

        if (Array.isArray(parsedProperties) && parsedProperties.length > 0) {
          const propertyIds = parsedProperties.map((p: { propertyId: number }) => parseInt(String(p.propertyId))).filter((id: number) => !isNaN(id))
          
          if (propertyIds.length > 0) {
            const existingProperties = await tx.property.findMany({
              where: { 
                propertyId: { in: propertyIds },
                isActive: true 
              }
            })

            if (existingProperties.length === propertyIds.length) {
              await tx.furnitureProperty.createMany({
                data: parsedProperties.map((prop: { propertyId: number; propertyValue: string }) => ({
                  furnitureId,
                  propertyId: parseInt(String(prop.propertyId)),
                  propertyValue: prop.propertyValue.trim(),
                  isActive: true
                }))
              })
            }
          }
        }
      }

      return furniture
    }, {
      timeout: 30000
    })

    // Post-transaction image operations

    // 1. Remove images if specified - use new deleteImage function
    let imageDeleteResults = []
    if (parsedRemoveImageIds && parsedRemoveImageIds.length > 0) {
      try {
        console.log(`🗑️ Removing images: ${parsedRemoveImageIds}`)
        for (const imageId of parsedRemoveImageIds) {
          const deleted = await deleteImage(parseInt(imageId), 'furnitures')
          imageDeleteResults.push({ imageId, deleted })
          if (deleted) {
            console.log(`✅ Successfully deleted image: ${imageId}`)
          } else {
            console.log(`❌ Failed to delete image: ${imageId}`)
          }
        }
      } catch (error) {
        console.error('Image deletion error:', error)
      }
    }

    // 2. Update image sort orders if specified
    if (parsedUpdateImageOrder && parsedUpdateImageOrder.length > 0) {
      try {
        console.log(`🔄 Updating image sort orders:`, parsedUpdateImageOrder)
        
        for (const orderUpdate of parsedUpdateImageOrder) {
          const { imageId, sortOrder } = orderUpdate // Use sortOrder instead of newSortOrder
          
          // Update database sortOrder
          await prisma.furnitureImage.updateMany({
            where: {
              furnitureId: furnitureId,
              imageId: parseInt(imageId)
            },
            data: {
              sortOrder: parseInt(sortOrder),
              imageType: parseInt(sortOrder) === 1 ? 'main' : 'gallery' // Update imageType based on sortOrder
            }
          })
          
          console.log(`✅ Updated image ${imageId} sortOrder to ${sortOrder}`)
        }
        
      } catch (error) {
        console.error('Image sort order update error:', error)
      }
    }

    // 3. Process already uploaded S3 images (Direct Upload)
    let directS3Results: any[] = []
    if (parsedUploadedImages && Array.isArray(parsedUploadedImages)) {
      for (const img of parsedUploadedImages) {
        try {
          const imageRecord = await prisma.image.create({
            data: {
              fileName: img.fileName,
              filePath: img.s3Key,
              altText: img.altText || `${furnitureName} - Image`,
              fileSize: img.fileSize,
              fileType: 'webp'
            }
          })

          await prisma.furnitureImage.create({
            data: {
              furnitureId: furnitureId,
              imageId: imageRecord.imageId,
              imageType: img.imageType || 'gallery',
              sortOrder: img.sortOrder || 1,
              isActive: true
            }
          })
          directS3Results.push({ ...img, success: true })
        } catch (s3Error) {
          console.error('Error saving direct S3 image to DB during update:', s3Error)
        }
      }
    }

    // 4. Process new image files if provided (Traditional Fallback)
    let imageUploadResults: any[] = []
    if (imageFiles.length > 0) {
      try {
        const categorySlug = slugifyCategory(existingFurniture.category?.categoryName || 'unknown')
        
        // Use the centralized S3/Image processing function
        newImageResults = await processImageFiles(
          imageFiles,
          furnitureId,
          categorySlug,
          'furnitures'
        )
        imageUploadResults = newImageResults
        
        console.log(`✅ Processed ${newImageResults.length} new images`)
        
      } catch (error) {
        console.error('New image processing error:', error)
        // If image processing fails, we might want to return a partial success or specific error
        // For now, we log it and continue to return the furniture data
      }
    }

    // Get updated furniture with all relations
    const finalFurniture = await prisma.furniture.findUnique({
      where: { furnitureId },
      include: {
        category: {
          select: {
            categoryId: true,
            categoryName: true,
            categoryPath: true
          }
        },
        colors: {
          include: {
            color: {
              select: {
                colorId: true,
                colorName: true,
                colorCode: true
              }
            }
          }
        },
        properties: {
          include: {
            property: {
              select: {
                propertyId: true,
                propertyName: true,
                propertyType: true
              }
            }
          }
        },
        images: {
          where: { isActive: true },
          include: {
            image: {
              select: {
                imageId: true,
                fileName: true,
                filePath: true,
                altText: true,
                description: true,
                width: true,
                height: true,
                fileSize: true
              }
            }
          },
          orderBy: [
            { imageType: 'asc' },
            { sortOrder: 'asc' }
          ]
        },
        _count: {
          select: {
            colors: true,
            properties: true,
            images: true
          }
        }
      }
    })

    // Add URLs to images
    const furnitureWithUrls = {
      ...finalFurniture,
      images: finalFurniture?.images.map(fi => ({
        ...fi,
        image: {
          ...fi.image,
          url: toPublicUrl(fi.image.filePath)
        }
      })) || []
    }

    const response: any = {
      success: true,
      message: 'Furniture successfully updated',
      data: furnitureWithUrls
    }

    // Add image operation results
    if (imageFiles.length > 0 || (parsedRemoveImageIds && parsedRemoveImageIds.length > 0)) {
      response.imageOperations = {
        uploaded: imageUploadResults.length,
        deleted: imageDeleteResults.length,
        uploadResults: imageUploadResults,
        deleteResults: imageDeleteResults,
        newImagePaths: imageUploadResults.map(img => ({
          fileName: img.fileName,
          sortOrder: img.sortOrder,
          publicUrl: img.publicUrl
        }))
      }
    }

    // Trigger revalidation for immediate updates
    try {
      (revalidateTag as any)('products');
      (revalidateTag as any)('home-products');
      (revalidatePath as any)('/');
      (revalidatePath as any)(`/product-detail-furniture/${furnitureId}`);
    } catch (e) {
      console.error('Revalidation error:', e);
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Furniture update error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Error occurred while updating furniture',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Enhanced furniture deletion
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const furnitureId = parseInt(id)

    if (isNaN(furnitureId) || furnitureId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid furniture ID'
      }, { status: 400 })
    }

    // Check furniture and related images
    const furniture = await prisma.furniture.findUnique({
      where: { furnitureId },
      include: {
        category: {
          select: {
            categoryName: true
          }
        },
        images: {
          include: {
            image: {
              select: {
                imageId: true,
                fileName: true
              }
            }
          }
        },
        _count: {
          select: {
            colors: true,
            properties: true,
            images: true
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

    // Collect image IDs
    const imageIds = furniture.images.map(fi => fi.image.imageId)

    // Transaction to delete furniture
    await prisma.$transaction(async (tx) => {
      // Delete related records
      await tx.furnitureImage.deleteMany({
        where: { furnitureId }
      })
      
      await tx.furnitureProperty.deleteMany({
        where: { furnitureId }
      })
      
      await tx.furnitureColor.deleteMany({
        where: { furnitureId }
      })

      // Delete furniture
      await tx.furniture.delete({
        where: { furnitureId }
      })
    })

    // Delete images after successful transaction with new system
    let imageDeleteResults = []
    if (imageIds.length > 0) {
      try {
        console.log(`🗑️ Deleting images: ${imageIds}`)
        for (const imageId of imageIds) {
          const deleted = await deleteImage(imageId, 'furnitures')
          imageDeleteResults.push({ imageId, deleted })
        }
      } catch (error) {
        console.warn('Image deletion error:', error)
      }
    }

    // Trigger revalidation for immediate updates
    try {
      (revalidateTag as any)('products');
      (revalidateTag as any)('home-products');
      (revalidatePath as any)('/');
      (revalidatePath as any)(`/product-detail-furniture/${furnitureId}`);
    } catch (e) {
      console.error('Revalidation error:', e);
    }

    return NextResponse.json({
      success: true,
      message: `"${furniture.furnitureName}" furniture successfully deleted`,
      deletedItem: {
        furnitureId: furniture.furnitureId,
        furnitureName: furniture.furnitureName,
        relatedData: {
          colors: furniture._count.colors,
          properties: furniture._count.properties,
          images: furniture._count.images
        }
      },
      imageDeleteResults
    })

  } catch (error) {
    console.error('Furniture deletion error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Error occurred while deleting furniture',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}