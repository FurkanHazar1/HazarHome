// app/api/furniture-sets/route.ts - Simplified Image Management System
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  slugifyCategory, 
  processImageFiles,
  toPublicUrl,
  deleteImage
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

interface ImageFileWithMetadata {
  file: File;
  sortOrder: number;
  imageType: 'main' | 'gallery';
  altText?: string;
}

// GET - Enhanced furniture sets listing with parent category filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const categoryId = searchParams.get('categoryId')
    const isActive = searchParams.get('active')
    const search = searchParams.get('search')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minFurnitureCount = searchParams.get('minFurnitureCount')
    const maxFurnitureCount = searchParams.get('maxFurnitureCount')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const includeDetails = searchParams.get('includeDetails') === 'true'
    const includeImagesByType = searchParams.get('includeImagesByType') === 'true'
    const includeFurniturePreview = searchParams.get('includeFurniturePreview') === 'true'
    const parentCategoriesOnly = searchParams.get('parentCategoriesOnly') !== 'false' // Default true

    // Where conditions
    let whereClause: any = {}

    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    if (categoryId && !isNaN(parseInt(categoryId))) {
      whereClause.categoryId = parseInt(categoryId)
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
        { setName: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } }
      ]
    }

    // Parent categories only filter (categoryLevel = 1)
    if (parentCategoriesOnly) {
      whereClause.category = {
        categoryLevel: 1,
        isActive: true
      }
    }

    // Furniture count filtering
    if (minFurnitureCount || maxFurnitureCount) {
      const furnitureCountConditions: any = {}
      
      if (minFurnitureCount && !isNaN(parseInt(minFurnitureCount))) {
        furnitureCountConditions.gte = parseInt(minFurnitureCount)
      }
      if (maxFurnitureCount && !isNaN(parseInt(maxFurnitureCount))) {
        furnitureCountConditions.lte = parseInt(maxFurnitureCount)
      }
      
      // This requires a subquery - we'll filter after the query
    }

    const validSortFields = ['setName', 'price', 'createdAt', 'setId']
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
          categoryPath: true,
          categoryLevel: true
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

    if (includeDetails) {
      includeOptions.furnitureSetColors = {
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
      includeOptions.furnitureSetProperties = {
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
      includeOptions.furnitureSetImages = {
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
          { imageType: 'asc' }, // main images first
          { sortOrder: 'asc' }
        ]
      }
    }

    if (includeFurniturePreview) {
      includeOptions.furnitureSetItems = {
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
      }
    }
    // Note: We don't set furnitureSetItems to false here to avoid TypeScript issues
    // The count will always be available via _count.furnitureSetItems

    const [furnitureSets, total] = await Promise.all([
      prisma.furnitureSet.findMany({
        where: whereClause,
        include: includeOptions,
        orderBy,
        skip,
        take: limit
      }),
      prisma.furnitureSet.count({ where: whereClause })
    ])

    // Post-process for furniture count filtering
    let filteredSets = furnitureSets
    if (minFurnitureCount || maxFurnitureCount) {
      filteredSets = furnitureSets.filter(set => {
        // Type assertion for safe access to furniture count
        const setWithCount = set as any
        const furnitureCount = setWithCount._count?.furnitureSetItems || 0
        let matchesMin = true
        let matchesMax = true
        
        if (minFurnitureCount) {
          matchesMin = furnitureCount >= parseInt(minFurnitureCount)
        }
        if (maxFurnitureCount) {
          matchesMax = furnitureCount <= parseInt(maxFurnitureCount)
        }
        
        return matchesMin && matchesMax
      })
    }

    // Process results to group images by type if requested
    const processedSets = filteredSets.map(furnitureSet => {
      const result: any = { ...furnitureSet }
      
      if (includeImagesByType && 'furnitureSetImages' in furnitureSet && furnitureSet.furnitureSetImages && Array.isArray(furnitureSet.furnitureSetImages)) {
        const imagesByType: {
          main: any[];
          gallery: any[];
          thumbnails: any[];
        } = {
          main: [],
          gallery: [],
          thumbnails: []
        }
        
        furnitureSet.furnitureSetImages.forEach((setImage: any) => {
          if (setImage && setImage.image) {
            const imageWithUrl = {
              ...setImage,
              image: {
                ...setImage.image,
                url: toPublicUrl(setImage.image.filePath)
              }
            }
            
            // Group by imageType
            if (setImage.imageType === 'main') {
              imagesByType.main.push(imageWithUrl)
            } else if (setImage.imageType === 'thumbnail') {
              imagesByType.thumbnails.push(imageWithUrl)
            } else {
              imagesByType.gallery.push(imageWithUrl)
            }
          }
        })
        
        result.imagesByType = imagesByType
      }
      
      // Add URLs to regular images
      if ('furnitureSetImages' in result && result.furnitureSetImages) {
        result.furnitureSetImages = result.furnitureSetImages.map((setImage: any) => ({
          ...setImage,
          image: {
            ...setImage.image,
            url: toPublicUrl(setImage.image.filePath)
          }
        }))
      }
      
      // Calculate total quantity and individual furniture count
      if ('furnitureSetItems' in result && result.furnitureSetItems && Array.isArray(result.furnitureSetItems)) {
        result.stats = {
          totalQuantity: result.furnitureSetItems.reduce((sum: number, item: any) => sum + item.quantity, 0),
          uniqueFurnitureCount: result.furnitureSetItems.length,
          activeFurnitureCount: result.furnitureSetItems.filter((item: any) => item.furniture && item.furniture.isActive).length
        }
      } else {
        // Set default stats if furnitureSetItems is not included
        result.stats = {
          totalQuantity: 0,
          uniqueFurnitureCount: 0,
          activeFurnitureCount: 0
        }
      }
      
      return result
    })

    return NextResponse.json({
      success: true,
      data: processedSets,
      pagination: {
        page,
        limit,
        total: filteredSets.length, // Use filtered count
        totalUnfiltered: total,
        pages: Math.ceil(filteredSets.length / limit)
      },
      filters: {
        parentCategoriesOnly,
        categoryId: categoryId ? parseInt(categoryId) : null,
        search,
        priceRange: {
          min: minPrice ? parseFloat(minPrice) : null,
          max: maxPrice ? parseFloat(maxPrice) : null
        },
        furnitureCountRange: {
          min: minFurnitureCount ? parseInt(minFurnitureCount) : null,
          max: maxFurnitureCount ? parseInt(maxFurnitureCount) : null
        }
      }
    })

  } catch (error) {
    console.error('Furniture sets list error:', error)
    return NextResponse.json({
      success: false,
      error: 'Furniture sets could not be retrieved'
    }, { status: 500 })
  }
}

