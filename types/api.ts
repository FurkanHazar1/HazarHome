// types/api.ts - Comprehensive API Type Definitions
// Auto-extracted from optimized backend endpoints

// Base response structures
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  validationErrors?: string[]
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalUnfiltered?: number
    pages: number
    hasNext?: boolean
    hasPrev?: boolean
  }
  stats?: any
  filters?: any
}

// Entity types
export interface Category {
  categoryId: number
  categoryName: string
  categoryPath: string
  categoryLevel: number
  description?: string
  isActive: boolean
  parentId?: number | null
  createdAt?: string
  parent?: Pick<Category, 'categoryId' | 'categoryName' | 'categoryPath'>
  children?: Category[]
  _count?: {
    furnitures: number
    children: number
  }
}

export interface Color {
  colorId: number
  colorName: string
  colorCode: string
  isActive: boolean
  createdAt?: string
  _count?: {
    furnitureColors: number
    furnitureSetColors: number
  }
}

export interface Property {
  propertyId: number
  propertyName: string
  propertyType: string
  description?: string
  defaultValue?: string
  isRequired: boolean
  isActive: boolean
  selectOptions?: string
  validationRules?: string
  createdAt?: string
  _count?: {
    furnitureProperties: number
    furnitureSetProperties: number
  }
}

export interface Image {
  imageId: number
  fileName: string
  filePath: string
  fileSize?: number
  fileType?: string
  description?: string
  altText?: string
  width?: number
  height?: number
  originalFileName?: string
  uploadedAt?: string
  url?: string
}

export interface Furniture {
  furnitureId: number
  furnitureName: string
  furnitureType: string
  price: number
  description?: string
  isActive: boolean
  createdAt: string
  categoryId: number
  category?: Category
  colors?: FurnitureColor[]
  properties?: FurnitureProperty[]
  images?: FurnitureImage[]
  furnitureSets?: FurnitureSetItem[]
  hasImages?: boolean
  hasColors?: boolean
  hasProperties?: boolean
  _count?: {
    colors: number
    properties: number
    images: number
    furnitureSets: number
  }
}

export interface FurnitureSet {
  setId: number
  setName: string
  description?: string
  price: number
  isActive: boolean
  createdAt: string
  categoryId: number
  category?: Category
  furnitureSetColors?: FurnitureSetColor[]
  furnitureSetProperties?: FurnitureSetProperty[]
  furnitureSetImages?: FurnitureSetImage[]
  furnitureSetItems?: FurnitureSetItem[]
  stats?: FurnitureSetStats
  _count?: {
    furnitureSetColors: number
    furnitureSetProperties: number
    furnitureSetImages: number
    furnitureSetItems: number
  }
}

// Junction table types
export interface FurnitureColor {
  colorId: number
  furnitureId: number
  isAvailable: boolean
  color: Color
}

export interface FurnitureProperty {
  propertyId: number
  furnitureId: number
  propertyValue: string
  isActive: boolean
  property: Property
}

export interface FurnitureImage {
  imageId: number
  furnitureId: number
  imageType: 'main' | 'gallery' | 'thumbnail'
  sortOrder: number
  isActive: boolean
  image: Image
}

export interface FurnitureSetColor {
  colorId: number
  furnitureSetId: number
  isAvailable: boolean
  color: Color
}

export interface FurnitureSetProperty {
  propertyId: number
  furnitureSetId: number
  propertyValue: string
  isActive: boolean
  property: Property
}

export interface FurnitureSetImage {
  imageId: number
  furnitureSetId: number
  imageType: 'main' | 'gallery' | 'thumbnail'
  sortOrder: number
  isActive: boolean
  image: Image
}

export interface FurnitureSetItem {
  furnitureId: number
  furnitureSetId: number
  quantity: number
  sortOrder?: number
  furniture?: Furniture
}

// Stats interfaces
export interface FurnitureStats {
  total: number
  active: number
  inactive: number
  averagePrice: number
  minPrice: number
  maxPrice: number
  totalImages: number
  totalColors: number
  furnitureTypes?: string[]
  categoryCounts?: { [categoryName: string]: number }
}

export interface FurnitureSetStats {
  totalQuantity: number
  uniqueFurnitureCount: number
  activeFurnitureCount: number
}

// Enhanced response types with computed fields
export interface FurnitureDetailResponse extends ApiResponse<Furniture> {
  data: Furniture & {
    breadcrumb: Pick<Category, 'categoryId' | 'categoryName' | 'categoryPath'>[]
    imageGallery: {
      main?: FurnitureImage[]
      mainImages?: FurnitureImage[]
      gallery?: FurnitureImage[]
      galleryImages?: FurnitureImage[]
      thumbnailImages?: FurnitureImage[]
      totalImages: number
    }
    colorOptions: (Color & { isAvailable: boolean })[]
    propertiesByType: { [propertyType: string]: any[] }
    stats: {
      totalColors: number
      totalProperties: number
      totalImages: number
      totalFurnitureSets: number
      activeColors: number
      activeProperties: number
      activeImages: number
    }
    metadata: {
      createdAt: string
      formattedPrice: string
      categoryLevel: number | null
      hasMainImage: boolean
      hasGalleryImages: boolean
    }
  }
}

