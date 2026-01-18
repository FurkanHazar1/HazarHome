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

// POST - Enhanced furniture creation with direct S3 upload support
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
        colorIds: formData.get('colorIds') as string,
        properties: formData.get('properties') as string,
        imageTypeMappings: formData.get('imageTypeMappings') as string,
        uploadedImages: formData.get('uploadedImages') as string, // JSON string of S3 metadata
      }

      // Image files (traditional upload fallback)
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
      colorIds = [],
      properties = [],
      imageTypeMappings,
      uploadedImages
    } = data

    // Parse JSON strings
    let parsedColorIds = colorIds
    let parsedProperties = properties
    let parsedImageTypeMappings = imageTypeMappings
    let parsedUploadedImages = uploadedImages

    if (typeof colorIds === 'string') {
      parsedColorIds = colorIds ? JSON.parse(colorIds) : []
    }
    if (typeof properties === 'string') {
      parsedProperties = properties ? JSON.parse(properties) : []
    }
    if (typeof imageTypeMappings === 'string') {
      parsedImageTypeMappings = imageTypeMappings ? JSON.parse(imageTypeMappings) : {}
    }
    if (typeof uploadedImages === 'string') {
      parsedUploadedImages = uploadedImages ? JSON.parse(uploadedImages) : []
    }

    // Validations
    const validationErrors = []

    if (!furnitureName || typeof furnitureName !== 'string' || furnitureName.trim().length === 0) {
      validationErrors.push('Furniture name is required')
    }

    if (price === undefined || price === null || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      validationErrors.push('A valid price must be entered')
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
      if (category) categoryName = category.categoryName
    }

    const categorySlug = slugifyCategory(categoryName)

    // Main transaction
    const furniture = await prisma.$transaction(async (tx) => {
      // 1. Create furniture
      const newFurniture = await tx.furniture.create({
        data: {
          furnitureName: furnitureName.trim(),
          furnitureType: furnitureType || 'Genel',
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
          data: parsedProperties.map((prop: any) => ({
            furnitureId: newFurniture.furnitureId,
            propertyId: parseInt(String(prop.propertyId)),
            propertyValue: prop.propertyValue.trim(),
            isActive: true
          }))
        })
      }

      return newFurniture
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
              altText: img.altText || `${furnitureName} - Image`,
              fileSize: img.fileSize,
              fileType: 'webp'
            }
          })

          await prisma.furnitureImage.create({
            data: {
              furnitureId: furniture.furnitureId,
              imageId: imageRecord.imageId,
              imageType: img.imageType || 'gallery',
              sortOrder: img.sortOrder || 1,
              isActive: true
            }
          })
          imageResults.push({ ...img, success: true })
        } catch (s3Error) {
          console.error('Error saving direct S3 image to DB:', s3Error)
        }
      }
    }

    // 4b. Process traditional file uploads (Fallback)
    if (imageFiles.length > 0) {
      try {
        const fileResults = await processImageFiles(
          imageFiles, 
          furniture.furnitureId,
          categorySlug
        )
        imageResults = [...imageResults, ...fileResults]
      } catch (imageProcessError) {
        console.warn('Image processing error after furniture creation:', imageProcessError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Furniture successfully added',
      data: furniture,
      imageResults
    }, { status: 201 })

  } catch (error) {
    console.error('Furniture creation error:', error)
    return NextResponse.json({
      success: false,
      message: 'Error occurred while adding furniture',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Enhanced bulk furniture deletion
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
    
    if (ids.length === 0) return NextResponse.json({ success: false, error: 'No valid furniture IDs' }, { status: 400 })

    const furnitures = await prisma.furniture.findMany({
      where: { furnitureId: { in: ids } },
      include: { images: { include: { image: true } } }
    })

    const allImageIds: number[] = []
    furnitures.forEach(f => f.images.forEach(fi => allImageIds.push(fi.image.imageId)))

    const result = await prisma.$transaction(async (tx) => {
      const foundIds = furnitures.map((f) => f.furnitureId)
      await tx.furnitureImage.deleteMany({ where: { furnitureId: { in: foundIds } } })
      await tx.furnitureProperty.deleteMany({ where: { furnitureId: { in: foundIds } } })
      await tx.furnitureColor.deleteMany({ where: { furnitureId: { in: foundIds } } })
      return await tx.furniture.deleteMany({ where: { furnitureId: { in: foundIds } } })
    })

    if (allImageIds.length > 0) {
      for (const imageId of allImageIds) {
        await deleteImage(imageId, 'furnitures')
      }
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} furniture successfully deleted`
    })

  } catch (error) {
    console.error('Bulk furniture deletion error:', error)
    return NextResponse.json({ success: false, error: 'Furniture could not be deleted' }, { status: 500 })
  }
}

// PATCH - Enhanced bulk furniture status update
export async function PATCH(request: Request) {
  try {
    const data = await request.json()
    const { ids, isActive } = data
    if (!ids || !Array.isArray(ids) || ids.length === 0) return NextResponse.json({ success: false, error: 'IDs required' }, { status: 400 })

    const updated = await prisma.furniture.updateMany({
      where: { furnitureId: { in: ids.map(Number) } },
      data: { isActive }
    })

    return NextResponse.json({
      success: true,
      message: `${updated.count} furniture status updated`
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}
