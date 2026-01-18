// app/api/furniture-sets/[id]/route.ts - Single Furniture Set API with Category-Based Image System
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  processImageFiles,
  renumberImages, 
  deleteImage, 
  toPublicUrl,
  slugifyCategory
} from '@/lib/image-utils'

// Type definitions
interface PropertyInput {
  propertyId: number;
  propertyValue: string;
}

interface FurnitureItemInput {
  furnitureId: number;
  quantity: number;
  sortOrder?: number;
}

// GET - Enhanced single furniture set details with category-based image grouping
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const setId = parseInt(id)

    if (isNaN(setId) || setId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid furniture set ID'
      }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const groupImagesByType = searchParams.get('groupImagesByType') === 'true'
    const includeFurnitureDetails = searchParams.get('includeFurnitureDetails') === 'true'
    const calculatePricing = searchParams.get('calculatePricing') === 'true'

    const furnitureSet = await prisma.furnitureSet.findUnique({
      where: { setId },
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
        furnitureSetColors: {
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
        furnitureSetProperties: {
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
        furnitureSetImages: {
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
        furnitureSetItems: {
          include: {
            furniture: includeFurnitureDetails ? {
              include: {
                category: {
                  select: {
                    categoryId: true,
                    categoryName: true,
                    categoryPath: true
                  }
                },
                colors: {
                  where: { isAvailable: true },
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
                  where: { isActive: true },
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
                  where: { isActive: true, imageType: 'main' },
                  include: {
                    image: {
                      select: {
                        imageId: true,
                        fileName: true,
                        filePath: true,
                        altText: true,
                        width: true,
                        height: true
                      }
                    }
                  },
                  orderBy: { sortOrder: 'asc' },
                  take: 1 // Only main image
                }
              }
            } : {
              select: {
                furnitureId: true,
                furnitureName: true,
                furnitureType: true,
                price: true,
                isActive: true,
                categoryId: true
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: {
            furnitureSetColors: true,
            furnitureSetProperties: true,
            furnitureSetImages: true,
            furnitureSetItems: true
          }
        }
      }
    })

    if (!furnitureSet) {
      return NextResponse.json({
        success: false,
        error: 'Furniture set not found'
      }, { status: 404 })
    }

    // Build breadcrumb
    const breadcrumb = []
    if (furnitureSet.category) {
      if (furnitureSet.category.parent) {
        breadcrumb.push({
          categoryId: furnitureSet.category.parent.categoryId,
          categoryName: furnitureSet.category.parent.categoryName,
          categoryPath: furnitureSet.category.parent.categoryPath
        })
      }
      breadcrumb.push({
        categoryId: furnitureSet.category.categoryId,
        categoryName: furnitureSet.category.categoryName,
        categoryPath: furnitureSet.category.categoryPath
      })
    }

    // Process images
    let imageGallery: any = {
      totalImages: furnitureSet._count.furnitureSetImages
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

      furnitureSet.furnitureSetImages.forEach(setImage => {
        const processedImage = {
          ...setImage,
          image: {
            ...setImage.image,
            url: toPublicUrl(setImage.image.filePath)
          }
        }

        // Group by image type
        if (setImage.imageType === 'main') {
          imagesByType.main.push(processedImage)
        } else if (setImage.imageType === 'thumbnail') {
          imagesByType.thumbnails.push(processedImage)
        } else {
          imagesByType.gallery.push(processedImage)
        }
      })

      imageGallery = {
        main: imagesByType.main,
        gallery: imagesByType.gallery,
        thumbnails: imagesByType.thumbnails,
        totalImages: furnitureSet._count.furnitureSetImages,
        counts: {
          main: imagesByType.main.length,
          gallery: imagesByType.gallery.length,
          thumbnails: imagesByType.thumbnails.length
        }
      }
    } else {
      // Traditional grouping by image type
      const mainImages = furnitureSet.furnitureSetImages.filter(si => si.imageType === 'main')
      const galleryImages = furnitureSet.furnitureSetImages.filter(si => si.imageType === 'gallery')
      const thumbnailImages = furnitureSet.furnitureSetImages.filter(si => si.imageType === 'thumbnail')

      imageGallery = {
        mainImages: mainImages.map(si => ({
          ...si,
          image: {
            ...si.image,
            url: toPublicUrl(si.image.filePath)
          }
        })),
        galleryImages: galleryImages.map(si => ({
          ...si,
          image: {
            ...si.image,
            url: toPublicUrl(si.image.filePath)
          }
        })),
        thumbnailImages: thumbnailImages.map(si => ({
          ...si,
          image: {
            ...si.image,
            url: toPublicUrl(si.image.filePath)
          }
        })),
        totalImages: furnitureSet._count.furnitureSetImages
      }
    }

    // Group properties by type
    const propertiesByType = furnitureSet.furnitureSetProperties.reduce((acc: any, sp) => {
      const type = sp.property.propertyType
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push({
        propertyId: sp.property.propertyId,
        propertyName: sp.property.propertyName,
        propertyValue: sp.propertyValue,
        description: sp.property.description,
        isActive: sp.isActive
      })
      return acc
    }, {})

    // Calculate pricing if requested
    let pricingAnalysis: any = null
    if (calculatePricing && 'furnitureSetItems' in furnitureSet && furnitureSet.furnitureSetItems) {
      const totalIndividualPrice = furnitureSet.furnitureSetItems.reduce((sum, item) => {
        return sum + (Number(item.furniture.price) * item.quantity)
      }, 0)
      
      const setPrice = Number(furnitureSet.price)
      const savings = totalIndividualPrice - setPrice
      const savingsPercentage = totalIndividualPrice > 0 ? ((savings / totalIndividualPrice) * 100) : 0

      pricingAnalysis = {
        setPrice,
        totalIndividualPrice,
        savings,
        savingsPercentage: Math.round(savingsPercentage * 100) / 100,
        isSetCheaper: savings > 0,
        formattedSetPrice: new Intl.NumberFormat('tr-TR', {
          style: 'currency',
          currency: 'TRY'
        }).format(setPrice),
        formattedIndividualPrice: new Intl.NumberFormat('tr-TR', {
          style: 'currency',
          currency: 'TRY'
        }).format(totalIndividualPrice),
        formattedSavings: new Intl.NumberFormat('tr-TR', {
          style: 'currency',
          currency: 'TRY'
        }).format(Math.abs(savings))
      }
    }

    // Process furniture items with images
    const processedFurnitureItems = 'furnitureSetItems' in furnitureSet && furnitureSet.furnitureSetItems 
      ? furnitureSet.furnitureSetItems.map(item => {
          const result: any = { ...item }
          
          // Type assertion for furniture with images
          const furniture = item.furniture as any
          
          if (includeFurnitureDetails && furniture.images && Array.isArray(furniture.images)) {
            result.furniture.images = furniture.images.map((fi: any) => ({
              ...fi,
              image: {
                ...fi.image,
                url: toPublicUrl(fi.image.filePath)
              }
            }))
          }
          
          // Add individual item pricing
          result.itemTotalPrice = Number(item.furniture.price) * item.quantity
          result.formattedItemPrice = new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
          }).format(Number(item.furniture.price))
          result.formattedItemTotalPrice = new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
          }).format(result.itemTotalPrice)
          
          return result
        })
      : []

    // Calculate stats with safe property access
    const setFurnitureItems = 'furnitureSetItems' in furnitureSet ? furnitureSet.furnitureSetItems : []
    const totalQuantity = setFurnitureItems.reduce((sum, item) => sum + item.quantity, 0)
    const uniqueFurnitureCount = setFurnitureItems.length
    const activeFurnitureCount = setFurnitureItems.filter(item => item.furniture && item.furniture.isActive).length

    // Prepare response data
    const responseData = {
      ...furnitureSet,
      breadcrumb,
      imageGallery,
      colorOptions: furnitureSet.furnitureSetColors.map(sc => ({
        ...sc.color,
        isAvailable: sc.isAvailable
      })),
      propertiesByType,
      furnitureItems: processedFurnitureItems,
      pricingAnalysis,
      stats: {
        totalColors: furnitureSet._count.furnitureSetColors,
        totalProperties: furnitureSet._count.furnitureSetProperties,
        totalImages: furnitureSet._count.furnitureSetImages,
        totalFurnitureItems: furnitureSet._count.furnitureSetItems,
        totalQuantity,
        uniqueFurnitureCount,
        activeFurnitureCount,
        activeColors: furnitureSet.furnitureSetColors.filter(sc => sc.isAvailable && sc.color.isActive).length,
        activeProperties: furnitureSet.furnitureSetProperties.filter(sp => sp.isActive && sp.property.isActive).length,
        activeImages: furnitureSet.furnitureSetImages.filter(si => si.isActive).length
      },
      metadata: {
        createdAt: furnitureSet.createdAt,
        formattedPrice: new Intl.NumberFormat('tr-TR', {
          style: 'currency',
          currency: 'TRY'
        }).format(Number(furnitureSet.price)),
        categoryLevel: furnitureSet.category?.categoryLevel || null,
        isParentCategory: furnitureSet.category?.categoryLevel === 1,
        hasMainImage: imageGallery.main?.length > 0 || imageGallery.mainImages?.length > 0,
        hasGalleryImages: imageGallery.gallery?.length > 0 || imageGallery.galleryImages?.length > 0,
        hasThumbnails: imageGallery.thumbnails?.length > 0 || imageGallery.thumbnailImages?.length > 0,
        categoryBasedPath: furnitureSet.category 
          ? `furniture-sets/${furnitureSet.category.categoryName.toLowerCase()}/${furnitureSet.setId}_${(furnitureSet.setName || '').toLowerCase().replace(/\s+/g, '-')}`
          : null
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error('Furniture set detail error:', error)
    return NextResponse.json({
      success: false,
      error: 'Furniture set could not be retrieved',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT - Enhanced furniture set update with category-based image support
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const setId = parseInt(id)
    
    if (isNaN(setId) || setId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid furniture set ID'
      }, { status: 400 })
    }

    const contentType = request.headers.get('content-type') || ''
    let data: any = {}
    let imageFiles: File[] = []

    // Parse request data
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      
      data = {
        setName: formData.get('setName') as string,
        categoryId: formData.get('categoryId') as string,
        description: formData.get('description') as string,
        price: formData.get('price') as string,
        isActive: formData.get('isActive') as string,
        colorIds: formData.get('colorIds') as string,
        properties: formData.get('properties') as string,
        furnitureItems: formData.get('furnitureItems') as string,
        removeImageIds: formData.get('removeImageIds') as string,
        updateImageOrder: formData.get('updateImageOrder') as string,
        imageTypeMappings: formData.get('imageTypeMappings') as string,
        uploadedImages: formData.get('uploadedImages') as string // NEW
      }

      const files = formData.getAll('newImages') as File[]
      imageFiles = files.filter(file => file.size > 0)

    } else {
      data = await request.json()
    }

    const {
      setName,
      categoryId,
      description,
      price,
      isActive,
      colorIds,
      properties,
      furnitureItems,
      removeImageIds,
      updateImageOrder,
      imageTypeMappings,
      uploadedImages // NEW
    } = data

    // Parse JSON strings
    let parsedColorIds = colorIds
    let parsedProperties = properties
    let parsedFurnitureItems = furnitureItems
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
    if (typeof furnitureItems === 'string') {
      parsedFurnitureItems = furnitureItems ? JSON.parse(furnitureItems) : undefined
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

    // Check if furniture set exists
    const existingSet = await prisma.furnitureSet.findUnique({
      where: { setId },
      include: {
        category: {
          select: {
            categoryName: true,
            categoryLevel: true
          }
        },
        furnitureSetColors: {
          select: {
            colorId: true
          }
        },
        furnitureSetItems: {
          select: {
            furnitureId: true,
            quantity: true
          }
        }
      }
    })

    if (!existingSet) {
      return NextResponse.json({
        success: false,
        error: 'Furniture set not found'
      }, { status: 404 })
    }

    // Enhanced validation
    const validationErrors = []

    if (setName !== undefined) {
      if (!setName || typeof setName !== 'string' || setName.trim().length === 0) {
        validationErrors.push('Set name cannot be empty')
      } else if (setName.trim().length > 150) {
        validationErrors.push('Set name cannot exceed 150 characters')
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
    let categoryName = existingSet.category?.categoryName || 'uncategorized'
    
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

      if (category.categoryLevel !== 1) {
        return NextResponse.json({
          success: false,
          error: 'Furniture sets can only be assigned to parent categories (level 1)'
        }, { status: 400 })
      }
      
      categoryName = category.categoryName
    }

    // Check for duplicate name if name is being updated
    if (setName !== undefined && setName.trim() !== existingSet.setName) {
      const duplicateSet = await prisma.furnitureSet.findFirst({
        where: {
          setName: {
            equals: setName.trim(),
            mode: 'insensitive'
          },
          setId: {
            not: setId
          }
        }
      })

      if (duplicateSet) {
        return NextResponse.json({
          success: false,
          error: 'Another furniture set with this name already exists'
        }, { status: 400 })
      }
    }

    // Validate furniture items if provided
    if (parsedFurnitureItems !== undefined) {
      if (!Array.isArray(parsedFurnitureItems) || parsedFurnitureItems.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'At least one furniture item must be in the set'
        }, { status: 400 })
      }

      const furnitureIds = parsedFurnitureItems.map((item: FurnitureItemInput) => parseInt(String(item.furnitureId))).filter((id: number) => !isNaN(id))
      
      if (furnitureIds.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No valid furniture IDs found in furniture items'
        }, { status: 400 })
      }

      // Check if all furniture items exist and are active
      const existingFurniture = await prisma.furniture.findMany({
        where: { 
          furnitureId: { in: furnitureIds },
          isActive: true 
        }
      })

      if (existingFurniture.length !== furnitureIds.length) {
        return NextResponse.json({
          success: false,
          error: 'Some furniture items could not be found or are inactive'
        }, { status: 400 })
      }

      // Validate quantities
      for (const item of parsedFurnitureItems) {
        if (!item.quantity || isNaN(parseInt(String(item.quantity))) || parseInt(String(item.quantity)) <= 0) {
          return NextResponse.json({
            success: false,
            error: 'All furniture items must have valid quantities (greater than 0)'
          }, { status: 400 })
        }
      }
    }

    // Main transaction - Update furniture set data
    const updatedSet = await prisma.$transaction(async (tx) => {
      // 1. Update main set data
      const updateData: any = {}
      
      if (setName !== undefined) updateData.setName = setName.trim()
      if (categoryId !== undefined) updateData.categoryId = categoryId ? parseInt(categoryId) : null
      if (description !== undefined) updateData.description = description?.trim() || null
      if (price !== undefined) updateData.price = parseFloat(price)
      if (isActive !== undefined) updateData.isActive = Boolean(isActive === 'true' || isActive === true)

      const set = await tx.furnitureSet.update({
        where: { setId },
        data: updateData
      })

      // 2. Update colors (optional)
      if (parsedColorIds !== undefined) {
        await tx.furnitureSetColor.deleteMany({
          where: { furnitureSetId: setId }
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
              await tx.furnitureSetColor.createMany({
                data: colorIdNumbers.map((colorId: number) => ({
                  furnitureSetId: setId,
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
        await tx.furnitureSetProperty.deleteMany({
          where: { furnitureSetId: setId }
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
              await tx.furnitureSetProperty.createMany({
                data: parsedProperties.map((prop: { propertyId: number; propertyValue: string }) => ({
                  furnitureSetId: setId,
                  propertyId: parseInt(String(prop.propertyId)),
                  propertyValue: prop.propertyValue.trim(),
                  isActive: true
                }))
              })
            }
          }
        }
      }

      // 4. Update furniture items
      if (parsedFurnitureItems !== undefined) {
        await tx.furnitureSetAndFurniture.deleteMany({
          where: { furnitureSetId: setId }
        })

        if (Array.isArray(parsedFurnitureItems) && parsedFurnitureItems.length > 0) {
          await tx.furnitureSetAndFurniture.createMany({
            data: parsedFurnitureItems.map((item: FurnitureItemInput, index: number) => ({
              furnitureSetId: setId,
              furnitureId: parseInt(String(item.furnitureId)),
              quantity: parseInt(String(item.quantity)),
              sortOrder: item.sortOrder || index + 1
            }))
          })
        }
      }

      return set
    }, {
      timeout: 30000
    })

    // Post-transaction image operations

    // 1. Remove images if specified - use new deleteImage function
    let imageDeleteResults = []
    if (parsedRemoveImageIds && parsedRemoveImageIds.length > 0) {
      try {
        console.log(`🗑️ Removing furniture-set images: ${parsedRemoveImageIds}`)
        for (const imageId of parsedRemoveImageIds) {
          const deleted = await deleteImage(parseInt(imageId), 'furniture-sets')
          imageDeleteResults.push({ imageId, deleted })
          if (deleted) {
            console.log(`✅ Successfully deleted furniture-set image: ${imageId}`)
          } else {
            console.log(`❌ Failed to delete furniture-set image: ${imageId}`)
          }
        }
      } catch (error) {
        console.error('Furniture-set image deletion error:', error)
      }
    }

    // 2. Update image sort orders if specified
    if (parsedUpdateImageOrder && parsedUpdateImageOrder.length > 0) {
      try {
        console.log(`🔄 Updating furniture-set image sort orders:`, parsedUpdateImageOrder)
        
        for (const orderUpdate of parsedUpdateImageOrder) {
          const { imageId, sortOrder } = orderUpdate // Use sortOrder instead of newSortOrder
          
          // Update database sortOrder
          await prisma.furnitureSetImage.updateMany({
            where: {
              furnitureSetId: setId,
              imageId: parseInt(imageId)
            },
            data: {
              sortOrder: parseInt(sortOrder),
              imageType: parseInt(sortOrder) === 1 ? 'main' : 'gallery' // Update imageType based on sortOrder
            }
          })
          
          console.log(`✅ Updated furniture-set image ${imageId} sortOrder to ${sortOrder}`)
        }
        
      } catch (error) {
        console.error('Furniture-set image sort order update error:', error)
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
              altText: img.altText || `${setName} - Image`,
              fileSize: img.fileSize,
              fileType: 'webp'
            }
          })

          await prisma.furnitureSetImage.create({
            data: {
              furnitureSetId: setId,
              imageId: imageRecord.imageId,
              imageType: img.imageType || 'gallery',
              sortOrder: img.sortOrder || 1,
              isActive: true
            }
          })
          directS3Results.push({ ...img, success: true })
        } catch (s3Error) {
          console.error('Error saving direct S3 image to DB during set update:', s3Error)
        }
      }
    }

    // 4. Process new image files if provided (Fallback)
    let newImageResults: any[] = []
    if (imageFiles.length > 0) {
      try {
        const categorySlug = slugifyCategory(existingSet.category?.categoryName || 'unknown')
        
        // Use the centralized S3/Image processing function
        newImageResults = await processImageFiles(
          imageFiles,
          setId,
          categorySlug,
          'furniture-sets'
        )
        
        console.log(`✅ Processed ${newImageResults.length} new furniture-set images`)
        
      } catch (error) {
        console.error('New furniture-set image processing error:', error)
      }
    }

    // Get updated furniture set with all relations
    const finalSet = await prisma.furnitureSet.findUnique({
      where: { setId },
      include: {
        category: {
          select: {
            categoryId: true,
            categoryName: true,
            categoryPath: true,
            categoryLevel: true
          }
        },
        furnitureSetColors: {
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
        furnitureSetProperties: {
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
        furnitureSetImages: {
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
        furnitureSetItems: {
          include: {
            furniture: {
              select: {
                furnitureId: true,
                furnitureName: true,
                furnitureType: true,
                price: true,
                isActive: true
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: {
            furnitureSetColors: true,
            furnitureSetProperties: true,
            furnitureSetImages: true,
            furnitureSetItems: true
          }
        }
      }
    })

    // Add URLs to images and calculate stats
    const updateFurnitureItems = finalSet && 'furnitureSetItems' in finalSet ? finalSet.furnitureSetItems : []
    const setWithUrls = {
      ...finalSet,
      furnitureSetImages: finalSet?.furnitureSetImages.map(si => ({
        ...si,
        image: {
          ...si.image,
          url: toPublicUrl(si.image.filePath)
        }
      })) || [],
      stats: {
        totalQuantity: updateFurnitureItems.reduce((sum, item) => sum + item.quantity, 0),
        uniqueFurnitureCount: updateFurnitureItems.length,
        totalIndividualPrice: updateFurnitureItems.reduce((sum, item) => sum + (Number(item.furniture.price) * item.quantity), 0),
        setSavings: finalSet ? (updateFurnitureItems.reduce((sum, item) => sum + (Number(item.furniture.price) * item.quantity), 0) - Number(finalSet.price)) : 0
      }
    }

    const response: any = {
      success: true,
      message: 'Furniture set successfully updated',
      data: setWithUrls
    }

    // Add image operation results
    if (imageFiles.length > 0 || (parsedRemoveImageIds && parsedRemoveImageIds.length > 0)) {
      response.imageOperations = {
        uploaded: newImageResults.length,
        deleted: imageDeleteResults.length,
        uploadResults: newImageResults,
        deleteResults: imageDeleteResults,
        paths: newImageResults.map(img => ({
          fileName: img.fileName,
          sortOrder: img.sortOrder,
          publicUrl: img.publicUrl,
          savedPath: img.savedPath
        }))
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Furniture set update error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Error occurred while updating furniture set',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Enhanced furniture set deletion
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const setId = parseInt(id)

    if (isNaN(setId) || setId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid furniture set ID'
      }, { status: 400 })
    }

    // Check furniture set and related images
    const furnitureSet = await prisma.furnitureSet.findUnique({
      where: { setId },
      include: {
        furnitureSetImages: {
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
            furnitureSetColors: true,
            furnitureSetProperties: true,
            furnitureSetImages: true,
            furnitureSetItems: true
          }
        }
      }
    })

    if (!furnitureSet) {
      return NextResponse.json({
        success: false,
        error: 'Furniture set not found'
      }, { status: 404 })
    }

    // Collect image IDs
    const imageIds = furnitureSet.furnitureSetImages.map(si => si.image.imageId)

    // Transaction to delete furniture set
    await prisma.$transaction(async (tx) => {
      // Delete related records
      await tx.furnitureSetImage.deleteMany({
        where: { furnitureSetId: setId }
      })
      
      await tx.furnitureSetProperty.deleteMany({
        where: { furnitureSetId: setId }
      })
      
      await tx.furnitureSetColor.deleteMany({
        where: { furnitureSetId: setId }
      })

      await tx.furnitureSetAndFurniture.deleteMany({
        where: { furnitureSetId: setId }
      })

      // Delete furniture set
      await tx.furnitureSet.delete({
        where: { setId }
      })
    })

    // Delete images after successful transaction
    let imageDeleteResults = []
    if (imageIds.length > 0) {
      try {
        for (const imageId of imageIds) {
          const deleteResult = await deleteImage(imageId, 'furniture-sets')
          imageDeleteResults.push(deleteResult)
        }
      } catch (error) {
        console.warn('Image deletion error:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `"${furnitureSet.setName || 'Unnamed Set'}" furniture set successfully deleted`,
      deletedItem: {
        setId: furnitureSet.setId,
        setName: furnitureSet.setName,
        relatedData: {
          colors: furnitureSet._count.furnitureSetColors,
          properties: furnitureSet._count.furnitureSetProperties,
          images: furnitureSet._count.furnitureSetImages,
          furnitureItems: furnitureSet._count.furnitureSetItems
        }
      },
      imageDeleteResults
    })

  } catch (error) {
    console.error('Furniture set deletion error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Error occurred while deleting furniture set',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}