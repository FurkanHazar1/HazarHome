'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function FurnitureSetManagement() {
  const [sets, setSets] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    fetchCategories()
    fetchSets()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?includeHierarchy=true')
      const data = await res.json()
      if (data.success) {
        // Sets are usually categorized by main categories (Level 1)
        const mainCategories: any[] = []
        data.data.forEach((cat: any) => {
          mainCategories.push({ ...cat, level: 1 })
          cat.children?.forEach((child: any) => {
            mainCategories.push({ ...child, level: 2 })
          })
        })
        setCategories(mainCategories)
      }
    } catch (error) {
      console.error('Category fetch error:', error)
    }
  }

  const fetchSets = async (catId: string = '') => {
    setLoading(true)
    try {
      let url = '/api/furniture-sets?includeDetails=true'
      if (catId) url += `&categoryId=${catId}`

      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setSets(data.data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedCategory(val)
    fetchSets(val)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu takımı silmek istediğinize emin misiniz?')) return
    try {
      await fetch(`/api/furniture-sets/${id}`, { method: 'DELETE' })
      setSets(prev => prev.filter(s => s.setId !== id))
    } catch (error) {
      console.error(error)
    }
  }

  const filteredSets = sets.filter(s => 
    s.setName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getImageUrl = (path?: string) => {
    if (!path) return null
    let cleanPath = path.replace(/\\/g, '/')
    if (cleanPath.startsWith('public/')) cleanPath = cleanPath.replace('public/', '')
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath
    if (!cleanPath.startsWith('/uploads/')) cleanPath = '/uploads/' + cleanPath.replace(/^\//, '')
    return `${cleanPath}?t=${Date.now()}`
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Takım Yönetimi</h1>
            <p className="text-slate-400 mt-1">Mobilya takımlarını yönetin</p>
          </div>
          <Link 
            href="/admin/furniture-sets/add" 
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-5 py-3 rounded-xl transition-all shadow-lg shadow-pink-600/20 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            Yeni Takım Ekle
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Takım adı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition placeholder-slate-500"
            />
            <svg className="w-6 h-6 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>

          {/* Category Filter */}
          <div className="relative w-full sm:w-64">
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="w-full h-full bg-slate-800/50 border border-slate-700 text-white pl-4 pr-10 py-4 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map(cat => (
                <option key={cat.categoryId} value={cat.categoryId} className={cat.level === 1 ? 'font-bold' : ''}>
                  {cat.level === 1 ? '📁' : '↳'} {cat.categoryName}
                </option>
              ))}
            </select>
            <svg className="w-5 h-5 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-80 bg-slate-800 animate-pulse rounded-2xl"></div>)}
          </div>
        ) : filteredSets.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700/50 border-dashed">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-white mb-2">Sonuç Bulunamadı</h3>
            <p className="text-slate-400">Arama kriterlerinize uygun takım bulunamadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSets.map((set) => {
              const mainImage = set.furnitureSetImages?.[0]?.image.filePath
              const imageUrl = getImageUrl(mainImage)

              return (
                <div key={set.setId} className="group bg-slate-800 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-pink-500/50 transition hover:shadow-2xl hover:shadow-pink-500/10 flex flex-col">
                  <div className="relative aspect-video overflow-hidden bg-black">
                    {imageUrl ? (
                      <Image src={imageUrl} alt={set.setName} fill className="object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">Görsel Yok</div>
                    )}
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-md ${set.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      {set.isActive ? 'Aktif' : 'Pasif'}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex-1">
                      <div className="text-xs text-pink-400 font-medium mb-1">{set.category?.categoryName}</div>
                      <h3 className="text-xl font-bold text-white mb-2">{set.setName}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="bg-slate-700/50 px-2 py-1 rounded">
                          {set._count?.furnitureSetItems || 0} Parça
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center">
                      <span className="text-white font-bold text-lg">{set.price > 0 ? `₺${set.price.toLocaleString('tr-TR')}` : '-'}</span>
                      <div className="flex gap-2">
                        <Link href={`/admin/furniture-sets/${set.setId}`} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </Link>
                        <Link href={`/admin/furniture-sets/${set.setId}/edit`} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </Link>
                        <button onClick={() => handleDelete(set.setId)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
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
