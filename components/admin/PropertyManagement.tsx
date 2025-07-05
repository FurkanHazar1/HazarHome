'use client'

import { useState, useEffect } from 'react'

// Next.js için TypeScript interface'leri
interface Property {
  propertyId: number
  propertyName: string
  propertyType: 'text' | 'number' | 'date' | 'boolean'
  description?: string
  isActive: boolean
  createdAt: string
  _count: {
    furnitureProperties: number
    furnitureSetProperties: number
  }
}

interface PropertyStats {
  byType: { [key: string]: number }
  usage: {
    used: number
    unused: number
    total: number
  }
  mostUsed: Array<{
    propertyName: string
    totalUsage: number
    furnitureUsage: number
    furnitureSetUsage: number
  }>
}

interface FormData {
  propertyName: string
  propertyType: 'text' | 'number' | 'date' | 'boolean'
  description: string
  isActive: boolean
}

interface Filters {
  search: string
  type: string
  category: string
  usage: string
  active: string
}

// Next.js için basit icon component'leri
const TrashIcon = () => <span className="text-lg">🗑️</span>
const EditIcon = () => <span className="text-lg">✏️</span>
const PlusIcon = () => <span className="text-lg">➕</span>
const EyeIcon = () => <span className="text-lg">👁️</span>
const EyeOffIcon = () => <span className="text-lg">👁️‍🗨️</span>
const SaveIcon = () => <span className="text-lg">💾</span>
const CloseIcon = () => <span className="text-lg">❌</span>
const LoaderIcon = () => <span className="text-lg animate-spin">⏳</span>
const SearchIcon = () => <span className="text-lg">🔍</span>
const FilterIcon = () => <span className="text-lg">🔽</span>
const StatsIcon = () => <span className="text-lg">📊</span>
const CleanIcon = () => <span className="text-lg">🧹</span>

