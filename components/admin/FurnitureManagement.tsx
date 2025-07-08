'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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

interface FurnitureImage {
  id: number
  imageType: string
  sortOrder: number
  image: {
    imageId: number
    fileName: string
    filePath: string
    altText: string
  }
}

// API Response types
interface ApiResponse<T> {
  success: boolean
  message?: string
  error?: string
  details?: string
  data?: T
}

interface ImageListItem {
  imageId: number
  fileName: string
  originalFileName?: string
  webPath: string
  fileSize?: number
  fileType?: string
  width?: number
  height?: number
  description?: string
  altText?: string
  sortOrder: number
  imageType: string
}

interface Furniture {
  furnitureId: number
  furnitureName: string
  furnitureType: string
  price: number
  description: string
  isActive: boolean
  createdAt: string
  category?: Category
  colors?: Array<{
    color: Color
    isAvailable: boolean
  }>
  properties?: Array<{
    propertyValue: string
    property: Property
  }>
  images?: FurnitureImage[]
  _count: {
    colors: number
    properties: number
    images: number
  }
}

interface FurnitureResponse extends ApiResponse<Furniture[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
  stats: {
    total: number
    averagePrice: number
    minPrice: number
    maxPrice: number
  }
  filters: any
}

interface FilterState {
  search: string
  categoryId: string
  isActive: string
  minPrice: string
  maxPrice: string
  furnitureType: string
  colorIds: string
}

// Icon components
const FurnitureIcon = () => <span className="text-xl">🪑</span>
const SearchIcon = () => <span className="text-lg">🔍</span>
const FilterIcon = () => <span className="text-lg">🔧</span>
const PlusIcon = () => <span className="text-lg">➕</span>
const EditIcon = () => <span className="text-sm">✏️</span>
const DeleteIcon = () => <span className="text-sm">🗑️</span>
const EyeIcon = () => <span className="text-sm">👁️</span>
const ImageIcon = () => <span className="text-sm">🖼️</span>
const TagIcon = () => <span className="text-sm">🏷️</span>
const ColorIcon = () => <span className="text-sm">🎨</span>
const LoaderIcon = () => <span className="text-lg animate-spin">⏳</span>
const RefreshIcon = () => <span className="text-lg">🔄</span>
const GridIcon = () => <span className="text-lg">⚏</span>
const ListIcon = () => <span className="text-lg">📋</span>
const WarningIcon = () => <span className="text-sm">⚠️</span>
const SuccessIcon = () => <span className="text-sm">✅</span>
const ApiIcon = () => <span className="text-sm">🔗</span>

