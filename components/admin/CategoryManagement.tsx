'use client'

import { useState, useEffect } from 'react'

interface Category {
  categoryId: number
  categoryName: string
  description?: string
  parentId?: number
  categoryLevel: number
  categoryPath: string
  isActive: boolean
  children?: Category[]
  _count?: {
    furnitures: number
    children: number
  }
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  const [formData, setFormData] = useState({
    categoryName: '',
    description: '',
    parentId: '',
    isActive: true
  })

  // Load Categories
  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/categories?includeHierarchy=true')
      const data = await res.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // CRUD Operations
  const handleDelete = async (id: number) => {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (res.ok) fetchCategories()
    } catch (error) {
      console.error(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.categoryId}` : '/api/categories'
      const method = editingCategory ? 'PUT' : 'POST'
      
      const body = {
        ...formData,
        parentId: formData.parentId ? parseInt(formData.parentId) : null
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        fetchCategories()
        setShowModal(false)
        resetForm()
      } else {
        alert('İşlem başarısız')
      }
    } catch (error) {
      console.error(error)
    }
  }

  const startEdit = (cat: Category) => {
    setEditingCategory(cat)
    setFormData({
      categoryName: cat.categoryName,
      description: cat.description || '',
      parentId: cat.parentId?.toString() || '',
      isActive: cat.isActive
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingCategory(null)
    setFormData({ categoryName: '', description: '', parentId: '', isActive: true })
  }

  // Recursive options renderer for parent selection
  const renderCategoryOptions = (cats: Category[], level = 0) => {
    return cats.map(cat => (
      <>
        <option key={cat.categoryId} value={cat.categoryId} disabled={cat.categoryId === editingCategory?.categoryId}>
          {'\u00A0'.repeat(level * 4)} {level === 0 ? '📂' : '↳'} {cat.categoryName}
        </option>
        {cat.children && renderCategoryOptions(cat.children, level + 1)}
      </>
    ))
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Kategori Yönetimi</h1>
            <p className="text-slate-400 mt-1">Ürün kategorilerini düzenleyin</p>
          </div>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition shadow-lg shadow-purple-600/20 font-medium flex items-center gap-2"
          >
            <span>+</span> Yeni Kategori
          </button>
        </div>

        {/* Categories List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-white text-center py-10">Yükleniyor...</div>
          ) : (
            categories.map(cat => (
              <div key={cat.categoryId} className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
                {/* Parent Category */}
                <div className="p-4 flex items-center justify-between bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center text-xl">
                      📂
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{cat.categoryName}</h3>
                      <div className="text-xs text-slate-400 flex gap-2">
                        <span>{cat._count?.children || 0} Alt Kategori</span>
                        <span>•</span>
                        <span>{cat._count?.furnitures || 0} Ürün</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${cat.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {cat.isActive ? 'AKTİF' : 'PASİF'}
                    </span>
                    <button onClick={() => startEdit(cat)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg">✏️</button>
                    <button onClick={() => handleDelete(cat.categoryId)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">🗑️</button>
                  </div>
                </div>

                {/* Children */}
                {cat.children && cat.children.length > 0 && (
                  <div className="border-t border-slate-700 bg-slate-900/30 p-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {cat.children.map(child => (
                        <div key={child.categoryId} className="flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded-xl hover:border-purple-500/50 transition group">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500 text-lg">↳</span>
                            <div>
                              <div className="font-medium text-slate-200">{child.categoryName}</div>
                              <div className="text-xs text-slate-500">{child._count?.furnitures || 0} Ürün</div>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(child)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded">✏️</button>
                            <button onClick={() => handleDelete(child.categoryId)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded">🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Kategori Adı</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-white"
                    value={formData.categoryName}
                    onChange={e => setFormData({...formData, categoryName: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 block mb-1">Üst Kategori</label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-white"
                    value={formData.parentId}
                    onChange={e => setFormData({...formData, parentId: e.target.value})}
                  >
                    <option value="">(Yok - Ana Kategori)</option>
                    {renderCategoryOptions(categories)}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-400 block mb-1">Açıklama</label>
                  <textarea 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-white resize-none"
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="flex items-center gap-3 py-2">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-purple-500 bg-slate-900 border-slate-700 rounded"
                    checked={formData.isActive}
                    onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  />
                  <span className="text-white">Aktif</span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">İptal</button>
                  <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}