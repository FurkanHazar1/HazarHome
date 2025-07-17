'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// FIXED: Standardized TypeScript interfaces
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

// FIXED: Unified property structure
interface FurnitureProperty {
  propertyId: number
  propertyValue: string
  isActive?: boolean
  property?: Property
}

// FIXED: Unified image structure compatible with management
interface FurnitureImage {
  file?: File
  preview?: string
  imageType: 'main_image' | 'gallery' // FIXED: Changed from 'main' to 'main_image'
  name: string
  sortOrder: number
  fileName?: string
  filePath?: string
  altText?: string
  isActive?: boolean
}

interface FurnitureFormData {
  furnitureName: string
  furnitureType: string
  categoryId: number | null
  description: string
  price: string
  isActive: boolean
  colorIds: number[]
  properties: FurnitureProperty[] // FIXED: Updated interface
}

// FIXED: Standardized API response interface
interface ApiResponse {
  success: boolean
  data?: any
  error?: string
  message?: string
  validationErrors?: string[]
}

// Icon components (keeping existing ones)
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

export default function FurnitureAdd() {
  const router = useRouter()
  
  // State management
  const [formData, setFormData] = useState<FurnitureFormData>({
    furnitureName: '',
    furnitureType: '',
    categoryId: null,
    description: '',
    price: '',
    isActive: true,
    colorIds: [],
    properties: []
  })
  
  const [categories, setCategories] = useState<Category[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [images, setImages] = useState<FurnitureImage[]>([])
  
  const [loading, setLoading] = useState<boolean>(false)
  const [dataLoading, setDataLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // FIXED: Enhanced data loading with better error handling
  const loadInitialData = async () => {
    try {
      setDataLoading(true)
      
      const [categoriesRes, propertiesRes, colorsRes] = await Promise.all([
        fetch('/api/categories?includeHierarchy=true'), // FIXED: Added query param for consistency
        fetch('/api/properties?includeActive=true'), // FIXED: Added query param
        fetch('/api/colors?includeActive=true') // FIXED: Added query param
      ])

      if (!categoriesRes.ok || !propertiesRes.ok || !colorsRes.ok) {
        throw new Error('Failed to load data')
      }

      const [categoriesData, propertiesData, colorsData] = await Promise.all([
        categoriesRes.json(),
        propertiesRes.json(),
        colorsRes.json()
      ])

      // FIXED: Handle both flat and hierarchical responses
      const flattenedCategories: Category[] = []
      
      if (categoriesData.success && categoriesData.data) {
        categoriesData.data.forEach((parentCategory: any) => {
          if (parentCategory.isActive) {
            // Add parent category (level 1)
            flattenedCategories.push({
              categoryId: parentCategory.categoryId,
              categoryName: parentCategory.categoryName,
              categoryPath: parentCategory.categoryPath,
              categoryLevel: parentCategory.categoryLevel || 1,
              isActive: parentCategory.isActive,
              parent: parentCategory.parent
            })
            
            // Add children categories (level 2)
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
      
      // FIXED: Handle API response format consistency
      setProperties(
        (propertiesData.success ? propertiesData.data : propertiesData)
          ?.filter((prop: Property) => prop.isActive) || []
      )
      setColors(
        (colorsData.success ? colorsData.data : colorsData)
          ?.filter((color: Color) => color.isActive) || []
      )
      
    } catch (err) {
      console.error('Data loading error:', err)
      setError('Veriler yüklenemedi. Lütfen sayfayı yenileyin.')
    } finally {
      setDataLoading(false)
    }
  }

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else if (name === 'categoryId') {
      setFormData(prev => ({
        ...prev,
        categoryId: value ? parseInt(value) : null
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  // Handle color selection
  const handleColorChange = (colorId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      colorIds: checked 
        ? [...prev.colorIds, colorId]
        : prev.colorIds.filter(id => id !== colorId)
    }))
  }

  // FIXED: Updated property handling to match management component
  const addProperty = (propertyId: number) => {
    const property = properties.find(p => p.propertyId === propertyId)
    if (!property) return
    
    // Check if already added
    if (formData.properties.some(p => p.propertyId === propertyId)) {
      setError(`"${property.propertyName}" özelliği zaten eklenmiş`)
      return
    }
    
    setFormData(prev => ({
      ...prev,
      properties: [...prev.properties, { 
        propertyId, 
        propertyValue: '',
        isActive: true,
        property 
      }]
    }))
  }

  // Remove property from form
  const removeProperty = (propertyId: number) => {
    setFormData(prev => ({
      ...prev,
      properties: prev.properties.filter(p => p.propertyId !== propertyId)
    }))
  }

  // Handle property changes
  const handlePropertyChange = (propertyId: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      properties: prev.properties.map(p => 
        p.propertyId === propertyId ? { ...p, propertyValue: value } : p
      )
    }))
  }

  // FIXED: Enhanced image upload handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    files.forEach(file => {
      if (file.size > 100 * 1024 * 1024) { // 100MB
        setError(`File ${file.name} is too large (max 100MB)`)
        return
      }

      if (!file.type.startsWith('image/')) {
        setError(`File ${file.name} is not an image`)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const newImage: FurnitureImage = {
          file,
          preview: e.target?.result as string,
          imageType: images.length === 0 ? 'main_image' : 'gallery', // FIXED: Use 'main_image'
          name: file.name,
          sortOrder: images.length + 1,
          fileName: file.name,
          altText: formData.furnitureName || file.name,
          isActive: true
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
      // Reorder sortOrder after removal
      return newImages.map((img, i) => ({
        ...img,
        sortOrder: i + 1
      }))
    })
  }

  // FIXED: Updated image type handling
  const changeImageType = (index: number, type: 'main_image' | 'gallery') => {
    setImages(prev => prev.map((img, i) => {
      if (i === index) {
        return { ...img, imageType: type }
      }
      // If setting this as main, make other main images gallery
      if (type === 'main_image' && img.imageType === 'main_image') {
        return { ...img, imageType: 'gallery' }
      }
      return img
    }))
  }

  // Move image up in order
  const moveImageUp = (index: number) => {
    if (index === 0) return
    
    setImages(prev => {
      const newImages = [...prev]
      const temp = newImages[index]
      newImages[index] = newImages[index - 1]
      newImages[index - 1] = temp
      
      // Update sortOrder
      return newImages.map((img, i) => ({
        ...img,
        sortOrder: i + 1
      }))
    })
  }

  // Move image down in order
  const moveImageDown = (index: number) => {
    if (index === images.length - 1) return
    
    setImages(prev => {
      const newImages = [...prev]
      const temp = newImages[index]
      newImages[index] = newImages[index + 1]
      newImages[index + 1] = temp
      
      // Update sortOrder
      return newImages.map((img, i) => ({
        ...img,
        sortOrder: i + 1
      }))
    })
  }

  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
    
    if (dragIndex === dropIndex) return
    
    setImages(prev => {
      const newImages = [...prev]
      const draggedImage = newImages[dragIndex]
      
      // Remove dragged image
      newImages.splice(dragIndex, 1)
      
      // Insert at new position
      newImages.splice(dropIndex, 0, draggedImage)
      
      // Update sortOrder
      return newImages.map((img, i) => ({
        ...img,
        sortOrder: i + 1
      }))
    })
  }

  // Set custom sort order
  const setCustomSortOrder = (index: number, newOrder: number) => {
    if (newOrder < 1 || newOrder > images.length) return
    
    setImages(prev => {
      const newImages = [...prev]
      const targetImage = newImages[index]
      
      // Remove from current position
      newImages.splice(index, 1)
      
      // Insert at new position (newOrder - 1 because array is 0-indexed)
      newImages.splice(newOrder - 1, 0, targetImage)
      
      // Update sortOrder
      return newImages.map((img, i) => ({
        ...img,
        sortOrder: i + 1
      }))
    })
  }

  // FIXED: Enhanced validation
  const validateForm = (): boolean => {
    const errors: string[] = []

    if (!formData.furnitureName.trim()) {
      errors.push('Mobilya adı zorunludur')
    }

    if (!formData.furnitureType.trim()) {
      errors.push('Mobilya tipi zorunludur')
    }

    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      errors.push('Geçerli bir fiyat giriniz')
    }

    if (!formData.categoryId) {
      errors.push('Kategori seçimi zorunludur')
    }

    // FIXED: Check if at least one main image exists
    const hasMainImage = images.some(img => img.imageType === 'main_image')
    if (images.length > 0 && !hasMainImage) {
      // Auto-assign first image as main if none selected
      setImages(prev => prev.map((img, index) => ({
        ...img,
        imageType: index === 0 ? 'main_image' : 'gallery'
      })))
    }

    if (errors.length > 0) {
      setError(errors.join(', '))
      return false
    }

    return true
  }

  // FIXED: Enhanced form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const formDataToSend = new FormData()
      
      // Add furniture data
      formDataToSend.append('furnitureName', formData.furnitureName)
      formDataToSend.append('furnitureType', formData.furnitureType)
      formDataToSend.append('categoryId', formData.categoryId?.toString() || '')
      formDataToSend.append('description', formData.description)
      formDataToSend.append('price', formData.price)
      formDataToSend.append('isActive', formData.isActive.toString())
      
      // Add colors (optional)
      if (formData.colorIds.length > 0) {
        formDataToSend.append('colorIds', JSON.stringify(formData.colorIds))
      }
      
      // FIXED: Properties with proper structure
      if (formData.properties.length > 0) {
        const propertiesData = formData.properties.map(p => ({
          propertyId: p.propertyId,
          propertyValue: p.propertyValue,
          isActive: p.isActive ?? true
        }))
        formDataToSend.append('properties', JSON.stringify(propertiesData))
      }
      
      // FIXED: Image handling with proper mapping
      const imageTypeMappings: { [key: string]: string } = {}
      const imageSortOrders: { [key: string]: number } = {}
      
      images.forEach(img => {
        imageTypeMappings[img.name] = img.imageType
        imageSortOrders[img.name] = img.sortOrder
      })
      
      formDataToSend.append('imageTypeMappings', JSON.stringify(imageTypeMappings))
      formDataToSend.append('imageSortOrders', JSON.stringify(imageSortOrders))
      
      // Add image files in sort order
      const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder)
      sortedImages.forEach(img => {
        if (img.file) {
          formDataToSend.append('images', img.file)
        }
      })

      const response = await fetch('/api/furniture', {
        method: 'POST',
        body: formDataToSend
      })

      const result: ApiResponse = await response.json()

      if (result.success) {
        setSuccess('✅ Mobilya başarıyla eklendi!')
        setTimeout(() => {
          // FIXED: Enhanced navigation with success indicator
          router.push(`/admin/furniture?newItem=${result.data?.furnitureId || 'new'}&success=true`)
        }, 1500)
      } else {
        setError(result.error || result.message || 'Mobilya eklenemedi')
        if (result.validationErrors && result.validationErrors.length > 0) {
          setError(result.validationErrors.join(', '))
        }
      }

    } catch (err) {
      console.error('Submit error:', err)
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  // FIXED: Enhanced property grouping
  const propertiesByType = properties.reduce((acc, prop) => {
    if (!acc[prop.propertyType]) {
      acc[prop.propertyType] = []
    }
    acc[prop.propertyType].push(prop)
    return acc
  }, {} as { [key: string]: Property[] })

  // Get selected properties with their details
  const selectedProperties = formData.properties.map(fp => {
    const property = fp.property || properties.find(p => p.propertyId === fp.propertyId)
    return {
      ...fp,
      property: property!
    }
  }).filter(sp => sp.property) // Filter out properties that might not exist

  // Get available properties (not yet selected)
  const availableProperties = properties.filter(
    prop => !formData.properties.some(fp => fp.propertyId === prop.propertyId)
  )

  // Get selected category
  const selectedCategory = categories.find(cat => cat.categoryId === formData.categoryId)

  // FIXED: Clear error and success messages after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  return (
<div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FurnitureIcon />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Yeni Mobilya Ekle
                </h1>
                <p className="text-gray-600 mt-1">
                  Mobilya kataloğuna yeni ürün ekleyin
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
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Success State */}
        {success && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6 shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-xl">✅</span>
              <span className="font-medium">{success}</span>
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
                      Mobilya Adı *
                    </label>
                    <input
                      type="text"
                      name="furnitureName"
                      value={formData.furnitureName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Örn: Modern Koltuk"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Mobilya Tipi *
                    </label>
                    <input
                      type="text"
                      name="furnitureType"
                      value={formData.furnitureType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Örn: Koltuk, Masa, Sandalye"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Kategori *
                    </label>
                    <select
                      name="categoryId"
                      value={formData.categoryId || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    >
                      <option value="">Kategori Seçiniz</option>
                      {categories.map(category => (
                        <option key={category.categoryId} value={category.categoryId}>
                          {category.categoryLevel === 1 
                            ? `📁 ${category.categoryName}` 
                            : `   └── ${category.categoryName}`
                          }
                        </option>
                      ))}
                    </select>
                    {selectedCategory && (
                      <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="font-semibold text-blue-700">Kategori:</span>
                            <p className="text-gray-700">{selectedCategory.categoryName}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-blue-700">Seviye:</span>
                            <p className="text-gray-700">{selectedCategory.categoryLevel}</p>
                          </div>
                          {selectedCategory.categoryPath && (
                            <div>
                              <span className="font-semibold text-blue-700">Path:</span>
                              <p className="text-gray-700 truncate">{selectedCategory.categoryPath}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Fiyat (TL) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 pl-12 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-lg">₺</span>
                      </div>
                    </div>
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
                    placeholder="Mobilya hakkında detaylı bilgi..."
                  />
                </div>

                <div className="mt-6">
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
            </div>

            {/* Colors */}
            {colors.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <span className="text-2xl">🎨</span>
                    <span>Renkler (Opsiyonel)</span>
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {colors.map(color => (
                      <label key={color.colorId} className="group relative">
                        <input
                          type="checkbox"
                          checked={formData.colorIds.includes(color.colorId)}
                          onChange={(e) => handleColorChange(color.colorId, e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                          formData.colorIds.includes(color.colorId)
                            ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                              style={{ backgroundColor: color.colorCode }}
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700">
                                {color.colorName}
                              </span>
                              <p className="text-xs text-gray-500">
                                {color.colorCode}
                              </p>
                            </div>
                          </div>
                          {formData.colorIds.includes(color.colorId) && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  {formData.colorIds.length > 0 && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <p className="text-sm font-medium text-blue-700">
                        Seçilen renkler: {formData.colorIds.length} adet
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
                    <span className="text-2xl">🏷️</span>
                    <span>Özellikler</span>
                  </h2>
                </div>
                
                <div className="p-6">
                  {/* Add Property Section */}
                  <div className="mb-8">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                          <PlusIcon />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">Özellik Ekle</h3>
                          <p className="text-sm text-gray-600">Mobilyaya özel özellikler ekleyin</p>
                        </div>
                      </div>
                      
                      <select
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                        onChange={(e) => {
                          if (e.target.value) {
                            addProperty(parseInt(e.target.value))
                            e.target.value = '' // Reset select
                          }
                        }}
                      >
                        <option value="">Özellik seçiniz</option>
                        {Object.entries(propertiesByType).map(([type, props]) => (
                          <optgroup key={type} label={`📁 ${type.charAt(0).toUpperCase() + type.slice(1)}`}>
                            {props.filter(prop => availableProperties.includes(prop)).map(property => (
                              <option key={property.propertyId} value={property.propertyId}>
                                {property.propertyName}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      
                      {availableProperties.length === 0 && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-green-700 font-medium flex items-center space-x-2">
                            <span>✅</span>
                            <span>Tüm özellikler eklenmiş</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Selected Properties */}
                    {selectedProperties.length > 0 && (
                      <div className="space-y-6 mt-8">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                            <span>📋</span>
                            <span>Seçilen Özellikler</span>
                          </h3>
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            {selectedProperties.length} özellik
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {selectedProperties.map((selectedProp) => (
                            <div key={selectedProp.propertyId} className="group relative bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="font-semibold text-gray-800">
                                      {selectedProp.property.propertyName}
                                    </h4>
                                    <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full border border-blue-200">
                                      {selectedProp.property.propertyType}
                                    </span>
                                  </div>
                                  {selectedProp.property.description && (
                                    <p className="text-xs text-gray-500 mb-3">
                                      {selectedProp.property.description}
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeProperty(selectedProp.propertyId)}
                                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  title="Özelliği kaldır"
                                >
                                  <DeleteIcon />
                                </button>
                              </div>
                              
                              <input
                                type="text"
                                value={selectedProp.propertyValue}
                                onChange={(e) => handlePropertyChange(selectedProp.propertyId, e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                placeholder={selectedProp.property.description || `${selectedProp.property.propertyName} değeri`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedProperties.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 mt-8">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-3xl">🏷️</span>
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium">Henüz özellik eklenmedi</p>
                            <p className="text-sm text-gray-400 mt-1">
                              Yukarıdaki dropdown'dan özellik ekleyebilirsiniz
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Images */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <span className="text-2xl">🖼️</span>
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
                        <div 
                          key={index} 
                          className="relative border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow"
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                        >
                          {/* Drag Handle */}
                          <div className="absolute top-2 left-2 z-10 bg-white rounded p-1 shadow-sm cursor-move">
                            <DragIcon />
                          </div>
                          
                          {/* Sort Order Badge */}
                          <div className="absolute top-2 right-2 z-10 bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {image.sortOrder}
                          </div>
                          
                          <div className="aspect-square relative">
                            <Image
                              src={image.preview!}
                              alt={image.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700 truncate max-w-[60%]">
                                {image.name}
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
                                onClick={() => changeImageType(index, 'main_image')}
                                className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                                  image.imageType === 'main_image'
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
                                  onChange={(e) => setCustomSortOrder(index, parseInt(e.target.value))}
                                  className="w-12 px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Quick Sort Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setImages(prev => prev.map((img, i) => ({
                            ...img,
                            sortOrder: i + 1
                          })))
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                      >
                        Sıralamayı Sıfırla
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImages(prev => [...prev].reverse().map((img, i) => ({
                            ...img,
                            sortOrder: i + 1
                          })))
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                      >
                        Sıralamayı Ters Çevir
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImages(prev => prev.map(img => ({
                            ...img,
                            imageType: 'gallery'
                          })))
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                      >
                        Hepsini Galeri Yap
                      </button>
                    </div>
                  </div>
                )}

                {images.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-3xl">🖼️</span>
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
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg"
              >
                {loading ? <LoaderIcon /> : <SaveIcon />}
                <span>{loading ? 'Kaydediliyor...' : 'Mobilya Ekle'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}