// app/api/products/route.ts - Unified Products API with Prisma Database Integration
// Bu API furniture ve furniture-sets'i birleştirerek tek endpoint sağlar

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { toPublicUrl } from '@/lib/image-utils'
import { 
  getCategoryBySlug, 
  categorySlugToId, 
  convertLegacyCategorySlug,
  getMainCategorySlug 
} from '@/lib/category-mapping'

// GET - Birleşik ürün listesi (Furniture + FurnitureSet)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const categoryParam = searchParams.get('category') || searchParams.get('categoryId')
    const subCategoryParam = searchParams.get('subCategory')
    const type = searchParams.get('type') as 'furniture' | 'furniture_set' | null
    const search = searchParams.get('search')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const isActive = searchParams.get('active')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const includeDetails = searchParams.get('includeDetails') === 'true'
    const random = searchParams.get('random') === 'true'

    // Kategori ID'sini çözümle
    let categoryId: number | null = null
    if (categoryParam) {
      // Önce sayısal ID olup olmadığını kontrol et
      if (!isNaN(parseInt(categoryParam))) {
        categoryId = parseInt(categoryParam)
      } else {
        // Slug ise veritabanından kategori ara
        try {
          const slugToName: { [key: string]: string } = {
            'oturma-odasi': 'Oturma Odası',
            'yemek-odasi': 'Yemek Odası',
            'yatak-odasi': 'Yatak Odası',
            'uclu-koltuklar': 'Üçlü Koltuklar',
            'ikili-koltuklar': 'İkili Koltuklar',
            'kose-koltuklar': 'Köşe Koltuklar',
            'berjer-koltuklar': 'Berjer Koltuklar',
            'tv-uniteleri': 'TV Üniteleri',
            'sehpalar': 'Sehpalar',
            'yemek-masalari': 'Yemek Masaları',
            'yemek-sandalyeleri': 'Yemek Sandalyeleri',
            'konsol-vitrin': 'Konsol ve Vitrinler',
            'yataklar': 'Yataklar',
            'gardiroplar': 'Gardıroplar',
            'komodinler': 'Komodinler',
            'makyaj-masalari': 'Makyaj Masaları',
            'sifonyerler': 'Şifonyerler'
          };
          
          const categoryName = slugToName[categoryParam];
          if (categoryName) {
            const category = await prisma.category.findFirst({
              where: { categoryName: categoryName }
            });
            if (category) {
              categoryId = category.categoryId;
            }
          }
        } catch (error) {
          console.error('Error finding category by slug:', error);
        }
      }
    }

    // Alt kategori ID'sini çözümle
    let subCategoryId: number | null = null
    if (subCategoryParam) {
      if (!isNaN(parseInt(subCategoryParam))) {
        subCategoryId = parseInt(subCategoryParam)
      } else {
        // Slug ise veritabanından kategori ara
        try {
          const slugToName: { [key: string]: string } = {
            'uclu-koltuklar': 'Üçlü Koltuklar',
            'ikili-koltuklar': 'İkili Koltuklar',
            'kose-koltuklar': 'Köşe Koltuklar',
            'berjer-koltuklar': 'Berjer Koltuklar',
            'tv-uniteleri': 'TV Üniteleri',
            'sehpalar': 'Sehpalar',
            'yemek-masalari': 'Yemek Masaları',
            'yemek-sandalyeleri': 'Yemek Sandalyeleri',
            'konsol-vitrin': 'Konsol ve Vitrinler',
            'yataklar': 'Yataklar',
            'gardiroplar': 'Gardıroplar',
            'komodinler': 'Komodinler',
            'makyaj-masalari': 'Makyaj Masaları',
            'sifonyerler': 'Şifonyerler'
          };
          
          const categoryName = slugToName[subCategoryParam];
          if (categoryName) {
            const category = await prisma.category.findFirst({
              where: { categoryName: categoryName }
            });
            if (category) {
              subCategoryId = category.categoryId;
            }
          }
        } catch (error) {
          console.error('Error finding subcategory by slug:', error);
        }
      }
    }

    // Where conditions
    const furnitureWhere: any = {}
    const furnitureSetWhere: any = {}

    // Aktif durumu
    if (isActive !== null) {
      const activeValue = isActive === 'true'
      furnitureWhere.isActive = activeValue
      furnitureSetWhere.isActive = activeValue
    } else {
      furnitureWhere.isActive = true
      furnitureSetWhere.isActive = true
    }

    // Kategori filtresi
    if (subCategoryId) {
      furnitureWhere.categoryId = subCategoryId
    } else if (categoryId) {
      furnitureWhere.categoryId = categoryId
      furnitureSetWhere.categoryId = categoryId
    }

    // Arama filtresi
    if (search?.trim()) {
      furnitureWhere.OR = [
        { furnitureName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { furnitureType: { contains: search, mode: 'insensitive' } }
      ]
      
      furnitureSetWhere.OR = [
        { setName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fiyat filtresi
    if (minPrice || maxPrice) {
      const priceFilter: any = {}
      if (minPrice) priceFilter.gte = parseFloat(minPrice)
      if (maxPrice) priceFilter.lte = parseFloat(maxPrice)
      
      furnitureWhere.price = priceFilter
      furnitureSetWhere.price = priceFilter
    }

    // Sıralama
    const validSortFields = ['furnitureName', 'setName', 'price', 'createdAt']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc'

    let furnitureOrderBy: any
    let furnitureSetOrderBy: any

    if (random) {
      furnitureOrderBy = { furnitureId: 'asc' } 
      furnitureSetOrderBy = { setId: 'asc' }
    } else {
      furnitureOrderBy = sortField === 'setName' ? { furnitureName: orderDirection } : { [sortField]: orderDirection }
      furnitureSetOrderBy = sortField === 'furnitureName' ? { setName: orderDirection } : { [sortField]: orderDirection }
    }

    // Paralel sorgular
    let furniturePromise: Promise<any[]> = Promise.resolve([])
    let furnitureSetPromise: Promise<any[]> = Promise.resolve([])

    if (!type || type === 'furniture') {
      furniturePromise = prisma.furniture.findMany({
        where: furnitureWhere,
        include: {
          category: true,
          ...(includeDetails ? {
            colors: {
              include: { color: true },
              where: { isAvailable: true }
            },
            properties: {
              include: { property: true },
              where: { isActive: true }
            },
            images: {
              include: { image: true },
              where: { isActive: true },
              orderBy: [
                { imageType: 'asc' },
                { sortOrder: 'asc' }
              ]
            }
          } : {}),
          _count: {
            select: {
              colors: true,
              properties: true,
              images: true
            }
          }
        },
        orderBy: furnitureOrderBy,
        take: limit,
        skip: (page - 1) * limit
      })
    }

    if ((!type || type === 'furniture_set') && !subCategoryId) {
      furnitureSetPromise = prisma.furnitureSet.findMany({
        where: furnitureSetWhere,
        include: {
          category: true,
          ...(includeDetails ? {
            furnitureSetColors: {
              include: { color: true },
              where: { isAvailable: true }
            },
            furnitureSetProperties: {
              include: { property: true },
              where: { isActive: true }
            },
            furnitureSetImages: {
              include: { image: true },
              where: { isActive: true },
              orderBy: [
                { imageType: 'asc' },
                { sortOrder: 'asc' }
              ]
            }
          } : {}),
          _count: {
            select: {
              furnitureSetColors: true,
              furnitureSetProperties: true,
              furnitureSetImages: true,
              furnitureSetItems: true
            }
          }
        },
        orderBy: furnitureSetOrderBy,
        take: limit,
        skip: (page - 1) * limit
      })
    }

    const [furnitures, furnitureSets] = await Promise.all([furniturePromise, furnitureSetPromise])

    // Veriyi frontend formatına çevir
    const transformedFurnitures = furnitures.map(transformFurnitureToProduct)
    const transformedSets = furnitureSets.map(transformFurnitureSetToProduct)

    // Birleştir ve sırala
    const allProducts = [...transformedFurnitures, ...transformedSets]
    
    if (random) {
      for (let i = allProducts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allProducts[i], allProducts[j]] = [allProducts[j], allProducts[i]];
      }
    } else {
      if (sortField === 'createdAt') {
        allProducts.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime()
          const dateB = new Date(b.createdAt || 0).getTime()
          return orderDirection === 'asc' ? dateA - dateB : dateB - dateA
        })
      } else if (sortField === 'price') {
        allProducts.sort((a, b) => {
          return orderDirection === 'asc' ? a.price - b.price : b.price - a.price
        })
      }
    }

    const totalFurnitures = !type || type === 'furniture' ? 
      await prisma.furniture.count({ where: furnitureWhere }) : 0
    const totalSets = (!type || type === 'furniture_set') && !subCategoryId ? 
      await prisma.furnitureSet.count({ where: furnitureSetWhere }) : 0
    const total = totalFurnitures + totalSets

    return NextResponse.json({
      success: true,
      data: allProducts.slice(0, limit),
      pagination: {
        page,
        limit,
        total,
        totalFurnitures,
        totalSets,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Ürünler getirilemedi'
    }, { status: 500 })
  }
}