export default function FurnitureManagement() {
  // State management
  const [furnitures, setFurnitures] = useState<Furniture[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [pagination, setPagination] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [bulkLoading, setBulkLoading] = useState<boolean>(false)
  const [deletingItems, setDeletingItems] = useState<number[]>([])
  const [loadingImages, setLoadingImages] = useState<{ [key: number]: boolean }>({})
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categoryId: '',
    isActive: '',
    minPrice: '',
    maxPrice: '',
    furnitureType: '',
    colorIds: ''
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit] = useState<number>(12)

  // Load furniture data
  const loadFurnitures = async (page: number = 1, newFilters?: FilterState): Promise<void> => {
    try {
      setLoading(true)
      setError('')
      const filterParams = newFilters || filters
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        includeDetails: 'true',
        ...(filterParams.search && { search: filterParams.search }),
        ...(filterParams.categoryId && { categoryId: filterParams.categoryId }),
        ...(filterParams.isActive && { active: filterParams.isActive }),
        ...(filterParams.minPrice && { minPrice: filterParams.minPrice }),
        ...(filterParams.maxPrice && { maxPrice: filterParams.maxPrice }),
        ...(filterParams.furnitureType && { type: filterParams.furnitureType }),
        ...(filterParams.colorIds && { colorIds: filterParams.colorIds })
      })

      const response = await fetch(`/api/furniture?${queryParams}`)
      const data: FurnitureResponse = await response.json()

      if (data.success) {
        setFurnitures(data.data || [])
        setPagination(data.pagination)
        setStats(data.stats)
        setCurrentPage(page)
      } else {
        setError(data.error || 'Mobilyalar yüklenemedi')
      }
    } catch (err) {
      console.error('Furniture loading error:', err)
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  // Load categories and colors for filters
  const loadFilterData = async (): Promise<void> => {
    try {
      const [categoriesRes, colorsRes] = await Promise.all([
        fetch('/api/categories?flat=true&active=true'),
        fetch('/api/colors?active=true')
      ])

      const [categoriesData, colorsData] = await Promise.all([
        categoriesRes.json(),
        colorsRes.json()
      ])

      if (categoriesData.success) setCategories(categoriesData.data)
      if (colorsData.success) setColors(colorsData.data)
    } catch (err) {
      console.error('Filter data loading error:', err)
    }
  }

  // Load images for a specific furniture from Upload API
  const loadFurnitureImages = async (furnitureId: number): Promise<string | null> => {
    try {
      setLoadingImages(prev => ({ ...prev, [furnitureId]: true }))
      
      const response = await fetch(`/api/upload?furnitureId=${furnitureId}`)
      const data: ApiResponse<ImageListItem[]> = await response.json()
      
      if (data.success && data.data && data.data.length > 0) {
        // Return main image or first image
        const mainImage = data.data.find(img => img.imageType === 'main_image') || data.data[0]
        return mainImage.webPath
      }
      
      return null
    } catch (err) {
      console.error('Images loading error:', err)
      return null
    } finally {
      setLoadingImages(prev => ({ ...prev, [furnitureId]: false }))
    }
  }

  // Bulk delete images using Upload API
  const bulkDeleteFurnitureImages = async (furnitureIds: number[]): Promise<void> => {
    try {
      for (const furnitureId of furnitureIds) {
        // Get all images for this furniture
        const response = await fetch(`/api/upload?furnitureId=${furnitureId}`)
        const data: ApiResponse<ImageListItem[]> = await response.json()
        
        if (data.success && data.data && data.data.length > 0) {
          const imageIds = data.data.map(img => img.imageId)
          
          // Bulk delete images
          await fetch('/api/upload', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'delete',
              imageIds
            })
          })
        }
      }
    } catch (err) {
      console.error('Bulk image delete error:', err)
    }
  }

  // Initial load
  useEffect(() => {
    loadFurnitures()
    loadFilterData()
  }, [])

  // Handle filter change
  const handleFilterChange = (key: keyof FilterState, value: string): void => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    loadFurnitures(1, newFilters)
  }

  // Handle bulk actions
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete'): Promise<void> => {
    if (selectedItems.length === 0) {
      setError('Lütfen işlem yapmak istediğiniz mobilyaları seçin')
      return
    }

    const confirmed = confirm(`Seçili ${selectedItems.length} mobilya için ${action} işlemi yapılacak. Devam edilsin mi?`)
    if (!confirmed) return

    try {
      setBulkLoading(true)
      setError('')
      setSuccessMessage('')
      
      if (action === 'delete') {
        setDeletingItems(selectedItems)
        
        // First delete associated images via Upload API
        await bulkDeleteFurnitureImages(selectedItems)
        
        // Then delete furniture records
        const response = await fetch(`/api/furniture?ids=${selectedItems.join(',')}`, {
          method: 'DELETE'
        })
        const data = await response.json()
        
        if (data.success) {
          setSuccessMessage(`${data.deletedCount} mobilya ve ilişkili görselleri silindi`)
          setSelectedItems([])
          loadFurnitures(currentPage)
        } else {
          setError('Silme işlemi başarısız: ' + data.error)
        }
        
        setDeletingItems([])
      } else {
        const response = await fetch('/api/furniture', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ids: selectedItems,
            isActive: action === 'activate'
          })
        })
        const data = await response.json()
        
        if (data.success) {
          setSuccessMessage(`${data.updatedCount} mobilya ${action === 'activate' ? 'aktif' : 'pasif'} yapıldı`)
          setSelectedItems([])
          loadFurnitures(currentPage)
        } else {
          setError('Güncelleme işlemi başarısız: ' + data.error)
        }
      }
    } catch (err) {
      console.error('Bulk action error:', err)
      setError('İşlem sırasında hata oluştu')
    } finally {
      setBulkLoading(false)
    }
  }

  // Format price
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price)
  }

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('tr-TR')
  }

  // Get main image with API fallback
  const getMainImage = (images?: FurnitureImage[], furnitureId?: number): string => {
    const mainImage = images?.find(img => img.imageType === 'main_image')
    const fallbackImage = mainImage?.image.filePath || '/images/placeholder-furniture.jpg'
    
    // Could implement real-time image loading here if needed
    return fallbackImage
  }

  // Select all/none
  const handleSelectAll = (): void => {
    if (selectedItems.length === furnitures.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(furnitures.map(f => f.furnitureId))
    }
  }

  // Clear messages
  const clearMessages = (): void => {
    setError('')
    setSuccessMessage('')
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <FurnitureIcon />
              <span>Mobilya Yönetimi</span>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center space-x-1">
                <ApiIcon />
                <span>API Entegreli</span>
              </span>
            </h1>
            <p className="text-gray-600 mt-2">
              Mobilyaları görüntüle, düzenle ve yönet • Upload API ile görsel yönetimi
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => loadFurnitures(currentPage)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              disabled={loading}
            >
              {loading ? <LoaderIcon /> : <RefreshIcon />}
              <span>Yenile</span>
            </button>
            
            <Link
              href="/admin/furniture/add"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <PlusIcon />
              <span>Yeni Mobilya</span>
            </Link>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Toplam Mobilya</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Ortalama Fiyat</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.averagePrice ? formatPrice(stats.averagePrice) : '-'}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">En Düşük Fiyat</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.minPrice ? formatPrice(stats.minPrice) : '-'}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">En Yüksek Fiyat</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.maxPrice ? formatPrice(stats.maxPrice) : '-'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <WarningIcon />
            <span>{error}</span>
          </div>
          <button onClick={clearMessages} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SuccessIcon />
            <span>{successMessage}</span>
          </div>
          <button onClick={clearMessages} className="text-green-500 hover:text-green-700">✕</button>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {/* Filter Toggle and View Mode */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FilterIcon />
              <span>Filtreler</span>
            </button>

            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedItems.length} seçili
                </span>
                <button
                  onClick={() => handleBulkAction('activate')}
                  disabled={bulkLoading}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 disabled:opacity-50"
                >
                  {bulkLoading ? <LoaderIcon /> : 'Aktif Yap'}
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  disabled={bulkLoading}
                  className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200 disabled:opacity-50"
                >
                  {bulkLoading ? <LoaderIcon /> : 'Pasif Yap'}
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  disabled={bulkLoading}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 disabled:opacity-50"
                >
                  {bulkLoading ? <LoaderIcon /> : 'Sil (API Dahil)'}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <GridIcon />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <ListIcon />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-gray-200">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arama
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Mobilya ara..."
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <div className="absolute left-2 top-2">
                  <SearchIcon />
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori
              </label>
              <select
                value={filters.categoryId}
                onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Tüm Kategoriler</option>
                {categories.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durum
              </label>
              <select
                value={filters.isActive}
                onChange={(e) => handleFilterChange('isActive', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Tümü</option>
                <option value="true">Aktif</option>
                <option value="false">Pasif</option>
              </select>
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Fiyat
              </label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Fiyat
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="999999"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {/* Furniture Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobilya Tipi
              </label>
              <input
                type="text"
                value={filters.furnitureType}
                onChange={(e) => handleFilterChange('furnitureType', e.target.value)}
                placeholder="Koltuk, Masa..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoaderIcon />
          <span className="ml-2 text-gray-600">Mobilyalar yükleniyor...</span>
        </div>
      )}

      {/* Furniture Grid/List */}
      {!loading && furnitures.length > 0 && (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {furnitures.map((furniture) => (
                <div
                  key={furniture.furnitureId}
                  className={`bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all ${
                    selectedItems.includes(furniture.furnitureId) ? 'ring-2 ring-blue-500' : ''
                  } ${deletingItems.includes(furniture.furnitureId) ? 'opacity-50' : ''}`}
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={getMainImage(furniture.images, furniture.furnitureId)}
                      alt={furniture.furnitureName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder-furniture.jpg'
                      }}
                    />
                    
                    {/* Checkbox */}
                    <div className="absolute top-2 left-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(furniture.furnitureId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, furniture.furnitureId])
                          } else {
                            setSelectedItems(selectedItems.filter(id => id !== furniture.furnitureId))
                          }
                        }}
                        disabled={deletingItems.includes(furniture.furnitureId)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        furniture.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {furniture.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>

                    {/* Loading/Deleting Overlay */}
                    {deletingItems.includes(furniture.furnitureId) && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-white text-center">
                          <LoaderIcon />
                          <div className="text-sm mt-1">Siliniyor...</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">
                      {furniture.furnitureName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {furniture.furnitureType}
                    </p>
                    <p className="text-lg font-bold text-blue-600 mb-3">
                      {formatPrice(furniture.price)}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                      <span className="flex items-center space-x-1">
                        <ImageIcon />
                        <span>{furniture._count.images}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <ColorIcon />
                        <span>{furniture._count.colors}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <TagIcon />
                        <span>{furniture._count.properties}</span>
                      </span>
                    </div>

                    {/* API Integration Badge */}
                    <div className="mb-3">
                      <span className="inline-flex items-center space-x-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                        <ApiIcon />
                        <span>API Destekli</span>
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/furniture/${furniture.furnitureId}`}
                        className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm text-center hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1"
                      >
                        <EyeIcon />
                        <span>Detay</span>
                      </Link>
                      <Link
                        href={`/admin/furniture/${furniture.furnitureId}/edit`}
                        className="flex-1 bg-green-50 text-green-700 px-3 py-2 rounded text-sm text-center hover:bg-green-100 transition-colors flex items-center justify-center space-x-1"
                      >
                        <EditIcon />
                        <span>Düzenle</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedItems.length === furnitures.length}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mobilya
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fiyat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        API
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {furnitures.map((furniture) => (
                      <tr 
                        key={furniture.furnitureId} 
                        className={`hover:bg-gray-50 ${deletingItems.includes(furniture.furnitureId) ? 'opacity-50' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(furniture.furnitureId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems([...selectedItems, furniture.furnitureId])
                              } else {
                                setSelectedItems(selectedItems.filter(id => id !== furniture.furnitureId))
                              }
                            }}
                            disabled={deletingItems.includes(furniture.furnitureId)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="relative">
                              <img
                                src={getMainImage(furniture.images, furniture.furnitureId)}
                                alt={furniture.furnitureName}
                                className="w-12 h-12 rounded-lg object-cover mr-4"
                                onError={(e) => {
                                  e.currentTarget.src = '/images/placeholder-furniture.jpg'
                                }}
                              />
                              {loadingImages[furniture.furnitureId] && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                                  <LoaderIcon />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {furniture.furnitureName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {furniture.furnitureType}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {furniture.category?.categoryName || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {formatPrice(furniture.price)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            furniture.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {furniture.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center space-x-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                            <ApiIcon />
                            <span>Entegreli</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(furniture.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/admin/furniture/${furniture.furnitureId}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <EyeIcon />
                            </Link>
                            <Link
                              href={`/admin/furniture/${furniture.furnitureId}/edit`}
                              className="text-green-600 hover:text-green-900"
                            >
                              <EditIcon />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Toplam {pagination.total} mobilyadan {((pagination.page - 1) * pagination.limit) + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} arası gösteriliyor
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => loadFurnitures(pagination.page - 1)}
                  disabled={!pagination.hasPrev || loading}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Önceki
                </button>
                
                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === pagination.pages || 
                    Math.abs(page - pagination.page) <= 2
                  )
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => loadFurnitures(page)}
                        disabled={loading}
                        className={`px-3 py-2 text-sm border rounded-lg disabled:opacity-50 ${
                          page === pagination.page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
                
                <button
                  onClick={() => loadFurnitures(pagination.page + 1)}
                  disabled={!pagination.hasNext || loading}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && furnitures.length === 0 && (
        <div className="text-center py-12">
          <FurnitureIcon />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Mobilya bulunamadı</h3>
          <p className="mt-1 text-sm text-gray-500">
            {Object.values(filters).some(v => v) 
              ? 'Filtrelere uygun mobilya bulunamadı. Filtreleri değiştirmeyi deneyin.'
              : 'Henüz hiç mobilya eklenmemiş. İlk mobilyayı ekleyerek başlayın.'
            }
          </p>
          <div className="mt-6">
            <Link
              href="/admin/furniture/add"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon />
              <span className="ml-2">Yeni Mobilya Ekle</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}