// POST - Enhanced furniture set creation with category-based image support
export async function POST(request: Request) {
  let createdSetId: number | null = null
  let imageFiles: File[] = []

  try {
    const contentType = request.headers.get('content-type') || ''
    let data: any = {}

    // FormData (file uploads) or JSON
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      
      // Furniture set data
      data = {
        setName: formData.get('setName') as string,
        categoryId: formData.get('categoryId') as string,
        description: formData.get('description') as string,
        price: formData.get('price') as string,
        isActive: formData.get('isActive') as string,
        colorIds: formData.get('colorIds') as string, // Optional colors
        properties: formData.get('properties') as string,
        furnitureItems: formData.get('furnitureItems') as string, // Required furniture items
        imageTypeMappings: formData.get('imageTypeMappings') as string,
      }

      // Image files
      const files = formData.getAll('images') as File[]
      imageFiles = files.filter(file => file.size > 0)

    } else {
      data = await request.json()
    }

    const {
      setName,
      categoryId,
      description,
      price,
      isActive = true,
      colorIds = [], // Optional colors
      properties = [],
      furnitureItems = [], // Required furniture items
      imageTypeMappings,
      uploadedImages // NEW: Direct S3 metadata
    } = data

    // Parse JSON strings
    let parsedColorIds = colorIds
    let parsedProperties = properties
    let parsedFurnitureItems = furnitureItems
    let parsedImageTypeMappings = imageTypeMappings
    let parsedUploadedImages = uploadedImages

    if (typeof colorIds === 'string') {
      parsedColorIds = colorIds ? JSON.parse(colorIds) : []
    }
    if (typeof properties === 'string') {
      parsedProperties = properties ? JSON.parse(properties) : []
    }
    if (typeof furnitureItems === 'string') {
      parsedFurnitureItems = furnitureItems ? JSON.parse(furnitureItems) : []
    }
    if (typeof imageTypeMappings === 'string') {
      parsedImageTypeMappings = imageTypeMappings ? JSON.parse(imageTypeMappings) : {}
    }
    if (typeof uploadedImages === 'string') {
      parsedUploadedImages = uploadedImages ? JSON.parse(uploadedImages) : []
    }

    // Enhanced validations
    const validationErrors = []

    if (!setName || typeof setName !== 'string' || setName.trim().length === 0) {
      validationErrors.push('Set name is required')
    } else if (setName.trim().length > 150) {
      validationErrors.push('Set name cannot exceed 150 characters')
    }

    if (!categoryId || isNaN(parseInt(categoryId)) || parseInt(categoryId) <= 0) {
      validationErrors.push('A valid parent category ID must be selected')
    }

    if (price === undefined || price === null || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      validationErrors.push('A valid price must be entered')
    }

    // Mobilya ekleme artık zorunlu değil - opsiyonel oldu

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        validationErrors
      }, { status: 400 })
    }

    // Validate category - must be parent category (level 1)
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
        error: 'Cannot create set in inactive category'
      }, { status: 400 })
    }

    if (category.categoryLevel !== 1) {
      return NextResponse.json({
        success: false,
        error: 'Furniture sets can only be created in parent categories (level 1). Please select a main category like "Salon Takımı", "Yatak Odası Takımı", etc.'
      }, { status: 400 })
    }

    // Generate category slug for path creation
    const categorySlug = slugifyCategory(category.categoryName)

    // Check for duplicate set name
    const existingSet = await prisma.furnitureSet.findFirst({
      where: {
        setName: {
          equals: setName.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (existingSet) {
      return NextResponse.json({
        success: false,
        error: 'A furniture set with this name already exists'
      }, { status: 400 })
    }

    // Validate furniture items if provided (opsiyonel)
    if (parsedFurnitureItems && Array.isArray(parsedFurnitureItems) && parsedFurnitureItems.length > 0) {
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
        },
        select: {
          furnitureId: true,
          furnitureName: true,
          price: true
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
        if (!item.furnitureId || isNaN(parseInt(String(item.furnitureId)))) {
          validationErrors.push('All furniture items must have valid furniture IDs')
        }
        if (!item.quantity || isNaN(parseInt(String(item.quantity))) || parseInt(String(item.quantity)) <= 0) {
          validationErrors.push('All furniture items must have valid quantities (greater than 0)')
        }
      }

      if (validationErrors.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'Furniture items validation error',
          validationErrors
        }, { status: 400 })
      }
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

    // Process image files with new system AFTER furniture set creation
    // (We need set ID for proper path generation)

    // Main transaction - Create furniture set and related records
    const furnitureSet = await prisma.$transaction(async (tx) => {
      // 1. Create furniture set
      const newSet = await tx.furnitureSet.create({
        data: {
          setName: setName.trim(),
          categoryId: parseInt(String(categoryId)),
          description: description?.trim() || null,
          price: parseFloat(String(price)),
          isActive: Boolean(isActive === 'true' || isActive === true)
        }
      })

      createdSetId = newSet.setId

      // 2. Add furniture items (opsiyonel)
      if (parsedFurnitureItems && Array.isArray(parsedFurnitureItems) && parsedFurnitureItems.length > 0) {
        await tx.furnitureSetAndFurniture.createMany({
          data: parsedFurnitureItems.map((item: FurnitureItemInput, index: number) => ({
            furnitureSetId: newSet.setId,
            furnitureId: parseInt(String(item.furnitureId)),
            quantity: parseInt(String(item.quantity)),
            sortOrder: item.sortOrder || index + 1
          }))
        })
      }

      // 3. Add colors (optional)
      if (parsedColorIds && parsedColorIds.length > 0) {
        const colorIdNumbers = parsedColorIds.map((id: number) => parseInt(String(id))).filter((id: number) => !isNaN(id))
        
        if (colorIdNumbers.length > 0) {
          await tx.furnitureSetColor.createMany({
            data: colorIdNumbers.map((colorId: number) => ({
              furnitureSetId: newSet.setId,
              colorId: colorId,
              isAvailable: true
            }))
          })
        }
      }

      // 4. Add properties
      if (parsedProperties && parsedProperties.length > 0) {
        await tx.furnitureSetProperty.createMany({
          data: parsedProperties.map((prop: PropertyInput) => ({
            furnitureSetId: newSet.setId,
            propertyId: parseInt(String(prop.propertyId)),
            propertyValue: prop.propertyValue.trim(),
            isActive: true
          }))
        })
      }

      return newSet
    }, {
      timeout: 30000
    })

    // 4. Handle Image Records
    let imageResults: any[] = []

    // 4a. Process already uploaded S3 images (Direct Upload)
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
              furnitureSetId: furnitureSet.setId,
              imageId: imageRecord.imageId,
              imageType: img.imageType || 'gallery',
              sortOrder: img.sortOrder || 1,
              isActive: true
            }
          })
          imageResults.push({ ...img, success: true })
        } catch (s3Error) {
          console.error('Error saving direct S3 image to DB for set:', s3Error)
        }
      }
    }

    // 4b. Process traditional file uploads (Fallback)
    if (imageFiles.length > 0) {
      try {
        const fileResults = await processImageFiles(
          imageFiles, 
          furnitureSet.setId,
          categorySlug,
          'furniture-sets'
        )
        imageResults = [...imageResults, ...fileResults]
      } catch (imageProcessError) {
        console.warn('Image processing error after furniture set creation:', imageProcessError)
      }
    }

    // Get created furniture set with all related data
    const createdSet = await prisma.furnitureSet.findUnique({
      where: { setId: furnitureSet.setId },
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
    const createdFurnitureItems = createdSet && 'furnitureSetItems' in createdSet ? createdSet.furnitureSetItems : []
    const setWithUrls = {
      ...createdSet,
      furnitureSetImages: createdSet?.furnitureSetImages.map(si => ({
        ...si,
        image: {
          ...si.image,
          url: toPublicUrl(si.image.filePath)
        }
      })) || [],
      stats: {
        totalQuantity: createdFurnitureItems.reduce((sum, item) => sum + item.quantity, 0),
        uniqueFurnitureCount: createdFurnitureItems.length,
        totalIndividualPrice: createdFurnitureItems.reduce((sum, item) => sum + (Number(item.furniture.price) * item.quantity), 0),
        setSavings: createdSet ? (createdFurnitureItems.reduce((sum, item) => sum + (Number(item.furniture.price) * item.quantity), 0) - Number(createdSet.price)) : 0
      }
    }

    const response: any = {
      success: true,
      message: 'Furniture set successfully created',
      data: setWithUrls
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
    console.error('Furniture set creation error:', error)
    
    // Cleanup if set was created but error occurred later
    if (createdSetId) {
      try {
        await prisma.$transaction(async (tx) => {
          if (createdSetId !== null) {
            await tx.furnitureSetImage.deleteMany({
              where: { furnitureSetId: createdSetId! }
            })
          }
          if (createdSetId !== null) {
            await tx.furnitureSetProperty.deleteMany({
              where: { furnitureSetId: createdSetId! }
            })
          }
          if (createdSetId !== null) {
            await tx.furnitureSetColor.deleteMany({
              where: { furnitureSetId: createdSetId! }
            })
          }
          if (createdSetId !== null) {
            await tx.furnitureSetAndFurniture.deleteMany({
              where: { furnitureSetId: createdSetId! }
            })
          }
          await tx.furnitureSet.delete({
            where: { setId: createdSetId! }
          })
        })
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError)
      }
    }
    
    return NextResponse.json({
      success: false,
      message: 'Error occurred while creating furniture set',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Enhanced bulk furniture set deletion
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    
    if (!idsParam?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Furniture set IDs to delete must be specified'
      }, { status: 400 })
    }

    const ids = idsParam.split(',')
      .map((id: string) => parseInt(id.trim()))
      .filter((id: number) => !isNaN(id) && id > 0)
    
    if (ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid furniture set IDs found'
      }, { status: 400 })
    }

    // Check furniture sets and related images
    const furnitureSets = await prisma.furnitureSet.findMany({
      where: { setId: { in: ids } },
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
        }
      }
    })

    if (furnitureSets.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No furniture sets found with specified IDs'
      }, { status: 404 })
    }

    // Collect image IDs
    const allImageIds: number[] = []
    furnitureSets.forEach(set => {
      set.furnitureSetImages.forEach(si => {
        allImageIds.push(si.image.imageId)
      })
    })

    // Transaction to delete furniture sets
    const result = await prisma.$transaction(async (tx) => {
      const foundIds = furnitureSets.map((s) => s.setId)
      
      // Delete related records
      await tx.furnitureSetImage.deleteMany({
        where: { furnitureSetId: { in: foundIds } }
      })
      
      await tx.furnitureSetProperty.deleteMany({
        where: { furnitureSetId: { in: foundIds } }
      })
      
      await tx.furnitureSetColor.deleteMany({
        where: { furnitureSetId: { in: foundIds } }
      })

      await tx.furnitureSetAndFurniture.deleteMany({
        where: { furnitureSetId: { in: foundIds } }
      })

      // Delete furniture sets
      return await tx.furnitureSet.deleteMany({
        where: { setId: { in: foundIds } }
      })
    })

    // Delete images after successful transaction using new deleteImage function
    let imageDeleteResults = []
    if (allImageIds.length > 0) {
      try {
        console.log(`🗑️ Deleting ${allImageIds.length} furniture-set images: ${allImageIds}`)
        for (const imageId of allImageIds) {
          const imageIdNumber = parseInt(imageId.toString())
          if (isNaN(imageIdNumber)) continue
          
          const deleted = await deleteImage(imageIdNumber, 'furniture-sets')
          imageDeleteResults.push({ imageId, deleted })
          if (deleted) {
            console.log(`✅ Successfully deleted furniture-set image: ${imageId}`)
          } else {
            console.log(`❌ Failed to delete furniture-set image: ${imageId}`)
          }
        }
      } catch (error) {
        console.warn('Furniture-set image deletion error:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} furniture sets successfully deleted`,
      deletedCount: result.count,
      deletedItems: furnitureSets.map((s) => ({ 
        id: s.setId, 
        name: s.setName 
      })),
      imageDeleteResults
    })

  } catch (error) {
    console.error('Bulk furniture set deletion error:', error)
    return NextResponse.json({
      success: false,
      error: 'Furniture sets could not be deleted'
    }, { status: 500 })
  }
}

// PATCH - Enhanced bulk furniture set status update
export async function PATCH(request: Request) {
  try {
    const data = await request.json()
    const { ids, isActive } = data

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Furniture set IDs to update must be specified'
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
        error: 'No valid furniture set IDs found'
      }, { status: 400 })
    }

    const existingSets = await prisma.furnitureSet.findMany({
      where: { setId: { in: validIds } },
      select: { setId: true }
    })

    if (existingSets.length !== validIds.length) {
      return NextResponse.json({
        success: false,
        error: 'Some furniture sets could not be found'
      }, { status: 400 })
    }

    const updated = await prisma.furnitureSet.updateMany({
      where: { setId: { in: validIds } },
      data: { isActive }
    })

    return NextResponse.json({
      success: true,
      message: `${updated.count} furniture set status updated to ${isActive ? 'active' : 'inactive'}`,
      updatedCount: updated.count
    })

  } catch (error) {
    console.error('Bulk furniture set update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Furniture set status could not be updated'
    }, { status: 500 })
  }
}