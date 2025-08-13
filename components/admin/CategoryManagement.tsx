'use client'

import { useState, useEffect } from 'react'

// TypeScript interfaces
interface Category {
  categoryId: number
  categoryName: string
  description?: string
  parentId?: number
  categoryLevel: number
  categoryPath: string
  isActive: boolean
  createdAt: string
  children?: Category[]
  _count: {
    furnitures: number
    children: number
  }
}

interface FormData {
  categoryName: string
  description: string
  parentId: number | null
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
const CategoryIcon = () => <span className="text-2xl">📁</span>
const SuccessIcon = () => <span className="text-lg">✅</span>
const FolderIcon = () => <span className="text-lg">📂</span>
const SubFolderIcon = () => <span className="text-lg">📄</span>
const StatsIcon = () => <span className="text-lg">📊</span>

export default function CategoryManagement() {
  // State management
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [showAddForm, setShowAddForm] = useState<boolean>(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // Form state
  const [formData, setFormData] = useState<FormData>({
    categoryName: '',
    description: '',
    parentId: null,
    isActive: true
  })

  // Load categories from API
  const loadCategories = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await fetch('/api/categories', {
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
        setCategories(data.data)
        setError('')
      } else {
        setError(data.error || 'Kategoriler yüklenemedi')
      }
    } catch (err) {
      console.error('Kategori yükleme hatası:', err)
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  // Load categories on component mount
  useEffect(() => {
    loadCategories()
  }, [])

  // Handle form submission
  const handleSubmit = async (): Promise<void> => {
    // Client-side validation
    if (!formData.categoryName.trim()) {
      setError('Kategori adı zorunludur')
      return
    }

    setError('')
    setSuccess('')

    try {
      const url = editingCategory 
        ? `/api/categories/${editingCategory.categoryId}`
        : '/api/categories'
      
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        const successMessage = editingCategory ? 'Kategori güncellendi!' : 'Kategori eklendi!'
        setSuccess(successMessage)
        resetForm()
        await loadCategories()
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'İşlem başarısız')
      }
    } catch (err) {
      console.error('Form gönderme hatası:', err)
      setError('Bağlantı hatası')
    }
  }

  // Delete category
  const handleDelete = async (categoryId: number, categoryName: string): Promise<void> => {
    if (!confirm(`"${categoryName}" kategorisini silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
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
        setSuccess('Kategori silindi!')
        await loadCategories()
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
  const toggleActive = async (categoryId: number, currentStatus: boolean): Promise<void> => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
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
        setSuccess(`Kategori ${!currentStatus ? 'aktif' : 'pasif'} yapıldı!`)
        await loadCategories()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Durum değiştirilemedi')
      }
    } catch (err) {
      console.error('Toggle hatası:', err)
      setError('Bağlantı hatası')
    }
  }

  // Reset form
  const resetForm = (): void => {
    setFormData({
      categoryName: '',
      description: '',
      parentId: null,
      isActive: true
    })
    setShowAddForm(false)
    setEditingCategory(null)
  }

  // Start editing category
  const startEdit = (category: Category): void => {
    setFormData({
      categoryName: category.categoryName,
      description: category.description || '',
      parentId: category.parentId || null,
      isActive: category.isActive
    })
    setEditingCategory(category)
    setShowAddForm(true)
  }

  // Render main categories with dark theme
  const renderMainCategories = () => {
    return categories.map((mainCategory) => (
      <div key={mainCategory.categoryId} className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 mb-4 sm:mb-6 overflow-hidden hover:shadow-3xl transition-shadow duration-300">
        {/* Main Category Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-800/30 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                <FolderIcon />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                  {mainCategory.categoryName}
                </h3>
                {mainCategory.description && (
                  <p className="text-blue-100 text-sm opacity-90 line-clamp-2">{mainCategory.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-200 text-sm">📁</span>
                    <span className="text-blue-100 text-sm font-medium">
                      {mainCategory._count.children} alt kategori
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-200 text-sm">🪑</span>
                    <span className="text-blue-100 text-sm font-medium">
                      {mainCategory._count.furnitures} mobilya
                    </span>
                  </div>
                  <span className={`px-2 sm:px-3 py-1 text-xs font-bold rounded-full border ${
                    mainCategory.isActive 
                      ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                      : 'bg-red-500/20 text-red-300 border-red-500/30'
                  }`}>
                    {mainCategory.isActive ? '✅ Aktif' : '❌ Pasif'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Main Category Actions */}
            <div className="flex items-center space-x-2 sm:flex-shrink-0">
              <button
                onClick={() => toggleActive(mainCategory.categoryId, mainCategory.isActive)}
                className={`p-2 sm:p-3 rounded-xl transition-all duration-200 backdrop-blur-sm ${
                  mainCategory.isActive 
                    ? 'text-orange-300 hover:bg-orange-500/20 border border-orange-500/30' 
                    : 'text-green-300 hover:bg-green-500/20 border border-green-500/30'
                }`}
                title={mainCategory.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                type="button"
              >
                {mainCategory.isActive ? <EyeOffIcon /> : <EyeIcon />}
              </button>
              <button
                onClick={() => startEdit(mainCategory)}
                className="p-2 sm:p-3 text-blue-200 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl transition-all duration-200 backdrop-blur-sm"
                title="Düzenle"
                type="button"
              >
                <EditIcon />
              </button>
              <button
                onClick={() => handleDelete(mainCategory.categoryId, mainCategory.categoryName)}
                className="p-2 sm:p-3 text-red-300 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-all duration-200 backdrop-blur-sm"
                title="Sil"
                type="button"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Sub Categories */}
        {mainCategory.children && mainCategory.children.length > 0 && (
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {mainCategory.children.map((subCategory) => (
                <div
                  key={subCategory.categoryId}
                  className="group bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 rounded-xl p-3 sm:p-4 hover:shadow-lg hover:border-gray-500 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <SubFolderIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-200 truncate">
                          {subCategory.categoryName}
                        </h4>
                        {subCategory.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{subCategory.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-400 text-xs">🪑</span>
                        <span className="text-xs text-gray-400 font-medium">
                          {subCategory._count.furnitures}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        subCategory.isActive 
                          ? 'bg-green-900/30 text-green-400 border border-green-600/30' 
                          : 'bg-red-900/30 text-red-400 border border-red-600/30'
                      }`}>
                        {subCategory.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Sub Category Actions */}
                  <div className="flex items-center space-x-1 sm:space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => toggleActive(subCategory.categoryId, subCategory.isActive)}
                      className={`flex-1 p-1.5 sm:p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        subCategory.isActive 
                          ? 'text-orange-400 hover:bg-orange-500/20 border border-orange-500/30' 
                          : 'text-green-400 hover:bg-green-500/20 border border-green-500/30'
                      }`}
                      title={subCategory.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                      type="button"
                    >
                      {subCategory.isActive ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                    <button
                      onClick={() => startEdit(subCategory)}
                      className="flex-1 p-1.5 sm:p-2 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs font-medium transition-all duration-200"
                      title="Düzenle"
                      type="button"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleDelete(subCategory.categoryId, subCategory.categoryName)}
                      className="flex-1 p-1.5 sm:p-2 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-xs font-medium transition-all duration-200"
                      title="Sil"
                      type="button"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty Sub Categories State */}
        {(!mainCategory.children || mainCategory.children.length === 0) && (
          <div className="p-6 text-center border-t border-gray-700">
            <div className="text-gray-500 text-sm flex items-center justify-center space-x-2">
              <span>📂</span>
              <span>Bu kategoride alt kategori bulunmuyor</span>
            </div>
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <CategoryIcon />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  Kategori Yönetimi
                </h1>
                <p className="text-gray-400 mt-1 text-sm sm:text-base">
                  Mobilya kategorilerini yönetin ve düzenleyin
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg w-full sm:w-auto"
              type="button"
            >
              <PlusIcon />
              <span>Yeni Kategori</span>
            </button>
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
              <span className="font-medium text-sm sm:text-base">{success}</span>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                    <span className="text-xl sm:text-2xl">{editingCategory ? '✏️' : '➕'}</span>
                    <span className="hidden sm:inline">{editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}</span>
                    <span className="sm:hidden">{editingCategory ? 'Düzenle' : 'Yeni'}</span>
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

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <label htmlFor="categoryName" className="block text-sm font-semibold text-gray-300">
                    Kategori Adı *
                  </label>
                  <input
                    id="categoryName"
                    type="text"
                    required
                    value={formData.categoryName}
                    onChange={(e) => setFormData({...formData, categoryName: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                    placeholder="Kategori adını girin"
                  />
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
                    placeholder="Kategori açıklaması (isteğe bağlı)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="parentId" className="block text-sm font-semibold text-gray-300">
                    Ana Kategori
                  </label>
                  <select
                    id="parentId"
                    value={formData.parentId || ''}
                    onChange={(e) => setFormData({...formData, parentId: e.target.value ? parseInt(e.target.value) : null})}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                  >
                    <option value="" className="bg-gray-700">Ana Kategori (Seviye 1)</option>
                    {categories.map((category) => (
                      <option key={category.categoryId} value={category.categoryId} className="bg-gray-700">
                        📁 {category.categoryName}
                      </option>
                    ))}
                  </select>
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
                    Aktif kategori olarak yayınla
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg"
                    type="button"
                  >
                    <SaveIcon />
                    <span>{editingCategory ? 'Güncelle' : 'Kaydet'}</span>
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
          <div className="flex items-center justify-center py-12 sm:py-20">
            <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl border border-gray-700">
              <div className="flex items-center space-x-4">
                <LoaderIcon />
                <span className="text-gray-300 font-medium text-sm sm:text-base">Kategoriler yükleniyor...</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && categories.length === 0 && (
          <div className="text-center py-12 sm:py-20">
            <div className="bg-gray-800 rounded-2xl p-8 sm:p-12 shadow-2xl border border-gray-700">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <CategoryIcon />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-200 mb-3 sm:mb-4">Henüz kategori bulunmuyor</h3>
              <p className="text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
                Mobilya kataloğunuzu organize etmek için ilk kategoriyi oluşturun.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg inline-flex items-center space-x-2 w-full sm:w-auto justify-center"
                type="button"
              >
                <PlusIcon />
                <span>İlk kategoriyi ekleyin</span>
              </button>
            </div>
          </div>
        )}

        {/* Categories List */}
        {!loading && categories.length > 0 && (
          <div>
            {/* Stats Header */}
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <StatsIcon />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-200">Kategori İstatistikleri</h2>
                    <p className="text-gray-400 text-xs sm:text-sm">Toplam kategori bilgileri</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 text-center">
                  <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-xl p-3 sm:p-4 border border-blue-600/30">
                    <div className="text-xl sm:text-2xl font-bold text-blue-300">{categories.length}</div>
                    <div className="text-xs text-blue-400 font-medium">Ana Kategori</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-3 sm:p-4 border border-purple-600/30">
                    <div className="text-xl sm:text-2xl font-bold text-purple-300">
                      {categories.reduce((sum, cat) => sum + cat._count.children, 0)}
                    </div>
                    <div className="text-xs text-purple-400 font-medium">Alt Kategori</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl p-3 sm:p-4 border border-green-600/30">
                    <div className="text-xl sm:text-2xl font-bold text-green-300">
                      {categories.reduce((sum, cat) => sum + cat._count.furnitures, 0)}
                    </div>
                    <div className="text-xs text-green-400 font-medium">Toplam Mobilya</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Categories Grid */}
            <div className="space-y-4 sm:space-y-6">
              {renderMainCategories()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}