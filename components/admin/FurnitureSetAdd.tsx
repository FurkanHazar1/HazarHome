'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// Types
interface Category {
  categoryId: number
  categoryName: string
  categoryPath: string | null
  categoryLevel: number
  isActive: boolean
}

interface Furniture {
  furnitureId: number
  furnitureName: string
  furnitureType: string
  price: number
  isActive: boolean
  categoryId: number | null
}

interface Color {
  colorId: number
  colorName: string
  colorCode: string | null
  isActive: boolean
}

interface Property {
  propertyId: number
  propertyName: string
  propertyType: string
  isActive: boolean
}

interface FurnitureItem {
  furnitureId: number
  quantity: number
  sortOrder: number
  furniture?: Furniture
}

interface PropertyValue {
  propertyId: number
  propertyValue: string
}

interface ImageFile {
  file: File
  preview: string
  imageType: 'main' | 'gallery'
  sortOrder: number
}

// Icon components
const FurnitureSetIcon = () => <span className="text-2xl">🏠</span>
const FurnitureIcon = () => <span className="text-2xl">🪑</span>
const PlusIcon = () => <span className="text-lg">➕</span>
const LoaderIcon = () => <span className="text-lg animate-spin">⏳</span>
const ImageIcon = () => <span className="text-xl">🖼️</span>
const SaveIcon = () => <span className="text-lg">💾</span>
const BackIcon = () => <span className="text-lg">←</span>
const UpIcon = () => <span className="text-lg">↑</span>
const DownIcon = () => <span className="text-lg">↓</span>
const DragIcon = () => <span className="text-lg">☰</span>
const DeleteIcon = () => <span className="text-lg">🗑️</span>
const MainIcon = () => <span className="text-lg">⭐</span>
const GalleryIcon = () => <span className="text-lg">📸</span>
const SuccessIcon = () => <span className="text-lg">✅</span>
const ColorIcon = () => <span className="text-lg">🎨</span>
const PropertyIcon = () => <span className="text-lg">🏷️</span>
const MoneyIcon = () => <span className="text-lg">💰</span>


const generateImageUrl = (filePath: string): string => {
  if (!filePath) return ''
  const cleanPath = filePath.replace('uploads/', '')
  return `/api/images/serve/${cleanPath}`
}

// API'den gelen image data'yı process etmek için
const processApiImages = (apiImages: any[]): any[] => {
  return apiImages.map(img => ({
    ...img,
    url: img.filePath ? generateImageUrl(img.filePath) : null
  }))
}

