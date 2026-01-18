'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { compressImage } from '@/utils/imageCompression'

interface Category {
  categoryId: number
  categoryName: string
  categoryLevel: number
}

interface Property {
  propertyId: number
  propertyName: string
}

interface SelectedProperty {
  propertyId: number
  propertyName: string
  propertyValue: string
}

export default function FurnitureAdd() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [generatingDesc, setGeneratingDesc] = useState(false);

  // Data Sources
  const [categories, setCategories] = useState<Category[]>([])
  const [availableProperties, setAvailableProperties] = useState<Property[]>([])
  
  // Form State
  const [formData, setFormData] = useState({
    furnitureName: '',
    categoryId: '',
    description: '',
    isActive: true
  })

  // Relations
  const [selectedProperties, setSelectedProperties] = useState<SelectedProperty[]>([])

  // Image State
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  // AI Description Generator
  const generateDescription = async () => {
    if (!formData.furnitureName || !formData.categoryId) {
      alert('Lütfen önce mobilya adını ve kategorisini seçin.');
      return;
    }

    setGeneratingDesc(true);
    try {
      const selectedCat = categories.find(c => c.categoryId === parseInt(formData.categoryId));
      const categoryName = selectedCat ? selectedCat.categoryName : '';

      const propNames = selectedProperties.map(p => `${p.propertyName}: ${p.propertyValue || 'Var'}`);

      const res = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.furnitureName,
          category: categoryName,
          type: 'furniture',
          properties: propNames
        })
      });

      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, description: data.description }));
      } else {
        alert('Açıklama oluşturulamadı: ' + (data.error || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('AI error:', error);
      alert('Yapay zeka servisine bağlanırken hata oluştu.');
    } finally {
      setGeneratingDesc(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Categories
        const catRes = await fetch('/api/categories?active=true&includeHierarchy=true')
        const catData = await catRes.json()
        if (catData.success) {
          const flattened: Category[] = []
          catData.data.forEach((cat: any) => {
            flattened.push({ categoryId: cat.categoryId, categoryName: cat.categoryName, categoryLevel: 1 })
            cat.children?.forEach((child: any) => {
              flattened.push({ categoryId: child.categoryId, categoryName: child.categoryName, categoryLevel: 2 })
            })
          })
          setCategories(flattened)
        }

        // Properties
        const propRes = await fetch('/api/properties?active=true')
        const propData = await propRes.json()
        if (propData.success) {
          setAvailableProperties(propData.data)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setInitialLoading(false)
      }
    }
    fetchData()
  }, [])

  // Image Handlers
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const compressedFiles = await Promise.all(newFiles.map(file => compressImage(file)))
      
      setImages(prev => [...prev, ...compressedFiles])
      const urls = compressedFiles.map(file => URL.createObjectURL(file))
      setPreviews(prev => [...prev, ...urls])
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newImages = [...images]
    const newPreviewsTemp = [...previews]
    const targetIndex = direction === 'left' ? index - 1 : index + 1

    if (targetIndex >= 0 && targetIndex < newImages.length) {
      [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
      [newPreviewsTemp[index], newPreviewsTemp[targetIndex]] = [newPreviewsTemp[targetIndex], newPreviewsTemp[index]];
      
      setImages(newImages)
      setPreviews(newPreviewsTemp)
    }
  }

  // Property Handlers
  const addProperty = (propertyId: string) => {
    if (!propertyId) return
    const id = parseInt(propertyId)
    const prop = availableProperties.find(p => p.propertyId === id)
    
    if (prop && !selectedProperties.find(p => p.propertyId === id)) {
      setSelectedProperties(prev => [...prev, {
        propertyId: id,
        propertyName: prop.propertyName,
        propertyValue: ''
      }])
    }
  }

  const updatePropertyValue = (id: number, value: string) => {
    setSelectedProperties(prev => prev.map(p => p.propertyId === id ? { ...p, propertyValue: value } : p))
  }

  const removeProperty = (id: number) => {
    setSelectedProperties(prev => prev.filter(p => p.propertyId !== id))
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Upload images directly to S3 using Presigned URLs
      const uploadedImagesMetadata = []
      
      for (let i = 0; i < images.length; i++) {
        const file = images[i]
        const imageType = i === 0 ? 'main' : 'gallery'
        const sortOrder = i + 1

        // Get Presigned URL
        const presignedRes = await fetch('/api/images/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            itemType: 'furnitures',
            categoryName: categories.find(c => c.categoryId === parseInt(formData.categoryId))?.categoryName || 'uncategorized'
          })
        })

        const { uploadUrl, s3Key } = await presignedRes.json()

        // Upload directly to S3
        const uploadResult = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 
            'Content-Type': file.type 
          }
        })

        if (!uploadResult.ok) {
          throw new Error(`S3 upload failed with status: ${uploadResult.status}`)
        }

        uploadedImagesMetadata.push({
          s3Key,
          fileName: file.name,
          fileSize: file.size,
          imageType,
          sortOrder,
          altText: `${formData.furnitureName} - Görsel ${sortOrder}`
        })
      }

      // 2. Save furniture data with S3 keys
      const selectedCat = categories.find(c => c.categoryId === parseInt(formData.categoryId))
      const derivedType = selectedCat ? selectedCat.categoryName : 'Genel'

      const payload = {
        ...formData,
        furnitureType: derivedType,
        price: '0', // Fixed price as per original logic
        properties: selectedProperties,
        uploadedImages: uploadedImagesMetadata
      }

      const res = await fetch('/api/furniture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await res.json()

      if (result.success) {
        router.push('/admin/furniture')
      } else {
        alert(result.error || 'Hata oluştu')
      }
    } catch (error) {
      console.error(error)
      alert('Beklenmedik bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Yükleniyor...</div>

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 sm:p-10">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Yeni Mobilya Ekle
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Main Info */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-semibold text-indigo-300">Temel Bilgiler</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-slate-400 font-medium">Mobilya Adı</label>
                <input 
                  type="text" 
                  required
                  value={formData.furnitureName}
                  onChange={e => setFormData({...formData, furnitureName: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  placeholder="Örn: Chester Koltuk"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-400 font-medium">Kategori</label>
                <select 
                  required
                  value={formData.categoryId}
                  onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition appearance-none"
                >
                  <option value="">Kategori Seçiniz...</option>
                  {categories.map(cat => (
                    <option 
                      key={cat.categoryId} 
                      value={cat.categoryId} 
                      disabled={cat.categoryLevel === 1} // Disable level 1
                      className={cat.categoryLevel === 1 ? 'bg-slate-800 text-slate-500 font-bold' : 'text-white'}
                    >
                      {cat.categoryLevel === 1 ? `📂 ${cat.categoryName}` : `   ↳ ${cat.categoryName}`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">* Sadece alt kategoriler seçilebilir.</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm text-slate-400 font-medium">Açıklama</label>
                <button
                  type="button"
                  onClick={generateDescription}
                  disabled={generatingDesc}
                  className="text-xs flex items-center gap-1 bg-purple-600/20 text-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-600/30 transition border border-purple-500/30 disabled:opacity-50"
                >
                  {generatingDesc ? (
                    <>
                      <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></span>
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      ✨ Yapay Zeka ile Oluştur
                    </>
                  )}
                </button>
              </div>
              <textarea 
                rows={4}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
                placeholder="Ürün açıklamasını buraya yazın veya yapay zeka ile oluşturun..."
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer group w-fit">
              <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${formData.isActive ? 'bg-green-500' : 'bg-slate-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
              <input type="checkbox" className="hidden" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
              <span className="text-white">Yayında (Aktif)</span>
            </label>
          </div>

          {/* Properties */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-indigo-300">Özellikler</h2>
              <select 
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                onChange={(e) => { addProperty(e.target.value); e.target.value = ''; }}
              >
                <option value="">+ Özellik Ekle</option>
                {availableProperties
                  .filter(p => !selectedProperties.find(sp => sp.propertyId === p.propertyId))
                  .map(p => (
                    <option key={p.propertyId} value={p.propertyId}>{p.propertyName}</option>
                  ))
                }
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedProperties.length === 0 && (
                <div className="col-span-2 text-center text-slate-500 py-4 border border-dashed border-slate-700 rounded-xl">
                  Henüz özellik eklenmedi.
                </div>
              )}
              {selectedProperties.map(prop => (
                <div key={prop.propertyId} className="flex items-center gap-2 bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <span className="text-sm font-medium text-slate-400 w-1/3 truncate" title={prop.propertyName}>{prop.propertyName}</span>
                  <input 
                    type="text"
                    value={prop.propertyValue}
                    onChange={(e) => updatePropertyValue(prop.propertyId, e.target.value)}
                    className="flex-1 bg-transparent border-b border-slate-700 focus:border-indigo-500 outline-none text-white text-sm px-2 py-1"
                    placeholder="Değer girin..."
                  />
                  <button type="button" onClick={() => removeProperty(prop.propertyId)} className="text-red-400 hover:text-red-300">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-semibold text-indigo-300">Görseller</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <label className="aspect-square rounded-xl border-2 border-dashed border-slate-600 hover:border-indigo-500 hover:bg-slate-800/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-400">
                <span className="text-3xl">+</span>
                <span className="text-xs font-medium">Seç</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>

              {previews.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-700 bg-black">
                  <Image src={src} alt="Preview" fill className="object-cover" />
                  
                  {/* Sort Badge */}
                  <div className="absolute top-2 left-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-xs font-bold border border-white/20 z-10">
                    {idx + 1}
                  </div>

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moveImage(idx, 'left')} disabled={idx === 0} className="p-1 bg-white/20 rounded hover:bg-white/40 disabled:opacity-30">⬅️</button>
                      <button type="button" onClick={() => moveImage(idx, 'right')} disabled={idx === previews.length - 1} className="p-1 bg-white/20 rounded hover:bg-white/40 disabled:opacity-30">➡️</button>
                    </div>
                    <button type="button" onClick={() => removeImage(idx)} className="text-xs bg-red-500 px-3 py-1 rounded-full text-white hover:bg-red-600">Sil</button>
                  </div>
                  
                  {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-indigo-600 text-white text-[10px] font-bold text-center py-1">KAPAK</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => router.back()} className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition font-medium">İptal</button>
            <button type="submit" disabled={loading} className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium disabled:opacity-50">
              {loading ? 'Kaydediliyor...' : 'Mobilyayı Kaydet'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}