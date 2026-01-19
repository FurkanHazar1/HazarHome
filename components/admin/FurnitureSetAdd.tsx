'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { compressImage } from '@/utils/imageCompression'
import { toPublicUrl } from '@/lib/image-helpers'

export default function FurnitureSetAdd() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [generatingDesc, setGeneratingDesc] = useState(false)
  
  // Data Options
  const [categories, setCategories] = useState<any[]>([])
  const [furnitureList, setFurnitureList] = useState<any[]>([])
  
  // Modal State
  const [showFurnitureModal, setShowFurnitureModal] = useState(false)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null) // New state for category filter

  // Form Data
  const [formData, setFormData] = useState({
    setName: '',
    categoryId: '',
    description: '',
    isActive: true
  })

  // Selected Furniture Items
  const [selectedItems, setSelectedItems] = useState<{ id: number, name: string, quantity: number, image?: string }[]>([])

  // AI Description Generator
  const generateDescription = async () => {
    if (!formData.setName || !formData.categoryId) {
      alert('Lütfen önce takım adını ve kategorisini seçin.');
      return;
    }

    setGeneratingDesc(true);
    try {
      const selectedCat = categories.find(c => c.categoryId === parseInt(formData.categoryId));
      const categoryName = selectedCat ? selectedCat.categoryName : '';

      const setContentText = selectedItems.map(item => `${item.quantity} adet ${item.name}`).join(', ');

      const res = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.setName,
          category: categoryName,
          type: 'furniture_set',
          setContent: setContentText
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

  // Images
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  useEffect(() => {
    // Load Categories
    fetch('/api/categories?includeHierarchy=true').then(res => res.json()).then(data => {
      if (data.success) {
        // Only level 1 categories usually for Sets, but let's allow all active
        const flattened: any[] = []
        data.data.forEach((cat: any) => {
          flattened.push({ ...cat, level: 1 })
          cat.children?.forEach((child: any) => {
            flattened.push({ ...child, level: 2 })
          })
        })
        setCategories(flattened)
      }
    })

    // Load Furniture List
    fetch('/api/furniture?active=true&limit=1000&includeDetails=true').then(res => res.json()).then(data => {
      if (data.success) setFurnitureList(data.data)
    })
  }, [])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      
      const compressedFiles: File[] = []
      for (const file of newFiles) {
        try {
          const compressed = await compressImage(file)
          compressedFiles.push(compressed)
        } catch (error) {
          console.error("Image compression failed for", file.name, error)
        }
      }
      
      setImages(prev => [...prev, ...compressedFiles])
      const urls = compressedFiles.map(file => URL.createObjectURL(file))
      setPreviews(prev => [...prev, ...urls])
    }
  }

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => {
      URL.revokeObjectURL(prev[idx])
      return prev.filter((_, i) => i !== idx)
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

  const addFurnitureToSet = (item: any) => {
    if (selectedItems.find(i => i.id === item.furnitureId)) return
    const imagePath = item.images?.[0]?.image?.filePath
    setSelectedItems(prev => [...prev, { 
      id: item.furnitureId, 
      name: item.furnitureName, 
      quantity: 1,
      image: imagePath
    }])
    setShowFurnitureModal(false)
  }

  const updateQuantity = (id: number, delta: number) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQ }
      }
      return item
    }))
  }

  const removeFurniture = (id: number) => {
    setSelectedItems(prev => prev.filter(item => item.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedItems.length === 0) return alert('Lütfen takıma en az bir mobilya ekleyin')
    
    setLoading(true)
    
    try {
      // 1. Upload images directly to S3
      const uploadedImagesMetadata = []
      const currentCategory = categories.find(c => c.categoryId === parseInt(formData.categoryId))?.categoryName || 'uncategorized'

      for (let i = 0; i < images.length; i++) {
        const file = images[i]
        const imageType = i === 0 ? 'main' : 'gallery'
        const sortOrder = i + 1

        const presignedRes = await fetch('/api/images/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            itemType: 'furniture-sets',
            categoryName: currentCategory
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
          altText: `${formData.setName} - Görsel ${sortOrder}`
        })
      }

      // 2. Save furniture set data
      const payload = {
        ...formData,
        price: '0',
        furnitureItems: selectedItems.map((item, idx) => ({
          furnitureId: item.id,
          quantity: item.quantity,
          sortOrder: idx + 1
        })),
        uploadedImages: uploadedImagesMetadata
      }

      const res = await fetch('/api/furniture-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) router.push('/admin/furniture-sets')
      else alert('Hata oluştu')

    } catch (error) {
      console.error(error)
      alert('Sistemsel bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Filter furniture list based on selected category
  const filteredFurnitureList = selectedCategoryFilter
    ? furnitureList.filter(item => item.categoryId === selectedCategoryFilter)
    : furnitureList

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 sm:p-10">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
            Yeni Takım Ekle
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Col: Info */}
            <div className="space-y-8">
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 space-y-6">
                <h2 className="text-xl font-semibold text-pink-300">Takım Bilgileri</h2>
                
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Takım Adı</label>
                  <input type="text" required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-pink-500"
                    value={formData.setName} onChange={e => setFormData({...formData, setName: e.target.value})} placeholder="Örn: Royal Yatak Odası" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Kategori</label>
                  <select required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-pink-500"
                    value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                    <option value="">Seçiniz...</option>
                    {categories.filter(cat => cat.level === 1).map(cat => <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-slate-400">Açıklama</label>
                    <button
                      type="button"
                      onClick={generateDescription}
                      disabled={generatingDesc}
                      className="text-xs flex items-center gap-1 bg-pink-600/20 text-pink-300 px-3 py-1.5 rounded-lg hover:bg-pink-600/30 transition border border-pink-500/30 disabled:opacity-50"
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
                  <textarea rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-pink-500 resize-none"
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Takım açıklamasını buraya yazın veya yapay zeka ile oluşturun..."
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 accent-pink-500 bg-slate-900 border-slate-700 rounded" />
                  <span>Yayında</span>
                </div>
              </div>

              {/* Images */}
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 space-y-6">
                <h2 className="text-xl font-semibold text-pink-300">Görseller</h2>
                <div className="grid grid-cols-3 gap-3">
                  <label className="aspect-square rounded-xl border-2 border-dashed border-slate-600 hover:border-pink-500 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-pink-400 transition">
                    <span className="text-2xl">+</span>
                    <span className="text-xs">Ekle</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  {previews.map((src, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-black group border border-slate-700">
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
                        <button type="button" onClick={() => removeImage(idx)} className="text-xs bg-red-500 px-3 py-1 rounded-full text-white hover:bg-red-600 transition">Sil</button>
                      </div>
                      
                      {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-pink-600 text-white text-[10px] font-bold text-center py-1">KAPAK</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Items */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-pink-300">Takım İçeriği</h2>
                <button type="button" onClick={() => setShowFurnitureModal(true)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition">
                  + Mobilya Ekle
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px]">
                {selectedItems.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                    Henüz mobilya eklenmedi
                  </div>
                ) : (
                  selectedItems.map((item) => (
                    <div key={item.id} className="bg-slate-900 p-3 rounded-xl flex items-center justify-between border border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 bg-black rounded-lg overflow-hidden border border-slate-600 flex-shrink-0">
                          {item.image ? (
                            <Image src={toPublicUrl(item.image) || ''} alt={item.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">IMG</div>
                          )}
                        </div>
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-800 rounded-lg h-8">
                          <button type="button" onClick={() => updateQuantity(item.id, -1)} className="px-2 hover:bg-slate-700 rounded-l-lg h-full flex items-center text-slate-400 hover:text-white">-</button>
                          <span className="px-2 text-sm text-center min-w-[20px]">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.id, 1)} className="px-2 hover:bg-slate-700 rounded-r-lg h-full flex items-center text-slate-400 hover:text-white">+</button>
                        </div>
                        <button type="button" onClick={() => removeFurniture(item.id)} className="text-red-400 hover:text-red-300 p-1">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => router.back()} className="px-6 py-3 bg-slate-800 rounded-xl hover:bg-slate-700">İptal</button>
            <button type="submit" disabled={loading} className="px-8 py-3 bg-pink-600 rounded-xl hover:bg-pink-700 font-medium shadow-lg shadow-pink-600/20 disabled:opacity-50">
              {loading ? 'Kaydediliyor...' : 'Takımı Oluştur'}
            </button>
          </div>

        </form>

        {/* Modal */}
        {showFurnitureModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-800 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[80vh]">
              <div className="p-6 border-b border-slate-700 flex justify-between items-center gap-4">
                <h3 className="text-xl font-bold whitespace-nowrap">Mobilya Seç</h3>
                
                {/* Category Filter */}
                <select 
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-pink-500 w-full max-w-xs"
                  value={selectedCategoryFilter || ''}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Tüm Kategoriler</option>
                  {categories.map(cat => (
                    <option key={cat.categoryId} value={cat.categoryId} disabled={cat.level === 1} className={cat.level === 1 ? 'bg-slate-800 text-slate-500 font-bold' : ''}>
                      {cat.level === 1 ? `📂 ${cat.categoryName}` : `   ↳ ${cat.categoryName}`}
                    </option>
                  ))}
                </select>

                <button onClick={() => setShowFurnitureModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              
              <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredFurnitureList.length === 0 ? (
                  <div className="col-span-2 text-center text-slate-500 py-8">
                    Bu kategoride mobilya bulunamadı.
                  </div>
                ) : (
                  filteredFurnitureList.map(item => {
                    const itemImage = item.images?.[0]?.image?.filePath
                    return (
                      <button key={item.furnitureId} onClick={() => addFurnitureToSet(item)}
                        className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-700 rounded-xl hover:border-pink-500 hover:bg-slate-800 transition text-left group">
                        <div className="relative w-12 h-12 bg-black rounded-lg overflow-hidden border border-slate-600 flex-shrink-0">
                          {itemImage ? (
                            <Image src={toPublicUrl(itemImage) || ''} alt={item.furnitureName} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">IMG</div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold group-hover:text-pink-400 text-sm line-clamp-1">{item.furnitureName}</div>
                          <div className="text-xs text-slate-500">{item.furnitureType}</div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
