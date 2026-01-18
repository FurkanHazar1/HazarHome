'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { compressImage } from '@/utils/imageCompression'

interface Property {
  propertyId: number
  propertyName: string
}

interface SelectedProperty {
  propertyId: number
  propertyName: string
  propertyValue: string
}

export default function FurnitureEdit({ furnitureId }: { furnitureId: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [availableProperties, setAvailableProperties] = useState<Property[]>([])
  
  const [formData, setFormData] = useState({
    furnitureName: '',
    furnitureType: '',
    categoryId: '',
    description: '',
    price: '',
    isActive: true
  })

  // Relations
  const [selectedProperties, setSelectedProperties] = useState<SelectedProperty[]>([])

  // Images
  const [existingImages, setExistingImages] = useState<any[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load Categories
        const catRes = await fetch('/api/categories?active=true&includeHierarchy=true')
        const catData = await catRes.json()
        if (catData.success) {
          const flattened: any[] = []
          catData.data.forEach((cat: any) => {
            flattened.push({ ...cat, level: 1 })
            cat.children?.forEach((child: any) => {
              flattened.push({ ...child, level: 2 })
            })
          })
          setCategories(flattened)
        }

        // Load Properties
        const propRes = await fetch('/api/properties?active=true')
        const propData = await propRes.json()
        if (propData.success) {
          setAvailableProperties(propData.data)
        }

        // Load Furniture
        const timestamp = new Date().getTime()
        const res = await fetch(`/api/furniture/${furnitureId}?includeDetails=true&t=${timestamp}`)
        const data = await res.json()
        
        if (data.success) {
          const f = data.data
          setFormData({
            furnitureName: f.furnitureName,
            furnitureType: f.furnitureType || '',
            categoryId: f.category?.categoryId || '',
            description: f.description || '',
            price: f.price || '',
            isActive: f.isActive
          })
          
          // Map properties
          if (f.properties) {
            setSelectedProperties(f.properties.map((p: any) => ({
              propertyId: p.propertyId,
              propertyName: p.property?.propertyName || 'Bilinmiyor',
              propertyValue: p.propertyValue
            })))
          }

          // Sort images by sortOrder
          const sorted = (f.images || []).sort((a: any, b: any) => a.sortOrder - b.sortOrder)
          setExistingImages(sorted)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [furnitureId])

  // Image Handlers
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const compressedFiles = await Promise.all(newFiles.map(file => compressImage(file)))
      
      setNewImages(prev => [...prev, ...compressedFiles])
      const urls = compressedFiles.map(file => URL.createObjectURL(file))
      setNewPreviews(prev => [...prev, ...urls])
    }
  }

  const removeExisting = (id: number) => {
    setRemovedImageIds(prev => [...prev, id])
    setExistingImages(prev => prev.filter(img => img.image.imageId !== id))
  }

  const removeNew = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
    setNewPreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newItems = [...existingImages]
    const targetIndex = direction === 'left' ? index - 1 : index + 1
    
    if (targetIndex >= 0 && targetIndex < newItems.length) {
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]
      newItems.forEach((item, idx) => item.sortOrder = idx + 1)
      setExistingImages(newItems)
    }
  }

  // Property Handlers
  const addProperty = (propertyId: string) => {
    if (!propertyId) return
    const id = parseInt(propertyId)
    const prop = availableProperties.find(p => p.propertyId === id)
    if (prop && !selectedProperties.find(p => p.propertyId === id)) {
      setSelectedProperties(prev => [...prev, { propertyId: id, propertyName: prop.propertyName, propertyValue: '' }])
    }
  }

  const updatePropertyValue = (id: number, value: string) => {
    setSelectedProperties(prev => prev.map(p => p.propertyId === id ? { ...p, propertyValue: value } : p))
  }

  const removeProperty = (id: number) => {
    setSelectedProperties(prev => prev.filter(p => p.propertyId !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // 1. Upload new images directly to S3
      const uploadedImagesMetadata = []
      const currentCategory = categories.find(c => c.categoryId === parseInt(formData.categoryId))?.categoryName || 'uncategorized'

      for (let i = 0; i < newImages.length; i++) {
        const file = newImages[i]
        const sortOrder = existingImages.length + i + 1
        const imageType = sortOrder === 1 ? 'main' : 'gallery'

        const presignedRes = await fetch('/api/images/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            itemType: 'furnitures',
            categoryName: currentCategory,
            itemId: furnitureId
          })
        })

        const { uploadUrl, s3Key } = await presignedRes.json()

        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        })

        uploadedImagesMetadata.push({
          s3Key,
          fileName: file.name,
          fileSize: file.size,
          imageType,
          sortOrder,
          altText: `${formData.furnitureName} - Görsel ${sortOrder}`
        })
      }

      // 2. Prepare payload
      const payload = {
        ...formData,
        properties: selectedProperties,
        removeImageIds: removedImageIds,
        updateImageOrder: existingImages.map((img, idx) => ({
          imageId: img.image.imageId,
          sortOrder: idx + 1
        })),
        uploadedImages: uploadedImagesMetadata
      }

      const res = await fetch(`/api/furniture/${furnitureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        router.push(`/admin/furniture/${furnitureId}`)
      } else {
        const errData = await res.json()
        alert(errData.error || 'Güncelleme başarısız')
      }
    } catch (error) {
      console.error(error)
      alert('Sistemsel bir hata oluştu')
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
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Düzenle: {formData.furnitureName}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Main Info */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Mobilya Adı</label>
                <input 
                  type="text" 
                  value={formData.furnitureName}
                  onChange={e => setFormData({...formData, furnitureName: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Fiyat (₺)</label>
                <input 
                  type="number" 
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-mono text-green-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-400">Kategori</label>
                <select 
                  value={formData.categoryId}
                  onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
                >
                  {categories.map(cat => (
                    <option 
                      key={cat.categoryId} 
                      value={cat.categoryId}
                      disabled={cat.level === 1}
                      className={cat.level === 1 ? 'bg-slate-800 text-slate-500 font-bold' : 'text-white'}
                    >
                      {cat.level === 1 ? `📂 ${cat.categoryName}` : `   ↳ ${cat.categoryName}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 flex items-end pb-3">
                <label className="flex items-center gap-3 cursor-pointer group w-fit">
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${formData.isActive ? 'bg-green-500' : 'bg-slate-600'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                  <span className="text-white">Yayında (Aktif)</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Açıklama</label>
              <textarea 
                rows={4}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Properties */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Özellikler</h2>
              <select 
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none"
                onChange={(e) => { addProperty(e.target.value); e.target.value = ''; }}
              >
                <option value="">+ Özellik Ekle</option>
                {availableProperties
                  .filter(p => !selectedProperties.find(sp => sp.propertyId === p.propertyId))
                  .map(p => <option key={p.propertyId} value={p.propertyId}>{p.propertyName}</option>)
                }
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedProperties.map(prop => (
                <div key={prop.propertyId} className="flex items-center gap-2 bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <span className="text-sm text-slate-400 w-1/3 truncate">{prop.propertyName}</span>
                  <input type="text" value={prop.propertyValue} onChange={(e) => updatePropertyValue(prop.propertyId, e.target.value)}
                    className="flex-1 bg-transparent border-b border-slate-700 focus:border-indigo-500 outline-none text-white text-sm px-2 py-1" />
                  <button type="button" onClick={() => removeProperty(prop.propertyId)} className="text-red-400">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-semibold">Görsel Yönetimi</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {existingImages.map((item, idx) => (
                <div key={item.image.imageId} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-600 bg-black">
                  <Image src={getImageUrl(item.image.filePath)} alt="Img" fill className="object-cover" />
                  <div className="absolute top-2 left-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-xs font-bold border border-white/20 z-10">{idx + 1}</div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moveImage(idx, 'left')} disabled={idx === 0} className="p-1 bg-white/20 rounded hover:bg-white/40 disabled:opacity-30">⬅️</button>
                      <button type="button" onClick={() => moveImage(idx, 'right')} disabled={idx === existingImages.length - 1} className="p-1 bg-white/20 rounded hover:bg-white/40 disabled:opacity-30">➡️</button>
                    </div>
                    <button type="button" onClick={() => removeExisting(item.image.imageId)} className="px-3 py-1 bg-red-500/80 rounded-full text-xs">Sil</button>
                  </div>
                </div>
              ))}
              {newPreviews.map((src, idx) => (
                <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-green-500/50">
                  <Image src={src} alt="New" fill className="object-cover" />
                  <div className="absolute top-2 right-2 bg-green-500 text-[10px] px-2 py-1 rounded">YENİ</div>
                  <button type="button" onClick={() => removeNew(idx)} className="absolute bottom-2 right-2 p-1 bg-red-500 rounded-full text-white">✕</button>
                </div>
              ))}
              <label className="aspect-square rounded-xl border-2 border-dashed border-slate-600 hover:border-indigo-500 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-400 cursor-pointer transition">
                <span className="text-3xl">+</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => router.back()} className="px-6 py-3 bg-slate-800 rounded-xl hover:bg-slate-700">İptal</button>
            <button type="submit" disabled={saving} className="px-8 py-3 bg-indigo-600 rounded-xl hover:bg-indigo-700 font-medium disabled:opacity-50">
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
