// app/api/furniture/route.ts - Simplified Image Management System
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  slugifyCategory, 
  validateImage, 
  processImageFiles,
  toPublicUrl,
  deleteImage
} from '@/lib/image-utils'

// Type definitions
interface PropertyInput {
  propertyId: number;
  propertyValue: string;
}

// GET - Enhanced furniture listing with simplified image URLs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const categoryId = searchParams.get('categoryId')
    const furnitureType = searchParams.get('type')
    const isActive = searchParams.get('active')
    const search = searchParams.get('search')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const includeDetails = searchParams.get('includeDetails') === 'true'
    const includeImagesByType = searchParams.get('includeImagesByType') === 'true'

    // Where conditions
    let whereClause: any = {}

    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    if (categoryId && !isNaN(parseInt(categoryId))) {
      whereClause.categoryId = parseInt(categoryId)
    }

    if (furnitureType?.trim()) {
      whereClause.furnitureType = {
        contains: furnitureType.trim(),
        mode: 'insensitive'
      }
    }

    if (minPrice || maxPrice) {
      whereClause.price = {}
      if (minPrice && !isNaN(parseFloat(minPrice))) {
        whereClause.price.gte = parseFloat(minPrice)
      }
      if (maxPrice && !isNaN(parseFloat(maxPrice))) {
        whereClause.price.lte = parseFloat(maxPrice)
      }
    }

    if (search?.trim()) {
      whereClause.OR = [
        { furnitureName: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { furnitureType: { contains: search.trim(), mode: 'insensitive' } }
      ]
    }

    const validSortFields = ['furnitureName', 'price', 'createdAt', 'furnitureType', 'furnitureId']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const orderBy: any = {}
    orderBy[sortField] = sortOrder === 'asc' ? 'asc' : 'desc'

    const skip = (page - 1) * limit

    // Include options
    const includeOptions: any = {
      category: {
        select: {
          categoryId: true,
          categoryName: true,
          categoryPath: true
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

    if (includeDetails) {
      includeOptions.colors = {
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
      }
      includeOptions.properties = {
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
      }
      includeOptions.images = {
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
          { sortOrder: 'asc' }
        ]
      }
    }

    const [furnitures, total] = await Promise.all([
      prisma.furniture.findMany({
        where: whereClause,
        include: includeOptions,
        orderBy,
        skip,
        take: limit
      }),
      prisma.furniture.count({ where: whereClause })
    ])

    // Process results to group images by type if requested
    const processedFurnitures = furnitures.map(furniture => {
      const result: any = { ...furniture }
      
      if (includeImagesByType && furniture.images && Array.isArray(furniture.images)) {
        const imagesByType: {
          cover: any[];
          gallery: any[];
        } = {
          cover: [],
          gallery: []
        }
        
        furniture.images.forEach((furnitureImage: any) => {
          if (furnitureImage && furnitureImage.image) {
            const imageWithUrl = {
              ...furnitureImage,
              image: {
                ...furnitureImage.image,
                url: toPublicUrl(furnitureImage.image.filePath)
              }
            }
            
            // Group by sortOrder (image_1 is cover, rest is gallery)
            if (furnitureImage.sortOrder === 1) {
              imagesByType.cover.push(imageWithUrl)
            } else {
              imagesByType.gallery.push(imageWithUrl)
            }
          }
        })
        
        result.imagesByType = imagesByType
      }
      
      // Add URLs to regular images
      if (result.images) {
        result.images = result.images.map((furnitureImage: any) => ({
          ...furnitureImage,
          image: {
            ...furnitureImage.image,
            url: toPublicUrl(furnitureImage.image.filePath)
          }
        }))
      }
      
      return result
    })

    return NextResponse.json({
      success: true,
      data: processedFurnitures,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Furniture list error:', error)
    return NextResponse.json({
      success: false,
      error: 'Furniture could not be retrieved'
    }, { status: 500 })
  }
}

// POST - Enhanced furniture creation with category-based image support
export async function POST(request: Request) {
  let createdFurnitureId: number | null = null
  let imageFiles: File[] = []

  try {
    const contentType = request.headers.get('content-type') || ''
    let data: any = {}

    // FormData (file uploads) or JSON
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      
      // Furniture data
      data = {
        furnitureName: formData.get('furnitureName') as string,
        furnitureType: formData.get('furnitureType') as string,
        categoryId: formData.get('categoryId') as string,
        description: formData.get('description') as string,
        price: formData.get('price') as string,
        isActive: formData.get('isActive') as string,
        colorIds: formData.get('colorIds') as string, // Still support colors (optional)
        properties: formData.get('properties') as string,
        imageTypeMappings: formData.get('imageTypeMappings') as string, // NEW: Image type mappings
      }

      // Image files
      const files = formData.getAll('images') as File[]
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
      isActive = true,
      colorIds = [], // Optional colors
      properties = [],
      imageTypeMappings
    } = data

    // Parse JSON strings
    let parsedColorIds = colorIds
    let parsedProperties = properties
    let parsedImageTypeMappings = imageTypeMappings

    if (typeof colorIds === 'string') {
      parsedColorIds = colorIds ? JSON.parse(colorIds) : []
    }
    if (typeof properties === 'string') {
      parsedProperties = properties ? JSON.parse(properties) : []
    }
    if (typeof imageTypeMappings === 'string') {
      parsedImageTypeMappings = imageTypeMappings ? JSON.parse(imageTypeMappings) : {}
    }

    // Validations
    const validationErrors = []

    if (!furnitureName || typeof furnitureName !== 'string' || furnitureName.trim().length === 0) {
      validationErrors.push('Furniture name is required')
    } else if (furnitureName.trim().length > 100) {
      validationErrors.push('Furniture name cannot exceed 100 characters')
    }

    if (!furnitureType || typeof furnitureType !== 'string' || furnitureType.trim().length === 0) {
      validationErrors.push('Furniture type is required')
    }

    if (price === undefined || price === null || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      validationErrors.push('A valid price must be entered')
    }

    if (categoryId && (isNaN(parseInt(categoryId)) || parseInt(categoryId) <= 0)) {
      validationErrors.push('A valid category ID must be entered')
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        validationErrors
      }, { status: 400 })
    }

    // Get category information for path generation
    let categoryName = 'uncategorized'
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { categoryId: parseInt(String(categoryId)) }
      })
      
      if (!category) {
        return NextResponse.json({
          success: false,
          error: 'Specified category not found'
        }, { status: 400 })
      }

      if (!category.isActive) {
        return NextResponse.json({
          success: false,
          error: 'Cannot add furniture to inactive category'
        }, { status: 400 })
      }
      
      categoryName = category.categoryName
    }

    // Generate category slug for path creation
    const categorySlug = slugifyCategory(categoryName)

    // Check for duplicate furniture name
    const existingFurniture = await prisma.furniture.findFirst({
      where: {
        furnitureName: {
          equals: furnitureName.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (existingFurniture) {
      return NextResponse.json({
        success: false,
        error: 'A furniture with this name already exists'
      }, { status: 400 })
    }

    // Validate colors if provided (optional)
    if (parsedColorIds && parsedColorIds.length > 0) {
      const colorIdNumbers = parsedColorIds.map((id: number) => parseInt(String(id))).filter((id: number) => !isNaN(id))
      
      if (colorIdNumbers.length > 0) {
        const existingColors = await prisma.color.findMany({
          where: { 
            colorId: { in: colorIdNumbers },
            isActive: true 
          }
        })

        if (existingColors.length !== colorIdNumbers.length) {
          return NextResponse.json({
            success: false,
            error: 'Some colors could not be found or are inactive'
          }, { status: 400 })
        }
      }
    }

    // Validate properties if provided
    if (parsedProperties && parsedProperties.length > 0) {
      const propertyIds = parsedProperties.map((p: PropertyInput) => parseInt(String(p.propertyId))).filter((id: number) => !isNaN(id))
      
      if (propertyIds.length > 0) {
        const existingProperties = await prisma.property.findMany({
          where: { 
            propertyId: { in: propertyIds },
            isActive: true 
          }
        })

        if (existingProperties.length !== propertyIds.length) {
          return NextResponse.json({
            success: false,
            error: 'Some properties could not be found or are inactive'
          }, { status: 400 })
        }
      }
    }

    // Process image files with new system AFTER furniture creation
    // (We need furniture ID for proper path generation)

    // Main transaction - Create furniture and related records
    const furniture = await prisma.$transaction(async (tx) => {
      // 1. Create furniture
      const newFurniture = await tx.furniture.create({
        data: {
          furnitureName: furnitureName.trim(),
          furnitureType: furnitureType.trim(),
          categoryId: categoryId ? parseInt(String(categoryId)) : null,
          description: description?.trim() || null,
          price: parseFloat(String(price)),
          isActive: Boolean(isActive === 'true' || isActive === true)
        }
      })

      createdFurnitureId = newFurniture.furnitureId

      // 2. Add colors (optional)
      if (parsedColorIds && parsedColorIds.length > 0) {
        const colorIdNumbers = parsedColorIds.map((id: number) => parseInt(String(id))).filter((id: number) => !isNaN(id))
        
        if (colorIdNumbers.length > 0) {
          await tx.furnitureColor.createMany({
            data: colorIdNumbers.map((colorId: number) => ({
              furnitureId: newFurniture.furnitureId,
              colorId: colorId,
              isAvailable: true
            }))
          })
        }
      }

      // 3. Add properties
      if (parsedProperties && parsedProperties.length > 0) {
        await tx.furnitureProperty.createMany({
          data: parsedProperties.map((prop: PropertyInput) => ({
            furnitureId: newFurniture.furnitureId,
            propertyId: parseInt(String(prop.propertyId)),
            propertyValue: prop.propertyValue.trim(),
            isActive: true
          }))
        })
      }

      return newFurniture
    }, {
      timeout: 30000
    })

    // Process images after successful furniture creation (now we have the ID)
    let imageResults: any[] = []
    if (imageFiles.length > 0) {
      try {
        imageResults = await processImageFiles(
          imageFiles, 
          furniture.furnitureId, // Now we have the actual ID
          categorySlug
        )
      } catch (imageProcessError) {
        console.warn('Image processing error after furniture creation:', imageProcessError)
        // Image error doesn't prevent furniture creation, just warns
      }
    }

    // Get created furniture with all related data
    const createdFurniture = await prisma.furniture.findUnique({
      where: { furnitureId: furniture.furnitureId },
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
      ...createdFurniture,
      images: createdFurniture?.images.map(fi => ({
        ...fi,
        image: {
          ...fi.image,
          url: toPublicUrl(fi.image.filePath)
        }
      })) || []
    }

    const response: any = {
      success: true,
      message: 'Furniture successfully added',
      data: furnitureWithUrls
    }

    // Add image upload results
    if (imageFiles.length > 0) {
      response.imageResults = {
        uploaded: imageResults.length,
        total: imageFiles.length,
        details: imageResults,
        paths: imageResults.map((img: any) => ({
          fileName: img.fileName,
          sortOrder: img.sortOrder,
          publicUrl: img.publicUrl,
          savedPath: img.savedPath
        }))
      }
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Furniture creation error:', error)
    
    // Cleanup if furniture was created but error occurred later
    if (createdFurnitureId) {
      try {
        await prisma.$transaction(async (tx) => {
          if (createdFurnitureId !== null) {
            await tx.furnitureImage.deleteMany({
              where: { furnitureId: createdFurnitureId! }
            })
          }
          if (createdFurnitureId !== null) {
            await tx.furnitureProperty.deleteMany({
              where: { furnitureId: createdFurnitureId! }
            })
          }
          if (createdFurnitureId !== null) {
            await tx.furnitureColor.deleteMany({
              where: { furnitureId: createdFurnitureId! }
            })
          }
          await tx.furniture.delete({
            where: { furnitureId: createdFurnitureId! }
          })
        })
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError)
      }
    }
    
    return NextResponse.json({
      success: false,
      message: 'Error occurred while adding furniture',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Enhanced bulk furniture deletion (unchanged functionality)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    
    if (!idsParam?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Furniture IDs to delete must be specified'
      }, { status: 400 })
    }

    const ids = idsParam.split(',')
      .map((id: string) => parseInt(id.trim()))
      .filter((id: number) => !isNaN(id) && id > 0)
    
    if (ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid furniture IDs found'
      }, { status: 400 })
    }

    // Check furniture and related images
    const furnitures = await prisma.furniture.findMany({
      where: { furnitureId: { in: ids } },
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
        }
      }
    })

    if (furnitures.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No furniture found with specified IDs'
      }, { status: 404 })
    }

    // Collect image IDs
    const allImageIds: number[] = []
    furnitures.forEach(furniture => {
      furniture.images.forEach(fi => {
        allImageIds.push(fi.image.imageId)
      })
    })

    // Transaction to delete furniture
    const result = await prisma.$transaction(async (tx) => {
      const foundIds = furnitures.map((f) => f.furnitureId)
      
      // Delete related records
      await tx.furnitureImage.deleteMany({
        where: { furnitureId: { in: foundIds } }
      })
      
      await tx.furnitureProperty.deleteMany({
        where: { furnitureId: { in: foundIds } }
      })
      
      await tx.furnitureColor.deleteMany({
        where: { furnitureId: { in: foundIds } }
      })

      // Delete furniture
      return await tx.furniture.deleteMany({
        where: { furnitureId: { in: foundIds } }
      })
    })

    // Delete images after successful transaction using new deleteImage function
    let imageDeleteResults = []
    if (allImageIds.length > 0) {
      try {
        console.log(`🗑️ Deleting ${allImageIds.length} images: ${allImageIds}`)
        for (const imageId of allImageIds) {
          const imageIdNumber = parseInt(imageId.toString())
          if (isNaN(imageIdNumber)) continue
          
          const deleted = await deleteImage(imageIdNumber, 'furnitures')
          imageDeleteResults.push({ imageId, deleted })
          if (deleted) {
            console.log(`✅ Successfully deleted image: ${imageId}`)
          } else {
            console.log(`❌ Failed to delete image: ${imageId}`)
          }
        }
      } catch (error) {
        console.warn('Image deletion error:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} furniture successfully deleted`,
      deletedCount: result.count,
      deletedItems: furnitures.map((f) => ({ 
        id: f.furnitureId, 
        name: f.furnitureName 
      })),
      imageDeleteResults
    })

  } catch (error) {
    console.error('Bulk furniture deletion error:', error)
    return NextResponse.json({
      success: false,
      error: 'Furniture could not be deleted'
    }, { status: 500 })
  }
}

// PATCH - Enhanced bulk furniture status update (unchanged functionality)
export async function PATCH(request: Request) {
  try {
    const data = await request.json()
    const { ids, isActive } = data

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Furniture IDs to update must be specified'
      }, { status: 400 })
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'isActive value must be boolean (true/false)'
      }, { status: 400 })
    }

    const validIds = ids.map((id: number) => parseInt(String(id))).filter((id: number) => !isNaN(id) && id > 0)
    
    if (validIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid furniture IDs found'
      }, { status: 400 })
    }

    const existingFurnitures = await prisma.furniture.findMany({
      where: { furnitureId: { in: validIds } },
      select: { furnitureId: true }
    })

    if (existingFurnitures.length !== validIds.length) {
      return NextResponse.json({
        success: false,
        error: 'Some furniture could not be found'
      }, { status: 400 })
    }

    const updated = await prisma.furniture.updateMany({
      where: { furnitureId: { in: validIds } },
      data: { isActive }
    })

    return NextResponse.json({
      success: true,
      message: `${updated.count} furniture status updated to ${isActive ? 'active' : 'inactive'}`,
      updatedCount: updated.count
    })

  } catch (error) {
    console.error('Bulk furniture update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Furniture status could not be updated'
    }, { status: 500 })
  }
}