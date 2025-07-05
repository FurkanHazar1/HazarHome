'use client'

import { useState, useEffect } from 'react'

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

// Icon components
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

  // Renkleri yükle
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

  // Form gönderme
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

  // Renk silme
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

  // Aktif/Pasif değiştirme
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

  // Toplu işlemler
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

  // Kullanılmayan renkleri temizle
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

  // Form sıfırlama
  const resetForm = (): void => {
    setFormData({ colorName: '', colorCode: '', isActive: true })
    setShowAddForm(false)
    setEditingColor(null)
  }

  // Düzenleme
  const startEdit = (color: Color): void => {
    setFormData({
      colorName: color.colorName,
      colorCode: color.colorCode || '',
      isActive: color.isActive
    })
    setEditingColor(color)
    setShowAddForm(true)
  }

  // Checkbox işlemleri
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

  // Hex kod validasyonu
  const validateHexCode = (code: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(code)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Renk Yönetimi</h1>
          <p className="text-gray-600">Mobilya renklerini yönetin</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              showStats ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <StatsIcon />
            <span>İstatistikler</span>
          </button>
          <button
            onClick={cleanupUnused}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
          >
            <CleanIcon />
            <span>Temizle</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon />
            <span>Yeni Renk</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      {/* İstatistik Kartları */}
      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-600">Toplam Renk</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-600">Aktif Renk</h3>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-600">Kullanılan</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.used}</p>
          </div>
        </div>
      )}

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <SearchIcon /> Arama
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Renk ara..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Durum
            </label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
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
              {selectedIds.length} renk seçildi
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Aktif Yap
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
              >
                Pasif Yap
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
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
                {editingColor ? 'Renk Düzenle' : 'Yeni Renk Ekle'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <CloseIcon />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Renk Adı *
                </label>
                <input
                  type="text"
                  required
                  value={formData.colorName}
                  onChange={(e) => setFormData({...formData, colorName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Renk adını girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Renk Kodu (Hex)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.colorCode}
                    onChange={(e) => setFormData({...formData, colorCode: e.target.value})}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formData.colorCode && !validateHexCode(formData.colorCode) 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="#FF0000"
                  />
                  {formData.colorCode && validateHexCode(formData.colorCode) && (
                    <div 
                      className="w-12 h-10 rounded border-2 border-gray-300"
                      style={{ backgroundColor: formData.colorCode }}
                    ></div>
                  )}
                </div>
                {formData.colorCode && !validateHexCode(formData.colorCode) && (
                  <p className="text-xs text-red-600 mt-1">Geçersiz hex kod formatı</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Aktif renk
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <SaveIcon />
                  <span>{editingColor ? 'Güncelle' : 'Kaydet'}</span>
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
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
      {!loading && colors.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl">🎨</span>
          <p className="text-gray-500 mb-4 mt-2">Henüz renk bulunmuyor.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            İlk rengi ekleyin
          </button>
        </div>
      )}

      {/* Colors Grid */}
      {!loading && colors.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Toplam {colors.length} renk
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedIds.length === colors.length && colors.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Tümünü Seç</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {colors.map((color) => (
              <div
                key={color.colorId}
                className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${
                  selectedIds.includes(color.colorId) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
              >
                {/* Checkbox */}
                <div className="flex items-center justify-between mb-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(color.colorId)}
                    onChange={(e) => handleSelectColor(color.colorId, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleActive(color.colorId, color.isActive)}
                      className={`p-1.5 rounded transition-colors ${
                        color.isActive 
                          ? 'text-orange-600 hover:bg-orange-100' 
                          : 'text-green-600 hover:bg-green-100'
                      }`}
                      title={color.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                    >
                      {color.isActive ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                    <button
                      onClick={() => startEdit(color)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="Düzenle"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleDelete(color.colorId, color.colorName)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Sil"
                      disabled={color._count.furnitureColors + color._count.furnitureSetColors > 0}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                {/* Renk Önizleme */}
                <div className="flex items-center space-x-3 mb-3">
                  <div 
                    className="w-12 h-12 rounded-lg border-2 border-gray-300 flex-shrink-0"
                    style={{ 
                      backgroundColor: color.colorCode || '#F3F4F6',
                      backgroundImage: !color.colorCode ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : undefined,
                      backgroundSize: !color.colorCode ? '8px 8px' : undefined,
                      backgroundPosition: !color.colorCode ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined
                    }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {color.colorName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {color.colorCode || 'Renk kodu yok'}
                    </p>
                  </div>
                </div>

                {/* Kullanım Bilgisi */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Mobilya:</span>
                    <span className="font-medium">{color._count.furnitureColors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Set:</span>
                    <span className="font-medium">{color._count.furnitureSetColors}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span>Toplam:</span>
                    <span className="font-medium text-blue-600">
                      {color._count.furnitureColors + color._count.furnitureSetColors}
                    </span>
                  </div>
                </div>

                {/* Durum */}
                <div className="mt-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    color.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {color.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}