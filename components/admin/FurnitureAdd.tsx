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
  imageType: 'main_image' | 'gallery' // FIXED: API expects 'main_image', not 'main'
  name: string
  sortOrder: number
  fileName?: string
  filePath?: string
  altText?: string
  isActive?: boolean
  tempId: string // FIXED: Added unique identifier for tracking
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

// Icon components (updated to match FurnitureSetAdd style)
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
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [success, setSuccess] = useState<boolean>(false)

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
      setErrors({ submit: 'Veriler yüklenemedi. Lütfen sayfayı yenileyin.' })
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

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
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
      setErrors(prev => ({ ...prev, submit: `"${property.propertyName}" özelliği zaten eklenmiş` }))
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

 const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || [])
  
  if (files.length === 0) return

  // Validation
  for (const file of files) {
    if (file.size > 100 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, submit: `File ${file.name} is too large (max 100MB)` }))
      return
    }
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, submit: `File ${file.name} is not an image` }))
      return
    }
  }

  try {
    // Process all files in parallel but update state in batch
    const processedImages = await Promise.all(
      files.map((file, fileIndex) => {
        return new Promise<FurnitureImage>((resolve, reject) => {
          const reader = new FileReader()
          
          reader.onload = (e) => {
            const tempId = `temp_${Date.now()}_${Math.random()}_${fileIndex}`
            
            resolve({
              file,
              preview: e.target?.result as string,
              imageType: 'gallery', // Will be corrected in batch update
              name: file.name,
              sortOrder: fileIndex + 1, // Temporary, will be corrected
              fileName: file.name,
              altText: formData.furnitureName || file.name,
              isActive: true,
              tempId
            })
          }
          
          reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
          reader.readAsDataURL(file)
        })
      })
    )

    // Single state update with correct sort orders
    setImages(prevImages => {
      const currentCount = prevImages.length
      
      const correctedImages = processedImages.map((img, index) => ({
        ...img,
        sortOrder: currentCount + index + 1,
        imageType: (currentCount === 0 && index === 0) ? 'main_image' as const : 'gallery' as const
      }))
      
      return [...prevImages, ...correctedImages]
    })

  } catch (error) {
    setErrors(prev => ({ ...prev, submit: `Error processing images: ${error instanceof Error ? error.message : 'Unknown error'}` }))
  }

  // Clear input
  e.target.value = ''
}

  // Remove image
  const removeImage = (tempId: string) => {
    setImages(prev => {
      const filteredImages = prev.filter(img => img.tempId !== tempId)
      // FIXED: Recalculate sort orders after removal
      return filteredImages.map((img, index) => ({
        ...img,
        sortOrder: index + 1
      }))
    })
  }

  // FIXED: Updated image type handling
  const changeImageType = (tempId: string, type: 'main_image' | 'gallery') => {
    setImages(prev => prev.map(img => {
      if (img.tempId === tempId) {
        return { ...img, imageType: type }
      }
      // FIXED: If setting this as main_image, make other main_image images gallery
      if (type === 'main_image' && img.imageType === 'main_image') {
        return { ...img, imageType: 'gallery' }
      }
      return img
    }))
  }

  // Move image up in order
 const moveImageUp = (tempId: string) => {
    setImages(prev => {
      const currentIndex = prev.findIndex(img => img.tempId === tempId)
      if (currentIndex <= 0) return prev
      
      const newImages = [...prev]
      const temp = newImages[currentIndex]
      newImages[currentIndex] = newImages[currentIndex - 1]
      newImages[currentIndex - 1] = temp
      
      // FIXED: Update sort orders
      return newImages.map((img, index) => ({
        ...img,
        sortOrder: index + 1
      }))
    })
  }

  // Move image down in order
  const moveImageDown = (tempId: string) => {
    setImages(prev => {
      const currentIndex = prev.findIndex(img => img.tempId === tempId)
      if (currentIndex >= prev.length - 1) return prev
      
      const newImages = [...prev]
      const temp = newImages[currentIndex]
      newImages[currentIndex] = newImages[currentIndex + 1]
      newImages[currentIndex + 1] = temp
      
      // FIXED: Update sort orders
      return newImages.map((img, index) => ({
        ...img,
        sortOrder: index + 1
      }))
    })
  }

  // Handle drag and drop
