// Ürün servisi - Prisma veritabanından ürün verilerini çeker ve dönüştürür
import { prisma } from './prisma'
import { 
  getCategoryById, 
  getCategoryBySlug,
  categoryIdToSlug, 
  getMainCategorySlug,
  buildCategoryBreadcrumb,
  type CategoryMapping 
} from './category-mapping'

// Type definitions matching frontend expectations
export interface ProductImage {
  id: string
  name: string
  value: string
  code: string
  colorClass: string
  imgSrc: string
  isAvailable: boolean
}

export interface ProductColor {
  id: string
  name: string
  value: string
  code: string
  colorClass: string
  imgSrc: string
  isAvailable: boolean
}

export interface Product {
  id: number
  imgSrc: string
  imgHoverSrc?: string
  title: string
  price: number
  oldPrice?: number
  category: string
  type: 'furniture' | 'furniture_set'
  brand?: string
  description?: string
  features?: string[]
  material?: string
  care?: string
  careInstructions?: string[]
  dimensions?: string
  warranty?: string
  colors?: ProductColor[]
  filterCategories?: string[]
  isActive?: boolean
  createdAt?: string
  // Additional fields from database
  furnitureType?: string
  setName?: string
  categoryId?: number
  categoryName?: string
  breadcrumb?: CategoryMapping[]
}

export interface ProductFilters {
  category?: string
  subCategory?: string
  type?: 'furniture' | 'furniture_set'
  limit?: number
  offset?: number
  useStatic?: boolean
  search?: string
  minPrice?: number
  maxPrice?: number
  colorId?: number
  isActive?: boolean
}