export default function FurnitureSetAdd() {
  const router = useRouter()
  
  // Form state
  const [formData, setFormData] = useState({
    setName: '',
    categoryId: '',
    description: '',
    price: '',
    isActive: true
  })

  // Data state
  const [categories, setCategories] = useState<Category[]>([])
  const [furnitureList, setFurnitureList] = useState<Furniture[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  
  // Form selections
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureItem[]>([])
  const [selectedColors, setSelectedColors] = useState<number[]>([])
  const [selectedProperties, setSelectedProperties] = useState<PropertyValue[]>([])
  const [images, setImages] = useState<ImageFile[]>([])
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [success, setSuccess] = useState(false)
  const [showFurnitureModal, setShowFurnitureModal] = useState(false)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true)
        
        // Fetch parent categories (level = 1)
         const categoriesRes = await fetch('/api/categories?level=1&active=true') // UPDATED
      
          const categoriesData = await categoriesRes.json()
          if (categoriesData.success) {
            setCategories(categoriesData.data)
          }

        // Fetch furniture
        const furnitureRes = await fetch('/api/furniture?active=true&limit=100')
        const furnitureData = await furnitureRes.json()
        if (furnitureData.success) {
          setFurnitureList(furnitureData.data)
        }

        // Fetch colors
        const colorsRes = await fetch('/api/colors?active=true')
        const colorsData = await colorsRes.json()
        if (colorsData.success) {
          setColors(colorsData.data)
        }

        // Fetch properties
        const propertiesRes = await fetch('/api/properties?active=true')
        const propertiesData = await propertiesRes.json()
        if (propertiesData.success) {
          setProperties(propertiesData.data)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setErrors({ submit: 'Veriler yüklenemedi. Lütfen sayfayı yenileyin.' })
      } finally {
        setDataLoading(false)
      }
    }

    fetchData()
  }, [])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Add furniture to set
  const addFurniture = (furniture: Furniture) => {
    const exists = selectedFurniture.find(item => item.furnitureId === furniture.furnitureId)
    if (!exists) {
      const newItem: FurnitureItem = {
        furnitureId: furniture.furnitureId,
        quantity: 1,
        sortOrder: selectedFurniture.length + 1,
        furniture
      }
      setSelectedFurniture(prev => [...prev, newItem])
    }
    setShowFurnitureModal(false)
  }

  // Update furniture quantity
  const updateFurnitureQuantity = (furnitureId: number, quantity: number) => {
    if (quantity <= 0) {
      setSelectedFurniture(prev => prev.filter(item => item.furnitureId !== furnitureId))
    } else {
      setSelectedFurniture(prev => 
        prev.map(item => 
          item.furnitureId === furnitureId 
            ? { ...item, quantity }
            : item
        )
      )
    }
  }

  // Handle color selection
  const toggleColor = (colorId: number) => {
    setSelectedColors(prev => 
      prev.includes(colorId) 
        ? prev.filter(id => id !== colorId)
        : [...prev, colorId]
    )
  }

  // Handle property changes
  const updateProperty = (propertyId: number, value: string) => {
    if (!value.trim()) {
      setSelectedProperties(prev => prev.filter(p => p.propertyId !== propertyId))
    } else {
      setSelectedProperties(prev => {
        const exists = prev.find(p => p.propertyId === propertyId)
        if (exists) {
          return prev.map(p => p.propertyId === propertyId ? { ...p, propertyValue: value } : p)
        } else {
          return [...prev, { propertyId, propertyValue: value }]
        }
      })
    }
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    files.forEach((file, index) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, submit: `${file.name} geçerli bir resim dosyası değil.` }))
        return
      }

      // Validate file size (100MB)
      if (file.size > 100 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, submit: `${file.name} dosyası 100MB'dan büyük.` }))
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const newImage: ImageFile = {
          file,
          preview: event.target?.result as string,
          imageType: index === 0 ? 'main' : 'gallery',
          sortOrder: images.length + index + 1
        }
        setImages(prev => [...prev, newImage])
      }
      reader.readAsDataURL(file)
    })

    // Clear input
    e.target.value = ''
  }

  // Remove image
  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index)
      // Reorder sort orders after removal
      return newImages.map((img, i) => ({
        ...img,
        sortOrder: i + 1
      }))
    })
  }

  // Change image type
  const changeImageType = (index: number, imageType: 'main' | 'gallery') => {
    setImages(prev => prev.map((img, i) => {
      if (i === index) {
        return { ...img, imageType }
      }
      // If setting this as main, make other main images gallery
      if (imageType === 'main' && img.imageType === 'main') {
        return { ...img, imageType: 'gallery' }
      }
      return img
    }))
  }

  // Move image up in sort order
  const moveImageUp = (index: number) => {
    if (index === 0) return
    
    setImages(prev => {
      const newImages = [...prev]
      // Swap positions
      const temp = newImages[index]
      newImages[index] = newImages[index - 1]
      newImages[index - 1] = temp
      
      // Update sort orders
      return newImages.map((img, i) => ({
        ...img,
        sortOrder: i + 1
      }))
    })
  }

  // Move image down in sort order
  const moveImageDown = (index: number) => {
    if (index === images.length - 1) return
    
    setImages(prev => {
      const newImages = [...prev]
      // Swap positions
      const temp = newImages[index]
      newImages[index] = newImages[index + 1]
      newImages[index + 1] = temp
      
      // Update sort orders
      return newImages.map((img, i) => ({
        ...img,
        sortOrder: i + 1
      }))
    })
  }

  // Update sort order manually
  const updateSortOrder = (index: number, newSortOrder: number) => {
    if (newSortOrder < 1 || newSortOrder > images.length) return
    
    setImages(prev => {
      const newImages = [...prev]
      const imageToMove = newImages[index]
      
      // Remove from current position
      newImages.splice(index, 1)
      
      // Insert at new position (adjust for 0-based indexing)
      newImages.splice(newSortOrder - 1, 0, imageToMove)
      
      // Update all sort orders
      return newImages.map((img, i) => ({
        ...img,
        sortOrder: i + 1
      }))
    })
  }

  // Validate form
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.setName.trim()) {
      newErrors.setName = 'Takım adı gereklidir'
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Kategori seçimi gereklidir'
    }

    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Geçerli bir fiyat giriniz'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit form
  // 🔧 Mevcut handleSubmit fonksiyonunu şu şekilde güncelle:

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  if (!validateForm()) {
    return
  }

  setLoading(true)
  setErrors({})

  try {
    const submitData = new FormData()
    
    // Basic info
    submitData.append('setName', formData.setName.trim())
    submitData.append('categoryId', formData.categoryId)
    submitData.append('description', formData.description.trim())
    submitData.append('price', formData.price)
    submitData.append('isActive', formData.isActive.toString())
    
    // Furniture items (opsiyonel)
    const furnitureItems = selectedFurniture.map(item => ({
      furnitureId: item.furnitureId,
      quantity: item.quantity,
      sortOrder: item.sortOrder
    }))
    submitData.append('furnitureItems', JSON.stringify(furnitureItems))
    
    // Colors (optional)
    if (selectedColors.length > 0) {
      submitData.append('colorIds', JSON.stringify(selectedColors))
    }
    
    // Properties (optional)
    if (selectedProperties.length > 0) {
      submitData.append('properties', JSON.stringify(selectedProperties))
    }
    
    // Image type mappings
    const imageTypeMappings: {[key: string]: 'main' | 'gallery'} = {}
    images.forEach(img => {
      imageTypeMappings[img.file.name] = img.imageType
    })
    if (Object.keys(imageTypeMappings).length > 0) {
      submitData.append('imageTypeMappings', JSON.stringify(imageTypeMappings))
    }
    
    // Images
    images.forEach(img => {
      submitData.append('images', img.file)
    })

    const response = await fetch('/api/furniture-sets', {
      method: 'POST',
      body: submitData
    })

    const result = await response.json()

    if (result.success) {
      setSuccess(true)
      
      // 🆕 ENHANCED: Image upload sonuçlarını göster
      if (result.imageResults) {
        console.log(`✅ ${result.imageResults.uploaded}/${result.imageResults.total} resim yüklendi`)
        if (result.imageResults.categoryBasedPaths) {
          console.log('📁 Category-based paths:', result.imageResults.categoryBasedPaths)
        }
      }
      
      setTimeout(() => {
        router.push(`/admin/furniture-sets/${result.data.setId}`)
      }, 2000)
    } else {
      // 🆕 ENHANCED: API'den gelen validation errors'ı daha iyi handle et
      if (result.validationErrors && Array.isArray(result.validationErrors)) {
        const newErrors: {[key: string]: string} = {}
        
        result.validationErrors.forEach((error: string) => {
          const errorLower = error.toLowerCase()
          if (errorLower.includes('name') || errorLower.includes('takım')) {
            newErrors.setName = error
          } else if (errorLower.includes('category') || errorLower.includes('kategori')) {
            newErrors.categoryId = error
          } else if (errorLower.includes('price') || errorLower.includes('fiyat')) {
            newErrors.price = error
          } else {
            newErrors.submit = error
          }
        })
        
        setErrors(newErrors)
      } else {
        setErrors({ submit: result.error || 'Mobilya takımı oluşturulamadı' })
      }
    }
  } catch (error) {
    console.error('Submit error:', error)
    
    // 🆕 ENHANCED: Network hatalarını daha spesifik handle et
    if (error instanceof TypeError && error.message.includes('fetch')) {
      setErrors({ submit: 'Bağlantı hatası. İnternet bağlantınızı kontrol edin ve tekrar deneyin.' })
    } else {
      setErrors({ submit: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.' })
    }
  } finally {
    setLoading(false)
  }
}

  // Calculate total price
  const calculateTotalPrice = () => {
    return selectedFurniture.reduce((sum, item) => sum + (Number(item.furniture?.price) || 0) * item.quantity, 0)
  }

  const totalIndividualPrice = calculateTotalPrice()
  const setPrice = parseFloat(formData.price) || 0
  const savings = totalIndividualPrice - setPrice

  // Get selected category details
  const selectedCategory = categories.find(cat => cat.categoryId === parseInt(formData.categoryId))

  // Get selected property details
  const selectedPropertiesWithDetails = selectedProperties.map(sp => {
    const property = properties.find(p => p.propertyId === sp.propertyId)
    return { ...sp, property }
  }).filter(sp => sp.property)

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-green-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
              <SuccessIcon />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Başarılı!</h2>
            <p className="text-green-100">Mobilya takımı başarıyla oluşturuldu.</p>
          </div>
          <div className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <LoaderIcon />
              <span>Yönlendiriliyorsunuz...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FurnitureSetIcon />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Yeni Mobilya Takımı Oluştur
                </h1>
                <p className="text-gray-600 mt-1">
                  Mobilya takımı oluşturun. İsterseniz mobilyalarınızı gruplandırabilirsiniz.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all duration-200"
            >
              <BackIcon />
              <span>Geri</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {dataLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
              <div className="flex items-center space-x-4">
                <LoaderIcon />
                <span className="text-gray-600 font-medium">Veriler yükleniyor...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {errors.submit && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">{errors.submit}</span>
            </div>
          </div>
        )}

        {/* Form */}
        {!dataLoading && (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <span className="text-2xl">📋</span>
                  <span>Temel Bilgiler</span>
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Takım Adı *
                    </label>
                    <input
                      type="text"
                      name="setName"
                      value={formData.setName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.setName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Örn: Modern Salon Takımı"
                      required
                    />
                    {errors.setName && <p className="text-sm text-red-600 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{errors.setName}</span>
                    </p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Kategori *
                    </label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.categoryId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Kategori seçin</option>
                      {categories.map(category => (
                        <option key={category.categoryId} value={category.categoryId}>
                          📁 {category.categoryName}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && <p className="text-sm text-red-600 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{errors.categoryId}</span>
                    </p>}
                    {selectedCategory && (
                      <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-semibold text-blue-700">Kategori:</span>
                            <p className="text-gray-700">{selectedCategory.categoryName}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-blue-700">Seviye:</span>
                            <p className="text-gray-700">{selectedCategory.categoryLevel}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Fiyat (₺) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className={`w-full px-4 py-3 pl-12 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                        required
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-lg">₺</span>
                      </div>
                    </div>
                    {errors.price && <p className="text-sm text-red-600 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{errors.price}</span>
                    </p>}
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Aktif olarak yayınla</span>
                    </label>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Açıklama
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Takım hakkında detaylar..."
                  />
                </div>
              </div>
            </div>

            {/* Furniture Selection */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <FurnitureIcon />
                    <span>Mobilyalar (Opsiyonel)</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowFurnitureModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all duration-200"
                  >
                    <PlusIcon />
                    <span>Mobilya Ekle</span>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {selectedFurniture.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <FurnitureIcon />
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Henüz mobilya eklenmedi</p>
                        <button
                          type="button"
                          onClick={() => setShowFurnitureModal(true)}
                          className="mt-2 text-orange-600 hover:text-orange-800 font-medium"
                        >
                          İlk mobilyayı ekleyin
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedFurniture.map((item, index) => (
                      <div key={item.furnitureId} className="group relative bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{item.furniture?.furnitureName}</h3>
                            <p className="text-sm text-gray-500 mb-2">{item.furniture?.furnitureType}</p>
                            <div className="flex items-center space-x-2">
                              <MoneyIcon />
                              <span className="text-sm text-gray-700">
                                ₺{Number(item.furniture?.price)?.toLocaleString('tr-TR')} × {item.quantity} = 
                                <span className="font-semibold text-green-600 ml-1">
                                  ₺{((Number(item.furniture?.price) || 0) * item.quantity).toLocaleString('tr-TR')}
                                </span>
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-300 p-1">
                              <button
                                type="button"
                                onClick={() => updateFurnitureQuantity(item.furnitureId, item.quantity - 1)}
                                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateFurnitureQuantity(item.furnitureId, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => updateFurnitureQuantity(item.furnitureId, 0)}
                              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all duration-200"
                              title="Mobilyayı kaldır"
                            >
                              <DeleteIcon />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Price Summary - sadece mobilya varsa göster */}
                {selectedFurniture.length > 0 && (
                  <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <h3 className="font-semibold text-green-800 mb-4 flex items-center space-x-2">
                      <MoneyIcon />
                      <span>Fiyat Özeti</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Toplam Mobilya Fiyatı:</span>
                        <span className="font-medium">₺{totalIndividualPrice.toLocaleString('tr-TR')}</span>
                      </div>
                      {setPrice > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">Takım Fiyatı:</span>
                            <span className="font-medium">₺{setPrice.toLocaleString('tr-TR')}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold border-t border-green-300 pt-3">
                            <span className="text-gray-800">{savings > 0 ? 'Tasarruf:' : 'Fark:'}</span>
                            <span className={savings > 0 ? 'text-green-600' : 'text-red-600'}>
                              {savings > 0 ? '-' : '+'}₺{Math.abs(savings).toLocaleString('tr-TR')}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Colors */}
            {colors.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <ColorIcon />
                    <span>Renkler (Opsiyonel)</span>
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {colors.map(color => (
                      <label key={color.colorId} className="group relative cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedColors.includes(color.colorId)}
                          onChange={(e) => toggleColor(color.colorId)}
                          className="sr-only"
                        />
                        <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          selectedColors.includes(color.colorId)
                            ? 'border-purple-500 bg-purple-50 shadow-md transform scale-105'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                              style={{ backgroundColor: color.colorCode || '#ccc' }}
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700">
                                {color.colorName}
                              </span>
                              {color.colorCode && (
                                <p className="text-xs text-gray-500">
                                  {color.colorCode}
                                </p>
                              )}
                            </div>
                          </div>
                          {selectedColors.includes(color.colorId) && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedColors.length > 0 && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                      <p className="text-sm font-medium text-purple-700 flex items-center space-x-2">
                        <span>🎨</span>
                        <span>Seçilen renkler: {selectedColors.length} adet</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Properties */}
            {properties.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <PropertyIcon />
                    <span>Özellikler (Opsiyonel)</span>
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {properties.map(property => {
                      const existingProperty = selectedProperties.find(sp => sp.propertyId === property.propertyId)
                      return (
                        <div key={property.propertyId} className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            {property.propertyName}
                          </label>
                          <input
                            type="text"
                            value={existingProperty?.propertyValue || ''}
                            onChange={(e) => updateProperty(property.propertyId, e.target.value)}
                            placeholder={`${property.propertyName} değeri`}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      )
                    })}
                  </div>
                  {selectedPropertiesWithDetails.length > 0 && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-200">
                      <p className="text-sm font-medium text-green-700 flex items-center space-x-2">
                        <PropertyIcon />
                        <span>Tanımlanan özellikler: {selectedPropertiesWithDetails.length} adet</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Images */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <ImageIcon />
                  <span>Görseller</span>
                </h2>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Görsel Yükle
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Maksimum 100MB, desteklenen formatlar: JPG, PNG, GIF, WebP
                  </p>
                </div>

                {images.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                        <span>📸</span>
                        <span>Yüklenen Görseller ({images.length})</span>
                      </h3>
                      <p className="text-sm text-gray-500">
                        Sürükle-bırak ile sıralayabilirsiniz
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                          {/* Sort Order Badge */}
                          <div className="absolute top-2 right-2 z-10 bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {image.sortOrder}
                          </div>
                          
                          <div className="aspect-square relative">
                            <Image
                              src={image.preview}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700 truncate max-w-[60%]">
                                {image.file.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="text-red-600 hover:text-red-800 transition-colors p-1"
                              >
                                <DeleteIcon />
                              </button>
                            </div>
                            
                            {/* Image Type Buttons */}
                            <div className="flex space-x-2 mb-3">
                              <button
                                type="button"
                                onClick={() => changeImageType(index, 'main')}
                                className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                                  image.imageType === 'main'
                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                <MainIcon />
                                <span>Ana Görsel</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => changeImageType(index, 'gallery')}
                                className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                                  image.imageType === 'gallery'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                <GalleryIcon />
                                <span>Galeri</span>
                              </button>
                            </div>
                            
                            {/* Sort Order Controls */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => moveImageUp(index)}
                                  disabled={index === 0}
                                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Yukarı taşı"
                                >
                                  <UpIcon />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveImageDown(index)}
                                  disabled={index === images.length - 1}
                                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Aşağı taşı"
                                >
                                  <DownIcon />
                                </button>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Sıra:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max={images.length}
                                  value={image.sortOrder}
                                  onChange={(e) => updateSortOrder(index, parseInt(e.target.value))}
                                  className="w-12 px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {images.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <ImageIcon />
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Henüz görsel yüklenmedi</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Yukarıdaki dosya seçici ile görsel ekleyebilirsiniz
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg"
              >
                {loading ? <LoaderIcon /> : <SaveIcon />}
                <span>{loading ? 'Oluşturuluyor...' : 'Takımı Oluştur'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Furniture Selection Modal */}
      {showFurnitureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-96 overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <FurnitureIcon />
                <span>Mobilya Seç</span>
              </h3>
              <button
                onClick={() => setShowFurnitureModal(false)}
                className="text-white hover:text-gray-200 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-80">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {furnitureList
                  .filter(furniture => !selectedFurniture.find(item => item.furnitureId === furniture.furnitureId))
                  .map(furniture => (
                  <div
                    key={furniture.furnitureId}
                    className="group border border-gray-200 rounded-xl p-4 hover:border-orange-500 hover:shadow-md cursor-pointer transition-all duration-200 bg-gradient-to-r from-white to-gray-50"
                    onClick={() => addFurniture(furniture)}
                  >
                    <h4 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {furniture.furnitureName}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">{furniture.furnitureType}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <MoneyIcon />
                      <span className="text-sm font-medium text-green-600">
                        ₺{Number(furniture.price).toLocaleString('tr-TR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}