export default function PropertyManagement() {
  // State management
  const [properties, setProperties] = useState<Property[]>([])
  const [stats, setStats] = useState<PropertyStats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [showAddForm, setShowAddForm] = useState<boolean>(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [showStats, setShowStats] = useState<boolean>(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Form state
  const [formData, setFormData] = useState<FormData>({
    propertyName: '',
    propertyType: 'text',
    description: '',
    isActive: true
  })

  // Filter state
  const [filters, setFilters] = useState<Filters>({
    search: '',
    type: '',
    category: '',
    usage: '',
    active: ''
  })

  // Özellik kategorileri
  const categoryOptions = [
    { value: '', label: 'Tüm Kategoriler' },
    { value: 'temel', label: 'Temel Özellikler' },
    { value: 'ticari', label: 'Ticari Özellikler' },
    { value: 'koltuk', label: 'Koltuk Özellikleri' },
    { value: 'yatak', label: 'Yatak Özellikleri' },
    { value: 'dolap', label: 'Dolap Özellikleri' },
    { value: 'masa', label: 'Masa Özellikleri' },
    { value: 'genel', label: 'Genel Özellikler' }
  ]

  const typeOptions = [
    { value: '', label: 'Tüm Tipler' },
    { value: 'text', label: 'Metin' },
    { value: 'number', label: 'Sayı' },
    { value: 'date', label: 'Tarih' },
    { value: 'boolean', label: 'Evet/Hayır' }
  ]

  const usageOptions = [
    { value: '', label: 'Tüm Özellikler' },
    { value: 'used', label: 'Kullanılan' },
    { value: 'unused', label: 'Kullanılmayan' }
  ]

  // Next.js API route'larından özellikleri yükle
  const loadProperties = async (): Promise<void> => {
    try {
      setLoading(true)
      
      // Filtre parametrelerini oluştur
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.type) params.append('type', filters.type)
      if (filters.category) params.append('category', filters.category)
      if (filters.usage) params.append('usage', filters.usage)
      if (filters.active) params.append('active', filters.active)
      if (showStats) params.append('includeStats', 'true')
      
      const response = await fetch(`/api/properties?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setProperties(data.data)
        if (data.stats) {
          setStats(data.stats)
        }
        setError('')
      } else {
        setError(data.error || 'Özellikler yüklenemedi')
      }
    } catch (err) {
      console.error('Özellik yükleme hatası:', err)
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  // Component mount'da özellikleri yükle
  useEffect(() => {
    loadProperties()
  }, [filters, showStats])

  // Form gönderme
  const handleSubmit = async (): Promise<void> => {
    if (!formData.propertyName.trim()) {
      setError('Özellik adı zorunludur')
      return
    }

    setError('')
    setSuccess('')

    try {
      const url = editingProperty 
        ? `/api/properties/${editingProperty.propertyId}`
        : '/api/properties'
      
      const method = editingProperty ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        const successMessage = editingProperty ? 'Özellik güncellendi!' : 'Özellik eklendi!'
        setSuccess(successMessage)
        resetForm()
        await loadProperties()
        
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'İşlem başarısız')
      }
    } catch (err) {
      console.error('Form gönderme hatası:', err)
      setError('Bağlantı hatası')
    }
  }

  // Özellik silme
  const handleDelete = async (propertyId: number, propertyName: string): Promise<void> => {
    if (!confirm(`"${propertyName}" özelliğini silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setSuccess('Özellik silindi!')
        await loadProperties()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Silme işlemi başarısız')
      }
    } catch (err) {
      console.error('Silme hatası:', err)
      setError('Bağlantı hatası')
    }
  }

  // Aktif/Pasif değiştirme
  const toggleActive = async (propertyId: number, currentStatus: boolean): Promise<void> => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setSuccess(`Özellik ${!currentStatus ? 'aktif' : 'pasif'} yapıldı!`)
        await loadProperties()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Durum değiştirilemedi')
      }
    } catch (err) {
      console.error('Toggle hatası:', err)
      setError('Bağlantı hatası')
    }
  }

  // Toplu işlemler
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete'): Promise<void> => {
    if (selectedIds.length === 0) {
      setError('Lütfen en az bir özellik seçin')
      return
    }

    const actionText = {
      activate: 'aktif yapmak',
      deactivate: 'pasif yapmak', 
      delete: 'silmek'
    }

    if (!confirm(`Seçili ${selectedIds.length} özelliği ${actionText[action]} istediğinizden emin misiniz?`)) {
      return
    }

    try {
      let response
      
      if (action === 'delete') {
        response = await fetch(`/api/properties?ids=${selectedIds.join(',')}`, {
          method: 'DELETE'
        })
      } else {
        response = await fetch('/api/properties', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ids: selectedIds, 
            isActive: action === 'activate' 
          })
        })
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message)
        setSelectedIds([])
        await loadProperties()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Toplu işlem başarısız')
      }
    } catch (err) {
      console.error('Toplu işlem hatası:', err)
      setError('Bağlantı hatası')
    }
  }

  // Kullanılmayan özellikleri temizle
  const cleanupUnused = async (): Promise<void> => {
    if (!confirm('Kullanılmayan tüm özellikleri silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const unusedProperties = properties.filter(p => 
        p._count.furnitureProperties === 0 && p._count.furnitureSetProperties === 0
      )
      
      if (unusedProperties.length === 0) {
        setError('Kullanılmayan özellik bulunamadı')
        return
      }

      const unusedIds = unusedProperties.map(p => p.propertyId)
      
      const response = await fetch(`/api/properties?ids=${unusedIds.join(',')}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setSuccess(`${unusedIds.length} kullanılmayan özellik silindi!`)
        await loadProperties()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Temizleme başarısız')
      }
    } catch (err) {
      console.error('Temizleme hatası:', err)
      setError('Bağlantı hatası')
    }
  }

  // Form sıfırlama
  const resetForm = (): void => {
    setFormData({
      propertyName: '',
      propertyType: 'text',
      description: '',
      isActive: true
    })
    setShowAddForm(false)
    setEditingProperty(null)
  }

  // Düzenleme için formu doldur
  const startEdit = (property: Property): void => {
    setFormData({
      propertyName: property.propertyName,
      propertyType: property.propertyType,
      description: property.description || '',
      isActive: property.isActive
    })
    setEditingProperty(property)
    setShowAddForm(true)
  }

  // Özellik tipi etiketi
  const getTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      text: 'Metin',
      number: 'Sayı',
      date: 'Tarih',
      boolean: 'Evet/Hayır'
    }
    return labels[type] || type
  }

  // Özellik tipine göre renk
  const getTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      text: 'bg-blue-100 text-blue-800',
      number: 'bg-green-100 text-green-800',
      date: 'bg-purple-100 text-purple-800',
      boolean: 'bg-orange-100 text-orange-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  // Checkbox seçimi
  const handleSelectProperty = (propertyId: number, checked: boolean): void => {
    if (checked) {
      setSelectedIds([...selectedIds, propertyId])
    } else {
      setSelectedIds(selectedIds.filter(id => id !== propertyId))
    }
  }

  // Tümünü seç/seçme
  const handleSelectAll = (checked: boolean): void => {
    if (checked) {
      setSelectedIds(properties.map(p => p.propertyId))
    } else {
      setSelectedIds([])
    }
  }

  // Next.js component return
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Özellik Yönetimi</h1>
          <p className="text-gray-600">Mobilya özelliklerini yönetin</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              showStats 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            type="button"
          >
            <StatsIcon />
            <span>İstatistikler</span>
          </button>
          <button
            onClick={cleanupUnused}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
            type="button"
          >
            <CleanIcon />
            <span>Temizle</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            type="button"
          >
            <PlusIcon />
            <span>Yeni Özellik</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4" role="alert">
          {success}
        </div>
      )}

      {/* İstatistik Kartları */}
      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-600">Toplam Özellik</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.usage.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-600">Kullanılan</h3>
            <p className="text-2xl font-bold text-green-600">{stats.usage.used}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-600">Kullanılmayan</h3>
            <p className="text-2xl font-bold text-orange-600">{stats.usage.unused}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-600">Metin Tipi</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.byType.text || 0}</p>
          </div>
        </div>
      )}

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <SearchIcon /> Arama
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Özellik ara..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tip
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kullanım
            </label>
            <select
              value={filters.usage}
              onChange={(e) => setFilters({...filters, usage: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {usageOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Durum
            </label>
            <select
              value={filters.active}
              onChange={(e) => setFilters({...filters, active: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tüm Durumlar</option>
              <option value="true">Sadece Aktif</option>
              <option value="false">Sadece Pasif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Toplu İşlemler */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedIds.length} özellik seçildi
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                type="button"
              >
                Aktif Yap
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                type="button"
              >
                Pasif Yap
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                type="button"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingProperty ? 'Özellik Düzenle' : 'Yeni Özellik Ekle'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
                aria-label="Kapat"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="propertyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Özellik Adı *
                </label>
                <input
                  id="propertyName"
                  type="text"
                  required
                  value={formData.propertyName}
                  onChange={(e) => setFormData({...formData, propertyName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Özellik adını girin"
                />
              </div>

              <div>
                <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">
                  Özellik Tipi *
                </label>
                <select
                  id="propertyType"
                  value={formData.propertyType}
                  onChange={(e) => setFormData({...formData, propertyType: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="text">Metin</option>
                  <option value="number">Sayı</option>
                  <option value="date">Tarih</option>
                  <option value="boolean">Evet/Hayır</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Özellik açıklaması (isteğe bağlı)"
                  rows={3}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Aktif özellik
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  type="button"
                >
                  <SaveIcon />
                  <span>{editingProperty ? 'Güncelle' : 'Kaydet'}</span>
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  type="button"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoaderIcon />
          <span className="ml-2 text-gray-600">Yükleniyor...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && properties.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Henüz özellik bulunmuyor.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            type="button"
          >
            İlk özelliği ekleyin
          </button>
        </div>
      )}

      {/* Properties Table */}
      {!loading && properties.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Toplam {properties.length} özellik
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedIds.length === properties.length && properties.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Tümünü Seç</span>
              </label>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seç
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Özellik Adı
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tip
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanım
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {properties.map((property) => (
                  <tr 
                    key={property.propertyId}
                    className={`hover:bg-gray-50 ${
                      selectedIds.includes(property.propertyId) ? 'bg-blue-50' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(property.propertyId)}
                        onChange={(e) => handleSelectProperty(property.propertyId, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>

                    {/* Özellik Adı */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {property.propertyName}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {property.propertyId}
                      </div>
                    </td>

                    {/* Tip */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(property.propertyType)}`}>
                        {getTypeLabel(property.propertyType)}
                      </span>
                    </td>

                    {/* Açıklama */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {property.description ? (
                          <span title={property.description}>
                            {property.description.length > 50 
                              ? `${property.description.substring(0, 50)}...` 
                              : property.description
                            }
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Açıklama yok</span>
                        )}
                      </div>
                    </td>

                    {/* Kullanım */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600 font-medium">
                            {property._count.furnitureProperties + property._count.furnitureSetProperties}
                          </span>
                          <span className="text-gray-500">toplam</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {property._count.furnitureProperties} mobilya, {property._count.furnitureSetProperties} set
                        </div>
                      </div>
                    </td>

                    {/* Durum */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        property.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {property.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>

                    {/* İşlemler */}
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleActive(property.propertyId, property.isActive)}
                          className={`p-1.5 rounded transition-colors ${
                            property.isActive 
                              ? 'text-orange-600 hover:bg-orange-100' 
                              : 'text-green-600 hover:bg-green-100'
                          }`}
                          title={property.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                          type="button"
                        >
                          {property.isActive ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                        <button
                          onClick={() => startEdit(property)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="Düzenle"
                          type="button"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleDelete(property.propertyId, property.propertyName)}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Sil"
                          type="button"
                          disabled={property._count.furnitureProperties + property._count.furnitureSetProperties > 0}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* En Çok Kullanılan Özellikler (İstatistik açıksa) */}
          {showStats && stats?.mostUsed && stats.mostUsed.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                En Çok Kullanılan Özellikler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.mostUsed.slice(0, 6).map((item, index) => (
                  <div key={item.propertyName} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {item.propertyName}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-blue-600">
                        {item.totalUsage}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.furnitureUsage} mobilya, {item.furnitureSetUsage} set
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}