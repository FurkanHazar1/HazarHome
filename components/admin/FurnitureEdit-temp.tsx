'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// Type definitions
interface Category {
  categoryId: number
  categoryName: string
  categoryPath: string
  categoryLevel: number
  isActive: boolean
  parent?: {
    categoryId: number
    categoryName: string
  }
}

interface Property {
  propertyId: number
  propertyName: string
  propertyType: string
  description?: string
  isActive: boolean
}

interface Color {
  colorId: number
  colorName: string
  colorCode: string
  isActive: boolean
}

interface FurnitureProperty {
  propertyId: number
  propertyValue: string
  property?: Property
}

interface ExistingImage {
  imageId: number
  fileName: string
  filePath: string
  imageType: 'main_image' | 'gallery'
  sortOrder: number
  altText?: string
  isActive: boolean
}

interface NewImage {
  file: File
  preview: string
  imageType: 'main_image' | 'gallery'
  sortOrder: number
  tempId: string
}

interface FurnitureFormData {
  furnitureName: string
  furnitureType: string
  categoryId: number | null
  description: string
  price: string
  isActive: boolean
}

// Icon components
const LoaderIcon = () => <span className="text-lg animate-spin">⏳</span>
const SaveIcon = () => <span className="text-lg">💾</span>
const DeleteIcon = () => <span className="text-lg">🗑️</span>
const MainIcon = () => <span className="text-lg">⭐</span>
const GalleryIcon = () => <span className="text-lg">📸</span>
const UpIcon = () => <span className="text-lg">↑</span>
const DownIcon = () => <span className="text-lg">↓</span>
const ImageIcon = () => <span className="text-xl">🖼️</span>
const CheckIcon = () => <span className="text-lg">✓</span>

