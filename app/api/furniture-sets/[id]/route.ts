// app/api/furniture-sets/[id]/route.ts - Single Furniture Set API with Category-Based Image System
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidateTag, revalidatePath } from 'next/cache'
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

    const processedFurnitureItems = 'furnitureSetItems' in furnitureSet && furnitureSet.furnitureSetItems 
      ? furnitureSet.furnitureSetItems.map(item => {
          const result: any = { ...item }
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

    const setFurnitureItems = 'furnitureSetItems' in furnitureSet ? furnitureSet.furnitureSetItems : []
    const totalQuantity = setFurnitureItems.reduce((sum, item) => sum + item.quantity, 0)
    const uniqueFurnitureCount = setFurnitureItems.length
    const activeFurnitureCount = setFurnitureItems.filter(item => item.furniture && item.furniture.isActive).length

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

// PUT
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const setId = parseInt(id)
    
    if (isNaN(setId) || setId <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid furniture set ID' }, { status: 400 })
    }

    const contentType = request.headers.get('content-type') || ''
    let data: any = {}
    let imageFiles: File[] = []

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      data = {
        setName: formData.get('setName'),
        categoryId: formData.get('categoryId'),
        description: formData.get('description'),
        price: formData.get('price'),
        isActive: formData.get('isActive'),
        colorIds: formData.get('colorIds'),
        properties: formData.get('properties'),
        furnitureItems: formData.get('furnitureItems'),
        removeImageIds: formData.get('removeImageIds'),
        updateImageOrder: formData.get('updateImageOrder'),
        imageTypeMappings: formData.get('imageTypeMappings'),
        uploadedImages: formData.get('uploadedImages')
      }
      imageFiles = (formData.getAll('newImages') as File[]).filter(f => f.size > 0)
    } else {
      data = await request.json()
    }

    const { setName, categoryId, description, price, isActive, colorIds, properties, furnitureItems, removeImageIds, updateImageOrder, uploadedImages } = data

    const parsedColorIds = typeof colorIds === 'string' ? JSON.parse(colorIds || '[]') : colorIds
    const parsedProperties = typeof properties === 'string' ? JSON.parse(properties || '[]') : properties
    const parsedFurnitureItems = typeof furnitureItems === 'string' ? JSON.parse(furnitureItems || '[]') : furnitureItems
    const parsedRemoveImageIds = typeof removeImageIds === 'string' ? JSON.parse(removeImageIds || '[]') : removeImageIds
    const parsedUpdateImageOrder = typeof updateImageOrder === 'string' ? JSON.parse(updateImageOrder || '[]') : updateImageOrder
    const parsedUploadedImages = typeof uploadedImages === 'string' ? JSON.parse(uploadedImages || '[]') : uploadedImages

    const existingSet = await prisma.furnitureSet.findUnique({
      where: { setId },
      include: { category: true }
    })

    if (!existingSet) return NextResponse.json({ success: false, error: 'Set not found' }, { status: 404 })

    const updatedSet = await prisma.$transaction(async (tx) => {
      const updateData: any = {}
      if (setName !== undefined) updateData.setName = setName.trim()
      if (categoryId !== undefined) updateData.categoryId = categoryId ? parseInt(categoryId) : null
      if (description !== undefined) updateData.description = description?.trim() || null
      if (price !== undefined) updateData.price = parseFloat(price)
      if (isActive !== undefined) updateData.isActive = Boolean(isActive === 'true' || isActive === true)

      const set = await tx.furnitureSet.update({ where: { setId }, data: updateData })

      if (parsedColorIds !== undefined) {
        await tx.furnitureSetColor.deleteMany({ where: { furnitureSetId: setId } })
        if (Array.isArray(parsedColorIds) && parsedColorIds.length > 0) {
          await tx.furnitureSetColor.createMany({
            data: parsedColorIds.map((cid: number) => ({ furnitureSetId: setId, colorId: parseInt(String(cid)), isAvailable: true }))
          })
        }
      }

      if (parsedFurnitureItems !== undefined) {
        await tx.furnitureSetAndFurniture.deleteMany({ where: { furnitureSetId: setId } })
        if (Array.isArray(parsedFurnitureItems) && parsedFurnitureItems.length > 0) {
          await tx.furnitureSetAndFurniture.createMany({
            data: parsedFurnitureItems.map((item: any, idx: number) => ({
              furnitureSetId: setId,
              furnitureId: parseInt(item.furnitureId),
              quantity: parseInt(item.quantity),
              sortOrder: item.sortOrder || idx + 1
            }))
          })
        }
      }

      return set
    })

    // Image operations
    if (parsedRemoveImageIds?.length > 0) {
      for (const imgId of parsedRemoveImageIds) await deleteImage(parseInt(imgId), 'furniture-sets')
    }

    if (parsedUpdateImageOrder?.length > 0) {
      for (const ord of parsedUpdateImageOrder) {
        await prisma.furnitureSetImage.updateMany({
          where: { furnitureSetId: setId, imageId: parseInt(ord.imageId) },
          data: { sortOrder: parseInt(ord.sortOrder), imageType: parseInt(ord.sortOrder) === 1 ? 'main' : 'gallery' }
        })
      }
    }

    if (imageFiles.length > 0) {
      const categorySlug = slugifyCategory(existingSet.category?.categoryName || 'unknown')
      await processImageFiles(imageFiles, setId, categorySlug, 'furniture-sets')
    }

    try {
      (revalidateTag as any)('products');
      (revalidateTag as any)('home-products');
      (revalidatePath as any)('/');
      (revalidatePath as any)(`/product-detail-furniture-set/${setId}`);
    } catch (e) {
      console.error('Revalidation error:', e);
    }

    return NextResponse.json({ success: true, data: updatedSet })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}

// DELETE
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const setId = parseInt(id)

    const furnitureSet = await prisma.furnitureSet.findUnique({
      where: { setId },
      include: { furnitureSetImages: { include: { image: true } } }
    })

    if (!furnitureSet) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const imageIds = furnitureSet.furnitureSetImages.map(si => si.imageId)

    await prisma.$transaction(async (tx) => {
      await tx.furnitureSetImage.deleteMany({ where: { furnitureSetId: setId } })
      await tx.furnitureSetAndFurniture.deleteMany({ where: { furnitureSetId: setId } })
      await tx.furnitureSet.delete({ where: { setId } })
    })

    for (const imgId of imageIds) await deleteImage(imgId, 'furniture-sets')

    try {
      (revalidateTag as any)('products');
      (revalidateTag as any)('home-products');
      (revalidatePath as any)('/');
      (revalidatePath as any)(`/product-detail-furniture-set/${setId}`);
    } catch (e) {
      console.error('Revalidation error:', e);
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
