// app/api/furniture/[id]/route.ts - Updated Single Furniture API with Category-Based Image System
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Type definitions
interface PropertyInput {
  propertyId: number;
  propertyValue: string;
}

// Helper function to process image files with category-based system
async function processImageFiles(
  files: File[], 
  furnitureName: string,
  categoryName: string,
  imageTypeMappings?: { [fileName: string]: 'main' | 'gallery' }
): Promise<Array<{
  imageData: any;
  fileBuffer: string;
  sortOrder: number;
  imageType: 'main' | 'gallery';
  categoryName: string;
  itemName: string;
}>> {
  const processedImages = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    // File validation
    if (file.size > 104857600) { // 100MB
      throw new Error(`File ${file.name} is larger than 100MB`)
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}`)
    }

    // Determine image type
    let imageType: 'main' | 'gallery' = 'gallery'
    
    if (imageTypeMappings && imageTypeMappings[file.name]) {
      imageType = imageTypeMappings[file.name]
    } else if (i === 0) {
      // First image is main by default
      imageType = 'main'
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')

    processedImages.push({
      imageData: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type.split('/')[1],
        originalFileName: file.name,
        altText: `${furnitureName} - ${imageType} image`,
        sortOrder: imageType === 'main' ? 0 : i + 1
      },
      fileBuffer: base64,
      sortOrder: imageType === 'main' ? 0 : i + 1,
      imageType,
      categoryName,
      itemName: furnitureName
    })
  }

  return processedImages
}

// Helper function to create images via internal API with category-based system
async function createImagesForFurniture(
  furnitureId: number,
  furnitureName: string,
  categoryName: string,
  processedImages: any[]
) {
  const results = []
  
  for (const imageData of processedImages) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemType: 'furniture',
          itemId: furnitureId,
          categoryName: imageData.categoryName,
          itemName: imageData.itemName,
          imageType: imageData.imageType,
          imageData: imageData.imageData,
          fileBuffer: imageData.fileBuffer,
          sortOrder: imageData.sortOrder,
          generateThumbnails: true
        })
      })

      const result = await response.json()
      if (result.success) {
        results.push(result.data)
      }
    } catch (error) {
      console.warn(`Error creating image:`, error)
    }
  }

  return results
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
            url: furnitureImage.image.filePath 
              ? `/api/images/serve/${furnitureImage.image.filePath.replace('uploads/', '')}`
              : null
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
            url: fi.image.filePath 
              ? `/api/images/serve/${fi.image.filePath.replace('uploads/', '')}`
              : null
          }
        })),
        galleryImages: galleryImages.map(fi => ({
          ...fi,
          image: {
            ...fi.image,
            url: fi.image.filePath 
              ? `/api/images/serve/${fi.image.filePath.replace('uploads/', '')}`
              : null
          }
        })),
        thumbnailImages: thumbnailImages.map(fi => ({
          ...fi,
          image: {
            ...fi.image,
            url: fi.image.filePath 
              ? `/api/images/serve/${fi.image.filePath.replace('uploads/', '')}`
              : null
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
        imageTypeMappings: formData.get('imageTypeMappings') as string
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
      imageTypeMappings
    } = data

    // Parse JSON strings
    let parsedColorIds = colorIds
    let parsedProperties = properties
    let parsedRemoveImageIds = removeImageIds
    let parsedUpdateImageOrder = updateImageOrder
    let parsedImageTypeMappings = imageTypeMappings

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
      if (price === null || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
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

    // Process image files if any
    let processedImages: any[] = []
    if (imageFiles.length > 0) {
      const furnitureNameForImages = furnitureName?.trim() || existingFurniture.furnitureName
      
      try {
        processedImages = await processImageFiles(
          imageFiles, 
          furnitureNameForImages,
          categoryName,
          parsedImageTypeMappings
        )
      } catch (imageProcessError) {
        return NextResponse.json({
          success: false,
          error: `Image processing error: ${imageProcessError instanceof Error ? imageProcessError.message : 'Unknown error'}`
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

    // 1. Remove images if specified
    let imageDeleteResults = []
    if (parsedRemoveImageIds && parsedRemoveImageIds.length > 0) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/images?ids=${parsedRemoveImageIds.join(',')}&force=true`, {
          method: 'DELETE'
        })
        const imageDeleteResult = await response.json()
        imageDeleteResults.push(imageDeleteResult)
      } catch (error) {
        console.warn('Image deletion error:', error)
      }
    }

    // 2. Add new images if any
    let imageUploadResults = []
    if (processedImages.length > 0) {
      try {
        const furnitureNameForImages = furnitureName?.trim() || existingFurniture.furnitureName
        imageUploadResults = await createImagesForFurniture(
          furnitureId,
          furnitureNameForImages,
          categoryName,
          processedImages
        )
      } catch (error) {
        console.warn('Image upload error:', error)
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
          url: fi.image.filePath ? `/api/images/serve/${fi.image.filePath.replace('uploads/', '')}` : null
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
        categoryBasedPaths: processedImages.map(img => ({
          fileName: img.imageData.fileName,
          imageType: img.imageType,
          categoryName: img.categoryName,
          expectedPath: `furniture/${img.categoryName}/${furnitureId}_${img.itemName.toLowerCase().replace(/\s+/g, '-')}`
        }))
      }
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

    // Delete images after successful transaction
    let imageDeleteResults = []
    if (imageIds.length > 0) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/images?ids=${imageIds.join(',')}&force=true&deleteThumbnails=true`, {
          method: 'DELETE'
        })
        const imageDeleteResult = await response.json()
        imageDeleteResults.push(imageDeleteResult)
      } catch (error) {
        console.warn('Image deletion error:', error)
      }
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