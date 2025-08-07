'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'

// Utility function for image URLs with multiple fallbacks
const getImageUrl = (filePath: string): string[] => {
  if (!filePath) return []
  
  const normalizedPath = filePath.replace(/\\/g, '/')
  const cleanPath = normalizedPath.replace(/^uploads\//, '')
  
  const urlOptions = [
    `/api/images/serve/${cleanPath}`,
    `/uploads/${cleanPath}`,
    `/${normalizedPath}`,
    `/${cleanPath}`
  ]
  
  return urlOptions
}

// TypeScript interfaces for Furniture Sets
interface Category {
  categoryId: number
  categoryName: string
  categoryPath: string
  categoryLevel?: number
  isActive?: boolean
  parent?: {
    categoryId: number
    categoryName: string
  }
}

interface Color {
  colorId: number
  colorName: string
  colorCode: string
  isActive: boolean
}

interface Property {
  propertyId: number
  propertyName: string
  propertyType: string
  description?: string
  isActive?: boolean
}

interface Image {
  imageId: number
  fileName: string
  filePath: string
  altText: string
  width?: number
  height?: number
  fileSize?: number
  fileType?: string
}

interface FurnitureSetImage {
  sortOrder: number
  imageType: string
  isActive: boolean
  image: Image
}

interface FurnitureSetColor {
  isAvailable: boolean
  color: Color
}

interface FurnitureSetProperty {
  propertyId: number
  propertyValue: string
  isActive: boolean
  property: Property
}

interface FurnitureItem {
  furnitureId: number
  quantity: number
  sortOrder: number
  furniture: {
    furnitureId: number
    furnitureName: string
    furnitureType: string
    price: number
    isActive: boolean
  }
}

interface FurnitureSet {
  setId: number
  setName: string
  description?: string
  price: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
  category?: Category
  furnitureSetColors: FurnitureSetColor[]
  furnitureSetProperties: FurnitureSetProperty[]
  furnitureSetImages: FurnitureSetImage[]
  furnitureItems?: FurnitureItem[]
  stats?: {
    totalQuantity: number
    uniqueFurnitureCount: number
    activeFurnitureCount: number
    totalIndividualPrice: number
    setSavings: number
  }
  _count: {
    furnitureSetColors: number
    furnitureSetProperties: number
    furnitureSetImages: number
    furnitureSetItems: number
  }
}

interface FurnitureSetResponse {
  success: boolean
  data?: FurnitureSet[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
  stats?: {
    total: number
    active: number
    inactive: number
    averagePrice: number
    minPrice: number
    maxPrice: number
    totalImages: number
    totalColors: number
    totalFurnitureCount: number
    averageSavings: number
  }
  filters?: {
    categoryId: number | null
    isActive: string | null
    search: string | null
    minPrice: number | null
    maxPrice: number | null
    minFurnitureCount: number | null
    maxFurnitureCount: number | null
  }
  sort?: {
    sortBy: string
    sortOrder: string
  }
  error?: string
  message?: string
  validationErrors?: string[]
}

interface CategoryOption {
  categoryId: number
  categoryName: string
  categoryLevel?: number
  parent?: string
}

interface ColorOption {
  colorId: number
  colorName: string
  colorCode: string
  isActive: boolean
}

interface BulkActionResponse {
  success: boolean
  message?: string
  error?: string
  affectedCount?: number
  validationErrors?: string[]
}

// Enhanced Dark Theme Icons
const FurnitureSetIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const ImageIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m4 16 4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const ColorIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
  </svg>
)

const PropertyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
)

const FurnitureIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m7 21-3-3h16l-3 3" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const LoaderIcon = () => (
  <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const XCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ExportIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const ViewGridIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
)

const ViewListIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
)

const SavingsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

