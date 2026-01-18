'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toPublicUrl } from '@/lib/image-helpers'

interface Furniture {
  furnitureId: number
  furnitureName: string
  furnitureType: string
  price: number
  isActive: boolean
  category?: {
    categoryName: string
  }
  images?: {
    image: {
      filePath: string
    }
  }[]
}

export default function FurnitureManagement() {
  const [furnitureList, setFurnitureList] = useState<Furniture[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    fetchCategories()
    fetchFurniture()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?includeHierarchy=true')
      const data = await res.json()
      if (data.success) {
        const flattened: any[] = []
        data.data.forEach((cat: any) => {
          flattened.push({ ...cat, level: 1 })
          cat.children?.forEach((child: any) => {
            flattened.push({ ...child, level: 2 })
          })
        })
        setCategories(flattened)
      }
    } catch (error) {
      console.error('Category fetch error:', error)
    }
  }

  const fetchFurniture = async (catId: string = '') => {
    setLoading(true)
    try {
      let url = '/api/furniture?includeDetails=true&limit=100'
      if (catId) url += `&categoryId=${catId}`
      
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setFurnitureList(data.data)
      }
    } catch (error) {
      console.error('Error fetching furniture:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedCategory(val)
    fetchFurniture(val)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bu mobilyayı silmek istediğinizden emin misiniz?')) return
    
    try {
      const res = await fetch(`/api/furniture/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setFurnitureList(prev => prev.filter(item => item.furnitureId !== id))
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const filteredList = furnitureList.filter(item => 
    item.furnitureName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getFurnitureImage = (furniture: Furniture) => {
    const mainImg = furniture.images?.find((img: any) => img.imageType === 'main') || furniture.images?.[0]
    return toPublicUrl(mainImg?.image?.filePath) || '/images/products/placeholder.jpg'
  }

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Yükleniyor...</div>

  return (
    <div className="min-h-screen bg-slate-900 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Mobilya Yönetimi</h1>
            <p className="text-slate-400 mt-1">Ürünlerinizi listeleyin ve yönetin</p>
          </div>
          <Link 
            href="/admin/furniture/add" 
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            Yeni Mobilya Ekle
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Mobilya adı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-500"
            />
            <svg className="w-6 h-6 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>

          {/* Category Filter */}
          <div className="relative w-full sm:w-64">
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="w-full h-full bg-slate-800/50 border border-slate-700 text-white pl-4 pr-10 py-4 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map(cat => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.level === 1 ? '📁' : '↳'} {cat.categoryName}
                </option>
              ))}
            </select>
            <svg className="w-5 h-5 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-80 bg-slate-800/50 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700/50 border-dashed">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-white mb-2">Sonuç Bulunamadı</h3>
            <p className="text-slate-400">Arama kriterlerinize uygun mobilya bulunamadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredList.map((item) => {
              const mainImage = item.images?.[0]?.image?.filePath
              const imageUrl = toPublicUrl(mainImage)

              return (
                <div key={item.furnitureId} className="group bg-slate-800 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-indigo-500/50 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col">
                  {/* Image Area */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={item.furnitureName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      </div>
                    )}
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-md ${item.isActive ? 'bg-green-500/20 text-green-300 border border-green-500/20' : 'bg-red-500/20 text-red-300 border border-red-500/20'}`}>
                      {item.isActive ? 'Aktif' : 'Pasif'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex-1">
                      <div className="text-xs text-indigo-400 font-medium mb-1">{item.category?.categoryName || 'Kategorisiz'}</div>
                      <h3 className="text-lg font-bold text-white mb-1 line-clamp-1" title={item.furnitureName}>{item.furnitureName}</h3>
                      <p className="text-sm text-slate-400">{item.furnitureType}</p>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center">
                      <span className="text-white font-semibold">{item.price > 0 ? `₺${item.price.toLocaleString('tr-TR')}` : 'Fiyat Yok'}</span>
                      <div className="flex gap-2">
                        <Link 
                          href={`/admin/furniture/${item.furnitureId}`}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                          title="Detay"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </Link>
                        <Link 
                          href={`/admin/furniture/${item.furnitureId}/edit`}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </Link>
                        <button 
                          onClick={() => handleDelete(item.furnitureId)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
