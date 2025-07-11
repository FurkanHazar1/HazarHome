'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'

// Utility function for image URLs
const getImageUrl = (filePath: string): string => {
  if (!filePath) return ''
  const cleanPath = filePath.replace(/^uploads\//, '')
  return `/api/images/serve/${cleanPath}`
}

// TypeScript interfaces
interface Category {
  categoryId: number
  categoryName: string
  categoryPath: string
}

interface Color {
  colorId: number
  colorName: string
  colorCode: string
}

interface Property {
  propertyId: number
  propertyName: string
  propertyType: string
}

interface Image {
  imageId: number
  fileName: string
  filePath: string
  altText: string
  width?: number
  height?: number
}

interface FurnitureImage {
  sortOrder: number
  imageType: string
  isActive: boolean
  image: Image
}

interface FurnitureColor {
  isAvailable: boolean
  color: Color
}

interface FurnitureProperty {
  propertyValue: string
  isActive: boolean
  property: Property
}

interface Furniture {
  furnitureId: number
  furnitureName: string
  furnitureType: string
  description?: string
  price: number
  isActive: boolean
  createdAt: string
  category?: Category
  colors: FurnitureColor[]
  properties: FurnitureProperty[]
  images: FurnitureImage[]
  _count: {
    colors: number
    properties: number
    images: number
  }
}

interface FurnitureResponse {
  success: boolean
  data?: Furniture[]
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
    averagePrice: number
    minPrice: number
    maxPrice: number
  }
  filters?: {
    categoryId: number | null
    furnitureType: string | null
    isActive: string | null
    search: string | null
    minPrice: number | null
    maxPrice: number | null
    colorIds: string | null
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
}

interface ColorOption {
  colorId: number
  colorName: string
  colorCode: string
}

// Modern Icon components using SVG
const FurnitureIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m7 21-3-3h16l-3 3" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export default function FurnitureManagement() {
  // State management
  const [furnitures, setFurnitures] = useState<Furniture[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [bulkActionLoading, setBulkActionLoading] = useState<boolean>(false)

  // Filter states
  const [search, setSearch] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [furnitureTypeFilter, setFurnitureTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
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
  const [furnitureTypes, setFurnitureTypes] = useState<string[]>([])

  // Stats
  const [stats, setStats] = useState<{
    total: number
    averagePrice: number
    minPrice: number
    maxPrice: number
  } | null>(null)

  // Load filter options
  const loadFilterOptions = useCallback(async (): Promise<void> => {
    try {
      const [categoriesRes, colorsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/colors')
      ])

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        if (categoriesData.success) {
          setCategories(categoriesData.data.map((cat: any) => ({
            categoryId: cat.categoryId,
            categoryName: cat.categoryName
          })))
        }
      }

      if (colorsRes.ok) {
        const colorsData = await colorsRes.json()
        if (colorsData.success) {
          setColors(colorsData.data.map((color: any) => ({
            colorId: color.colorId,
            colorName: color.colorName,
            colorCode: color.colorCode
          })))
        }
      }
    } catch (error) {
      console.error('Filter options yükleme hatası:', error)
    }
  }, [])

  // Load furniture data with optimizations
  const loadFurniture = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError('')
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageLimit.toString(),
        sortBy,
        sortOrder,
        includeDetails: 'true'
      })

      if (search.trim()) params.append('search', search.trim())
      if (categoryFilter) params.append('categoryId', categoryFilter)
      if (furnitureTypeFilter) params.append('type', furnitureTypeFilter)
      if (statusFilter) params.append('active', statusFilter)
      if (minPrice) params.append('minPrice', minPrice)
      if (maxPrice) params.append('maxPrice', maxPrice)
      if (selectedColors.length > 0) params.append('colorIds', selectedColors.join(','))

      const response = await fetch(`/api/furniture?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: FurnitureResponse = await response.json()
      
      if (data.success) {
        setFurnitures(data.data || [])
        setCurrentPage(data.pagination?.page || 1)
        setTotalPages(data.pagination?.pages || 1)
        setTotalItems(data.pagination?.total || 0)
        setStats(data.stats || null)
        
        // Extract unique furniture types
        const types = [...new Set((data.data || []).map(f => f.furnitureType))]
        setFurnitureTypes(types)
      } else {
        setError(data.error || data.message || 'Mobilyalar yüklenemedi')
      }
    } catch (err) {
      console.error('Mobilya yükleme hatası:', err)
      setError('Mobilyalar yüklenemedi. Lütfen sayfayı yenileyin.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageLimit, sortBy, sortOrder, search, categoryFilter, furnitureTypeFilter, statusFilter, minPrice, maxPrice, selectedColors])

  // Delete furniture with improved error handling
  const handleDelete = async (ids: number[]): Promise<void> => {
    try {
      setBulkActionLoading(true)
      const response = await fetch(`/api/furniture?ids=${ids.join(',')}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setSelectedItems([])
        setShowDeleteConfirm(false)
        // Show success message briefly
        setError('')
        await loadFurniture()
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

  // Toggle furniture status with improved UX
  const handleStatusToggle = async (ids: number[], isActive: boolean): Promise<void> => {
    try {
      setBulkActionLoading(true)
      const response = await fetch('/api/furniture', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids, isActive })
      })

      const data = await response.json()

      if (data.success) {
        setSelectedItems([])
        setError('')
        await loadFurniture()
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

  // Handle selection with optimization
  const handleSelectAll = useCallback((checked: boolean): void => {
    if (checked) {
      setSelectedItems(furnitures.map(f => f.furnitureId))
    } else {
      setSelectedItems([])
    }
  }, [furnitures])

  const handleSelectItem = useCallback((furnitureId: number, checked: boolean): void => {
    setSelectedItems(prev => {
      if (checked) {
        return [...prev, furnitureId]
      } else {
        return prev.filter(id => id !== furnitureId)
      }
    })
  }, [])

  // Reset filters
  const resetFilters = useCallback((): void => {
    setSearch('')
    setCategoryFilter('')
    setFurnitureTypeFilter('')
    setStatusFilter('')
    setMinPrice('')
    setMaxPrice('')
    setSelectedColors([])
    setCurrentPage(1)
  }, [])

  // Format functions
  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price)
  }, [])

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  const getMainImage = useCallback((images: FurnitureImage[]): Image | null => {
    const mainImage = images.find(img => img.imageType === 'main_image' && img.isActive)
    return mainImage?.image || images[0]?.image || null
  }, [])

  // Memoized values
  const hasActiveFilters = useMemo(() => {
    return search || categoryFilter || furnitureTypeFilter || statusFilter || 
           minPrice || maxPrice || selectedColors.length > 0
  }, [search, categoryFilter, furnitureTypeFilter, statusFilter, minPrice, maxPrice, selectedColors])

  const isAllSelected = useMemo(() => {
    return furnitures.length > 0 && selectedItems.length === furnitures.length
  }, [furnitures.length, selectedItems.length])

  const isIndeterminate = useMemo(() => {
    return selectedItems.length > 0 && selectedItems.length < furnitures.length
  }, [selectedItems.length, furnitures.length])

  // Load data on component mount
  useEffect(() => {
    loadFilterOptions()
  }, [loadFilterOptions])

  useEffect(() => {
    loadFurniture()
  }, [loadFurniture])

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FurnitureIcon />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Mobilya Yönetimi
                </h1>
                <p className="text-gray-600 mt-1">
                  Mobilyaları görüntüleyin, düzenleyin ve yönetin
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={loadFurniture}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 shadow-sm"
              >
                <RefreshIcon />
                <span className="ml-2">Yenile</span>
              </button>
              <Link
                href="/admin/furniture/add"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
              >
                <PlusIcon />
                <span className="ml-2">Yeni Mobilya</span>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Toplam Mobilya', value: stats.total.toLocaleString(), color: 'blue' },
                { label: 'Ortalama Fiyat', value: formatPrice(stats.averagePrice || 0), color: 'green' },
                { label: 'En Düşük Fiyat', value: formatPrice(stats.minPrice || 0), color: 'yellow' },
                { label: 'En Yüksek Fiyat', value: formatPrice(stats.maxPrice || 0), color: 'purple' }
              ].map((stat, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-600">{stat.label}</h3>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                      <FurnitureIcon />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-lg font-semibold text-gray-900"
              >
                <FilterIcon />
                <span>Filtreler</span>
                {hasActiveFilters && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Aktif
                  </span>
                )}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                  Filtreleri Temizle
                </button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                {/* Search */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arama
                  </label>
                  <div className="relative">
                    <SearchIcon />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Mobilya adı, açıklama..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Tüm Kategoriler</option>
                    {categories.map(category => (
                      <option key={category.categoryId} value={category.categoryId}>
                        {category.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durum
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Tüm Durumlar</option>
                    <option value="true">Aktif</option>
                    <option value="false">Pasif</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Fiyat
                  </label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Fiyat
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="999999"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sıralama
                  </label>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-')
                      setSortBy(field)
                      setSortOrder(order)
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="createdAt-desc">En Yeni</option>
                    <option value="createdAt-asc">En Eski</option>
                    <option value="furnitureName-asc">İsim A-Z</option>
                    <option value="furnitureName-desc">İsim Z-A</option>
                    <option value="price-asc">Fiyat Artan</option>
                    <option value="price-desc">Fiyat Azalan</option>
                  </select>
                </div>

                {/* Page Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sayfa Başına
                  </label>
                  <select
                    value={pageLimit}
                    onChange={(e) => setPageLimit(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-800 font-medium">
                  {selectedItems.length} öğe seçildi
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleStatusToggle(selectedItems, true)}
                  disabled={bulkActionLoading}
                  className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50"
                >
                  {bulkActionLoading ? <LoaderIcon /> : '✓'}
                  <span className="ml-1">Aktifleştir</span>
                </button>
                <button
                  onClick={() => handleStatusToggle(selectedItems, false)}
                  disabled={bulkActionLoading}
                  className="inline-flex items-center px-3 py-1.5 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors disabled:opacity-50"
                >
                  {bulkActionLoading ? <LoaderIcon /> : '⏸'}
                  <span className="ml-1">Pasifleştir</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={bulkActionLoading}
                  className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <LoaderIcon />
              <p className="text-gray-600 font-medium">Mobilyalar yükleniyor...</p>
            </div>
          </div>
        )}

        {/* Furniture Table */}
        {!loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isIndeterminate
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 shadow-sm"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Görsel
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mobilya Bilgileri
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori/Tip
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fiyat
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Özellikler
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {furnitures.map((furniture) => {
                    const mainImage = getMainImage(furniture.images)
                    return (
                      <tr key={furniture.furnitureId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(furniture.furnitureId)}
                            onChange={(e) => handleSelectItem(furniture.furnitureId, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 shadow-sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          {mainImage ? (
                            <div className="relative group">
                              <img
                                src={getImageUrl(mainImage.filePath)}
                                alt={mainImage.altText}
                                className="w-16 h-16 rounded-lg object-cover shadow-sm group-hover:shadow-md transition-shadow"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.parentElement?.querySelector('.fallback-image') as HTMLElement;
                                  if (fallback) fallback.classList.remove('hidden');
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all"></div>
                              <div className="fallback-image hidden w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                                <ImageIcon />
                              </div>
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                              <ImageIcon />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-gray-900">
                              {furniture.furnitureName}
                            </div>
                            {furniture.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {furniture.description}
                              </div>
                            )}
                            <div className="flex items-center space-x-4 mt-2">
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <ImageIcon />
                                <span>{furniture._count.images}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <ColorIcon />
                                <span>{furniture._count.colors}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <PropertyIcon />
                                <span>{furniture._count.properties}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">
                              {furniture.category?.categoryName || 'Kategorisiz'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {furniture.furnitureType}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">
                            {formatPrice(furniture.price)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {furniture.colors.slice(0, 3).map((fc) => (
                              <div
                                key={fc.color.colorId}
                                className="w-6 h-6 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200"
                                style={{ backgroundColor: fc.color.colorCode }}
                                title={fc.color.colorName}
                              />
                            ))}
                            {furniture.colors.length > 3 && (
                              <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white shadow-sm ring-1 ring-gray-200 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  +{furniture.colors.length - 3}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            furniture.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {furniture.isActive ? '✓ Aktif' : '✕ Pasif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(furniture.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              href={`/admin/furniture/${furniture.furnitureId}`}
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Detay Görüntüle"
                            >
                              <EyeIcon />
                            </Link>
                            <Link
                              href={`/admin/furniture/${furniture.furnitureId}/edit`}
                              className="p-2 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Düzenle"
                            >
                              <EditIcon />
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedItems([furniture.furnitureId])
                                setShowDeleteConfirm(true)
                              }}
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
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

            {/* Empty State */}
            {furnitures.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FurnitureIcon />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Mobilya bulunamadı
                </h3>
                <p className="text-gray-500 mb-6">
                  {hasActiveFilters 
                    ? 'Filtreleri değiştirin veya temizleyin.'
                    : 'Henüz hiç mobilya eklenmemiş.'
                  }
                </p>
                <div className="flex justify-center space-x-3">
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Filtreleri Temizle
                    </button>
                  )}
                  <Link
                    href="/admin/furniture/add"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon />
                    <span className="ml-2">Yeni Mobilya Ekle</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Önceki
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sonraki
                </button>
              </div>
              
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{((currentPage - 1) * pageLimit) + 1}</span>
                    {' - '}
                    <span className="font-medium">
                      {Math.min(currentPage * pageLimit, totalItems)}
                    </span>
                    {' / '}
                    <span className="font-medium">{totalItems}</span>
                    {' sonuç gösteriliyor'}
                  </p>
                </div>
                
                <div>
                  <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                    {/* Previous button */}
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
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
                      className="relative inline-flex items-center px-2 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRightIcon />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-auto">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                  <DeleteIcon />
                </div>
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Mobilya Silme Onayı
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {selectedItems.length === 1 
                      ? 'Seçili mobilyayı silmek istediğinizden emin misiniz?'
                      : `${selectedItems.length} mobilyayı silmek istediğinizden emin misiniz?`
                    }
                    {' '}Bu işlem geri alınamaz.
                  </p>
                  
                  <div className="flex items-center justify-center space-x-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={bulkActionLoading}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      İptal
                    </button>
                    <button
                      onClick={() => handleDelete(selectedItems)}
                      disabled={bulkActionLoading}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {bulkActionLoading && <LoaderIcon />}
                      <span className={bulkActionLoading ? 'ml-2' : ''}>Sil</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}