function transformFurnitureToProduct(furniture: any) {
  const mainImage = furniture.images?.find((img: any) => img.imageType === 'main')?.image
  const galleryImages = furniture.images?.filter((img: any) => img.imageType === 'gallery') || []
  
  const categorySlug = furniture.category?.categoryName ? 
    furniture.category.categoryName.toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'uncategorized'

  return {
    id: furniture.furnitureId,
    imgSrc: toPublicUrl(mainImage?.filePath),
    imgHoverSrc: galleryImages[0]?.image?.filePath ? toPublicUrl(galleryImages[0].image.filePath) : undefined,
    title: furniture.furnitureName,
    price: Number(furniture.price),
    category: categorySlug,
    type: 'furniture',
    brand: 'HazarHome',
    description: furniture.description,
    furnitureType: furniture.furnitureType,
    categoryId: furniture.category?.categoryId,
    isActive: furniture.isActive,
    createdAt: furniture.createdAt,
    colors: furniture.colors?.map((colorRel: any) => ({
      id: `color-${colorRel.color.colorId}`,
      name: colorRel.color.colorName,
      value: colorRel.color.colorName,
      code: colorRel.color.colorCode || '#000000',
      colorClass: `bg-[${colorRel.color.colorCode || '#000000'}]`,
      imgSrc: toPublicUrl(mainImage?.filePath),
      isAvailable: colorRel.isAvailable
    })) || [],
    properties: furniture.properties?.map((prop: any) => ({
      name: prop.property.propertyName,
      value: prop.propertyValue,
      type: prop.property.propertyType
    })) || [],
    images: furniture.images?.map((img: any) => ({
      id: img.image.imageId,
      fileName: img.image.fileName,
      filePath: img.image.filePath,
      url: toPublicUrl(img.image.filePath),
      imageType: img.imageType,
      sortOrder: img.sortOrder,
      altText: img.image.altText
    })) || []
  }
}

