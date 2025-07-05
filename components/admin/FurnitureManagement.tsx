// components/admin/FurnitureManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// TypeScript interfaces
interface Furniture {
  furnitureId: number
  furnitureName: string
  furnitureType: string
  price: number
  isActive: boolean
  createdAt: string
  category?: {
    categoryId: number
    categoryName: string
    categoryPath: string
  }
  _count: {
    furnitureColors: number
    furnitureProperties: number
    furnitureImages: number
  }
}

interface Category {
  categoryId: number
  categoryName: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
}

interface FurnitureStats {
  total: number
  averagePrice: number
  minPrice: number
  maxPrice: number
}

// Icon components
const FurnitureIcon = () => <span className="text-2xl">🪑</span>
const PlusIcon = () => <span className="text-lg">➕</span>
const SearchIcon = () => <span className="text-lg">🔍</span>
const FilterIcon = () => <span className="text-lg">🔽</span>
const LoaderIcon = () => <span className="text-lg animate-spin">⏳</span>
const EditIcon = () => <span className="text-sm">✏️</span>
const DeleteIcon = () => <span className="text-sm">🗑️</span>
const EyeIcon = () => <span className="text-sm">👁️</span>
const ToggleIcon = () => <span className="text-sm">🔄</span>

export default function FurnitureManagement() {
  const router = useRouter()
  
  // State management
  const [furnitures, setFurnitures] = useState<Furniture[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [stats, setStats] = useState<FurnitureStats | null>(null)
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    furnitureType: '',
    isActive: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  // Mobilyaları yükle
  const loadFurnitures = async (): Promise<void> => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        includeDetails: 'false',
        ...(filters.search && { search: filters.search }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.furnitureType && { type: filters.furnitureType }),
        ...(filters.isActive !== '' && { active: filters.isActive }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      })

      const response = await fetch(`/api/furniture?${params}`)
      const data = await response.json()

      if (data.success) {
        setFurnitures(data.data)
        setPagination(data.pagination)
        setStats(data.stats)
        setError('')
      } else {
        setError(data.error || 'Mobilyalar yüklenemedi')
      }
    } catch (err) {
      console.error('Mobilya yükleme hatası:', err)
      setError('Mobilyalar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Kategorileri yükle
  const loadCategories = async (): Promise<void> => {
    try {
      const response = await fetch('/api/categories?flat=true&active=true')
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.data)
      }
    } catch (err) {
      console.error('Kategori yükleme hatası:', err)
    }
  }

  // Component mount
  useEffect(() => {
    loadCategories()
  }, [])

  // Filters veya pagination değiştiğinde mobilyaları yeniden yükle
  useEffect(() => {
    loadFurnitures()
  }, [pagination.page, pagination.limit, filters])

  // Toplu silme
  const handleBulkDelete = async (): Promise<void> => {
    if (selectedItems.length === 0) return
    
    const confirmed = window.confirm(`${selectedItems.length} mobilya silinecek. Emin misiniz?`)
    if (!confirmed) return

    try {
      setLoading(true)
      const response = await fetch(`/api/furniture?ids=${selectedItems.join(',')}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSelectedItems([])
        await loadFurnitures()
        alert(data.message)
      } else {
        alert(data.error || 'Silme işlemi başarısız')
      }
    } catch (err) {
      console.error('Toplu silme hatası:', err)
      alert('Silme işleminde hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Toplu aktif/pasif yapma
  const handleBulkToggleStatus = async (isActive: boolean): Promise<void> => {
    if (selectedItems.length === 0) return

    try {
      setLoading(true)
      const response = await fetch('/api/furniture', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedItems,
          isActive
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSelectedItems([])
        await loadFurnitures()
        alert(data.message)
      } else {
        alert(data.error || 'Güncelleme işlemi başarısız')
      }
    } catch (err) {
      console.error('Toplu güncelleme hatası:', err)
      alert('Güncelleme işleminde hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Tekil silme
  const handleDelete = async (furnitureId: number, furnitureName: string): Promise<void> => {
    const confirmed = window.confirm(`"${furnitureName}" mobilyası silinecek. Emin misiniz?`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/furniture/${furnitureId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadFurnitures()
        alert(data.message)
      } else {
        alert(data.error || 'Silme işlemi başarısız')
      }
    } catch (err) {
      console.error('Silme hatası:', err)
      alert('Silme işleminde hata oluştu')
    }
  }

  // Select all/none
  const handleSelectAll = (checked: boolean): void => {
    if (checked) {
      setSelectedItems(furnitures.map(f => f.furnitureId))
    } else {
      setSelectedItems([])
    }
  }

  // Select single item
  const handleSelectItem = (furnitureId: number, checked: boolean): void => {
    if (checked) {
      setSelectedItems([...selectedItems, furnitureId])
    } else {
      setSelectedItems(selectedItems.filter(id => id !== furnitureId))
    }
  }

  // Filter handler
  const handleFilterChange = (key: string, value: string): void => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  // Page change
  const handlePageChange = (newPage: number): void => {
    setPagination(prev => ({ ...prev, page: newPage }))
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

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <FurnitureIcon />
              <span>Mobilya Yönetimi</span>
            </h1>
            <p className="text-gray-600 mt-2">
              Mobilya ekleme, düzenleme ve yönetim işlemleri
            </p>
          </div>
          
          <Link
            href="/admin/furniture/add"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon />
            <span>Yeni Mobilya Ekle</span>
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Toplam Mobilya</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString('tr-TR')}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Ortalama Fiyat</div>
              <div className="text-2xl font-bold text-gray-900">{formatPrice(stats.averagePrice || 0)}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">En Düşük Fiyat</div>
              <div className="text-2xl font-bold text-gray-900">{formatPrice(stats.minPrice || 0)}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">En Yüksek Fiyat</div>
              <div className="text-2xl font-bold text-gray-900">{formatPrice(stats.maxPrice || 0)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FilterIcon />
          <span className="ml-2">Filtreler</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Arama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arama
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Mobilya adı..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={filters.categoryId}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map(category => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Mobilya Tipi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobilya Tipi
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Koltuk, Masa..."
              value={filters.furnitureType}
              onChange={(e) => handleFilterChange('furnitureType', e.target.value)}
            />
          </div>

          {/* Durum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Durum
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
            >
              <option value="">Tümü</option>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          </div>

          {/* Sıralama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sıralama
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                setFilters(prev => ({ ...prev, sortBy, sortOrder }))
              }}
            >
              <option value="createdAt-desc">En Yeni</option>
              <option value="createdAt-asc">En Eski</option>
              <option value="furnitureName-asc">İsim (A-Z)</option>
              <option value="furnitureName-desc">İsim (Z-A)</option>
              <option value="price-asc">Fiyat (Düşük-Yüksek)</option>
              <option value="price-desc">Fiyat (Yüksek-Düşük)</option>
            </select>
          </div>
        </div>

        {/* Fiyat Aralığı */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Fiyat
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Fiyat
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="999999"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedItems.length} mobilya seçildi
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkToggleStatus(true)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Aktif Yap
              </button>
              <button
                onClick={() => handleBulkToggleStatus(false)}
                className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
              >
                Pasif Yap
              </button>
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoaderIcon />
          <span className="ml-2 text-gray-600">Mobilyalar yükleniyor...</span>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedItems.length === furnitures.length && furnitures.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
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
                    Detaylar
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
                  <tr key={furniture.furnitureId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedItems.includes(furniture.furnitureId)}
                        onChange={(e) => handleSelectItem(furniture.furnitureId, e.target.checked)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {furniture.furnitureName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {furniture.furnitureType}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {furniture.category?.categoryName || 'Kategorisiz'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(furniture.price)}
                      </div>
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
                      <div className="text-xs text-gray-500">
                        <div>🎨 {furniture._count.furnitureColors} renk</div>
                        <div>🏷️ {furniture._count.furnitureProperties} özellik</div>
                        <div>🖼️ {furniture._count.furnitureImages} görsel</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {formatDate(furniture.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/furniture/${furniture.furnitureId}`}
                          className="text-blue-600 hover:text-blue-800"
                          title="Detay"
                        >
                          <EyeIcon />
                        </Link>
                        <Link
                          href={`/admin/furniture/${furniture.furnitureId}/edit`}
                          className="text-green-600 hover:text-green-800"
                          title="Düzenle"
                        >
                          <EditIcon />
                        </Link>
                        <button
                          onClick={() => handleDelete(furniture.furnitureId, furniture.furnitureName)}
                          className="text-red-600 hover:text-red-800"
                          title="Sil"
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm text-gray-700">
                  Toplam {pagination.total} kayıttan {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} arası gösteriliyor
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Önceki
                </button>
                
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = Math.max(1, pagination.page - 2) + i
                  if (pageNum > pagination.pages) return null
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-sm border rounded ${
                        pageNum === pagination.page
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && furnitures.length === 0 && (
        <div className="text-center py-12">
          <FurnitureIcon />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Mobilya bulunamadı</h3>
          <p className="mt-1 text-sm text-gray-500">
            Filtrelerinizi değiştirin veya yeni mobilya ekleyin.
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