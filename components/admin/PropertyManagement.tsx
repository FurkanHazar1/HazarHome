'use client'

import React, { useState, useEffect } from 'react'

// TypeScript interfaces
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

// Icon components - Styled to match FurnitureAdd
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
const PropertyIcon = () => <span className="text-2xl">🏷️</span>
const SuccessIcon = () => <span className="text-lg">✅</span>
const TextIcon = () => <span className="text-lg">📝</span>
const NumberIcon = () => <span className="text-lg">🔢</span>
const DateIcon = () => <span className="text-lg">📅</span>
const BooleanIcon = () => <span className="text-lg">☑️</span>
const UsageIcon = () => <span className="text-lg">📈</span>
const TrophyIcon = () => <span className="text-lg">🏆</span>

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

  // Property categories
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
    { value: 'text', label: 'Metin', icon: <TextIcon /> },
    { value: 'number', label: 'Sayı', icon: <NumberIcon /> },
    { value: 'date', label: 'Tarih', icon: <DateIcon /> },
    { value: 'boolean', label: 'Evet/Hayır', icon: <BooleanIcon /> }
  ]

  const usageOptions = [
    { value: '', label: 'Tüm Özellikler' },
    { value: 'used', label: 'Kullanılan' },
    { value: 'unused', label: 'Kullanılmayan' }
  ]

  // Load properties from API
  const loadProperties = async (): Promise<void> => {
    try {
      setLoading(true)
      
      // Build filter parameters
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

  // Load properties on component mount
  useEffect(() => {
    loadProperties()
  }, [filters, showStats])

  // Handle form submission
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

  // Delete property
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

  // Toggle active status
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

  // Bulk actions
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

  // Clean unused properties
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

  // Reset form
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

  // Start editing property
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

  // Get property type label
  const getTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      text: 'Metin',
      number: 'Sayı',
      date: 'Tarih',
      boolean: 'Evet/Hayır'
    }
    return labels[type] || type
  }

  // Get type icon
  const getTypeIcon = (type: string): React.ReactElement => {
    const icons: { [key: string]: React.ReactElement } = {
      text: <TextIcon />,
      number: <NumberIcon />,
      date: <DateIcon />,
      boolean: <BooleanIcon />
    }
    return icons[type] || <TextIcon />
  }

  // Get property type color for dark theme
  const getTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      text: 'bg-blue-900/30 text-blue-300 border-blue-600/30',
      number: 'bg-green-900/30 text-green-300 border-green-600/30',
      date: 'bg-purple-900/30 text-purple-300 border-purple-600/30',
      boolean: 'bg-orange-900/30 text-orange-300 border-orange-600/30'
    }
    return colors[type] || 'bg-gray-900/30 text-gray-300 border-gray-600/30'
  }

  // Handle property selection
  const handleSelectProperty = (propertyId: number, checked: boolean): void => {
    if (checked) {
      setSelectedIds([...selectedIds, propertyId])
    } else {
      setSelectedIds(selectedIds.filter(id => id !== propertyId))
    }
  }

  // Handle select all
  const handleSelectAll = (checked: boolean): void => {
    if (checked) {
      setSelectedIds(properties.map(p => p.propertyId))
    } else {
      setSelectedIds([])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <PropertyIcon />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  Özellik Yönetimi
                </h1>
                <p className="text-gray-400 mt-1 text-sm sm:text-base">
                  Mobilya özelliklerini yönetin ve düzenleyin
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowStats(!showStats)}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 font-medium border text-sm ${
                  showStats 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-500' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-600'
                }`}
                type="button"
              >
                <StatsIcon />
                <span className="hidden sm:inline">İstatistikler</span>
                <span className="sm:hidden">Stats</span>
              </button>
              <button
                onClick={cleanupUnused}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 font-medium shadow-lg border border-orange-500 text-sm"
                type="button"
              >
                <CleanIcon />
                <span className="hidden sm:inline">Temizle</span>
                <span className="sm:hidden">Clean</span>
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg w-full sm:w-auto justify-center text-sm"
                type="button"
              >
                <PlusIcon />
                <span>Yeni Özellik</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="bg-gradient-to-r from-red-900/50 to-red-800/50 border border-red-600/50 text-red-300 px-4 sm:px-6 py-3 sm:py-4 rounded-xl mb-4 sm:mb-6 shadow-sm" role="alert">
            <div className="flex items-center space-x-2">
              <span className="text-lg sm:text-xl">⚠️</span>
              <span className="font-medium text-sm sm:text-base">{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-gradient-to-r from-green-900/50 to-emerald-800/50 border border-green-600/50 text-green-300 px-4 sm:px-6 py-3 sm:py-4 rounded-xl mb-4 sm:mb-6 shadow-sm" role="alert">
            <div className="flex items-center space-x-2">
              <SuccessIcon />
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {showStats && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <PropertyIcon />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-400">Toplam Özellik</h3>
                  <p className="text-2xl font-bold text-blue-300">{stats.usage.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <UsageIcon />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-400">Kullanılan</h3>
                  <p className="text-2xl font-bold text-green-300">{stats.usage.used}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <CleanIcon />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-400">Kullanılmayan</h3>
                  <p className="text-2xl font-bold text-orange-300">{stats.usage.unused}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <TextIcon />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-400">Metin Tipi</h3>
                  <p className="text-2xl font-bold text-purple-300">{stats.byType.text || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <FilterIcon />
              <span>Filtreler</span>
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300 flex items-center space-x-2">
                  <SearchIcon />
                  <span>Arama</span>
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                  placeholder="Özellik ara..."
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300">
                  Tip
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                >
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-gray-700">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300">
                  Kategori
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-gray-700">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300">
                  Kullanım
                </label>
                <select
                  value={filters.usage}
                  onChange={(e) => setFilters({...filters, usage: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                >
                  {usageOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-gray-700">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300">
                  Durum
                </label>
                <select
                  value={filters.active}
                  onChange={(e) => setFilters({...filters, active: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                >
                  <option value="" className="bg-gray-700">Tüm Durumlar</option>
                  <option value="true" className="bg-gray-700">Sadece Aktif</option>
                  <option value="false" className="bg-gray-700">Sadece Pasif</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border border-blue-600/50 p-6 rounded-xl mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-blue-300 font-semibold flex items-center space-x-2">
                <span className="text-xl">📋</span>
                <span>{selectedIds.length} özellik seçildi</span>
              </span>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium shadow-sm"
                  type="button"
                >
                  Aktif Yap
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-lg text-sm hover:from-orange-700 hover:to-red-700 transition-all duration-200 font-medium shadow-sm"
                  type="button"
                >
                  Pasif Yap
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-sm"
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
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <span className="text-2xl">{editingProperty ? '✏️' : '➕'}</span>
                    <span>{editingProperty ? 'Özellik Düzenle' : 'Yeni Özellik Ekle'}</span>
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-blue-200 hover:text-white hover:bg-blue-500/20 p-2 rounded-lg transition-all duration-200"
                    type="button"
                    aria-label="Kapat"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label htmlFor="propertyName" className="block text-sm font-semibold text-gray-300">
                    Özellik Adı *
                  </label>
                  <input
                    id="propertyName"
                    type="text"
                    required
                    value={formData.propertyName}
                    onChange={(e) => setFormData({...formData, propertyName: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                    placeholder="Özellik adını girin"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="propertyType" className="block text-sm font-semibold text-gray-300">
                    Özellik Tipi *
                  </label>
                  <select
                    id="propertyType"
                    value={formData.propertyType}
                    onChange={(e) => setFormData({...formData, propertyType: e.target.value as any})}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                  >
                    <option value="text" className="bg-gray-700">📝 Metin</option>
                    <option value="number" className="bg-gray-700">🔢 Sayı</option>
                    <option value="date" className="bg-gray-700">📅 Tarih</option>
                    <option value="boolean" className="bg-gray-700">☑️ Evet/Hayır</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-300">
                    Açıklama
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-white placeholder-gray-400"
                    placeholder="Özellik açıklaması (isteğe bağlı)"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-300 cursor-pointer">
                    Aktif özellik olarak yayınla
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg"
                    type="button"
                  >
                    <SaveIcon />
                    <span>{editingProperty ? 'Güncelle' : 'Kaydet'}</span>
                  </button>
                  <button
                    onClick={resetForm}
                    className="flex-1 bg-gray-700 text-gray-300 py-3 px-4 rounded-xl hover:bg-gray-600 transition-all duration-200 font-medium border border-gray-600"
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
          <div className="flex items-center justify-center py-20">
            <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700">
              <div className="flex items-center space-x-4">
                <LoaderIcon />
                <span className="text-gray-300 font-medium">Özellikler yükleniyor...</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && properties.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-gray-800 rounded-2xl p-12 shadow-2xl border border-gray-700">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <PropertyIcon />
              </div>
              <h3 className="text-xl font-bold text-gray-200 mb-4">Henüz özellik bulunmuyor</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Mobilyalarınız için özel özellikler tanımlayarak daha detaylı katalog oluşturun.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg inline-flex items-center space-x-2"
                type="button"
              >
                <PlusIcon />
                <span>İlk özelliği ekleyin</span>
              </button>
            </div>
          </div>
        )}

        {/* Properties Table */}
        {!loading && properties.length > 0 && (
          <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <span className="text-2xl">📋</span>
                  <span>Özellik Listesi ({properties.length})</span>
                </h2>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === properties.length && properties.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-5 h-5 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-green-100">Tümünü Seç</span>
                </label>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Seç
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Özellik Adı
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Tip
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Açıklama
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Kullanım
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {properties.map((property) => (
                    <tr 
                      key={property.propertyId}
                      className={`hover:bg-gray-700/50 transition-colors duration-200 ${
                        selectedIds.includes(property.propertyId) ? 'bg-blue-900/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(property.propertyId)}
                          onChange={(e) => handleSelectProperty(property.propertyId, e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </td>

                      {/* Property Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                            {getTypeIcon(property.propertyType)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-200">
                              {property.propertyName}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {property.propertyId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getTypeColor(property.propertyType)}`}>
                          {getTypeLabel(property.propertyType)}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300 max-w-xs">
                          {property.description ? (
                            <span title={property.description} className="block">
                              {property.description.length > 50 
                                ? `${property.description.substring(0, 50)}...` 
                                : property.description
                              }
                            </span>
                          ) : (
                            <span className="text-gray-500 italic">Açıklama yok</span>
                          )}
                        </div>
                      </td>

                      {/* Usage */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-blue-400 font-semibold text-lg">
                              {property._count.furnitureProperties + property._count.furnitureSetProperties}
                            </span>
                            <span className="text-gray-400 text-xs">toplam</span>
                          </div>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div className="flex items-center space-x-1">
                              <span>🪑</span>
                              <span>{property._count.furnitureProperties} mobilya</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>📦</span>
                              <span>{property._count.furnitureSetProperties} set</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                          property.isActive 
                            ? 'bg-green-900/30 text-green-300 border-green-600/30' 
                            : 'bg-red-900/30 text-red-300 border-red-600/30'
                        }`}>
                          {property.isActive ? '✅ Aktif' : '❌ Pasif'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleActive(property.propertyId, property.isActive)}
                            className={`p-2 rounded-lg transition-all duration-200 border ${
                              property.isActive 
                                ? 'text-orange-400 hover:bg-orange-500/20 border-orange-500/30' 
                                : 'text-green-400 hover:bg-green-500/20 border-green-500/30'
                            }`}
                            title={property.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                            type="button"
                          >
                            {property.isActive ? <EyeOffIcon /> : <EyeIcon />}
                          </button>
                          <button
                            onClick={() => startEdit(property)}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-all duration-200"
                            title="Düzenle"
                            type="button"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleDelete(property.propertyId, property.propertyName)}
                            className="p-2 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Most Used Properties (If stats are shown) */}
            {showStats && stats?.mostUsed && stats.mostUsed.length > 0 && (
              <div className="bg-gray-700 p-6 border-t border-gray-600">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <TrophyIcon />
                  </div>
                  <h3 className="text-lg font-bold text-gray-200">
                    En Çok Kullanılan Özellikler
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.mostUsed.slice(0, 6).map((item, index) => (
                    <div key={item.propertyName} className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 p-4 rounded-xl hover:shadow-lg transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                            index === 1 ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30' :
                            index === 2 ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                            'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            #{index + 1}
                          </span>
                          <span className="text-sm font-semibold text-gray-200 truncate max-w-[120px]" title={item.propertyName}>
                            {item.propertyName}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-blue-400">
                          {item.totalUsage}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center space-x-1">
                            <span>🪑</span>
                            <span>Mobilya:</span>
                          </span>
                          <span className="font-medium text-gray-400">{item.furnitureUsage}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center space-x-1">
                            <span>📦</span>
                            <span>Set:</span>
                          </span>
                          <span className="font-medium text-gray-400">{item.furnitureSetUsage}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}