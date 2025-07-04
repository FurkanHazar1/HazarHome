'use client'

import { useState, useEffect } from 'react'

// Next.js için TypeScript interface'leri
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

// Next.js için basit icon component'leri
const TrashIcon = () => <span className="text-lg">🗑️</span>
const EditIcon = () => <span className="text-lg">✏️</span>
const PlusIcon = () => <span className="text-lg">➕</span>
const EyeIcon = () => <span className="text-lg">👁️</span>
const EyeOffIcon = () => <span className="text-lg">👁️‍🗨️</span>
const SaveIcon = () => <span className="text-lg">💾</span>
const CloseIcon = () => <span className="text-lg">❌</span>
const LoaderIcon = () => <span className="text-lg animate-spin">⏳</span>

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

  // Next.js API route'larından kategorileri yükle
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

  // Component mount'da kategorileri yükle
  useEffect(() => {
    loadCategories()
  }, [])

  // Form gönderme (Next.js API routes kullanarak)
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
        
        // Success mesajını 3 saniye sonra temizle
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'İşlem başarısız')
      }
    } catch (err) {
      console.error('Form gönderme hatası:', err)
      setError('Bağlantı hatası')
    }
  }

  // Kategori silme (Next.js API route kullanarak)
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

  // Aktif/Pasif değiştirme (Next.js API route kullanarak)
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

  // Form sıfırlama
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

  // Düzenleme için formu doldur
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

  // Ana kategorileri render et
  const renderMainCategories = () => {
    return categories.map((mainCategory) => (
      <div key={mainCategory.categoryId} className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        {/* Ana Kategori Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {mainCategory.categoryName}
                </h3>
                {mainCategory.description && (
                  <p className="text-sm text-gray-500 mt-1">{mainCategory.description}</p>
                )}
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-gray-400">
                    {mainCategory._count.children} alt kategori
                  </span>
                  <span className="text-xs text-gray-400">
                    {mainCategory._count.furnitures} mobilya
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    mainCategory.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {mainCategory.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Ana Kategori İşlemleri */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleActive(mainCategory.categoryId, mainCategory.isActive)}
                className={`p-2 rounded-lg transition-colors ${
                  mainCategory.isActive 
                    ? 'text-orange-600 hover:bg-orange-50' 
                    : 'text-green-600 hover:bg-green-50'
                }`}
                title={mainCategory.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                type="button"
              >
                {mainCategory.isActive ? <EyeOffIcon /> : <EyeIcon />}
              </button>
              <button
                onClick={() => startEdit(mainCategory)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Düzenle"
                type="button"
              >
                <EditIcon />
              </button>
              <button
                onClick={() => handleDelete(mainCategory.categoryId, mainCategory.categoryName)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sil"
                type="button"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Alt Kategoriler */}
        {mainCategory.children && mainCategory.children.length > 0 && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mainCategory.children.map((subCategory) => (
                <div
                  key={subCategory.categoryId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-700">
                      {subCategory.categoryName}
                    </h4>
                    {subCategory.description && (
                      <p className="text-xs text-gray-500 mt-1">{subCategory.description}</p>
                    )}
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs text-gray-400">
                        {subCategory._count.furnitures} mobilya
                      </span>
                      <span className={`px-1.5 py-0.5 text-xs rounded ${
                        subCategory.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {subCategory.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Alt Kategori İşlemleri */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => toggleActive(subCategory.categoryId, subCategory.isActive)}
                      className={`p-1.5 rounded transition-colors ${
                        subCategory.isActive 
                          ? 'text-orange-600 hover:bg-orange-100' 
                          : 'text-green-600 hover:bg-green-100'
                      }`}
                      title={subCategory.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                      type="button"
                    >
                      {subCategory.isActive ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                    <button
                      onClick={() => startEdit(subCategory)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="Düzenle"
                      type="button"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleDelete(subCategory.categoryId, subCategory.categoryName)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
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
      </div>
    ))
  }

  // Next.js component return
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kategori Yönetimi</h1>
          <p className="text-gray-600">Mobilya kategorilerini yönetin</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          type="button"
        >
          <PlusIcon />
          <span>Yeni Kategori</span>
        </button>
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

      {/* Add/Edit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
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
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori Adı *
                </label>
                <input
                  id="categoryName"
                  type="text"
                  required
                  value={formData.categoryName}
                  onChange={(e) => setFormData({...formData, categoryName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Kategori adını girin"
                />
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
                  placeholder="Kategori açıklaması (isteğe bağlı)"
                  rows={3}
                />
              </div>

              <div>
                <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">
                  Ana Kategori
                </label>
                <select
                  id="parentId"
                  value={formData.parentId || ''}
                  onChange={(e) => setFormData({...formData, parentId: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Ana Kategori (Seviye 1)</option>
                  {categories.map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>
                      {category.categoryName}
                    </option>
                  ))}
                </select>
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
                  Aktif kategori
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  type="button"
                >
                  <SaveIcon />
                  <span>{editingCategory ? 'Güncelle' : 'Kaydet'}</span>
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
      {!loading && categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Henüz kategori bulunmuyor.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            type="button"
          >
            İlk kategoriyi ekleyin
          </button>
        </div>
      )}

      {/* Categories List */}
      {!loading && categories.length > 0 && (
        <div>
          <div className="mb-4 text-sm text-gray-600">
            Toplam {categories.length} ana kategori, {categories.reduce((sum, cat) => sum + cat._count.children, 0)} alt kategori
          </div>
          {renderMainCategories()}
        </div>
      )}
    </div>
  )
}