export interface FurnitureSetDetailResponse extends ApiResponse<FurnitureSet> {
  data: FurnitureSet & {
    breadcrumb: Pick<Category, 'categoryId' | 'categoryName' | 'categoryPath'>[]
    imageGallery: {
      main?: FurnitureSetImage[]
      mainImages?: FurnitureSetImage[]
      gallery?: FurnitureSetImage[]
      galleryImages?: FurnitureSetImage[]
      thumbnailImages?: FurnitureSetImage[]
      totalImages: number
    }
    colorOptions: (Color & { isAvailable: boolean })[]
    propertiesByType: { [propertyType: string]: any[] }
    furnitureItems: (FurnitureSetItem & {
      furniture?: Furniture & { mainImage?: Image }
    })[]
    pricingAnalysis?: {
      individualTotal: number
      setPrice: number
      savings: number
      savingsPercentage: number
    }
    stats: FurnitureSetStats & {
      totalColors: number
      totalProperties: number
      totalImages: number
      totalFurnitureItems: number
      activeColors: number
      activeProperties: number
      activeImages: number
    }
    metadata: {
      createdAt: string
      formattedPrice: string
      categoryLevel: number | null
      isParentCategory: boolean
      hasMainImage: boolean
    }
  }
}

// Query parameter types
export interface FurnitureListParams {
  page?: number
  limit?: number
  categoryId?: number
  type?: string
  active?: string | boolean
  search?: string
  minPrice?: number
  maxPrice?: number
  colorIds?: number[] | string
  sortBy?: 'furnitureName' | 'price' | 'createdAt' | 'furnitureType' | 'furnitureId'
  sortOrder?: 'asc' | 'desc'
  includeDetails?: boolean
  includeImagesByType?: boolean
}

export interface FurnitureSetListParams {
  page?: number
  limit?: number
  categoryId?: number
  active?: string | boolean
  search?: string
  minPrice?: number
  maxPrice?: number
  minFurnitureCount?: number
  maxFurnitureCount?: number
  parentCategoriesOnly?: boolean
  sortBy?: 'setName' | 'price' | 'createdAt' | 'setId'
  sortOrder?: 'asc' | 'desc'
  includeDetails?: boolean
  includeImagesByType?: boolean
  includeFurniturePreview?: boolean
}

export interface CategoryListParams {
  page?: number
  limit?: number
  level?: number
  parentId?: number
  active?: boolean
  search?: string
  sortBy?: 'categoryName' | 'categoryLevel' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface ColorListParams {
  page?: number
  limit?: number
  active?: boolean
  search?: string
  sortBy?: 'colorName' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface PropertyListParams {
  page?: number
  limit?: number
  type?: string
  categoryId?: number
  active?: boolean
  search?: string
  used?: string // 'used' | 'unused' | 'all'
  sortBy?: 'propertyName' | 'propertyType' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// Mutation types
export interface CreateFurnitureData {
  furnitureName: string
  furnitureType: string
  price: number
  description?: string
  categoryId: number
  colorIds?: number[]
  properties?: { propertyId: number; propertyValue: string }[]
  images?: File[]
  imageTypeMappings?: { [key: string]: string }
}

export interface UpdateFurnitureData extends Partial<CreateFurnitureData> {
  furnitureId: number
  isActive?: boolean
}

export interface CreateFurnitureSetData {
  setName: string
  description?: string
  price: number
  categoryId: number
  colorIds?: number[]
  properties?: { propertyId: number; propertyValue: string }[]
  furnitureItems?: { furnitureId: number; quantity: number; sortOrder?: number }[]
  images?: File[]
  imageTypeMappings?: { [key: string]: string }
}

export interface UpdateFurnitureSetData extends Partial<CreateFurnitureSetData> {
  setId: number
  isActive?: boolean
}

// Bulk operation types
export interface BulkDeleteParams {
  ids: number[]
}

export interface BulkUpdateStatusParams {
  ids: number[]
  isActive: boolean
}

// Error types
export interface ApiError {
  success: false
  error: string
  message?: string
  validationErrors?: string[]
  status?: number
}

// Performance monitoring
export interface PerformanceMarker {
  name: string
  startTime: number
}

// Cache configurations
export interface CacheConfig {
  revalidate?: number
  cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached'
  next?: {
    revalidate?: number
    tags?: string[]
  }
}

// URL search params utility type
export type SearchParamsObject = { [key: string]: string | number | boolean | undefined }