// Enhanced Dark Theme Image Component
const FurnitureSetImageDisplay = ({ 
  image, 
  alt, 
  className = "w-16 h-16", 
  showFallback = true 
}: {
  image: Image | null
  alt: string
  className?: string
  showFallback?: boolean
}) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const urls = useMemo(() => {
    return image ? getImageUrl(image.filePath) : []
  }, [image])

  const handleImageError = useCallback(() => {
    if (currentUrlIndex < urls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1)
      setImageError(false)
    } else {
      setImageError(true)
    }
  }, [currentUrlIndex, urls.length])

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
    setImageError(false)
  }, [])

  // Reset state when image changes
  useEffect(() => {
    setCurrentUrlIndex(0)
    setImageError(false)
    setImageLoaded(false)
  }, [image?.imageId])

  if (!image || imageError || !urls[currentUrlIndex]) {
    return showFallback ? (
      <div className={`${className} bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700`}>
        <div className="text-slate-500">
          <ImageIcon />
        </div>
      </div>
    ) : null
  }

  return (
    <div className={`${className} relative group overflow-hidden rounded-xl`}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse rounded-xl flex items-center justify-center">
          <LoaderIcon />
        </div>
      )}
      <Image
        src={urls[currentUrlIndex]}
        alt={alt}
        fill
        className={`object-cover shadow-sm group-hover:shadow-md transition-all duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      <div className="absolute inset-0 ring-1 ring-white ring-opacity-10 rounded-xl"></div>
    </div>
  )
}

export default function FurnitureSetManager() {
  // State management
  const [furnitureSets, setFurnitureSets] = useState<FurnitureSet[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [bulkActionLoading, setBulkActionLoading] = useState<boolean>(false)

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Filter states
  const [search, setSearch] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [minFurnitureCount, setMinFurnitureCount] = useState<string>('')
  const [maxFurnitureCount, setMaxFurnitureCount] = useState<string>('')
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState<boolean>(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageLimit, setPageLimit] = useState<number>(20)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalItems, setTotalItems] = useState<number>(0)

  // Sort states
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<string>('desc')

  // Options for filters
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [colors, setColors] = useState<ColorOption[]>([])

  // Enhanced stats
  const [stats, setStats] = useState<{
    total: number
    active: number
    inactive: number
    averagePrice: number
    minPrice: number
    maxPrice: number
    totalImages: number
    totalColors: number
    totalFurnitureCount: number
    averageSavings: number
  } | null>(null)

  // Load filter options
  const loadFilterOptions = useCallback(async (): Promise<void> => {
    try {
      const [categoriesRes, colorsRes] = await Promise.all([
        fetch('/api/categories?parentOnly=true&active=true'),
        fetch('/api/colors?active=true')
      ])

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        if (categoriesData.success) {
          setCategories(categoriesData.data.map((cat: any) => ({
            categoryId: cat.categoryId,
            categoryName: cat.categoryName,
            categoryLevel: cat.categoryLevel || 0,
            parent: cat.parent?.categoryName
          })))
        }
      }

      if (colorsRes.ok) {
        const colorsData = await colorsRes.json()
        if (colorsData.success) {
          setColors(colorsData.data.filter((color: any) => color.isActive).map((color: any) => ({
            colorId: color.colorId,
            colorName: color.colorName,
            colorCode: color.colorCode,
            isActive: color.isActive
          })))
        }
      }
    } catch (error) {
      console.error('Filter options yükleme hatası:', error)
    }
  }, [])

  // Enhanced load furniture sets data with better error handling
  const loadFurnitureSets = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError('')
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageLimit.toString(),
        sortBy,
        sortOrder,
        includeDetails: 'true',
        includeFurniturePreview: 'true',
        calculatePricing: 'true',
        groupImagesByType: 'true'
      })

      if (search.trim()) params.append('search', search.trim())
      if (categoryFilter) params.append('categoryId', categoryFilter)
      if (statusFilter) params.append('active', statusFilter)
      if (minPrice) params.append('minPrice', minPrice)
      if (maxPrice) params.append('maxPrice', maxPrice)
      if (minFurnitureCount) params.append('minFurnitureCount', minFurnitureCount)
      if (maxFurnitureCount) params.append('maxFurnitureCount', maxFurnitureCount)
      if (selectedColors.length > 0) params.append('colorIds', selectedColors.join(','))

      const response = await fetch(`/api/furniture-sets?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: FurnitureSetResponse = await response.json()
      
      if (data.success) {
        setFurnitureSets(data.data || [])
        setCurrentPage(data.pagination?.page || 1)
        setTotalPages(data.pagination?.pages || 1)
        setTotalItems(data.pagination?.total || 0)
        setStats(data.stats || null)
      } else {
        setError(data.error || data.message || 'Mobilya takımları yüklenemedi')
      }
    } catch (err) {
      console.error('❌ Mobilya takımları yükleme hatası:', err)
      setError('Mobilya takımları yüklenemedi. Lütfen sayfayı yenileyin.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageLimit, sortBy, sortOrder, search, categoryFilter, statusFilter, minPrice, maxPrice, minFurnitureCount, maxFurnitureCount, selectedColors])

  // Enhanced delete furniture sets with success message
  const handleDelete = async (ids: number[]): Promise<void> => {
    try {
      setBulkActionLoading(true)
      const response = await fetch(`/api/furniture-sets?ids=${ids.join(',')}`, {
        method: 'DELETE'
      })

      const data: BulkActionResponse = await response.json()

      if (data.success) {
        setSelectedItems([])
        setShowDeleteConfirm(false)
        setError('')
        setSuccess(`✅ ${data.affectedCount || ids.length} mobilya takımı başarıyla silindi`)
        await loadFurnitureSets()
      } else {
        setError(data.error || 'Silme işlemi başarısız')
      }
    } catch (err) {
      console.error('Silme hatası:', err)
      setError('Silme işlemi başarısız. Lütfen tekrar deneyin.')
    } finally {
      setBulkActionLoading(false)
    }
  }

  // Enhanced status toggle with success message
  const handleStatusToggle = async (ids: number[], isActive: boolean): Promise<void> => {
    try {
      setBulkActionLoading(true)
      const response = await fetch('/api/furniture-sets', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids, isActive })
      })

      const data: BulkActionResponse = await response.json()

      if (data.success) {
        setSelectedItems([])
        setError('')
        setSuccess(`✅ ${data.affectedCount || ids.length} mobilya takımı durumu güncellendi`)
        await loadFurnitureSets()
      } else {
        setError(data.error || 'Durum güncelleme başarısız')
      }
    } catch (err) {
      console.error('Durum güncelleme hatası:', err)
      setError('Durum güncelleme başarısız. Lütfen tekrar deneyin.')
    } finally {
      setBulkActionLoading(false)
    }
  }

  // Enhanced selection handling
  const handleSelectAll = useCallback((checked: boolean): void => {
    if (checked) {
      setSelectedItems(furnitureSets.map(fs => fs.setId))
    } else {
      setSelectedItems([])
    }
  }, [furnitureSets])

  const handleSelectItem = useCallback((setId: number, checked: boolean): void => {
    setSelectedItems(prev => {
      if (checked) {
        return [...prev, setId]
      } else {
        return prev.filter(id => id !== setId)
      }
    })
  }, [])

  // Color filter handling
  const handleColorToggle = useCallback((colorId: string): void => {
    setSelectedColors(prev => 
      prev.includes(colorId) 
        ? prev.filter(id => id !== colorId)
        : [...prev, colorId]
    )
  }, [])

  // Reset filters
  const resetFilters = useCallback((): void => {
    setSearch('')
    setCategoryFilter('')
    setStatusFilter('')
    setMinPrice('')
    setMaxPrice('')
    setMinFurnitureCount('')
    setMaxFurnitureCount('')
    setSelectedColors([])
    setCurrentPage(1)
  }, [])

  // Export functionality
  const handleExport = useCallback(async (): Promise<void> => {
    try {
      const params = new URLSearchParams({
        export: 'true',
        format: 'csv'
      })

      if (search.trim()) params.append('search', search.trim())
      if (categoryFilter) params.append('categoryId', categoryFilter)
      if (statusFilter) params.append('active', statusFilter)
      if (minPrice) params.append('minPrice', minPrice)
      if (maxPrice) params.append('maxPrice', maxPrice)
      if (minFurnitureCount) params.append('minFurnitureCount', minFurnitureCount)
      if (maxFurnitureCount) params.append('maxFurnitureCount', maxFurnitureCount)
      if (selectedColors.length > 0) params.append('colorIds', selectedColors.join(','))

      const response = await fetch(`/api/furniture-sets/export?${params}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `furniture_sets_export_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setSuccess('✅ Veriler başarıyla dışa aktarıldı')
      } else {
        setError('Dışa aktarma işlemi başarısız')
      }
    } catch (err) {
      console.error('Export error:', err)
      setError('Dışa aktarma işlemi başarısız')
    }
  }, [search, categoryFilter, statusFilter, minPrice, maxPrice, minFurnitureCount, maxFurnitureCount, selectedColors])

  // Format functions
  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price)
  }, [])

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  // Get main image from furniture set images
  const getMainImage = useCallback((images: FurnitureSetImage[]): Image | null => {
    const mainImage = images.find(img => 
      (img.imageType === 'main_image' || img.imageType === 'main') && img.isActive
    )
    return mainImage?.image || images[0]?.image || null
  }, [])

  // Memoized values
  const hasActiveFilters = useMemo(() => {
    return search || categoryFilter || statusFilter || 
           minPrice || maxPrice || minFurnitureCount || maxFurnitureCount || selectedColors.length > 0
  }, [search, categoryFilter, statusFilter, minPrice, maxPrice, minFurnitureCount, maxFurnitureCount, selectedColors])

  const isAllSelected = useMemo(() => {
    return furnitureSets.length > 0 && selectedItems.length === furnitureSets.length
  }, [furnitureSets.length, selectedItems.length])

  const isIndeterminate = useMemo(() => {
    return selectedItems.length > 0 && selectedItems.length < furnitureSets.length
  }, [selectedItems.length, furnitureSets.length])

  // Handle navigation from Add component
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const newItemId = urlParams.get('newItem')
    const successParam = urlParams.get('success')
    
    if (newItemId && successParam === 'true') {
      setSuccess('✅ Yeni mobilya takımı başarıyla eklendi!')
      // Clean URL parameters
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [])

  // Load data on component mount
  useEffect(() => {
    loadFilterOptions()
  }, [loadFilterOptions])

  useEffect(() => {
    loadFurnitureSets()
  }, [loadFurnitureSets])

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // Grid Card Component for Furniture Sets with Dark Theme
  const FurnitureSetCard = ({ furnitureSet }: { furnitureSet: FurnitureSet }) => {
    const mainImage = getMainImage(furnitureSet.furnitureSetImages)
    const availableColors = furnitureSet.furnitureSetColors.filter(fc => fc.isAvailable)
    
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-300 group shadow-2xl">
        {/* Image Section */}
        <div className="aspect-square relative overflow-hidden">
          <FurnitureSetImageDisplay
            image={mainImage}
            alt={furnitureSet.setName}
            className="w-full h-full"
          />
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              furnitureSet.isActive 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {furnitureSet.isActive ? '✓ Aktif' : '✕ Pasif'}
            </span>
          </div>

          {/* Savings Badge */}
          {furnitureSet.stats && furnitureSet.stats.setSavings > 0 && (
            <div className="absolute top-3 right-12">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                -{formatPrice(furnitureSet.stats.setSavings)}
              </span>
            </div>
          )}

          {/* Selection Checkbox */}
          <div className="absolute top-3 right-3">
            <input
              type="checkbox"
              checked={selectedItems.includes(furnitureSet.setId)}
              onChange={(e) => handleSelectItem(furnitureSet.setId, e.target.checked)}
              className="w-4 h-4 rounded border-white/30 text-blue-600 focus:ring-blue-500 bg-white/20 backdrop-blur-sm"
            />
          </div>

          {/* Hover Actions */}
          <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center justify-center space-x-2">
              <Link
                href={`/admin/furniture-sets/${furnitureSet.setId}`}
                className="p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg transition-colors shadow-lg border border-white/20"
                title="Detay Görüntüle"
              >
                <EyeIcon />
              </Link>
              <Link
                href={`/admin/furniture-sets/${furnitureSet.setId}/edit`}
                className="p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg transition-colors shadow-lg border border-white/20"
                title="Düzenle"
              >
                <EditIcon />
              </Link>
              <button
                onClick={() => {
                  setSelectedItems([furnitureSet.setId])
                  setShowDeleteConfirm(true)
                }}
                className="p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg transition-colors shadow-lg border border-white/20"
                title="Sil"
              >
                <DeleteIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Title and Category */}
          <div className="mb-4">
            <h3 className="font-semibold text-white text-lg mb-2 line-clamp-2">
              {furnitureSet.setName}
            </h3>
            <div className="flex items-center text-sm text-white/60">
              <span>{furnitureSet.category?.categoryName || 'Kategorisiz'}</span>
              <span className="mx-2">•</span>
              <span>{furnitureSet._count.furnitureSetItems} parça</span>
            </div>
          </div>

          {/* Price and Savings */}
          <div className="mb-4">
            <div className="text-2xl font-bold text-blue-300">
              {formatPrice(furnitureSet.price)}
            </div>
            {furnitureSet.stats && furnitureSet.stats.setSavings > 0 && (
              <div className="text-sm text-green-300">
                {formatPrice(furnitureSet.stats.setSavings)} tasarruf
              </div>
            )}
          </div>

          {/* Colors */}
          <div className="mb-4">
            <div className="flex items-center space-x-1">
              {availableColors.slice(0, 4).map((fc) => (
                <div
                  key={fc.color.colorId}
                  className="w-5 h-5 rounded-full border-2 border-white/50 shadow-md"
                  style={{ backgroundColor: fc.color.colorCode }}
                  title={fc.color.colorName}
                />
              ))}
              {availableColors.length > 4 && (
                <div className="w-5 h-5 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    +{availableColors.length - 4}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-white/60 pt-4 border-t border-white/20">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <ImageIcon />
                <span>{furnitureSet._count.furnitureSetImages}</span>
              </div>
              <div className="flex items-center space-x-1">
                <FurnitureIcon />
                <span>{furnitureSet._count.furnitureSetItems}</span>
              </div>
              <div className="flex items-center space-x-1">
                <ColorIcon />
                <span>{furnitureSet._count.furnitureSetColors}</span>
              </div>
            </div>
            <div>
              {formatDate(furnitureSet.createdAt)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-indigo-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/20 backdrop-blur-sm rounded-xl border border-blue-500/30">
                <FurnitureSetIcon />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                  Mobilya Takımı Yönetimi
                </h1>
                <p className="text-white/70 mt-2 text-lg">
                  Mobilya takımlarını görüntüleyin, düzenleyin ve yönetin
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50' 
                      : 'text-white/60 hover:text-white/80 hover:bg-white/10'
                  }`}
                  title="Tablo Görünümü"
                >
                  <ViewListIcon />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50' 
                      : 'text-white/60 hover:text-white/80 hover:bg-white/10'
                  }`}
                  title="Kart Görünümü"
                >
                  <ViewGridIcon />
                </button>
              </div>

              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 rounded-xl shadow-lg"
                title="Dışa Aktar"
              >
                <ExportIcon />
                <span className="ml-2 hidden sm:block">Dışa Aktar</span>
              </button>

              <button
                onClick={loadFurnitureSets}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 rounded-xl shadow-lg"
              >
                <RefreshIcon />
                <span className="ml-2 hidden sm:block">Yenile</span>
              </button>

              <Link
                href="/admin/furniture-sets/add"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <PlusIcon />
                <span className="ml-2 font-medium">Yeni Takım</span>
              </Link>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          {stats && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  label: 'Toplam Takım', 
                  value: stats.total.toLocaleString(), 
                  color: 'from-blue-500 to-blue-600',
                  icon: FurnitureSetIcon,
                  change: `${stats.active} aktif, ${stats.inactive} pasif`
                },
                { 
                  label: 'Ortalama Fiyat', 
                  value: formatPrice(stats.averagePrice || 0), 
                  color: 'from-green-500 to-green-600',
                  icon: () => (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  ),
                  change: `${formatPrice(stats.minPrice || 0)} - ${formatPrice(stats.maxPrice || 0)}`
                },
                { 
                  label: 'Toplam Mobilya', 
                  value: stats.totalFurnitureCount?.toLocaleString() || '0', 
                  color: 'from-purple-500 to-purple-600',
                  icon: FurnitureIcon,
                  change: 'Tüm takımlarda'
                },
                { 
                  label: 'Ortalama Tasarruf', 
                  value: formatPrice(stats.averageSavings || 0), 
                  color: 'from-emerald-500 to-emerald-600',
                  icon: SavingsIcon,
                  change: 'Takım başına'
                }
              ].map((stat, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-white/70 mb-1">{stat.label}</h3>
                      <p className="text-3xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-white/60 mt-1">{stat.change}</p>
                    </div>
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                      <stat.icon />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-100 px-6 py-4 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <XCircleIcon />
                <span className="font-medium">{error}</span>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-300 hover:text-red-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-500/20 backdrop-blur-sm border border-green-500/30 text-green-100 px-6 py-4 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon />
                <span className="font-medium">{success}</span>
              </div>
              <button
                onClick={() => setSuccess('')}
                className="text-green-300 hover:text-green-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Filters */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-xl font-semibold text-white hover:text-blue-300 transition-colors"
              >
                <FilterIcon />
                <span>Filtreler</span>
                {hasActiveFilters && (
                  <span className="bg-blue-500/30 text-blue-200 text-xs font-medium px-3 py-1 rounded-full border border-blue-400/50">
                    {[search, categoryFilter, statusFilter, minPrice, maxPrice, minFurnitureCount, maxFurnitureCount, ...selectedColors].filter(Boolean).length} aktif
                  </span>
                )}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-blue-300 hover:text-blue-100 text-sm font-medium transition-colors"
                >
                  Filtreleri Temizle
                </button>
              )}
            </div>

            {showFilters && (
              <div className="space-y-6 pt-4 border-t border-white/20">
                {/* Search and Quick Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Arama
                    </label>
                    <div className="relative">
                      <SearchIcon />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Takım adı, açıklama..."
                        className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Kategori
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="" className="text-gray-900">Tüm Kategoriler</option>
                      {categories.map(category => (
                        <option key={category.categoryId} value={category.categoryId} className="text-gray-900">
                          {category.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Durum
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="" className="text-gray-900">Tüm Durumlar</option>
                      <option value="true" className="text-gray-900">Aktif</option>
                      <option value="false" className="text-gray-900">Pasif</option>
                    </select>
                  </div>
                </div>

                {/* Advanced Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Min Fiyat
                    </label>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Max Fiyat
                    </label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="999999"
                      className="w-full px-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Furniture Count Range */}
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Min Mobilya Sayısı
                    </label>
                    <input
                      type="number"
                      value={minFurnitureCount}
                      onChange={(e) => setMinFurnitureCount(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Max Mobilya Sayısı
                    </label>
                    <input
                      type="number"
                      value={maxFurnitureCount}
                      onChange={(e) => setMaxFurnitureCount(e.target.value)}
                      placeholder="20"
                      className="w-full px-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Sort Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Sıralama
                    </label>
                    <select
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(e) => {
                        const [field, order] = e.target.value.split('-')
                        setSortBy(field)
                        setSortOrder(order)
                      }}
                      className="w-full px-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="createdAt-desc" className="text-gray-900">En Yeni</option>
                      <option value="createdAt-asc" className="text-gray-900">En Eski</option>
                      <option value="setName-asc" className="text-gray-900">İsim A-Z</option>
                      <option value="setName-desc" className="text-gray-900">İsim Z-A</option>
                      <option value="price-asc" className="text-gray-900">Fiyat Artan</option>
                      <option value="price-desc" className="text-gray-900">Fiyat Azalan</option>
                    </select>
                  </div>
                </div>

                {/* Color Filter */}
                {colors.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-3">
                      Renkler ({selectedColors.length} seçili)
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {colors.map(color => (
                        <button
                          key={color.colorId}
                          onClick={() => handleColorToggle(color.colorId.toString())}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-200 ${
                            selectedColors.includes(color.colorId.toString())
                              ? 'border-blue-400 bg-blue-500/20 text-blue-200'
                              : 'border-white/20 bg-white/10 text-white/80 hover:border-white/40 hover:bg-white/20'
                          }`}
                        >
                          <div
                            className="w-4 h-4 rounded-full border border-white/50 shadow-sm"
                            style={{ backgroundColor: color.colorCode }}
                          />
                          <span className="text-sm">{color.colorName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Results Per Page */}
                <div className="flex items-center justify-between pt-4 border-t border-white/20">
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-white/90">
                      Sayfa Başına:
                    </label>
                    <select
                      value={pageLimit}
                      onChange={(e) => {
                        setPageLimit(parseInt(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value={10} className="text-gray-900">10</option>
                      <option value={20} className="text-gray-900">20</option>
                      <option value={50} className="text-gray-900">50</option>
                      <option value={100} className="text-gray-900">100</option>
                    </select>
                  </div>

                  {totalItems > 0 && (
                    <div className="text-sm text-white/70">
                      <span className="font-medium text-white">{totalItems}</span> sonuç bulundu
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-4 mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-blue-200 font-medium">
                  {selectedItems.length} öğe seçildi
                </span>
                <button
                  onClick={() => setSelectedItems([])}
                  className="text-blue-300 hover:text-blue-100 text-sm underline transition-colors"
                >
                  Seçimi Temizle
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleStatusToggle(selectedItems, true)}
                  disabled={bulkActionLoading}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50 shadow-lg"
                >
                  {bulkActionLoading ? <LoaderIcon /> : <CheckCircleIcon />}
                  <span className="ml-1">Aktifleştir</span>
                </button>
                <button
                  onClick={() => handleStatusToggle(selectedItems, false)}
                  disabled={bulkActionLoading}
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-xl hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors disabled:opacity-50 shadow-lg"
                >
                  {bulkActionLoading ? <LoaderIcon /> : <XCircleIcon />}
                  <span className="ml-1">Pasifleştir</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={bulkActionLoading}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50 shadow-lg"
                >
                  {bulkActionLoading ? <LoaderIcon /> : <DeleteIcon />}
                  <span className="ml-1">Sil</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <LoaderIcon />
              <p className="text-white/80 font-medium text-lg">Mobilya takımları yükleniyor...</p>
            </div>
          </div>
        )}

        {/* Content - Table or Grid */}
        {!loading && (
          <>
            {viewMode === 'table' ? (
              /* Table View */
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-white/10 backdrop-blur-sm border-b border-white/20">
                      <tr>
                        <th className="px-6 py-4 text-left">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = isIndeterminate
                            }}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded border-white/30 text-blue-600 focus:ring-blue-500 bg-white/20"
                          />
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                          Görsel
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                          Takım Bilgileri
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                          Fiyat & Tasarruf
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                          Mobilyalar
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                          Özellikler
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                          Tarih
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-white/80 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {furnitureSets.map((furnitureSet) => {
                        const mainImage = getMainImage(furnitureSet.furnitureSetImages)
                        const availableColors = furnitureSet.furnitureSetColors.filter(fc => fc.isAvailable)
                        
                        return (
                          <tr key={furnitureSet.setId} className="hover:bg-white/10 transition-colors">
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(furnitureSet.setId)}
                                onChange={(e) => handleSelectItem(furnitureSet.setId, e.target.checked)}
                                className="rounded border-white/30 text-blue-600 focus:ring-blue-500 bg-white/20"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <FurnitureSetImageDisplay
                                image={mainImage}
                                alt={furnitureSet.setName}
                                className="w-16 h-16"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="text-sm font-semibold text-white">
                                  {furnitureSet.setName}
                                </div>
                                {furnitureSet.description && (
                                  <div className="text-sm text-white/60 truncate max-w-xs">
                                    {furnitureSet.description}
                                  </div>
                                )}
                                <div className="flex items-center space-x-4 mt-2">
                                  <div className="flex items-center space-x-1 text-xs text-white/60">
                                    <ImageIcon />
                                    <span>{furnitureSet._count.furnitureSetImages}</span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-xs text-white/60">
                                    <ColorIcon />
                                    <span>{furnitureSet._count.furnitureSetColors}</span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-xs text-white/60">
                                    <PropertyIcon />
                                    <span>{furnitureSet._count.furnitureSetProperties}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-white">
                                {furnitureSet.category?.categoryName || 'Kategorisiz'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="text-sm font-bold text-blue-300">
                                  {formatPrice(furnitureSet.price)}
                                </div>
                                {furnitureSet.stats && furnitureSet.stats.setSavings > 0 && (
                                  <div className="text-xs text-green-300">
                                    -{formatPrice(furnitureSet.stats.setSavings)} tasarruf
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-white">
                                <span className="font-medium">{furnitureSet._count.furnitureSetItems}</span> parça
                                {furnitureSet.stats && (
                                  <div className="text-xs text-white/60 mt-1">
                                    Toplam: {furnitureSet.stats.totalQuantity} adet
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {availableColors.slice(0, 3).map((fc) => (
                                  <div
                                    key={fc.color.colorId}
                                    className="w-6 h-6 rounded-full border-2 border-white/50 shadow-sm"
                                    style={{ backgroundColor: fc.color.colorCode }}
                                    title={fc.color.colorName}
                                  />
                                ))}
                                {availableColors.length > 3 && (
                                  <div className="w-6 h-6 rounded-full bg-white/20 border-2 border-white/50 shadow-sm flex items-center justify-center">
                                    <span className="text-xs font-medium text-white">
                                      +{availableColors.length - 3}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                furnitureSet.isActive 
                                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}>
                                {furnitureSet.isActive ? '✓ Aktif' : '✕ Pasif'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-white/60">
                              <div className="space-y-1">
                                <div>{formatDate(furnitureSet.createdAt)}</div>
                                {furnitureSet.updatedAt && furnitureSet.updatedAt !== furnitureSet.createdAt && (
                                  <div className="text-xs text-white/40">
                                    Güncellendi: {formatDate(furnitureSet.updatedAt)}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Link
                                  href={`/admin/furniture-sets/${furnitureSet.setId}`}
                                  className="p-2 text-blue-300 hover:text-blue-100 hover:bg-blue-500/20 rounded-lg transition-colors"
                                  title="Detay Görüntüle"
                                >
                                  <EyeIcon />
                                </Link>
                                <Link
                                  href={`/admin/furniture-sets/${furnitureSet.setId}/edit`}
                                  className="p-2 text-yellow-300 hover:text-yellow-100 hover:bg-yellow-500/20 rounded-lg transition-colors"
                                  title="Düzenle"
                                >
                                  <EditIcon />
                                </Link>
                                <button
                                  onClick={() => {
                                    setSelectedItems([furnitureSet.setId])
                                    setShowDeleteConfirm(true)
                                  }}
                                  className="p-2 text-red-300 hover:text-red-100 hover:bg-red-500/20 rounded-lg transition-colors"
                                  title="Sil"
                                >
                                  <DeleteIcon />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {furnitureSets.map((furnitureSet) => (
                  <FurnitureSetCard key={furnitureSet.setId} furnitureSet={furnitureSet} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {furnitureSets.length === 0 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl text-center py-16">
                <div className="w-24 h-24 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4">
                  <FurnitureSetIcon />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">
                  Mobilya takımı bulunamadı
                </h3>
                <p className="text-white/60 mb-6 max-w-md mx-auto">
                  {hasActiveFilters 
                    ? 'Arama kriterlerinize uygun mobilya takımı bulunamadı. Filtreleri değiştirin veya temizleyin.'
                    : 'Henüz hiç mobilya takımı eklenmemiş. İlk takımınızı eklemek için aşağıdaki butonu kullanın.'
                  }
                </p>
                <div className="flex justify-center space-x-3">
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-colors"
                    >
                      Filtreleri Temizle
                    </button>
                  )}
                  <Link
                    href="/admin/furniture-sets/add"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-lg"
                  >
                    <PlusIcon />
                    <span className="ml-2">Yeni Takım Ekle</span>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}

        {/* Enhanced Pagination */}
        {!loading && totalPages > 1 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl px-6 py-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium rounded-xl text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Önceki
                </button>
                <div className="flex items-center px-4">
                  <span className="text-sm text-white/80">
                    Sayfa {currentPage} / {totalPages}
                  </span>
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium rounded-xl text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sonraki
                </button>
              </div>
              
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-white/80">
                    <span className="font-medium text-white">{((currentPage - 1) * pageLimit) + 1}</span>
                    {' - '}
                    <span className="font-medium text-white">
                      {Math.min(currentPage * pageLimit, totalItems)}
                    </span>
                    {' / '}
                    <span className="font-medium text-white">{totalItems}</span>
                    {' sonuç gösteriliyor'}
                    {hasActiveFilters && (
                      <span className="text-white/60 ml-1">(filtrelenmiş)</span>
                    )}
                  </p>
                </div>
                
                <div>
                  <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px">
                    {/* Previous button */}
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-xl bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium text-white/80 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeftIcon />
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let pageNumber
                      if (totalPages <= 7) {
                        pageNumber = i + 1
                      } else if (currentPage <= 4) {
                        pageNumber = i + 1
                      } else if (currentPage >= totalPages - 3) {
                        pageNumber = totalPages - 6 + i
                      } else {
                        pageNumber = currentPage - 3 + i
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                            currentPage === pageNumber
                              ? 'z-10 bg-blue-500/30 border-blue-400/50 text-blue-200'
                              : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      )
                    })}

                    {/* Next button */}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-xl bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium text-white/80 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRightIcon />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl max-w-md w-full mx-auto border border-white/20">
              <div className="p-8">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-500/20 backdrop-blur-sm rounded-full mb-6 border border-red-500/30">
                  <DeleteIcon />
                </div>
                
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    Mobilya Takımı Silme Onayı
                  </h3>
                  <div className="text-white/80 mb-8">
                    {selectedItems.length === 1 ? (
                      <div>
                        <p className="mb-4">Seçili mobilya takımını silmek istediğinizden emin misiniz?</p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                          <p className="text-sm font-medium text-white">
                            {furnitureSets.find(fs => fs.setId === selectedItems[0])?.setName}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p>
                        <span className="font-medium text-red-300">{selectedItems.length}</span> mobilya takımını silmek istediğinizden emin misiniz?
                      </p>
                    )}
                    <p className="text-sm text-red-300 mt-4 font-medium">
                      ⚠️ Bu işlem geri alınamaz ve tüm ilgili veriler silinecektir.
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={bulkActionLoading}
                      className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
                    >
                      İptal
                    </button>
                    <button
                      onClick={() => handleDelete(selectedItems)}
                      disabled={bulkActionLoading}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-colors disabled:opacity-50 shadow-lg"
                    >
                      {bulkActionLoading && <LoaderIcon />}
                      <span className={bulkActionLoading ? 'ml-2' : ''}>
                        {selectedItems.length === 1 ? 'Sil' : `${selectedItems.length} Takımı Sil`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS for animations and styles */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}