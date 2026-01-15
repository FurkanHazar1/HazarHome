'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { compressImage } from '@/utils/imageCompression'

export default function FurnitureSetEdit({ setId }: { setId: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [categories, setCategories] = useState<any[]>([])
  const [furnitureList, setFurnitureList] = useState<any[]>([])
  const [showFurnitureModal, setShowFurnitureModal] = useState(false)

  const [formData, setFormData] = useState({
    setName: '',
    categoryId: '',
    description: '',
    price: '',
    isActive: true
  })

  // Relations
  const [selectedItems, setSelectedItems] = useState<{ id: number, name: string, quantity: number, sortOrder: number }[]>([])
  
  // Images
  const [existingImages, setExistingImages] = useState<any[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load Options
        const catRes = await fetch('/api/categories?includeHierarchy=true')
        const catData = await catRes.json()
        if (catData.success) {
          const flattened: any[] = []
          catData.data.forEach((cat: any) => { if(cat.categoryLevel === 1) flattened.push(cat) })
          setCategories(flattened)
        }

        const furnRes = await fetch('/api/furniture?active=true&limit=1000')
        const furnData = await furnRes.json()
        if (furnData.success) setFurnitureList(furnData.data)

        // Load Set
        const timestamp = new Date().getTime()
        const res = await fetch(`/api/furniture-sets/${setId}?includeFurnitureDetails=true&t=${timestamp}`)
        const data = await res.json()
        
        if (data.success) {
          const s = data.data
          setFormData({
            setName: s.setName,
            categoryId: s.category?.categoryId || '',
            description: s.description || '',
            price: s.price || '',
            isActive: s.isActive
          })

          setSelectedItems(s.furnitureSetItems.map((item: any) => ({
            id: item.furnitureId,
            name: item.furniture?.furnitureName || 'Unknown',
            quantity: item.quantity,
            sortOrder: item.sortOrder
          })))

          const sortedImages = (s.furnitureSetImages || []).sort((a: any, b: any) => a.sortOrder - b.sortOrder)
          setExistingImages(sortedImages)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [setId])

  // Image Logic (Similar to FurnitureEdit)
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const compressedFiles = await Promise.all(newFiles.map(file => compressImage(file)))
      setNewImages(prev => [...prev, ...compressedFiles])
      const urls = compressedFiles.map(file => URL.createObjectURL(file))
      setNewPreviews(prev => [...prev, ...urls])
    }
  }

  const removeExistingImage = (id: number) => {
    setRemovedImageIds(prev => [...prev, id])
    setExistingImages(prev => prev.filter(img => img.image.imageId !== id))
  }

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
    setNewPreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newItems = [...existingImages]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex >= 0 && targetIndex < newItems.length) {
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]
      newItems.forEach((item, idx) => item.sortOrder = idx + 1)
      setExistingImages(newItems)
    }
  }

  // Items Logic
  const addFurniture = (item: any) => {
    if (selectedItems.find(i => i.id === item.furnitureId)) return
    setSelectedItems(prev => [...prev, { id: item.furnitureId, name: item.furnitureName, quantity: 1, sortOrder: prev.length + 1 }])
    setShowFurnitureModal(false)
  }

  const updateQuantity = (id: number, delta: number) => {
    setSelectedItems(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item))
  }

  const removeFurniture = (id: number) => {
    setSelectedItems(prev => prev.filter(item => item.id !== id))
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const data = new FormData()
      data.append('setName', formData.setName)
      data.append('categoryId', formData.categoryId)
      data.append('description', formData.description)
      data.append('price', formData.price) // Edit allows price
      data.append('isActive', String(formData.isActive))

      // Items
      const items = selectedItems.map((item, idx) => ({
        furnitureId: item.id,
        quantity: item.quantity,
        sortOrder: idx + 1
      }))
      data.append('furnitureItems', JSON.stringify(items))

      // Images
      if (removedImageIds.length > 0) data.append('removeImageIds', JSON.stringify(removedImageIds))
      newImages.forEach(file => data.append('newImages', file))

      const orderUpdates = existingImages.map((img, idx) => ({
        imageId: img.image.imageId,
        sortOrder: idx + 1
      }))
      data.append('updateImageOrder', JSON.stringify(orderUpdates))

      const mappings: any = {}
      newImages.forEach((file, idx) => {
        const totalIndex = existingImages.length + idx
        mappings[file.name] = totalIndex === 0 ? 'main' : 'gallery'
      })
      data.append('imageTypeMappings', JSON.stringify(mappings))

      const res = await fetch(`/api/furniture-sets/${setId}`, {
        method: 'PUT',
        body: data
      })

      if (res.ok) router.push(`/admin/furniture-sets/${setId}`)
      else alert('Hata oluştu')

    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const getImageUrl = (path: string) => {
    if (!path) return ''
    let cleanPath = path.replace(/\\/g, '/')
    if (cleanPath.startsWith('public/')) cleanPath = cleanPath.replace('public/', '')
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath
    if (!cleanPath.startsWith('/uploads/')) cleanPath = '/uploads/' + cleanPath.replace(/^\//, '')
    return `${cleanPath}?t=${Date.now()}`
  }

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Yükleniyor...</div>

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 sm:p-10">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Takımı Düzenle: {formData.setName}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Info & Images */}
            <div className="space-y-8">
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Takım Adı</label>
                  <input type="text" value={formData.setName} onChange={e => setFormData({...formData, setName: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-pink-500" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Fiyat (₺)</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-pink-500 font-mono text-green-400" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Kategori</label>
                  <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-pink-500">
                    {categories.map(cat => <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Açıklama</label>
                  <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-pink-500" />
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 accent-pink-500 bg-slate-900 border-slate-700 rounded" />
                  <span>Yayında</span>
                </div>
              </div>

              {/* Images */}
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 space-y-6">
                <h2 className="text-xl font-semibold">Görseller</h2>
                <div className="grid grid-cols-3 gap-3">
                  {/* Existing */}
                  {existingImages.map((item, idx) => (
                    <div key={item.image.imageId} className="relative aspect-square rounded-xl overflow-hidden group bg-black border border-slate-600">
                      <Image src={getImageUrl(item.image.filePath)} alt="img" fill className="object-cover" />
                      <div className="absolute top-1 left-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/20">{idx + 1}</div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition">
                        <div className="flex gap-1">
                          <button type="button" onClick={() => moveImage(idx, 'up')} disabled={idx === 0} className="p-1 bg-white/20 rounded hover:bg-white/40">⬆️</button>
                          <button type="button" onClick={() => moveImage(idx, 'down')} disabled={idx === existingImages.length - 1} className="p-1 bg-white/20 rounded hover:bg-white/40">⬇️</button>
                        </div>
                        <button type="button" onClick={() => removeExistingImage(item.image.imageId)} className="text-xs bg-red-500 px-2 py-1 rounded hover:bg-red-600">Sil</button>
                      </div>
                    </div>
                  ))}
                  
                  {/* New */}
                  {newPreviews.map((src, idx) => (
                    <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-green-500/50">
                      <Image src={src} alt="new" fill className="object-cover" />
                      <div className="absolute top-1 right-1 bg-green-500 text-[10px] px-1 rounded text-white">YENİ</div>
                      <button type="button" onClick={() => removeNewImage(idx)} className="absolute bottom-1 right-1 bg-red-500 p-1 rounded-full text-white">✕</button>
                    </div>
                  ))}

                  <label className="aspect-square rounded-xl border-2 border-dashed border-slate-600 hover:border-pink-500 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-pink-400 transition">
                    <span className="text-2xl">+</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                </div>
              </div>
            </div>

            {/* Right: Items */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-pink-300">İçerik</h2>
                <button type="button" onClick={() => setShowFurnitureModal(true)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition">+ Ekle</button>
              </div>
              
              <div className="flex-1 space-y-3">
                {selectedItems.map((item) => (
                  <div key={item.id} className="bg-slate-900 p-4 rounded-xl flex items-center justify-between border border-slate-700">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-slate-800 rounded-lg">
                        <button type="button" onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1 hover:bg-slate-700 rounded-l-lg">-</button>
                        <span className="px-2 w-8 text-center">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1 hover:bg-slate-700 rounded-r-lg">+</button>
                      </div>
                      <button type="button" onClick={() => removeFurniture(item.id)} className="text-red-400 hover:text-red-300">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={() => router.back()} className="px-6 py-3 bg-slate-800 rounded-xl hover:bg-slate-700">İptal</button>
            <button type="submit" disabled={saving} className="px-8 py-3 bg-pink-600 rounded-xl hover:bg-pink-700 font-medium shadow-lg disabled:opacity-50">
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>

        </form>

        {/* Modal */}
        {showFurnitureModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-800 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[80vh]">
              <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                <h3 className="text-xl font-bold">Mobilya Ekle</h3>
                <button onClick={() => setShowFurnitureModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                {furnitureList.map(item => (
                  <button key={item.furnitureId} onClick={() => addFurniture(item)}
                    className="p-4 bg-slate-900 border border-slate-700 rounded-xl hover:border-pink-500 hover:bg-slate-800 transition text-left group">
                    <div className="font-bold group-hover:text-pink-400">{item.furnitureName}</div>
                    <div className="text-sm text-slate-500">{item.furnitureType}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
