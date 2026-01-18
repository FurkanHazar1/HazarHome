'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toPublicUrl } from '@/lib/image-helpers'

interface Pin {
  pinId?: number
  xPosition: number
  yPosition: number
  furnitureId?: number
  furnitureSetId?: number
  furniture?: any
  furnitureSet?: any
}

interface FeatureEditorProps {
  initialData?: any
  isNew?: boolean
}

export default function FeatureEditor({ initialData, isNew = false }: FeatureEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('details') // details, hotspots

  // Form State
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder || 0)
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true)
  const [selectedImage, setSelectedImage] = useState<any>(initialData?.image || null)
  const [pins, setPins] = useState<Pin[]>(initialData?.pins || [])
  const [uploading, setUploading] = useState(false)

  // Image Selection Modal State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [imageSearchQuery, setImageSearchQuery] = useState('')
  const [imageSearchResults, setImageSearchResults] = useState<any[]>([])
  const [selectedProductImages, setSelectedProductImages] = useState<any[]>([])
  const [selectedProductForImages, setSelectedProductForImages] = useState<any>(null)

  // Pin Product Selection Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [productSearchResults, setProductSearchResults] = useState<any[]>([])
  const [currentPinIndex, setCurrentPinIndex] = useState<number | null>(null)

  // Image Ref for calculating coordinates
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // --- SEARCH HELPERS ---
  const searchProducts = async (query: string, setResults: (data: any[]) => void) => {
    if (!query) {
      setResults([])
      return
    }
    try {
      const [furnRes, setsRes] = await Promise.all([
        fetch(`/api/furniture?search=${encodeURIComponent(query)}&limit=5`),
        fetch(`/api/furniture-sets?search=${encodeURIComponent(query)}&limit=5`)
      ])
      const furnData = await furnRes.json()
      const setsData = await setsRes.json()

      const results = [
        ...(furnData.data || []).map((i: any) => ({ ...i, type: 'furniture', label: 'Mobilya', name: i.furnitureName })),
        ...(setsData.data || []).map((i: any) => ({ ...i, type: 'set', label: 'Takım', name: i.setName }))
      ]
      setResults(results)
    } catch (error) {
      console.error(error)
    }
  }

  const handleImageSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setImageSearchQuery(q)
    searchProducts(q, setImageSearchResults)
  }

  const handleProductSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setProductSearchQuery(q)
    searchProducts(q, setProductSearchResults)
  }

  const fetchProductImages = async (item: any) => {
    setSelectedProductForImages(item)
    // Fetch detailed item to get images
    const endpoint = item.type === 'furniture' 
      ? `/api/furniture/${item.furnitureId}` 
      : `/api/furniture-sets/${item.setId}`
    
    try {
      const res = await fetch(endpoint)
      const response = await res.json()
      
      const images = item.type === 'furniture'
        ? response.data?.images?.map((r: any) => r.image)
        : response.data?.furnitureSetImages?.map((r: any) => r.image)
      
      setSelectedProductImages(images || [])
    } catch (e) {
      console.error(e)
    }
  }

  // --- PIN LOGIC ---
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return

    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newPin: Pin = {
      xPosition: x,
      yPosition: y,
    }

    setPins([...pins, newPin])
    // Automatically open product selector for the new pin
    setCurrentPinIndex(pins.length) // Index of the new pin
    setIsProductModalOpen(true)
    setProductSearchQuery('')
    setProductSearchResults([])
  }

  const updatePinProduct = (item: any) => {
    if (currentPinIndex === null) return

    const updatedPins = [...pins]
    const pin = updatedPins[currentPinIndex]

    if (item.type === 'furniture') {
      pin.furnitureId = item.furnitureId
      pin.furnitureSetId = undefined
      pin.furniture = item
      pin.furnitureSet = undefined
    } else {
      pin.furnitureSetId = item.setId
      pin.furnitureId = undefined
      pin.furnitureSet = item
      pin.furniture = undefined
    }

    setPins(updatedPins)
    setIsProductModalOpen(false)
    setCurrentPinIndex(null)
  }

  const removePin = (index: number) => {
    const updatedPins = [...pins]
    updatedPins.splice(index, 1)
    setPins(updatedPins)
  }

  // --- DIRECT UPLOAD ---
  const handleDirectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // 1. Get Presigned URL
      const presignedRes = await fetch('/api/images/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          itemType: 'features'
        })
      })

      const { uploadUrl, s3Key } = await presignedRes.json()

      // 2. Upload directly to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      })
      
      // We'll pass this s3Key to the backend on submit
      // For the preview, we need a local URL
      setSelectedImage({
        filePath: s3Key, // Temp storage of key
        isNewS3: true,
        previewUrl: URL.createObjectURL(file)
      })
      
    } catch (error) {
      console.error('Image upload failed', error)
      alert('Görsel yüklenemedi.')
    } finally {
      setUploading(false)
    }
  }

  // --- SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedImage) {
      alert('Lütfen bir görsel seçin.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        title,
        description,
        sortOrder: parseInt(sortOrder.toString()),
        isActive,
        imageId: selectedImage.isNewS3 ? undefined : selectedImage.imageId,
        s3Key: selectedImage.isNewS3 ? selectedImage.filePath : undefined,
        pins: pins.map(p => ({
          xPosition: p.xPosition,
          yPosition: p.yPosition,
          furnitureId: p.furnitureId,
          furnitureSetId: p.furnitureSetId
        }))
      }

      const url = isNew ? '/api/features' : `/api/features/${initialData.featureId}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        router.push('/admin/features')
        router.refresh()
      } else {
        alert('Kaydetme başarısız.')
      }
    } catch (error) {
      console.error(error)
      alert('Hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  // Helper for image URLs in the editor
  const getFeatureImageUrl = (img: any) => {
    if (!img) return ''
    if (img.isNewS3) return img.previewUrl
    return toPublicUrl(img.filePath)
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{isNew ? 'Yeni Lookbook Ekle' : 'Lookbook Düzenle'}</h1>
        <div className="flex gap-2">
           <Link href="/admin/features" className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition">İptal</Link>
           <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
           >
             {loading ? 'Kaydediliyor...' : 'Kaydet'}
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-700 mb-6">
        <button 
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 font-medium border-b-2 transition ${activeTab === 'details' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Genel Bilgiler
        </button>
        <button 
          onClick={() => setActiveTab('hotspots')}
          disabled={!selectedImage}
          className={`px-4 py-2 font-medium border-b-2 transition ${activeTab === 'hotspots' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'} ${!selectedImage ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Hotspotlar (Noktalar)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Form */}
        <div className={`lg:col-span-1 space-y-6 ${activeTab === 'hotspots' ? 'hidden lg:block' : ''}`}>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Başlık</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Örn: Yaz Koleksiyonu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Açıklama</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Kısa açıklama..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Sıralama</label>
                  <input 
                    type="number" 
                    value={sortOrder}
                    onChange={e => setSortOrder(parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Durum</label>
                  <div className="flex items-center h-[42px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isActive}
                        onChange={e => setIsActive(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-300">Aktif</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <label className="block text-sm font-medium text-slate-300 mb-3">Ana Görsel</label>
            
            {selectedImage ? (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-600 group">
                <Image 
                  src={getFeatureImageUrl(selectedImage)} 
                  alt="Selected" 
                  fill 
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition gap-2">
                  <button onClick={() => setIsImageModalOpen(true)} className="bg-white text-slate-900 px-3 py-1 rounded font-medium text-sm">Üründen Seç</button>
                  <label className="bg-indigo-600 text-white px-3 py-1 rounded font-medium text-sm cursor-pointer hover:bg-indigo-500 transition">
                    Bilgisayardan Yükle
                    <input type="file" className="hidden" accept="image/*" onChange={handleDirectImageUpload} disabled={uploading} />
                  </label>
                </div>
                {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs">Yükleniyor...</div>}
              </div>
            ) : (
              <div className="space-y-3">
                <button 
                  onClick={() => setIsImageModalOpen(true)}
                  className="w-full aspect-video rounded-lg border-2 border-dashed border-slate-600 hover:border-indigo-500 hover:bg-slate-700/50 transition flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-white"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  <span>Üründen Görsel Seç</span>
                </button>
                <label className="w-full py-3 rounded-lg border-2 border-dashed border-slate-600 hover:border-indigo-500 hover:bg-slate-700/50 transition flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-white cursor-pointer">
                  {uploading ? 'Yükleniyor...' : 'Veya Bilgisayardan Yükle'}
                  <input type="file" className="hidden" accept="image/*" onChange={handleDirectImageUpload} disabled={uploading} />
                </label>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">Bu görsel Lookbook arka planı olarak kullanılacaktır.</p>
          </div>
        </div>

        {/* Right Col: Editor */}
        <div className={`lg:col-span-2 ${activeTab === 'details' ? 'hidden lg:block' : ''}`}>
           {selectedImage ? (
             <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-full flex flex-col">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-medium text-white">Görsel Düzenleyici</h3>
                 <p className="text-xs text-slate-400">Nokta eklemek için görselin üzerine tıklayın.</p>
               </div>

               <div className="relative flex-1 bg-slate-900 rounded-lg overflow-hidden border border-slate-600 select-none">
                 <div 
                  ref={imageContainerRef}
                  className="relative w-full h-full cursor-crosshair"
                  onClick={handleImageClick}
                 >
                    <Image 
                      src={getFeatureImageUrl(selectedImage)} 
                      alt="Editor" 
                      fill 
                      className="object-contain"
                    />
                    
                    {/* Render Pins */}
                    {pins.map((pin, idx) => (
                      <div
                        key={idx}
                        className="absolute w-6 h-6 -ml-3 -mt-3 bg-white rounded-full shadow-lg border-2 border-indigo-600 flex items-center justify-center transform hover:scale-110 transition z-10"
                        style={{ left: `${pin.xPosition}%`, top: `${pin.yPosition}%` }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentPinIndex(idx)
                          setIsProductModalOpen(true)
                          // Trigger search if it has a product to show context? No need, just show select modal
                        }}
                      >
                         <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                         
                         {/* Tooltip on Hover */}
                         <div className="absolute bottom-full mb-2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 pointer-events-none">
                           {pin.furniture?.furnitureName || pin.furnitureSet?.setName || 'Ürün seçilmedi'}
                         </div>
                      </div>
                    ))}
                 </div>
               </div>

               {/* Pin List */}
               <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                 {pins.map((pin, idx) => (
                   <div key={idx} className="flex items-center gap-2 bg-slate-700/50 p-2 rounded text-sm">
                      <div className="w-4 h-4 bg-white rounded-full border border-indigo-600 flex-shrink-0"></div>
                      <span className="flex-1 truncate text-slate-300">
                        {pin.furniture?.furnitureName || pin.furnitureSet?.setName || <span className="text-red-400">Ürün Seçilmedi</span>}
                      </span>
                      <button onClick={() => setCurrentPinIndex(idx)} className="text-indigo-400 hover:text-indigo-300 px-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>
                      <button onClick={() => removePin(idx)} className="text-red-400 hover:text-red-300 px-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                   </div>
                 ))}
               </div>
             </div>
           ) : (
             <div className="bg-slate-800 p-12 rounded-xl border border-slate-700 text-center text-slate-500 flex flex-col items-center justify-center h-full min-h-[400px]">
               <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
               <p>Önce sol taraftan bir görsel seçin.</p>
             </div>
           )}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Image Selection Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-700 flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h3 className="font-bold text-white">Görsel Seç</h3>
              <button onClick={() => setIsImageModalOpen(false)} className="text-slate-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar: Product Search */}
              <div className="w-1/3 border-r border-slate-700 flex flex-col bg-slate-900/30">
                <div className="p-3 border-b border-slate-700">
                  <input 
                    type="text" 
                    placeholder="Ürün ara..." 
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                    value={imageSearchQuery}
                    onChange={handleImageSearch}
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {imageSearchResults.map((item, idx) => (
                    <button 
                      key={idx}
                      onClick={() => fetchProductImages(item)}
                      className={`w-full text-left p-3 hover:bg-slate-700 border-b border-slate-700/50 transition flex flex-col ${selectedProductForImages?.furnitureId === item.furnitureId || selectedProductForImages?.setId === item.setId ? 'bg-indigo-900/30 border-l-4 border-l-indigo-500' : ''}`}
                    >
                      <span className="font-medium text-slate-200 text-sm">{item.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{item.label}</span>
                    </button>
                  ))}
                  {imageSearchResults.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-500">Aramaya başlayın...</div>
                  )}
                </div>
              </div>

              {/* Main: Images Grid */}
              <div className="flex-1 p-4 overflow-y-auto bg-slate-900/50">
                {selectedProductForImages ? (
                   <div>
                     <h4 className="mb-4 text-sm font-medium text-slate-300">{selectedProductForImages.name} Görselleri</h4>
                     <div className="grid grid-cols-3 gap-4">
                       {selectedProductImages.length > 0 ? selectedProductImages.map((img) => (
                         <div 
                          key={img.imageId} 
                          className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-indigo-500 cursor-pointer group"
                          onClick={() => {
                            setSelectedImage(img)
                            setIsImageModalOpen(false)
                          }}
                         >
                          <Image src={toPublicUrl(img.filePath)} alt="Select" fill className="object-cover" />
                           <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition"></div>
                         </div>
                       )) : (
                         <div className="col-span-3 text-center text-slate-500 py-8">Görsel bulunamadı.</div>
                       )}
                     </div>
                   </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    Soldan bir ürün seçin.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Product Selection Modal (For Pins) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
             <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h3 className="font-bold text-white">Nokta İçin Ürün Seç</h3>
              <button 
                onClick={() => {
                  setIsProductModalOpen(false)
                  // If new pin and no product selected, maybe remove pin? 
                  // For now, let keep it unlinked or user deletes manually.
                }} 
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="p-4">
              <input 
                type="text" 
                placeholder="Ürün adı ara..." 
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-indigo-500 outline-none mb-4"
                value={productSearchQuery}
                onChange={handleProductSearch}
                autoFocus
              />

              <div className="max-h-64 overflow-y-auto space-y-1">
                 {productSearchResults.map((item, idx) => (
                    <button 
                      key={idx}
                      onClick={() => updatePinProduct(item)}
                      className="w-full text-left p-3 hover:bg-slate-700 rounded-lg transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-medium text-slate-200">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.label}</div>
                      </div>
                      <div className="text-indigo-400 opacity-0 group-hover:opacity-100">Seç</div>
                    </button>
                  ))}
                  {productSearchResults.length === 0 && productSearchQuery && (
                    <div className="text-center text-slate-500 py-4">Sonuç bulunamadı.</div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}