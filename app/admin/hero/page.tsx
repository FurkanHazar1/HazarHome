'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function HeroManagement() {
  const [slides, setSlides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [currentSlide, setCurrentSlide] = useState<any>(null)
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    link: '',
    buttonText: 'İncele',
    isActive: true,
    sortOrder: 0,
    imageUrl: '',
    backgroundColor: '#f5f5f5'
  })
  const [uploading, setUploading] = useState(false)

  // Product Selector States
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [loadingProducts, setLoadingProducts] = useState(false)

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?flat=true&limit=1000')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data)
      } else if (Array.isArray(data)) {
        setCategories(data)
      }
    } catch (error) {
      console.error('Failed to fetch categories', error)
    }
  }

  const fetchProducts = async (searchQuery = '', categoryId = '') => {
    try {
      setLoadingProducts(true)
      const queryParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
      const catParam = categoryId ? `&categoryId=${categoryId}` : ''
      const limit = searchQuery || categoryId ? 20 : 50 

      const [furnRes, setsRes] = await Promise.all([
        fetch(`/api/furniture?limit=${limit}&includeDetails=true${queryParam}${catParam}`),
        fetch(`/api/furniture-sets?limit=${limit}&includeDetails=true${queryParam}${catParam}`)
      ])

      const furnData = await furnRes.json()
      const setsData = await setsRes.json()

      const combinedProducts = []

      if (furnData.success) {
        combinedProducts.push(...furnData.data.map((item: any) => ({
          ...item,
          type: 'furniture',
          displayName: item.furnitureName, 
          categoryName: item.category?.categoryName
        })))
      }

      if (setsData.success) {
        combinedProducts.push(...setsData.data.map((item: any) => ({
          ...item,
          type: 'set',
          furnitureId: item.setId, 
          furnitureName: item.setName, 
          displayName: item.setName,
          categoryName: item.category?.categoryName,
          images: item.furnitureSetImages?.map((img: any) => ({ image: img.image })) || []
        })))
      }

      setProducts(combinedProducts)
    } catch (error) {
      console.error('Failed to fetch products', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => {
    if (showProductSelector) {
        fetchProducts(productSearch, selectedCategory)
    }
  }, [showProductSelector, productSearch, selectedCategory])

  useEffect(() => {
    fetchSlides()
    fetchCategories()
  }, [])

  const fetchSlides = async () => {
    try {
      const res = await fetch('/api/hero')
      const data = await res.json()
      setSlides(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch slides', error)
      setLoading(false)
    }
  }

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageUpload = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'hero')

    try {
      const res = await fetch('/api/images', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      
      if (data.success) {
        setFormData(prev => ({ ...prev, imageUrl: data.image.filePath }))
      }
    } catch (error) {
      console.error('Image upload failed', error)
      alert('Resim yüklenemedi')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    try {
      const url = isEditing 
        ? `/api/hero/${currentSlide.id}`
        : '/api/hero'
      
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        fetchSlides()
        resetForm()
      } else {
        alert('İşlem başarısız oldu')
      }
    } catch (error) {
      console.error('Submit error', error)
    }
  }

  const handleEdit = (slide: any) => {
    setIsEditing(true)
    setCurrentSlide(slide)
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || '',
      link: slide.link,
      buttonText: slide.buttonText,
      isActive: slide.isActive,
      sortOrder: slide.sortOrder,
      imageUrl: slide.imageUrl,
      backgroundColor: slide.backgroundColor || '#f5f5f5'
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: any) => {
    if (!confirm('Bu slaytı silmek istediğinize emin misiniz?')) return

    try {
      const res = await fetch(`/api/hero/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchSlides()
      }
    } catch (error) {
      console.error('Delete error', error)
    }
  }

  const resetForm = () => {
    setIsEditing(false)
    setCurrentSlide(null)
    setFormData({
      title: '',
      subtitle: '',
      link: '',
      buttonText: 'İncele',
      isActive: true,
      sortOrder: 0,
      imageUrl: '',
      backgroundColor: '#f5f5f5'
    })
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Yükleniyor...</div>

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Hero Slider Yönetimi</h1>
          <p className="text-slate-400 text-sm">Ana sayfa slider alanını buradan yönetebilirsiniz.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              {isEditing ? <span className="text-blue-400">✏️</span> : <span className="text-emerald-400">✨</span>}
              {isEditing ? 'Slaytı Düzenle' : 'Yeni Slayt Ekle'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Başlık</label>
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Büyük başlık..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Alt Başlık</label>
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  placeholder="Açıklama metni..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Arkaplan Rengi</label>
                <div className="flex gap-3">
                  <div className="relative w-12 h-11 rounded-xl overflow-hidden shadow-inner border border-slate-600">
                     <input
                      type="color"
                      className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer p-0 m-0"
                      name="backgroundColor"
                      value={formData.backgroundColor}
                      onChange={handleInputChange}
                    />
                  </div>
                  <input 
                     type="text"
                     className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition font-mono uppercase"
                     name="backgroundColor"
                     value={formData.backgroundColor}
                     onChange={handleInputChange}
                     placeholder="#f5f5f5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Yönlendirme Linki</label>
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  required
                  placeholder="/shop/category/..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Buton Metni</label>
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition"
                  name="buttonText"
                  value={formData.buttonText}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Görsel</label>
                
                <div className="space-y-3">
                   <button
                     type="button"
                     onClick={() => setShowProductSelector(true)}
                     className="w-full py-3 px-4 bg-slate-800 border border-slate-600 border-dashed rounded-xl text-slate-300 hover:border-slate-500 hover:bg-slate-700/50 transition flex items-center justify-center gap-2 group"
                   >
                     <span className="text-xl group-hover:scale-110 transition">🖼️</span>
                     <span>Üründen Görsel Seç</span>
                   </button>

                   <input
                        type="file"
                        id="heroImageUpload"
                        className="hidden"
                        onChange={handleImageUpload}
                        accept="image/*"
                   />
                   <label 
                      htmlFor="heroImageUpload"
                      className="w-full py-2 px-4 bg-slate-900 border border-slate-700 rounded-xl text-slate-400 text-sm hover:text-white hover:border-slate-600 transition cursor-pointer flex items-center justify-center gap-2"
                   >
                      <span>Veya bilgisayardan yükle</span>
                   </label>
                </div>

                {formData.imageUrl && (
                    <div className="mt-4 relative w-full aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                      <Image 
                        src={formData.imageUrl.startsWith('/') ? formData.imageUrl : `/${formData.imageUrl}`}
                        alt="Preview" 
                        fill 
                        className="object-cover"
                      />
                      <button 
                        type="button" 
                        onClick={() => setFormData(p => ({...p, imageUrl: ''}))}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-red-500/80 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm z-20"
                      >
                        ✕
                      </button>
                    </div>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Sıralama</label>
                  <input
                    type="number"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleInputChange}
                  />
                </div>
                
                 <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Durum</label>
                   <label className="flex items-center gap-3 p-2.5 bg-slate-900 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-800 transition">
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </div>
                      <span className="text-sm text-slate-300">{formData.isActive ? 'Aktif' : 'Pasif'}</span>
                   </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="submit" 
                  disabled={!formData.imageUrl}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 ${
                    isEditing 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/20' 
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-emerald-500/20'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isEditing ? 'Değişiklikleri Kaydet' : 'Slaytı Ekle'}
                </button>
                {isEditing && (
                  <button 
                    type="button" 
                    className="py-3 px-4 rounded-xl font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 hover:text-white transition-all"
                    onClick={resetForm}
                  >
                    İptal
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Product Selector Modal */}
        {showProductSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-4xl max-h-[80vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Ürün Görseli Seç</h3>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowProductSelector(false);
                    setSelectedProduct(null);
                    setProductSearch('');
                  }}
                  className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Product List */}
                <div className="w-full md:w-1/3 border-r border-slate-800 flex flex-col">
                  <div className="p-3 border-b border-slate-800 space-y-2">
                    <input
                      type="text"
                      placeholder="Ürün ara..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                    <select
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="">Tüm Kategoriler</option>
                      {categories.map((cat: any) => (
                        <option key={cat.categoryId} value={cat.categoryId}>
                          {cat.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loadingProducts ? (
                      <div className="text-center p-4 text-slate-500 text-sm">Yükleniyor...</div>
                    ) : (
                      products
                        .map((product: any, idx) => (
                          <div
                            key={`${product.type}-${product.furnitureId || product.setId}-${idx}`}
                            onClick={() => setSelectedProduct(product)}
                            className={`p-3 rounded-lg cursor-pointer transition text-sm flex items-center gap-3 ${
                              (selectedProduct?.furnitureId === product.furnitureId && selectedProduct?.type === product.type)
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <div className="w-10 h-10 rounded bg-slate-700 flex-shrink-0 overflow-hidden relative">
                              {product.images?.[0] ? (
                                <Image
                                  src={product.images[0].image.url || `/${product.images[0].image.filePath}`}
                                  alt={product.displayName}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs">?</div>
                              )}
                            </div>
                            <div className="truncate flex-1">
                              <div className="font-medium truncate">{product.displayName}</div>
                              <div className="text-xs opacity-70 truncate flex items-center gap-2">
                                  <span className={`uppercase text-[10px] px-1.5 py-0.5 rounded ${product.type === 'set' ? 'bg-pink-500/20 text-pink-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                      {product.type === 'set' ? 'Takım' : 'Mobilya'}
                                  </span>
                                  <span>{product.categoryName || 'Kategorisiz'}</span>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Image Grid */}
                <div className="flex-1 bg-slate-950/50 flex flex-col">
                  <div className="p-4 border-b border-slate-800">
                    <h4 className="font-medium text-slate-300">
                      {selectedProduct ? `${selectedProduct.displayName} - Görselleri` : 'Görselleri görüntülemek için bir ürün seçin'}
                    </h4>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    {selectedProduct ? (
                      selectedProduct.images && selectedProduct.images.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {selectedProduct.images.map((imgItem: any) => (
                            <div 
                              key={imgItem.image.imageId}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, imageUrl: imgItem.image.filePath }));
                                setShowProductSelector(false);
                                setSelectedProduct(null);
                              }}
                              className="aspect-video relative rounded-lg overflow-hidden border border-slate-700 cursor-pointer group hover:border-indigo-500 transition"
                            >
                              <Image
                                src={imgItem.image.url || `/${imgItem.image.filePath}`}
                                alt="Product Image"
                                fill
                                className="object-cover group-hover:scale-105 transition duration-500"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                                <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition">Seç</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-slate-500">
                          Bu ürünün hiç görseli yok.
                        </div>
                      )
                    ) : (
                       <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                          <span className="text-4xl">👈</span>
                          <p>Soldaki listeden bir ürün seçin</p>
                       </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List Section */}
        <div className="xl:col-span-2">
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden">
             <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Mevcut Slaytlar</h3>
                <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-700 text-slate-400 border border-slate-600">
                   Toplam: {slides.length}
                </span>
             </div>
             
             {slides.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                   <p className="text-lg mb-2">Henüz hiç slayt eklenmemiş.</p>
                   <p className="text-sm">Soldaki formu kullanarak ilk slaytınızı oluşturun.</p>
                </div>
             ) : (
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-900/50 text-xs uppercase font-semibold text-slate-400">
                         <tr>
                            <th className="px-6 py-4">Görsel</th>
                            <th className="px-6 py-4">Başlık & Alt Başlık</th>
                            <th className="px-6 py-4">Link & Buton</th>
                            <th className="px-6 py-4 text-center">Durum</th>
                            <th className="px-6 py-4 text-center">Sıra</th>
                            <th className="px-6 py-4 text-right">İşlemler</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                         {slides.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-700/20 transition group">
                               <td className="px-6 py-4">
                                  <div className="w-24 h-16 rounded-lg bg-slate-700 relative overflow-hidden border border-slate-600 group-hover:border-slate-500 transition">
                                     {item.imageUrl ? (
                                        <Image
                                           src={`/${item.imageUrl}`}
                                           alt={item.title}
                                           fill
                                           className="object-cover"
                                        />
                                     ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">Yok</div>
                                     )}
                                  </div>
                               </td>
                               <td className="px-6 py-4">
                                  <div className="font-medium text-white mb-1 line-clamp-1">{item.title}</div>
                                  <div className="text-xs text-slate-400 line-clamp-1">{item.subtitle}</div>
                               </td>
                               <td className="px-6 py-4">
                                  <div className="text-sm text-slate-300">{item.buttonText}</div>
                                  <code className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-400 border border-slate-700/50 block mt-1 w-fit max-w-[150px] truncate">
                                     {item.link}
                                  </code>
                               </td>
                               <td className="px-6 py-4 text-center">
                                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${
                                     item.isActive 
                                     ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                     : 'bg-slate-700 text-slate-400 border-slate-600'
                                  }`}>
                                     {item.isActive ? 'Aktif' : 'Pasif'}
                                  </span>
                               </td>
                               <td className="px-6 py-4 text-center font-mono text-slate-400">
                                  {item.sortOrder}
                               </td>
                               <td className="px-6 py-4 text-right space-x-2">
                                  <button
                                     onClick={() => handleEdit(item)}
                                     className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition"
                                     title="Düzenle"
                                  >
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                  </button>
                                  <button
                                     onClick={() => handleDelete(item.id)}
                                     className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                                     title="Sil"
                                  >
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  )
}