const handleDragStart = (e: React.DragEvent, tempId: string) => {
    e.dataTransfer.setData('text/plain', tempId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropTempId: string) => {
    e.preventDefault()
    const dragTempId = e.dataTransfer.getData('text/plain')
    
    if (dragTempId === dropTempId) return
    
    setImages(prev => {
      const dragIndex = prev.findIndex(img => img.tempId === dragTempId)
      const dropIndex = prev.findIndex(img => img.tempId === dropTempId)
      
      if (dragIndex === -1 || dropIndex === -1) return prev
      
      const newImages = [...prev]
      const draggedImage = newImages[dragIndex]
      
      // Remove dragged image
      newImages.splice(dragIndex, 1)
      
      // Insert at new position
      newImages.splice(dropIndex, 0, draggedImage)
      
      // FIXED: Update sort orders
      return newImages.map((img, index) => ({
        ...img,
        sortOrder: index + 1
      }))
    })
  }

  // Set custom sort order
  const setCustomSortOrder = (tempId: string, newOrder: number) => {
    if (newOrder < 1 || newOrder > images.length) return
    
    setImages(prev => {
      const currentIndex = prev.findIndex(img => img.tempId === tempId)
      if (currentIndex === -1) return prev
      
      const newImages = [...prev]
      const targetImage = newImages[currentIndex]
      
      // Remove from current position
      newImages.splice(currentIndex, 1)
      
      // Insert at new position (newOrder - 1 because array is 0-indexed)
      newImages.splice(newOrder - 1, 0, targetImage)
      
      // FIXED: Update all sort orders
      return newImages.map((img, index) => ({
        ...img,
        sortOrder: index + 1
      }))
    })
  }

  // FIXED: Enhanced validation with image type checking
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.furnitureName.trim()) {
      newErrors.furnitureName = 'Mobilya adı zorunludur'
    }

    if (!formData.furnitureType.trim()) {
      newErrors.furnitureType = 'Mobilya tipi zorunludur'
    }

    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Geçerli bir fiyat giriniz'
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Kategori seçimi zorunludur'
    }

    // FIXED: Check main image requirement
    if (images.length > 0) {
      const hasMainImage = images.some(img => img.imageType === 'main_image')
      if (!hasMainImage) {
        // Auto-assign first image as main if none selected
        setImages(prev => prev.map((img, index) => ({
          ...img,
          imageType: index === 0 ? 'main_image' : 'gallery'
        })))
      }

      // Check for duplicate sort orders (shouldn't happen with fixed logic, but safety check)
      const sortOrders = images.map(img => img.sortOrder)
      const uniqueSortOrders = new Set(sortOrders)
      if (sortOrders.length !== uniqueSortOrders.size) {
        // Fix duplicate sort orders
        setImages(prev => prev.map((img, index) => ({
          ...img,
          sortOrder: index + 1
        })))
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // FIXED: Enhanced form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setErrors({})

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
      
      // FIXED: Image handling with correct API format
      if (images.length > 0) {
        // Sort images by sortOrder before sending
        const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder)
        
        // Create image type mappings using file names as keys
        const imageTypeMappings: { [key: string]: string } = {}
        sortedImages.forEach(img => {
          // API expects 'main' and 'gallery', not 'main_image'
          imageTypeMappings[img.name] = img.imageType === 'main_image' ? 'main' : 'gallery'
        })
        
        formDataToSend.append('imageTypeMappings', JSON.stringify(imageTypeMappings))
        
        // Add image files in correct order
        sortedImages.forEach(img => {
          if (img.file) {
            formDataToSend.append('images', img.file)
          }
        })
      }

      const response = await fetch('/api/furniture', {
        method: 'POST',
        body: formDataToSend
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        
        setTimeout(() => {
          router.push(`/admin/furniture?newItem=${result.data?.furnitureId || 'new'}&success=true`)
        }, 2000)
      } else {
        // ENHANCED: API'den gelen validation errors'ı daha iyi handle et
        if (result.validationErrors && Array.isArray(result.validationErrors)) {
          const newErrors: {[key: string]: string} = {}
          
          result.validationErrors.forEach((error: string) => {
            const errorLower = error.toLowerCase()
            if (errorLower.includes('name') || errorLower.includes('ad')) {
              newErrors.furnitureName = error
            } else if (errorLower.includes('type') || errorLower.includes('tip')) {
              newErrors.furnitureType = error
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
          setErrors({ submit: result.error || result.message || 'Mobilya eklenemedi' })
        }
      }

    } catch (err) {
      console.error('Submit error:', err)
      
      // ENHANCED: Network hatalarını daha spesifik handle et
      if (err instanceof TypeError && (err as TypeError).message.includes('fetch')) {
        setErrors({ submit: 'Bağlantı hatası. İnternet bağlantınızı kontrol edin ve tekrar deneyin.' })
      } else {
        setErrors({ submit: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.' })
      }
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

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl border border-green-600/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <SuccessIcon />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Başarılı!</h2>
            <p className="text-green-100">Mobilya başarıyla eklendi.</p>
          </div>
          <div className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-300">
              <LoaderIcon />
              <span>Yönlendiriliyorsunuz...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
<div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-900">
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile Header */}
          <div className="flex flex-col space-y-4 sm:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <FurnitureIcon />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                    Yeni Mobilya
                  </h1>
                  <p className="text-gray-400 text-sm">
                    Ürün ekleyin
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-all duration-200"
              >
                <BackIcon />
              </button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FurnitureIcon />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  Yeni Mobilya Ekle
                </h1>
                <p className="text-gray-400 mt-1">
                  Mobilya kataloğuna yeni ürün ekleyin
                </p>
              </div>
            </div>
            
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-all duration-200"
            >
              <BackIcon />
              <span>Geri</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {dataLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700">
              <div className="flex items-center space-x-4">
                <LoaderIcon />
                <span className="text-gray-300 font-medium">Veriler yükleniyor...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {errors.submit && (
          <div className="bg-gradient-to-r from-red-900/50 to-red-800/50 border border-red-600/50 text-red-300 px-6 py-4 rounded-xl mb-6 shadow-sm">
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
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <span className="text-2xl">📋</span>
                  <span>Temel Bilgiler</span>
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">
                      Mobilya Adı *
                    </label>
                    <input
                      type="text"
                      name="furnitureName"
                      value={formData.furnitureName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400 ${
                        errors.furnitureName ? 'border-red-500 bg-red-900/20' : 'border-gray-600'
                      }`}
                      placeholder="Örn: Modern Koltuk"
                      required
                    />
                    {errors.furnitureName && <p className="text-sm text-red-400 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{errors.furnitureName}</span>
                    </p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">
                      Mobilya Tipi *
                    </label>
                    <input
                      type="text"
                      name="furnitureType"
                      value={formData.furnitureType}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400 ${
                        errors.furnitureType ? 'border-red-500 bg-red-900/20' : 'border-gray-600'
                      }`}
                      placeholder="Örn: Koltuk, Masa, Sandalye"
                      required
                    />
                    {errors.furnitureType && <p className="text-sm text-red-400 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{errors.furnitureType}</span>
                    </p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">
                      Kategori *
                    </label>
                    <select
                      name="categoryId"
                      value={formData.categoryId || ''}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white ${
                        errors.categoryId ? 'border-red-500 bg-red-900/20' : 'border-gray-600'
                      }`}
                      required
                    >
                      <option value="" className="bg-gray-700">Kategori Seçiniz</option>
                      {categories.map(category => (
                        <option key={category.categoryId} value={category.categoryId} className="bg-gray-700">
                          {category.categoryLevel === 1 
                            ? `📁 ${category.categoryName}` 
                            : `   └── ${category.categoryName}`
                          }
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && <p className="text-sm text-red-400 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{errors.categoryId}</span>
                    </p>}
                    {selectedCategory && (
                      <div className="mt-3 p-4 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-xl border border-blue-600/30">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="font-semibold text-blue-300">Kategori:</span>
                            <p className="text-gray-300">{selectedCategory.categoryName}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-blue-300">Seviye:</span>
                            <p className="text-gray-300">{selectedCategory.categoryLevel}</p>
                          </div>
                          {selectedCategory.categoryPath && (
                            <div>
                              <span className="font-semibold text-blue-300">Path:</span>
                              <p className="text-gray-300 truncate">{selectedCategory.categoryPath}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">
                      Fiyat (TL) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 pl-12 bg-gray-700 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400 ${
                          errors.price ? 'border-red-500 bg-red-900/20' : 'border-gray-600'
                        }`}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-lg">₺</span>
                      </div>
                    </div>
                    {errors.price && <p className="text-sm text-red-400 flex items-center space-x-1">
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
                        className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-300">Aktif olarak yayınla</span>
                    </label>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <label className="block text-sm font-semibold text-gray-300">
                    Açıklama
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-white placeholder-gray-400"
                    placeholder="Mobilya hakkında detaylı bilgi..."
                  />
                </div>
              </div>
            </div>

            {/* Colors */}
            {colors.length > 0 && (
              <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
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
                          checked={formData.colorIds.includes(color.colorId)}
                          onChange={(e) => handleColorChange(color.colorId, e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          formData.colorIds.includes(color.colorId)
                            ? 'border-purple-500 bg-purple-900/30 shadow-md transform scale-105'
                            : 'border-gray-600 hover:border-gray-500 hover:shadow-sm bg-gray-700/50'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-gray-600 shadow-md"
                              style={{ backgroundColor: color.colorCode }}
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-300">
                                {color.colorName}
                              </span>
                              <p className="text-xs text-gray-500">
                                {color.colorCode}
                              </p>
                            </div>
                          </div>
                          {formData.colorIds.includes(color.colorId) && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  {formData.colorIds.length > 0 && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-600/30">
                      <p className="text-sm font-medium text-purple-300 flex items-center space-x-2">
                        <ColorIcon />
                        <span>Seçilen renkler: {formData.colorIds.length} adet</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Properties */}
            {properties.length > 0 && (
              <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <PropertyIcon />
                    <span>Özellikler (Opsiyonel)</span>
                  </h2>
                </div>
                
                <div className="p-6">
                  {/* Add Property Section */}
                  <div className="mb-8">
                    <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-6 border border-gray-600">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                          <PlusIcon />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-200">Özellik Ekle</h3>
                          <p className="text-sm text-gray-400">Mobilyaya özel özellikler ekleyin</p>
                        </div>
                      </div>
                      
                      <select
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-white"
                        onChange={(e) => {
                          if (e.target.value) {
                            addProperty(parseInt(e.target.value))
                            e.target.value = '' // Reset select
                          }
                        }}
                      >
                        <option value="" className="bg-gray-700">Özellik seçiniz</option>
                        {Object.entries(propertiesByType).map(([type, props]) => (
                          <optgroup key={type} label={`📁 ${type.charAt(0).toUpperCase() + type.slice(1)}`}>
                            {props.filter(prop => availableProperties.includes(prop)).map(property => (
                              <option key={property.propertyId} value={property.propertyId} className="bg-gray-700">
                                {property.propertyName}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      
                      {availableProperties.length === 0 && (
                        <div className="mt-4 p-4 bg-green-900/30 rounded-lg border border-green-600/30">
                          <p className="text-sm text-green-300 font-medium flex items-center space-x-2">
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
                          <h3 className="text-lg font-semibold text-gray-200 flex items-center space-x-2">
                            <span>📋</span>
                            <span>Seçilen Özellikler</span>
                          </h3>
                          <span className="px-3 py-1 bg-green-900/30 text-green-300 rounded-full text-sm font-medium border border-green-600/30">
                            {selectedProperties.length} özellik
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {selectedProperties.map((selectedProp) => (
                            <div key={selectedProp.propertyId} className="group relative bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl border border-gray-600 p-5 hover:shadow-md transition-all duration-200">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="font-semibold text-gray-200">
                                      {selectedProp.property.propertyName}
                                    </h4>
                                    <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-900/50 to-indigo-900/50 text-blue-300 rounded-full border border-blue-600/30">
                                      {selectedProp.property.propertyType}
                                    </span>
                                  </div>
                                  {selectedProp.property.description && (
                                    <p className="text-xs text-gray-400 mb-3">
                                      {selectedProp.property.description}
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeProperty(selectedProp.propertyId)}
                                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-lg transition-all duration-200"
                                  title="Özelliği kaldır"
                                >
                                  <DeleteIcon />
                                </button>
                              </div>
                              
                              <input
                                type="text"
                                value={selectedProp.propertyValue}
                                onChange={(e) => handlePropertyChange(selectedProp.propertyId, e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                                placeholder={selectedProp.property.description || `${selectedProp.property.propertyName} değeri`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedProperties.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-xl bg-gray-700/30 mt-8">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                            <PropertyIcon />
                          </div>
                          <div>
                            <p className="text-gray-300 font-medium">Henüz özellik eklenmedi</p>
                            <p className="text-sm text-gray-500 mt-1">
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
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <ImageIcon />
                  <span>Görseller ({images.length})</span>
                </h2>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Görsel Yükle
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Maksimum 100MB, desteklenen formatlar: JPG, PNG, GIF, WebP
                  </p>
                  <p className="text-xs text-blue-400 mt-1">
                    💡 İlk yüklenen görsel otomatik olarak ana görsel olur. Sonrakiler galeri görseli olur.
                  </p>
                </div>

                {images.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-200 flex items-center space-x-2">
                        <span>📸</span>
                        <span>Yüklenen Görseller ({images.length})</span>
                      </h3>
                      <p className="text-sm text-gray-500">
                        Sürükle-bırak ile sıralayabilirsiniz
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {images
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((image) => (
                        <div 
                          key={image.tempId}
                          className="relative border border-gray-600 rounded-xl overflow-hidden bg-gray-700 hover:shadow-lg transition-shadow"
                          draggable
                          onDragStart={(e) => handleDragStart(e, image.tempId)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, image.tempId)}
                        >
                          {/* Sort Order Badge */}
                          <div className="absolute top-2 right-2 z-10 bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                            {image.sortOrder}
                          </div>
                          
                          {/* Image Type Badge */}
                          <div className={`absolute top-2 left-2 z-10 px-2 py-1 rounded text-xs font-bold shadow-lg ${
                            image.imageType === 'main_image' 
                              ? 'bg-yellow-500 text-white' 
                              : 'bg-blue-500 text-white'
                          }`}>
                            {image.imageType === 'main_image' ? '⭐ ANA' : '📸 GALERİ'}
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
                              <span className="text-sm font-medium text-gray-300 truncate max-w-[60%]">
                                {image.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeImage(image.tempId)}
                                className="text-red-400 hover:text-red-300 transition-colors p-1 hover:bg-red-900/20 rounded"
                                title="Görseli kaldır"
                              >
                                <DeleteIcon />
                              </button>
                            </div>
                            
                            {/* Image Type Buttons */}
                            <div className="flex space-x-2 mb-3">
                              <button
                                type="button"
                                onClick={() => changeImageType(image.tempId, 'main_image')}
                                className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                                  image.imageType === 'main_image'
                                    ? 'bg-yellow-600/30 text-yellow-300 border border-yellow-600/50'
                                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                }`}
                              >
                                <MainIcon />
                                <span>Ana Görsel</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => changeImageType(image.tempId, 'gallery')}
                                className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                                  image.imageType === 'gallery'
                                    ? 'bg-blue-600/30 text-blue-300 border border-blue-600/50'
                                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
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
                                  onClick={() => moveImageUp(image.tempId)}
                                  disabled={image.sortOrder === 1}
                                  className="p-1 text-gray-400 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 rounded"
                                  title="Yukarı taşı"
                                >
                                  <UpIcon />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveImageDown(image.tempId)}
                                  disabled={image.sortOrder === images.length}
                                  className="p-1 text-gray-400 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 rounded"
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
                                  onChange={(e) => setCustomSortOrder(image.tempId, parseInt(e.target.value))}
                                  className="w-12 px-1 py-1 text-xs border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-700 text-white"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Quick Sort Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-600">
                      <button
                        type="button"
                        onClick={() => {
                          setImages(prev => prev.map((img, i) => ({
                            ...img,
                            sortOrder: i + 1
                          })))
                        }}
                        className="px-3 py-1 text-xs bg-gray-600 text-gray-300 hover:bg-gray-500 rounded transition-colors"
                      >
                        Sıralamayı Düzelt
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImages(prev => {
                            const reversed = [...prev].reverse()
                            return reversed.map((img, i) => ({
                              ...img,
                              sortOrder: i + 1
                            }))
                          })
                        }}
                        className="px-3 py-1 text-xs bg-gray-600 text-gray-300 hover:bg-gray-500 rounded transition-colors"
                      >
                        Sıralamayı Ters Çevir
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImages(prev => prev.map((img, index) => ({
                            ...img,
                            imageType: index === 0 ? 'main_image' : 'gallery'
                          })))
                        }}
                        className="px-3 py-1 text-xs bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 rounded transition-colors border border-blue-600/50"
                      >
                        İlkini Ana Görsel Yap
                      </button>
                    </div>
                  </div>
                )}

                {images.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-xl bg-gray-700/30">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                        <ImageIcon />
                      </div>
                      <div>
                        <p className="text-gray-300 font-medium">Henüz görsel yüklenmedi</p>
                        <p className="text-sm text-gray-500 mt-1">
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
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700 transition-all duration-200 font-medium"
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