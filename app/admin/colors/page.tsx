'use client'

import React, { useState, useEffect } from 'react'

// TypeScript interfaces
interface Color {
  colorId: number
  colorName: string
  colorCode?: string
  isActive: boolean
  createdAt: string
  _count: {
    furnitureColors: number
    furnitureSetColors: number
  }
}

interface ColorStats {
  total: number
  active: number
  used: number
}

interface FormData {
  colorName: string
  colorCode: string
  isActive: boolean
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
const CleanIcon = () => <span className="text-lg">🧹</span>
const StatsIcon = () => <span className="text-lg">📊</span>
const ColorIcon = () => <span className="text-2xl">🎨</span>
const SuccessIcon = () => <span className="text-lg">✅</span>
const PaletteIcon = () => <span className="text-lg">🎭</span>
const SwatchIcon = () => <span className="text-lg">🌈</span>
const ActiveIcon = () => <span className="text-lg">🔆</span>
const UsageIcon = () => <span className="text-lg">📈</span>

export default function ColorManagement() {
  // State management
  const [colors, setColors] = useState<Color[]>([])
  const [stats, setStats] = useState<ColorStats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [showAddForm, setShowAddForm] = useState<boolean>(false)
  const [editingColor, setEditingColor] = useState<Color | null>(null)
  const [showStats, setShowStats] = useState<boolean>(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [search, setSearch] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<string>('')

  // Form state
  const [formData, setFormData] = useState<FormData>({
    colorName: '',
    colorCode: '',
    isActive: true
  })

  // Load colors
  const loadColors = async (): Promise<void> => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (activeFilter) params.append('active', activeFilter)
      if (showStats) params.append('includeStats', 'true')
      
      const response = await fetch(`/api/colors?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setColors(data.data)
        if (data.stats) setStats(data.stats)
        setError('')
      } else {
        setError(data.error || 'Renkler yüklenemedi')
      }
    } catch (err) {
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadColors()
  }, [search, activeFilter, showStats])

  // Handle form submission
  const handleSubmit = async (): Promise<void> => {
    if (!formData.colorName.trim()) {
      setError('Renk adı zorunludur')
      return
    }

    setError('')
    setSuccess('')

    try {
      const url = editingColor ? `/api/colors/${editingColor.colorId}` : '/api/colors'
      const method = editingColor ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(editingColor ? 'Renk güncellendi!' : 'Renk eklendi!')
        resetForm()
        await loadColors()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'İşlem başarısız')
      }
    } catch (err) {
      setError('Bağlantı hatası')
    }
  }

  // Delete color
  const handleDelete = async (colorId: number, colorName: string): Promise<void> => {
    if (!confirm(`"${colorName}" rengini silmek istediğinizden emin misiniz?`)) return

    try {
      const response = await fetch(`/api/colors/${colorId}`, { method: 'DELETE' })
      const data = await response.json()

      if (data.success) {
        setSuccess('Renk silindi!')
        await loadColors()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Silme işlemi başarısız')
      }
    } catch (err) {
      setError('Bağlantı hatası')
    }
  }

  // Toggle active status
  const toggleActive = async (colorId: number, currentStatus: boolean): Promise<void> => {
    try {
      const response = await fetch(`/api/colors/${colorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Renk ${!currentStatus ? 'aktif' : 'pasif'} yapıldı!`)
        await loadColors()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Durum değiştirilemedi')
      }
    } catch (err) {
      setError('Bağlantı hatası')
    }
  }

  // Bulk actions
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete'): Promise<void> => {
    if (selectedIds.length === 0) {
      setError('Lütfen en az bir renk seçin')
      return
    }

    const actionText = {
      activate: 'aktif yapmak',
      deactivate: 'pasif yapmak',
      delete: 'silmek'
    }

    if (!confirm(`Seçili ${selectedIds.length} rengi ${actionText[action]} istediğinizden emin misiniz?`)) return

    try {
      let response
      
      if (action === 'delete') {
        response = await fetch(`/api/colors?ids=${selectedIds.join(',')}`, { method: 'DELETE' })
      } else {
        response = await fetch('/api/colors', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds, isActive: action === 'activate' })
        })
      }

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message)
        setSelectedIds([])
        await loadColors()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Toplu işlem başarısız')
      }
    } catch (err) {
      setError('Bağlantı hatası')
    }
  }

  // Clean unused colors
  const cleanupUnused = async (): Promise<void> => {
    if (!confirm('Kullanılmayan tüm renkleri silmek istediğinizden emin misiniz?')) return

    try {
      const unusedColors = colors.filter(c => 
        c._count.furnitureColors === 0 && c._count.furnitureSetColors === 0
      )
      
      if (unusedColors.length === 0) {
        setError('Kullanılmayan renk bulunamadı')
        return
      }

      const unusedIds = unusedColors.map(c => c.colorId)
      const response = await fetch(`/api/colors?ids=${unusedIds.join(',')}`, { method: 'DELETE' })
      const data = await response.json()

      if (data.success) {
        setSuccess(`${unusedIds.length} kullanılmayan renk silindi!`)
        await loadColors()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Temizleme başarısız')
      }
    } catch (err) {
      setError('Bağlantı hatası')
    }
  }

  // Reset form
  const resetForm = (): void => {
    setFormData({ colorName: '', colorCode: '', isActive: true })
    setShowAddForm(false)
    setEditingColor(null)
  }

  // Start editing
  const startEdit = (color: Color): void => {
    setFormData({
      colorName: color.colorName,
      colorCode: color.colorCode || '',
      isActive: color.isActive
    })
    setEditingColor(color)
    setShowAddForm(true)
  }

  // Checkbox operations
  const handleSelectColor = (colorId: number, checked: boolean): void => {
    if (checked) {
      setSelectedIds([...selectedIds, colorId])
    } else {
      setSelectedIds(selectedIds.filter(id => id !== colorId))
    }
  }

  const handleSelectAll = (checked: boolean): void => {
    setSelectedIds(checked ? colors.map(c => c.colorId) : [])
  }

  // Hex code validation
  const validateHexCode = (code: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(code)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <ColorIcon />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  Renk Yönetimi
                </h1>
                <p className="text-gray-400 mt-1">
                  Mobilya renklerini yönetin ve paletinizi oluşturun
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowStats(!showStats)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 font-medium border ${
                  showStats 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-500' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-600'
                }`}
              >
                <StatsIcon />
                <span>İstatistikler</span>
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg"
              >
                <PlusIcon />
                <span>Yeni Renk</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="bg-gradient-to-r from-red-900/50 to-red-800/50 border border-red-600/50 text-red-300 px-6 py-4 rounded-xl mb-6 shadow-sm" role="alert">
            <div className="flex items-center space-x-2">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-gradient-to-r from-green-900/50 to-emerald-800/50 border border-green-600/50 text-green-300 px-6 py-4 rounded-xl mb-6 shadow-sm" role="alert">
            <div className="flex items-center space-x-2">
              <SuccessIcon />
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {showStats && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <PaletteIcon />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-400">Toplam Renk</h3>
                  <p className="text-2xl font-bold text-pink-300">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <ActiveIcon />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-400">Aktif Renk</h3>
                  <p className="text-2xl font-bold text-green-300">{stats.active}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <UsageIcon />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-400">Kullanılan</h3>
                  <p className="text-2xl font-bold text-blue-300">{stats.used}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <SearchIcon />
              <span>Filtreler</span>
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300 flex items-center space-x-2">
                  <SearchIcon />
                  <span>Arama</span>
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                  placeholder="Renk ara..."
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300">
                  Durum
                </label>
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-white"
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
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-600/50 p-6 rounded-xl mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-purple-300 font-semibold flex items-center space-x-2">
                <span className="text-xl">🎨</span>
                <span>{selectedIds.length} renk seçildi</span>
              </span>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium shadow-sm"
                >
                  Aktif Yap
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-lg text-sm hover:from-orange-700 hover:to-red-700 transition-all duration-200 font-medium shadow-sm"
                >
                  Pasif Yap
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-sm"
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
              <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <span className="text-2xl">{editingColor ? '✏️' : '➕'}</span>
                    <span>{editingColor ? 'Renk Düzenle' : 'Yeni Renk Ekle'}</span>
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-pink-200 hover:text-white hover:bg-pink-500/20 p-2 rounded-lg transition-all duration-200"
                    aria-label="Kapat"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300">
                    Renk Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.colorName}
                    onChange={(e) => setFormData({...formData, colorName: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                    placeholder="Renk adını girin"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300">
                    Renk Kodu
                  </label>
                  <div className="space-y-3">
                    {/* Color Picker */}
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={formData.colorCode || '#FF0000'}
                        onChange={(e) => setFormData({...formData, colorCode: e.target.value})}
                        className="w-16 h-12 bg-gray-700 border border-gray-600 rounded-xl cursor-pointer hover:border-gray-500 transition-colors"
                        title="Renk paleti"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={formData.colorCode}
                          onChange={(e) => setFormData({...formData, colorCode: e.target.value})}
                          className={`w-full px-4 py-3 bg-gray-700 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400 font-mono ${
                            formData.colorCode && !validateHexCode(formData.colorCode) 
                              ? 'border-red-500 bg-red-900/20' 
                              : 'border-gray-600'
                          }`}
                          placeholder="#FF0000"
                        />
                      </div>
                      {formData.colorCode && validateHexCode(formData.colorCode) && (
                        <div 
                          className="w-12 h-12 rounded-xl border-2 border-gray-600 shadow-lg flex-shrink-0"
                          style={{ backgroundColor: formData.colorCode }}
                        ></div>
                      )}
                    </div>
                    
                    {/* Predefined Color Palette */}
                    <div className="space-y-2">
                      <div className="text-xs text-gray-400">Hazır Renkler:</div>
                      <div className="grid grid-cols-8 gap-2">
                        {[
                          '#FF0000', '#FF4500', '#FFA500', '#FFFF00',
                          '#ADFF2F', '#00FF00', '#00CED1', '#0000FF',
                          '#4169E1', '#8A2BE2', '#FF1493', '#FF69B4',
                          '#000000', '#404040', '#808080', '#FFFFFF',
                          '#8B4513', '#D2691E', '#CD853F', '#F5DEB3',
                          '#800000', '#800080', '#008000', '#008080'
                        ].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFormData({...formData, colorCode: color})}
                            className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg ${
                              formData.colorCode === color 
                                ? 'border-purple-400 ring-2 ring-purple-400/50' 
                                : 'border-gray-600 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {formData.colorCode && !validateHexCode(formData.colorCode) && (
                      <p className="text-xs text-red-400 flex items-center space-x-1">
                        <span>⚠️</span>
                        <span>Geçersiz hex kod formatı (örn: #FF0000)</span>
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      💡 Sol taraftaki renk seçiciyi kullanarak veya hex kod girererek renk seçebilirsiniz
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <label className="text-sm font-medium text-gray-300 cursor-pointer">
                    Aktif renk olarak yayınla
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg"
                  >
                    <SaveIcon />
                    <span>{editingColor ? 'Güncelle' : 'Kaydet'}</span>
                  </button>
                  <button
                    onClick={resetForm}
                    className="flex-1 bg-gray-700 text-gray-300 py-3 px-4 rounded-xl hover:bg-gray-600 transition-all duration-200 font-medium border border-gray-600"
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
                <span className="text-gray-300 font-medium">Renkler yükleniyor...</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && colors.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-gray-800 rounded-2xl p-12 shadow-2xl border border-gray-700">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <ColorIcon />
              </div>
              <h3 className="text-xl font-bold text-gray-200 mb-4">Henüz renk bulunmuyor</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Mobilyalarınız için renk paleti oluşturun ve ürünlerinizi daha çekici hale getirin.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg inline-flex items-center space-x-2"
              >
                <PlusIcon />
                <span>İlk rengi ekleyin</span>
              </button>
            </div>
          </div>
        )}

        {/* Colors Grid */}
        {!loading && colors.length > 0 && (
          <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <SwatchIcon />
                  <span>Renk Paleti ({colors.length})</span>
                </h2>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === colors.length && colors.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-5 h-5 text-pink-600 bg-gray-700 border-gray-600 rounded focus:ring-pink-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-pink-100">Tümünü Seç</span>
                </label>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {colors.map((color) => (
                  <div
                    key={color.colorId}
                    className={`group bg-gradient-to-br from-gray-700 to-gray-800 border rounded-2xl p-5 hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                      selectedIds.includes(color.colorId) 
                        ? 'ring-2 ring-purple-500 border-purple-500 shadow-purple-500/25' 
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {/* Header with checkbox and actions */}
                    <div className="flex items-center justify-between mb-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(color.colorId)}
                        onChange={(e) => handleSelectColor(color.colorId, e.target.checked)}
                        className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                      />
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => toggleActive(color.colorId, color.isActive)}
                          className={`p-2 rounded-lg transition-all duration-200 border ${
                            color.isActive 
                              ? 'text-orange-400 hover:bg-orange-500/20 border-orange-500/30' 
                              : 'text-green-400 hover:bg-green-500/20 border-green-500/30'
                          }`}
                          title={color.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                        >
                          {color.isActive ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                        <button
                          onClick={() => startEdit(color)}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-all duration-200"
                          title="Düzenle"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleDelete(color.colorId, color.colorName)}
                          className="p-2 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Sil"
                          disabled={color._count.furnitureColors + color._count.furnitureSetColors > 0}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>

                    {/* Color Preview */}
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="relative">
                        <div 
                          className="w-16 h-16 rounded-2xl border-2 border-gray-600 shadow-lg flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                          style={{ 
                            backgroundColor: color.colorCode || '#374151',
                            backgroundImage: !color.colorCode ? 
                              'linear-gradient(45deg, #4B5563 25%, transparent 25%), linear-gradient(-45deg, #4B5563 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #4B5563 75%), linear-gradient(-45deg, transparent 75%, #4B5563 75%)' : 
                              undefined,
                            backgroundSize: !color.colorCode ? '8px 8px' : undefined,
                            backgroundPosition: !color.colorCode ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined
                          }}
                        >
                          {!color.colorCode && (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-semibold">
                              N/A
                            </div>
                          )}
                        </div>
                        {color.colorCode && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-800 rounded-full border-2 border-gray-600 flex items-center justify-center">
                            <span className="text-xs">🎨</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-200 truncate mb-1">
                          {color.colorName}
                        </h3>
                        <p className="text-sm text-gray-400 font-mono">
                          {color.colorCode || 'Renk kodu yok'}
                        </p>
                      </div>
                    </div>

                    {/* Usage Statistics */}
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-600 mb-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400 flex items-center space-x-1">
                            <span>🪑</span>
                            <span>Mobilya:</span>
                          </span>
                          <span className="text-sm font-semibold text-blue-400">
                            {color._count.furnitureColors}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400 flex items-center space-x-1">
                            <span>📦</span>
                            <span>Set:</span>
                          </span>
                          <span className="text-sm font-semibold text-purple-400">
                            {color._count.furnitureSetColors}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                          <span className="text-sm font-semibold text-gray-300">Toplam:</span>
                          <span className="text-lg font-bold text-pink-400">
                            {color._count.furnitureColors + color._count.furnitureSetColors}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex justify-center">
                      <span className={`px-4 py-2 text-xs font-bold rounded-full border transition-all duration-200 ${
                        color.isActive 
                          ? 'bg-green-900/30 text-green-300 border-green-600/30' 
                          : 'bg-red-900/30 text-red-300 border-red-600/30'
                      }`}>
                        {color.isActive ? '✅ Aktif' : '❌ Pasif'}
                      </span>
                    </div>

                    {/* Usage Indicator */}
                    {(color._count.furnitureColors + color._count.furnitureSetColors) > 0 && (
                      <div className="mt-3 flex justify-center">
                        <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-full border border-blue-600/30">
                          <UsageIcon />
                          <span className="text-xs font-medium text-blue-300">Kullanımda</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Color Palette Summary */}
              <div className="mt-8 bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-6 border border-gray-600">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <SwatchIcon />
                  </div>
                  <h3 className="text-lg font-bold text-gray-200">Renk Paleti Özeti</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-400">
                      {colors.length}
                    </div>
                    <div className="text-sm text-gray-400">Toplam Renk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {colors.filter(c => c.isActive).length}
                    </div>
                    <div className="text-sm text-gray-400">Aktif Renk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {colors.filter(c => c._count.furnitureColors + c._count.furnitureSetColors > 0).length}
                    </div>
                    <div className="text-sm text-gray-400">Kullanılan Renk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {colors.filter(c => c.colorCode).length}
                    </div>
                    <div className="text-sm text-gray-400">Kodlu Renk</div>
                  </div>
                </div>

                {/* Quick Color Preview */}
                <div className="mt-6 pt-6 border-t border-gray-600">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Hızlı Önizleme</h4>
                  <div className="flex flex-wrap gap-2">
                    {colors.filter(c => c.colorCode).slice(0, 12).map((color) => (
                      <div
                        key={color.colorId}
                        className="w-8 h-8 rounded-lg border-2 border-gray-600 shadow-sm"
                        style={{ backgroundColor: color.colorCode }}
                        title={`${color.colorName} (${color.colorCode})`}
                      ></div>
                    ))}
                    {colors.filter(c => c.colorCode).length > 12 && (
                      <div className="w-8 h-8 rounded-lg border-2 border-gray-600 bg-gray-700 flex items-center justify-center">
                        <span className="text-xs text-gray-400 font-bold">+{colors.filter(c => c.colorCode).length - 12}</span>
                      </div>
                    )}
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