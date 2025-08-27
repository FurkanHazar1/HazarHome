// app/api/products/[id]/route.ts - Single Product API (Furniture or FurnitureSet by ID and type)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Tekil ürün detayı (ID ve type ile)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    
    if (isNaN(productId) || productId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz ürün ID'
      }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'furniture' | 'furniture_set'
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const groupImagesByType = searchParams.get('groupImagesByType') === 'true'

    if (!type) {
      return NextResponse.json({
        success: false,
        error: 'Product type (furniture or furniture_set) is required'
      }, { status: 400 })
    }

    let product = null

    if (type === 'furniture') {
      const furniture = await prisma.furniture.findUnique({
        where: { furnitureId: productId },
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

      if (!furniture) {
        return NextResponse.json({
          success: false,
          error: 'Furniture not found'
        }, { status: 404 })
      }

      product = transformFurnitureToProduct(furniture, groupImagesByType)

    } else if (type === 'furniture_set') {
      const furnitureSet = await prisma.furnitureSet.findUnique({
        where: { setId: productId },
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

      if (!furnitureSet) {
        return NextResponse.json({
          success: false,
          error: 'Furniture set not found'
        }, { status: 404 })
      }

      product = transformFurnitureSetToProduct(furnitureSet, groupImagesByType)
    }

    return NextResponse.json({
      success: true,
      data: product
    })

  } catch (error) {
    console.error('Single product API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Ürün detayları getirilemedi'
    }, { status: 500 })
  }
}

// Furniture'ı Product formatına çevir
function transformFurnitureToProduct(furniture: any, groupImagesByType: boolean = false) {
  const categorySlug = furniture.category?.categoryName ? 
    furniture.category.categoryName.toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'uncategorized'

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
    imageGallery.main = furniture.images?.filter((img: any) => img.imageType === 'main') || []
    imageGallery.gallery = furniture.images?.filter((img: any) => img.imageType === 'gallery') || []
    imageGallery.thumbnails = furniture.images?.filter((img: any) => img.imageType === 'thumbnail') || []
  } else {
    imageGallery.images = furniture.images?.map((img: any) => ({
      ...img,
      image: {
        ...img.image,
        url: buildImageUrl(img.image.filePath)
      }
    })) || []
  }

  // Group properties by type
  const propertiesByType = furniture.properties?.reduce((acc: any, fp: any) => {
    const propertyType = fp.property.propertyType || 'Other'
    if (!acc[propertyType]) acc[propertyType] = []
    acc[propertyType].push({
      propertyId: fp.property.propertyId,
      propertyName: fp.property.propertyName,
      propertyValue: fp.propertyValue,
      description: fp.property.description,
      isActive: fp.isActive
    })
    return acc
  }, {}) || {}

  return {
    furnitureId: furniture.furnitureId,
    furnitureName: furniture.furnitureName,
    furnitureType: furniture.furnitureType,
    description: furniture.description,
    price: Number(furniture.price),
    isActive: furniture.isActive,
    createdAt: furniture.createdAt,
    category: furniture.category,
    breadcrumb,
    imageGallery,
    colorOptions: furniture.colors?.map((fc: any) => ({
      ...fc.color,
      isAvailable: fc.isAvailable
    })) || [],
    propertiesByType,
    stats: {
      totalColors: furniture._count.colors,
      totalProperties: furniture._count.properties,
      totalImages: furniture._count.images,
      activeColors: furniture.colors?.filter((fc: any) => fc.isAvailable && fc.color.isActive).length || 0,
      activeProperties: furniture.properties?.filter((fp: any) => fp.isActive && fp.property.isActive).length || 0,
      activeImages: furniture.images?.filter((fi: any) => fi.isActive).length || 0
    },
    metadata: {
      createdAt: furniture.createdAt,
      formattedPrice: new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
      }).format(Number(furniture.price)),
      categoryLevel: furniture.category?.categoryLevel || null,
      hasMainImage: furniture.images?.some((img: any) => img.imageType === 'main') || false,
      hasGalleryImages: furniture.images?.some((img: any) => img.imageType === 'gallery') || false,
      hasThumbnails: furniture.images?.some((img: any) => img.imageType === 'thumbnail') || false,
      categoryBasedPath: furniture.category 
        ? `furniture/${categorySlug}/${furniture.furnitureId}_${furniture.furnitureName.toLowerCase().replace(/\s+/g, '-')}`
        : null
    },
    // Frontend uyumluluğu için ek alanlar
    id: furniture.furnitureId,
    title: furniture.furnitureName,
    type: 'furniture',
    brand: 'HazarHome',
    categorySlug,
    imgSrc: furniture.images?.find((img: any) => img.imageType === 'main')?.image?.filePath ? 
      buildImageUrl(furniture.images.find((img: any) => img.imageType === 'main').image.filePath) : 
      '/images/products/placeholder.jpg',
    colors: furniture.colors?.map((colorRel: any) => ({
      id: `color-${colorRel.color.colorId}`,
      name: colorRel.color.colorName,
      value: colorRel.color.colorName,
      code: colorRel.color.colorCode || '#000000',
      colorClass: `bg-[${colorRel.color.colorCode || '#000000'}]`,
      imgSrc: furniture.images?.find((img: any) => img.imageType === 'main')?.image?.filePath ? 
        buildImageUrl(furniture.images.find((img: any) => img.imageType === 'main').image.filePath) : 
        '/images/products/placeholder.jpg',
      isAvailable: colorRel.isAvailable
    })) || []
  }
}