function transformFurnitureSetToProduct(set: any) {
  const mainImage = set.furnitureSetImages?.find((img: any) => img.imageType === 'main')?.image
  const galleryImages = set.furnitureSetImages?.filter((img: any) => img.imageType === 'gallery') || []
  
  const categorySlug = set.category?.categoryName ? 
    set.category.categoryName.toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'uncategorized'

  return {
    id: set.setId,
    imgSrc: toPublicUrl(mainImage?.filePath),
    imgHoverSrc: galleryImages[0]?.image?.filePath ? toPublicUrl(galleryImages[0].image.filePath) : undefined,
    title: set.setName,
    price: Number(set.price),
    category: categorySlug,
    type: 'furniture_set',
    brand: 'HazarHome',
    description: set.description,
    setName: set.setName,
    categoryId: set.category?.categoryId,
    isActive: set.isActive,
    createdAt: set.createdAt,
    colors: set.furnitureSetColors?.map((colorRel: any) => ({
      id: `set-color-${colorRel.color.colorId}`,
      name: colorRel.color.colorName,
      value: colorRel.color.colorName,
      code: colorRel.color.colorCode || '#000000',
      colorClass: `bg-[${colorRel.color.colorCode || '#000000'}]`,
      imgSrc: toPublicUrl(mainImage?.filePath),
      isAvailable: colorRel.isAvailable
    })) || [],
    properties: set.furnitureSetProperties?.map((prop: any) => ({
      name: prop.property.propertyName,
      value: prop.propertyValue,
      type: prop.property.propertyType
    })) || [],
    images: set.furnitureSetImages?.map((img: any) => ({
      id: img.image.imageId,
      fileName: img.image.fileName,
      filePath: img.image.filePath,
      url: toPublicUrl(img.image.filePath),
      imageType: img.imageType,
      sortOrder: img.sortOrder,
      altText: img.image.altText
    })) || []
  }
}

export async function POST(request: NextRequest) {
  try {
    const filters = await request.json()
    const searchParams = new URLSearchParams()
    
    if (filters.category) searchParams.append('category', filters.category)
    if (filters.search) searchParams.append('search', filters.search)
    if (filters.type) searchParams.append('type', filters.type)
    if (filters.priceRange?.min) searchParams.append('minPrice', filters.priceRange.min.toString())
    if (filters.priceRange?.max) searchParams.append('maxPrice', filters.priceRange.max.toString())
    if (filters.limit) searchParams.append('limit', filters.limit.toString())
    if (filters.page) searchParams.append('page', filters.page.toString())
    if (filters.sortBy) searchParams.append('sortBy', filters.sortBy)
    
    searchParams.append('includeDetails', 'true')

    const getRequest = new NextRequest(`${request.url}?${searchParams.toString()}`, {
      method: 'GET'
    })
    
    return await GET(getRequest)

  } catch (error) {
    console.error('Products POST API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Filtrelenmiş ürünler getirilemedi'
    }, { status: 500 })
  }
}