export default function FurnitureEdit({ furnitureId }: { furnitureId: number }) {
  const router = useRouter()
  
  // State management
  const [formData, setFormData] = useState<FurnitureFormData>({
    furnitureName: '',
    furnitureType: '',
    categoryId: null,
    description: '',
    price: '',
    isActive: true
  })
  
  const [categories, setCategories] = useState<Category[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [selectedColors, setSelectedColors] = useState<number[]>([])
  const [selectedProperties, setSelectedProperties] = useState<FurnitureProperty[]>([])
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [newImages, setNewImages] = useState<NewImage[]>([])
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([])
  
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Load furniture data
  const loadFurnitureData = async () => {
    try {
      setLoading(true)
      
      const [furnitureRes, categoriesRes, propertiesRes, colorsRes] = await Promise.all([
        fetch(`/api/furniture/${furnitureId}`),
        fetch('/api/categories'),
        fetch('/api/properties'),
        fetch('/api/colors')
      ])

      if (!furnitureRes.ok) {
        throw new Error('Mobilya verisi yüklenemedi')
      }

      const [furnitureData, categoriesData, propertiesData, colorsData] = await Promise.all([
        furnitureRes.json(),
        categoriesRes.json(),
        propertiesRes.json(),
        colorsRes.json()
      ])

      if (furnitureData.success && furnitureData.data) {
        const furniture = furnitureData.data
        
        setFormData({
          furnitureName: furniture.furnitureName || '',
          furnitureType: furniture.furnitureType || '',
          categoryId: furniture.categoryId || null,
          description: furniture.description || '',
          price: furniture.price?.toString() || '',
          isActive: furniture.isActive !== false
        })

        // Set colors
        if (furniture.colors && furniture.colors.length > 0) {
          setSelectedColors(furniture.colors.map((c: any) => c.colorId))
        }

        // Set properties
        if (furniture.properties && furniture.properties.length > 0) {
          setSelectedProperties(furniture.properties.map((p: any) => ({
            propertyId: p.propertyId,
            propertyValue: p.propertyValue || ''
          })))
        }

        // Set existing images
        if (furniture.images && furniture.images.length > 0) {
          setExistingImages(furniture.images.filter((img: any) => img.isActive))
        }
      }

      // Process categories
      const flattenedCategories: Category[] = []
      if (categoriesData.success && categoriesData.data) {
        categoriesData.data.forEach((parentCategory: any) => {
          if (parentCategory.isActive) {
            flattenedCategories.push({
              categoryId: parentCategory.categoryId,
              categoryName: parentCategory.categoryName,
              categoryPath: parentCategory.categoryPath,
              categoryLevel: parentCategory.categoryLevel || 1,
              isActive: parentCategory.isActive
            })
            
            if (parentCategory.children && parentCategory.children.length > 0) {
              parentCategory.children.forEach((childCategory: any) => {
                if (childCategory.isActive) {
                  flattenedCategories.push({
                    categoryId: childCategory.categoryId,
                    categoryName: childCategory.categoryName,
                    categoryPath: childCategory.categoryPath,
                    categoryLevel: childCategory.categoryLevel || 2,
                    isActive: childCategory.isActive,
                    parent: {
                      categoryId: parentCategory.categoryId,
                      categoryName: parentCategory.categoryName
                    }
                  })
                }
              })
            }
          }
        })
      }

      setCategories(flattenedCategories)
      setProperties((propertiesData.success ? propertiesData.data : propertiesData)?.filter((p: Property) => p.isActive) || [])
      setColors((colorsData.success ? colorsData.data : colorsData)?.filter((c: Color) => c.isActive) || [])
      
    } catch (err) {
      console.error('Error loading data:', err)
      setErrors({ submit: 'Veriler yüklenemedi. Lütfen tekrar deneyin.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (furnitureId) {
      loadFurnitureData()
    }
  }, [furnitureId])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Toggle color selection
  const toggleColor = (colorId: number) => {
    setSelectedColors(prev => 
      prev.includes(colorId) 
        ? prev.filter(id => id !== colorId)
        : [...prev, colorId]
    )
  }

  // Update property value
  const updateProperty = (propertyId: number, value: string) => {
    setSelectedProperties(prev => {
      const existing = prev.find(p => p.propertyId === propertyId)
      if (existing) {
        return prev.map(p => 
          p.propertyId === propertyId 
            ? { ...p, propertyValue: value }
            : p
        )
      } else {
        return [...prev, { propertyId, propertyValue: value }]
      }
    })
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = () => {
          const newImage: NewImage = {
            file,
            preview: reader.result as string,
            imageType: 'gallery',
            sortOrder: existingImages.length + newImages.length + 1,
            tempId: Date.now().toString() + Math.random().toString(36).substr(2, 9)
          }
          setNewImages(prev => [...prev, newImage])
        }
        reader.readAsDataURL(file)
      }
    })
    
    e.target.value = ''
  }

  // Change image type
  const changeImageType = (imageId: number, newType: 'main_image' | 'gallery') => {
    setExistingImages(prev => prev.map(img => 
      img.imageId === imageId ? { ...img, imageType: newType } : img
    ))
  }

  const changeNewImageType = (tempId: string, newType: 'main_image' | 'gallery') => {
    setNewImages(prev => prev.map(img => 
      img.tempId === tempId ? { ...img, imageType: newType } : img
    ))
  }

  // Remove images
  const removeExistingImage = (imageId: number) => {
    setRemovedImageIds(prev => [...prev, imageId])
    setExistingImages(prev => prev.filter(img => img.imageId !== imageId))
  }

  const removeNewImage = (tempId: string) => {
    setNewImages(prev => prev.filter(img => img.tempId !== tempId))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (saving) return
    
    setSaving(true)
    setErrors({})
    
    try {
      const submitFormData = new FormData()
      
      // Add form data
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          submitFormData.append(key, value.toString())
        }
      })
      
      // Add colors
      submitFormData.append('colorIds', JSON.stringify(selectedColors))
      
      // Add properties
      submitFormData.append('properties', JSON.stringify(selectedProperties.filter(p => p.propertyValue.trim() !== '')))
      
      // Add existing images changes
      submitFormData.append('existingImages', JSON.stringify(existingImages))
      submitFormData.append('removedImageIds', JSON.stringify(removedImageIds))
      
      // Add new images
      newImages.forEach((image, index) => {
        submitFormData.append(`newImages`, image.file)
        submitFormData.append(`newImageTypes`, image.imageType)
        submitFormData.append(`newImageSortOrders`, image.sortOrder.toString())
      })
      
      const response = await fetch(`/api/furniture/${furnitureId}`, {
        method: 'PUT',
        body: submitFormData
      })
      
      const result = await response.json()
      
      if (result.success) {
        setTimeout(() => {
          router.push('/admin/furniture')
        }, 1500)
      } else {
        throw new Error(result.message || 'Güncelleme başarısız')
      }
      
    } catch (err: any) {
      console.error('Submit error:', err)
      setErrors({ submit: err.message || 'Güncelleme sırasında hata oluştu' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <LoaderIcon />
          <p className="text-white mt-4">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-sm px-8 py-6 border-b border-white/10">
            <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
              <span className="text-4xl">🪑</span>
              <span>Mobilya Düzenle</span>
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* Basic Information */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600/80 to-purple-600/80 backdrop-blur-sm px-8 py-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <span className="text-3xl">📝</span>
                  <span>Temel Bilgiler</span>
                </h2>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-2">Mobilya Adı *</label>
                    <input
                      type="text"
                      name="furnitureName"
                      value={formData.furnitureName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Mobilya adını girin"
                    />
                    {errors.furnitureName && <p className="text-red-400 text-xs mt-1">{errors.furnitureName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-2">Mobilya Tipi</label>
                    <input
                      type="text"
                      name="furnitureType"
                      value={formData.furnitureType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Örn: Koltuk, Masa, Dolap"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-2">Kategori</label>
                    <select
                      name="categoryId"
                      value={formData.categoryId || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Kategori seçin</option>
                      {categories.map(category => (
                        <option key={category.categoryId} value={category.categoryId} className="bg-gray-800 text-white">
                          {category.categoryLevel === 2 ? '  └─ ' : ''}{category.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-2">Fiyat</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-semibold text-white/90 mb-2">Açıklama</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Mobilya hakkında detayları yazın..."
                  />
                </div>

                <div className="mt-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 bg-white/10 border-white/30 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-white/90">Aktif</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Image Management */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-600/80 to-teal-600/80 backdrop-blur-sm px-8 py-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <ImageIcon />
                  <span>Görsel Yönetimi ({existingImages.length + newImages.length} görsel)</span>
                </h2>
              </div>
              
              <div className="p-8">
                {/* Upload Area */}
                <div className="mb-8">
                  <label className="block w-full cursor-pointer">
                    <div className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center hover:border-white/50 hover:bg-white/5 transition-all duration-200">
                      <ImageIcon />
                      <p className="text-white/80 font-medium mt-2">Yeni görseller eklemek için tıklayın</p>
                      <p className="text-sm text-white/60 mt-1">PNG, JPG, JPEG formatları desteklenir</p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Mevcut Görseller</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {existingImages.map(image => (
                        <div key={image.imageId} className="bg-white/10 rounded-xl overflow-hidden border border-white/20">
                          <div className="relative aspect-video">
                            <Image
                              src={`/api/images/serve/${image.filePath}`}
                              alt={image.altText || 'Mobilya görseli'}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
                              <button
                                type="button"
                                onClick={() => changeImageType(image.imageId, 'main_image')}
                                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                  image.imageType === 'main_image'
                                    ? 'bg-yellow-500 text-black'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                              >
                                <MainIcon /> Ana
                              </button>
                              <button
                                type="button"
                                onClick={() => changeImageType(image.imageId, 'gallery')}
                                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                  image.imageType === 'gallery'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                              >
                                <GalleryIcon /> Galeri
                              </button>
                              <button
                                type="button"
                                onClick={() => removeExistingImage(image.imageId)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium"
                              >
                                <DeleteIcon />
                              </button>
                            </div>
                            {image.imageType === 'main_image' && (
                              <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded-lg text-xs font-bold">
                                ANA
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <p className="text-sm text-white/80 truncate">{image.fileName}</p>
                            <p className="text-xs text-white/60">Sıra: {image.sortOrder}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images */}
                {newImages.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Yeni Görseller</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {newImages.map(image => (
                        <div key={image.tempId} className="bg-white/10 rounded-xl overflow-hidden border border-white/20">
                          <div className="relative aspect-video">
                            <Image
                              src={image.preview}
                              alt="Yeni görsel"
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
                              <button
                                type="button"
                                onClick={() => changeNewImageType(image.tempId, 'main_image')}
                                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                  image.imageType === 'main_image'
                                    ? 'bg-yellow-500 text-black'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                              >
                                <MainIcon /> Ana
                              </button>
                              <button
                                type="button"
                                onClick={() => changeNewImageType(image.tempId, 'gallery')}
                                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                  image.imageType === 'gallery'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                              >
                                <GalleryIcon /> Galeri
                              </button>
                              <button
                                type="button"
                                onClick={() => removeNewImage(image.tempId)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium"
                              >
                                <DeleteIcon />
                              </button>
                            </div>
                            {image.imageType === 'main_image' && (
                              <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded-lg text-xs font-bold">
                                ANA
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <p className="text-sm text-white/80 truncate">{image.file.name}</p>
                            <p className="text-xs text-white/60">Sıra: {image.sortOrder}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {existingImages.length === 0 && newImages.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-white/30 rounded-xl bg-white/5">
                    <ImageIcon />
                    <p className="text-white/80 font-medium mt-2">Henüz görsel yok</p>
                    <p className="text-sm text-white/60 mt-1">Yukarıdaki alanı kullanarak görsel ekleyebilirsiniz</p>
                  </div>
                )}
              </div>
            </div>

            {/* Colors */}
            {colors.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 backdrop-blur-sm px-8 py-6 border-b border-white/10">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                    <span className="text-3xl">🎨</span>
                    <span>Renkler ({selectedColors.length} seçili)</span>
                  </h2>
                </div>
                
                <div className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {colors.map(color => (
                      <label key={color.colorId} className="group relative cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedColors.includes(color.colorId)}
                          onChange={() => toggleColor(color.colorId)}
                          className="sr-only"
                        />
                        <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          selectedColors.includes(color.colorId)
                            ? 'border-purple-400 bg-purple-500/20 shadow-lg transform scale-105'
                            : 'border-white/20 hover:border-white/40 hover:bg-white/10'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-white/50 shadow-md"
                              style={{ backgroundColor: color.colorCode || '#ccc' }}
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-white">
                                {color.colorName}
                              </span>
                              {color.colorCode && (
                                <p className="text-xs text-white/60">
                                  {color.colorCode}
                                </p>
                              )}
                            </div>
                          </div>
                          {selectedColors.includes(color.colorId) && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                              <CheckIcon />
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Properties */}
            {properties.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-600/80 to-teal-600/80 backdrop-blur-sm px-8 py-6 border-b border-white/10">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                    <span className="text-3xl">🏷️</span>
                    <span>Özellikler ({selectedProperties.length} tanımlı)</span>
                  </h2>
                </div>
                
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {properties.map(property => {
                      const existingProperty = selectedProperties.find(sp => sp.propertyId === property.propertyId)
                      return (
                        <div key={property.propertyId} className="space-y-2">
                          <label className="block text-sm font-semibold text-white/90">
                            {property.propertyName}
                            {property.description && (
                              <span className="text-xs text-white/60 ml-2">({property.description})</span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={existingProperty?.propertyValue || ''}
                            onChange={(e) => updateProperty(property.propertyId, e.target.value)}
                            className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            placeholder={`${property.propertyName} değerini girin`}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {errors.submit && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                <p className="text-red-200">{errors.submit}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-between items-center pt-8">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-white/20 text-white/80 rounded-xl hover:bg-white/10 transition-all duration-200 font-medium"
              >
                İptal
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <LoaderIcon />
                    <span>Güncelleniyor...</span>
                  </>
                ) : (
                  <>
                    <SaveIcon />
                    <span>Değişiklikleri Kaydet</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