// FurnitureSet'i Product formatına çevir
function transformFurnitureSetToProduct(set: any, groupImagesByType: boolean = false) {
  const categorySlug = set.category?.categoryName ? 
    set.category.categoryName.toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'uncategorized'

  // Build breadcrumb
  const breadcrumb = []
  if (set.category) {
    if (set.category.parent) {
      breadcrumb.push({
        categoryId: set.category.parent.categoryId,
        categoryName: set.category.parent.categoryName,
        categoryPath: set.category.parent.categoryPath
      })
    }
    breadcrumb.push({
      categoryId: set.category.categoryId,
      categoryName: set.category.categoryName,
      categoryPath: set.category.categoryPath
    })
  }

  // Process images
  let imageGallery: any = {
    totalImages: set._count.furnitureSetImages
  }

  if (groupImagesByType) {
    imageGallery.main = set.furnitureSetImages?.filter((img: any) => img.imageType === 'main') || []
    imageGallery.gallery = set.furnitureSetImages?.filter((img: any) => img.imageType === 'gallery') || []
    imageGallery.thumbnails = set.furnitureSetImages?.filter((img: any) => img.imageType === 'thumbnail') || []
  } else {
    imageGallery.images = set.furnitureSetImages?.map((img: any) => ({
      ...img,
      image: {
        ...img.image,
        url: buildImageUrl(img.image.filePath)
      }
    })) || []
  }

  // Group properties by type
  const propertiesByType = set.furnitureSetProperties?.reduce((acc: any, sp: any) => {
    const propertyType = sp.property.propertyType || 'Other'
    if (!acc[propertyType]) acc[propertyType] = []
    acc[propertyType].push({
      propertyId: sp.property.propertyId,
      propertyName: sp.property.propertyName,
      propertyValue: sp.propertyValue,
      description: sp.property.description,
      isActive: sp.isActive
    })
    return acc
  }, {}) || {}

  return {
    setId: set.setId,
    setName: set.setName,
    description: set.description,
    price: Number(set.price),
    isActive: set.isActive,
    createdAt: set.createdAt,
    category: set.category,
    breadcrumb,
    imageGallery,
    colorOptions: set.furnitureSetColors?.map((fc: any) => ({
      ...fc.color,
      isAvailable: fc.isAvailable
    })) || [],
    propertiesByType,
    furnitureSetItems: set.furnitureSetItems?.map((item: any) => ({
      id: item.id,
      furnitureId: item.furnitureId,
      quantity: item.quantity,
      sortOrder: item.sortOrder,
      furniture: item.furniture
    })) || [],
    stats: {
      totalColors: set._count.furnitureSetColors,
      totalProperties: set._count.furnitureSetProperties,
      totalImages: set._count.furnitureSetImages,
      totalFurnitureItems: set._count.furnitureSetItems,
      activeColors: set.furnitureSetColors?.filter((fc: any) => fc.isAvailable && fc.color.isActive).length || 0,
      activeProperties: set.furnitureSetProperties?.filter((sp: any) => sp.isActive && sp.property.isActive).length || 0,
      activeImages: set.furnitureSetImages?.filter((fi: any) => fi.isActive).length || 0
    },
    metadata: {
      createdAt: set.createdAt,
      formattedPrice: new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
      }).format(Number(set.price)),
      categoryLevel: set.category?.categoryLevel || null,
      hasMainImage: set.furnitureSetImages?.some((img: any) => img.imageType === 'main') || false,
      hasGalleryImages: set.furnitureSetImages?.some((img: any) => img.imageType === 'gallery') || false,
      hasThumbnails: set.furnitureSetImages?.some((img: any) => img.imageType === 'thumbnail') || false,
      categoryBasedPath: set.category 
        ? `furniture-sets/${categorySlug}/${set.setId}_${set.setName?.toLowerCase().replace(/\s+/g, '-')}`
        : null
    },
    // Frontend uyumluluğu için ek alanlar
    id: set.setId,
    title: set.setName,
    type: 'furniture_set',
    brand: 'HazarHome',
    categorySlug,
    imgSrc: set.furnitureSetImages?.find((img: any) => img.imageType === 'main')?.image?.filePath ? 
      buildImageUrl(set.furnitureSetImages.find((img: any) => img.imageType === 'main').image.filePath) : 
      '/images/products/placeholder.jpg',
    colors: set.furnitureSetColors?.map((colorRel: any) => ({
      id: `set-color-${colorRel.color.colorId}`,
      name: colorRel.color.colorName,
      value: colorRel.color.colorName,
      code: colorRel.color.colorCode || '#000000',
      colorClass: `bg-[${colorRel.color.colorCode || '#000000'}]`,
      imgSrc: set.furnitureSetImages?.find((img: any) => img.imageType === 'main')?.image?.filePath ? 
        buildImageUrl(set.furnitureSetImages.find((img: any) => img.imageType === 'main').image.filePath) : 
        '/images/products/placeholder.jpg',
      isAvailable: colorRel.isAvailable
    })) || []
  }
}

// Image URL builder
function buildImageUrl(filePath: string): string {
  if (!filePath) return '/images/products/placeholder.jpg'
  
  if (filePath.startsWith('http') || filePath.startsWith('/api/')) {
    return filePath
  }
  
  const normalizedPath = filePath.replace(/\\/g, '/')
  
  if (normalizedPath.startsWith('/uploads/')) {
    return normalizedPath
  } else if (normalizedPath.startsWith('uploads/')) {
    return `/${normalizedPath}`
  } else {
    return `/uploads/${normalizedPath}`
  }
}