export interface PaginatedResult {
  products: Product[]
  pagination: {
    currentPage: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Veritabanından image URL'sini oluşturur
 */
function buildImageUrl(filePath: string | null, fallback: string = '/images/products/placeholder.jpg'): string {
  if (!filePath) return fallback
  
  // Eğer zaten tam URL ise direkt döndür
  if (filePath.startsWith('http') || filePath.startsWith('/api/')) {
    return filePath
  }
  
  // Yeni image sistem yapısı
  const normalizedPath = filePath.replace(/\\/g, '/')
  
  // Public URL oluştur
  if (normalizedPath.startsWith('/uploads/')) {
    return normalizedPath
  } else if (normalizedPath.startsWith('uploads/')) {
    return `/${normalizedPath}`
  } else {
    return `/uploads/${normalizedPath}`
  }
}

/**
 * Furniture verisini Product formatına çevirir
 */
function transformFurnitureToProduct(furniture: any): Product {
  const category = getCategoryById(furniture.categoryId)
  const mainCategorySlug = getMainCategorySlug(furniture.categoryId)
  
  // Ana resmi bul
  const mainImage = furniture.images?.find((img: any) => img.imageType === 'main')?.image
  const galleryImages = furniture.images?.filter((img: any) => img.imageType === 'gallery') || []
  
  // Renk seçeneklerini dönüştür
  const colors: ProductColor[] = furniture.colors?.map((colorRel: any) => ({
    id: `color-${colorRel.color.colorId}`,
    name: colorRel.color.colorName,
    value: colorRel.color.colorName,
    code: colorRel.color.colorCode || '#000000',
    colorClass: `bg-[${colorRel.color.colorCode || '#000000'}]`,
    imgSrc: mainImage ? buildImageUrl(mainImage.filePath) : '/images/products/placeholder.jpg',
    isAvailable: colorRel.isAvailable
  })) || []

  return {
    id: furniture.furnitureId,
    imgSrc: mainImage ? buildImageUrl(mainImage.filePath) : '/images/products/placeholder.jpg',
    imgHoverSrc: galleryImages[0]?.image ? buildImageUrl(galleryImages[0].image.filePath) : undefined,
    title: furniture.furnitureName,
    price: Number(furniture.price),
    category: mainCategorySlug || 'uncategorized',
    type: 'furniture',
    brand: 'HazarHome',
    description: furniture.description,
    furnitureType: furniture.furnitureType,
    dimensions: furniture.properties?.find((p: any) => p.property.propertyName === 'Boyutlar')?.propertyValue,
    material: furniture.properties?.find((p: any) => p.property.propertyName === 'Malzeme')?.propertyValue,
    warranty: furniture.properties?.find((p: any) => p.property.propertyName === 'Garanti')?.propertyValue || '2 Yıl Üretici Garantisi',
    colors,
    isActive: furniture.isActive,
    createdAt: furniture.createdAt,
    categoryId: furniture.categoryId,
    categoryName: category?.name,
    breadcrumb: buildCategoryBreadcrumb(furniture.categoryId),
    filterCategories: category ? [category.slug] : []
  }
}

/**
 * FurnitureSet verisini Product formatına çevirir
 */
function transformFurnitureSetToProduct(furnitureSet: any): Product {
  const category = getCategoryById(furnitureSet.categoryId)
  const mainCategorySlug = getMainCategorySlug(furnitureSet.categoryId)
  
  // Ana resmi bul
  const mainImage = furnitureSet.furnitureSetImages?.find((img: any) => img.imageType === 'main')?.image
  const galleryImages = furnitureSet.furnitureSetImages?.filter((img: any) => img.imageType === 'gallery') || []
  
  // Renk seçeneklerini dönüştür
  const colors: ProductColor[] = furnitureSet.furnitureSetColors?.map((colorRel: any) => ({
    id: `set-color-${colorRel.color.colorId}`,
    name: colorRel.color.colorName,
    value: colorRel.color.colorName,
    code: colorRel.color.colorCode || '#000000',
    colorClass: `bg-[${colorRel.color.colorCode || '#000000'}]`,
    imgSrc: mainImage ? buildImageUrl(mainImage.filePath) : '/images/products/placeholder.jpg',
    isAvailable: colorRel.isAvailable
  })) || []

  return {
    id: furnitureSet.setId,
    imgSrc: mainImage ? buildImageUrl(mainImage.filePath) : '/images/products/placeholder.jpg',
    imgHoverSrc: galleryImages[0]?.image ? buildImageUrl(galleryImages[0].image.filePath) : undefined,
    title: furnitureSet.setName,
    price: Number(furnitureSet.price),
    category: mainCategorySlug || 'uncategorized',
    type: 'furniture_set',
    brand: 'HazarHome',
    description: furnitureSet.description,
    setName: furnitureSet.setName,
    dimensions: furnitureSet.furnitureSetProperties?.find((p: any) => p.property.propertyName === 'Boyutlar')?.propertyValue,
    material: furnitureSet.furnitureSetProperties?.find((p: any) => p.property.propertyName === 'Malzeme')?.propertyValue,
    warranty: furnitureSet.furnitureSetProperties?.find((p: any) => p.property.propertyName === 'Garanti')?.propertyValue || '3 Yıl Üretici Garantisi',
    colors,
    isActive: furnitureSet.isActive,
    createdAt: furnitureSet.createdAt,
    categoryId: furnitureSet.categoryId,
    categoryName: category?.name,
    breadcrumb: buildCategoryBreadcrumb(furnitureSet.categoryId),
    filterCategories: category ? [category.slug] : []
  }
}

/**
 * Furniture ürünlerini çeker
 */
export async function fetchFurnitures(filters: ProductFilters = {}): Promise<Product[]> {
  try {
    const whereClause: any = {}
    
    // Aktif durumu filtresi
    if (filters.isActive !== undefined) {
      whereClause.isActive = filters.isActive
    } else {
      whereClause.isActive = true // Varsayılan olarak sadece aktif ürünler
    }
    
    // Kategori filtresi
    if (filters.category) {
      const category = getCategoryBySlug(filters.category)
      if (category) {
        whereClause.categoryId = category.id
      }
    }
    
    // Alt kategori filtresi
    if (filters.subCategory) {
      const subCategoryId = getCategoryBySlug(filters.subCategory)
      if (subCategoryId) {
        whereClause.categoryId = subCategoryId.id
      }
    }
    
    // Arama filtresi
    if (filters.search) {
      whereClause.OR = [
        { furnitureName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { furnitureType: { contains: filters.search, mode: 'insensitive' } }
      ]
    }
    
    // Fiyat filtresi
    if (filters.minPrice || filters.maxPrice) {
      whereClause.price = {}
      if (filters.minPrice) whereClause.price.gte = filters.minPrice
      if (filters.maxPrice) whereClause.price.lte = filters.maxPrice
    }
    
    // Renk filtresi
    if (filters.colorId) {
      whereClause.colors = {
        some: {
          colorId: filters.colorId,
          isAvailable: true
        }
      }
    }
    
    const furnitures = await prisma.furniture.findMany({
      where: whereClause,
      include: {
        category: true,
        colors: {
          include: {
            color: true
          },
          where: { isAvailable: true }
        },
        properties: {
          include: {
            property: true
          },
          where: { isActive: true }
        },
        images: {
          include: {
            image: true
          },
          where: { isActive: true },
          orderBy: [
            { imageType: 'asc' },
            { sortOrder: 'asc' }
          ]
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit,
      skip: filters.offset
    })
    
    return furnitures.map(transformFurnitureToProduct)
    
  } catch (error) {
    console.error('Error fetching furnitures:', error)
    return []
  }
}

/**
 * Furniture Set ürünlerini çeker
 */
export async function fetchFurnitureSets(filters: ProductFilters = {}): Promise<Product[]> {
  try {
    const whereClause: any = {}
    
    // Aktif durumu filtresi
    if (filters.isActive !== undefined) {
      whereClause.isActive = filters.isActive
    } else {
      whereClause.isActive = true
    }
    
    // Kategori filtresi - Furniture Sets sadece ana kategorilerde (level 1)
    if (filters.category) {
      const category = getCategoryBySlug(filters.category)
      if (category && category.level === 1) {
        whereClause.categoryId = category.id
      }
    }
    
    // Arama filtresi
    if (filters.search) {
      whereClause.OR = [
        { setName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ]
    }
    
    // Fiyat filtresi
    if (filters.minPrice || filters.maxPrice) {
      whereClause.price = {}
      if (filters.minPrice) whereClause.price.gte = filters.minPrice
      if (filters.maxPrice) whereClause.price.lte = filters.maxPrice
    }
    
    // Renk filtresi
    if (filters.colorId) {
      whereClause.furnitureSetColors = {
        some: {
          colorId: filters.colorId,
          isAvailable: true
        }
      }
    }
    
    const furnitureSets = await prisma.furnitureSet.findMany({
      where: whereClause,
      include: {
        category: true,
        furnitureSetColors: {
          include: {
            color: true
          },
          where: { isAvailable: true }
        },
        furnitureSetProperties: {
          include: {
            property: true
          },
          where: { isActive: true }
        },
        furnitureSetImages: {
          include: {
            image: true
          },
          where: { isActive: true },
          orderBy: [
            { imageType: 'asc' },
            { sortOrder: 'asc' }
          ]
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit,
      skip: filters.offset
    })
    
    return furnitureSets.map(transformFurnitureSetToProduct)
    
  } catch (error) {
    console.error('Error fetching furniture sets:', error)
    return []
  }
}

/**
 * Tüm ürünleri çeker (Furniture + FurnitureSet)
 */
export async function fetchAllProducts(filters: ProductFilters = {}): Promise<Product[]> {
  try {
    const [furnitures, furnitureSets] = await Promise.all([
      filters.type === 'furniture_set' ? [] : fetchFurnitures(filters),
      filters.type === 'furniture' ? [] : fetchFurnitureSets(filters)
    ])
    
    const allProducts = [...furnitures, ...furnitureSets]
    
    // CreatedAt'e göre sırala
    allProducts.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    
    // Limit uygula
    if (filters.limit) {
      const start = filters.offset || 0
      return allProducts.slice(start, start + filters.limit)
    }
    
    return allProducts
    
  } catch (error) {
    console.error('Error fetching all products:', error)
    return []
  }
}

/**
 * Tekil ürün çeker (ID ve type ile)
 */
export async function fetchProductById(id: number, type: 'furniture' | 'furniture_set'): Promise<Product | null> {
  try {
    if (type === 'furniture') {
      const furniture = await prisma.furniture.findUnique({
        where: { furnitureId: id },
        include: {
          category: true,
          colors: {
            include: {
              color: true
            },
            where: { isAvailable: true }
          },
          properties: {
            include: {
              property: true
            },
            where: { isActive: true }
          },
          images: {
            include: {
              image: true
            },
            where: { isActive: true },
            orderBy: [
              { imageType: 'asc' },
              { sortOrder: 'asc' }
            ]
          }
        }
      })
      
      return furniture ? transformFurnitureToProduct(furniture) : null
      
    } else if (type === 'furniture_set') {
      const furnitureSet = await prisma.furnitureSet.findUnique({
        where: { setId: id },
        include: {
          category: true,
          furnitureSetColors: {
            include: {
              color: true
            },
            where: { isAvailable: true }
          },
          furnitureSetProperties: {
            include: {
              property: true
            },
            where: { isActive: true }
          },
          furnitureSetImages: {
            include: {
              image: true
            },
            where: { isActive: true },
            orderBy: [
              { imageType: 'asc' },
              { sortOrder: 'asc' }
            ]
          }
        }
      })
      
      return furnitureSet ? transformFurnitureSetToProduct(furnitureSet) : null
    }
    
    return null
    
  } catch (error) {
    console.error('Error fetching product by id:', error)
    return null
  }
}

/**
 * Sayfalı ürün çekme
 */
export async function fetchProductsPaginated(
  page: number = 1, 
  pageSize: number = 12, 
  filters: ProductFilters = {}
): Promise<PaginatedResult> {
  try {
    const offset = (page - 1) * pageSize
    const limit = pageSize
    
    // Toplam sayıyı almak için ayrı sorgu
    const [furnitureCount, furnitureSetCount] = await Promise.all([
      filters.type === 'furniture_set' ? 0 : prisma.furniture.count({
        where: {
          isActive: filters.isActive !== undefined ? filters.isActive : true,
          ...(filters.category ? { 
            categoryId: getCategoryBySlug(filters.category)?.id
          } : {})
        }
      }),
      filters.type === 'furniture' ? 0 : prisma.furnitureSet.count({
        where: {
          isActive: filters.isActive !== undefined ? filters.isActive : true,
          ...(filters.category ? { 
            categoryId: getCategoryBySlug(filters.category)?.id
          } : {})
        }
      })
    ])
    
    const totalItems = furnitureCount + furnitureSetCount
    const totalPages = Math.ceil(totalItems / pageSize)
    
    // Ürünleri çek
    const products = await fetchAllProducts({ ...filters, offset, limit })
    
    return {
      products,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
    
  } catch (error) {
    console.error('Error fetching paginated products:', error)
    return {
      products: [],
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    }
  }
}

/**
 * Öne çıkan ürünler (en yeni ürünler)
 */
export async function fetchFeaturedProducts(limit: number = 8, type?: 'furniture' | 'furniture_set'): Promise<Product[]> {
  return fetchAllProducts({ limit, type, isActive: true })
}

/**
 * Kategoriye göre ürün çekme
 */
export async function fetchProductsByCategory(
  categorySlug: string, 
  subCategorySlug?: string, 
  options: Omit<ProductFilters, 'category' | 'subCategory'> = {}
): Promise<Product[]> {
  return fetchAllProducts({
    ...options,
    category: categorySlug,
    subCategory: subCategorySlug
  })
}
