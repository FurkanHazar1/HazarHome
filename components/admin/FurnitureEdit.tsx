'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// TypeScript interfaces - API'ye uygun
interface Category {
  categoryId: number
  categoryName: string
  categoryLevel: number
  parent?: {
    categoryId: number
    categoryName: string
  }
}

interface Color {
  colorId: number
  colorName: string
  colorCode: string
  isActive: boolean
}

interface Property {
  propertyId: number
  propertyName: string
  propertyType: string
  description?: string
  isActive: boolean
}

interface PropertyValue {
  propertyId: number
  propertyValue: string
}

// API Response types
interface UploadedFile {
  imageId: number
  fileName: string
  originalFileName: string
  filePath: string
  webPath: string
  fileSize: number
  fileType: string
  width: number
  height: number
  optimized: boolean
}

interface ImageListItem {
  imageId: number
  fileName: string
  originalFileName?: string
  webPath: string
  fileSize?: number
  fileType?: string
  width?: number
  height?: number
  description?: string
  altText?: string
  sortOrder: number
  imageType: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  error?: string
  details?: string
  data?: T
}

interface ImageData {
  imageId?: number
  fileName: string
  filePath: string
  webPath: string
  fileSize?: number
  fileType?: string
  description?: string
  altText?: string
  width?: number
  height?: number
  sortOrder: number
  imageType: 'main_image' | 'gallery'
}

interface FormData {
  furnitureName: string
  furnitureType: string
  categoryId: number | null
  description: string
  price: string
  isActive: boolean
  colorIds: number[]
  properties: PropertyValue[]
  images: ImageData[]
}

interface ValidationError {
  field: string
  message: string
}

interface FurnitureEditProps {
  furnitureId: string
}

// Icon components
const FurnitureIcon = () => <span className="text-xl">🪑</span>
const SaveIcon = () => <span className="text-lg">💾</span>
const BackIcon = () => <span className="text-lg">←</span>
const CategoryIcon = () => <span className="text-sm">📂</span>
const ColorIcon = () => <span className="text-sm">🎨</span>
const PropertyIcon = () => <span className="text-sm">🏷️</span>
const ImageIcon = () => <span className="text-sm">🖼️</span>
const LoaderIcon = () => <span className="text-lg animate-spin">⏳</span>
const PlusIcon = () => <span className="text-sm">➕</span>
const TrashIcon = () => <span className="text-sm">🗑️</span>
const UploadIcon = () => <span className="text-sm">📤</span>
const EditIcon = () => <span className="text-lg">✏️</span>
const UpdateIcon = () => <span className="text-sm">📝</span>

export default function FurnitureEdit({ furnitureId }: FurnitureEditProps) {
  const router = useRouter()
  
  // State management
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [uploading, setUploading] = useState<boolean>(false)
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)
  const [updatingImageId, setUpdatingImageId] = useState<number | null>(null)
  const [error, setError] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  
  // Data states
  const [categories, setCategories] = useState<Category[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [originalFurniture, setOriginalFurniture] = useState<any>(null)
  
  // Form data
  const [formData, setFormData] = useState<FormData>({
    furnitureName: '',
    furnitureType: '',
    categoryId: null,
    description: '',
    price: '',
    isActive: true,
    colorIds: [],
    properties: [],
    images: []
  })

  // Load dropdown data (categories, colors, properties)
  const loadFormData = async (): Promise<void> => {
    try {
      const [categoriesRes, colorsRes, propertiesRes] = await Promise.all([
        fetch('/api/categories?flat=true&active=true'),
        fetch('/api/colors?active=true'),
        fetch('/api/properties?active=true')
      ])

      const [categoriesData, colorsData, propertiesData] = await Promise.all([
        categoriesRes.json(),
        colorsRes.json(),
        propertiesRes.json()
      ])

      if (categoriesData.success) setCategories(categoriesData.data)
      if (colorsData.success) setColors(colorsData.data)
      if (propertiesData.success) setProperties(propertiesData.data)
      
    } catch (err) {
      console.error('Form data loading error:', err)
      setError('Form verileri yüklenemedi')
    }
  }

  // Load existing furniture data
  const loadExistingFurniture = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/furniture/${furnitureId}`)
      const data = await response.json()
      
      if (data.success) {
        const furniture = data.data
        setOriginalFurniture(furniture)
        
        // Load images using the API
        await loadImages()
        
        // Populate form with existing data
        setFormData(prev => ({
          ...prev,
          furnitureName: furniture.furnitureName || '',
          furnitureType: furniture.furnitureType || '',
          categoryId: furniture.category?.categoryId || null,
          description: furniture.description || '',
          price: furniture.price?.toString() || '',
          isActive: furniture.isActive ?? true,
          colorIds: furniture.colors?.filter((c: any) => c.isAvailable).map((c: any) => c.color.colorId) || [],
          properties: furniture.properties?.filter((p: any) => p.isActive).map((p: any) => ({
            propertyId: p.property.propertyId,
            propertyValue: p.propertyValue
          })) || []
        }))
      } else {
        setError(data.error || 'Mobilya bulunamadı')
      }
    } catch (err) {
      console.error('Furniture loading error:', err)
      setError('Mobilya verileri yüklenemedi')
    }
  }

  // Load images using API
  const loadImages = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/upload?furnitureId=${furnitureId}`)
      const data: ApiResponse<ImageListItem[]> = await response.json()
      
      if (data.success && data.data) {
        const apiImages = data.data.map((img: ImageListItem) => ({
          imageId: img.imageId,
          fileName: img.fileName,
          filePath: img.webPath,
          webPath: img.webPath,
          fileSize: img.fileSize,
          fileType: img.fileType,
          description: img.description,
          altText: img.altText,
          width: img.width,
          height: img.height,
          sortOrder: img.sortOrder,
          imageType: img.imageType as 'main_image' | 'gallery'
        }))
        
        setFormData(prev => ({ ...prev, images: apiImages }))
      }
    } catch (err) {
      console.error('Images loading error:', err)
    }
  }

  // Load all data on mount
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true)
      await Promise.all([
        loadFormData(),
        loadExistingFurniture()
      ])
      setLoading(false)
    }
    
    loadAllData()
  }, [furnitureId])

  // Handle input change
  const handleInputChange = (field: keyof FormData, value: any): void => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear validation errors for this field
    setValidationErrors(prev => prev.filter(error => error.field !== field))
  }

  // Handle color selection
  const handleColorToggle = (colorId: number): void => {
    const newColorIds = formData.colorIds.includes(colorId)
      ? formData.colorIds.filter(id => id !== colorId)
      : [...formData.colorIds, colorId]
    
    handleInputChange('colorIds', newColorIds)
  }

  // Handle property change
  const handlePropertyChange = (propertyId: number, value: string): void => {
    const newProperties = [...formData.properties]
    const existingIndex = newProperties.findIndex(p => p.propertyId === propertyId)
    
    if (value.trim()) {
      if (existingIndex >= 0) {
        newProperties[existingIndex].propertyValue = value
      } else {
        newProperties.push({ propertyId, propertyValue: value })
      }
    } else {
      if (existingIndex >= 0) {
        newProperties.splice(existingIndex, 1)
      }
    }
    
    handleInputChange('properties', newProperties)
  }

  // Get property value
  const getPropertyValue = (propertyId: number): string => {
    const property = formData.properties.find(p => p.propertyId === propertyId)
    return property?.propertyValue || ''
  }

  // Get category name by ID
  const getCategoryName = (categoryId: number | null): string => {
    if (!categoryId) return 'Kategori'
    const category = categories.find(c => c.categoryId === categoryId)
    return category?.categoryName || 'Kategori'
  }

  // Handle image upload using API
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Validation
    if (!formData.furnitureName.trim()) {
      setError('Görsel yüklemek için önce mobilya adını giriniz')
      return
    }

    if (!formData.categoryId) {
      setError('Görsel yüklemek için önce kategori seçiniz')
      return
    }

    try {
      setUploading(true)
      setError('')

      // Prepare form data according to API
      const uploadFormData = new FormData()
      uploadFormData.append('categoryName', getCategoryName(formData.categoryId))
      uploadFormData.append('furnitureName', formData.furnitureName.trim())
      uploadFormData.append('description', formData.description || '')
      uploadFormData.append('altText', `${formData.furnitureName} görseli`)

      // Add files
      Array.from(files).forEach(file => {
        uploadFormData.append('files', file)
      })

      // Upload files to API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      })

      const data: ApiResponse<UploadedFile[]> = await response.json()

      if (data.success && data.data) {
        // Convert API response to ImageData format
        const newImages: ImageData[] = data.data.map((file: UploadedFile, index: number) => ({
          imageId: file.imageId,
          fileName: file.fileName,
          filePath: file.filePath,
          webPath: file.webPath,
          fileSize: file.fileSize,
          fileType: file.fileType,
          altText: file.originalFileName,
          width: file.width,
          height: file.height,
          sortOrder: formData.images.length + index + 1,
          imageType: (formData.images.length + index) === 0 ? 'main_image' : 'gallery'
        }))

        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }))

        // Clear validation errors for images
        setValidationErrors(prev => prev.filter(error => error.field !== 'images'))
      } else {
        setError(data.error || 'Dosya yükleme hatası')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Dosya yükleme sırasında hata oluştu')
    } finally {
      setUploading(false)
      // Clear file input
      event.target.value = ''
    }
  }

  // Remove image using API DELETE
  const removeImage = async (index: number): Promise<void> => {
    const image = formData.images[index]
    
    if (!image.imageId) {
      // If no imageId, just remove from state (newly uploaded but not saved)
      const newImages = formData.images.filter((_, i) => i !== index)
      const reorderedImages = newImages.map((img, i) => ({
        ...img,
        sortOrder: i + 1,
        imageType: i === 0 ? 'main_image' as const : 'gallery' as const
      }))
      handleInputChange('images', reorderedImages)
      return
    }

    try {
      setDeletingImageId(image.imageId)
      
      const response = await fetch(`/api/upload?imageId=${image.imageId}`, {
        method: 'DELETE'
      })
      
      const data: ApiResponse<any> = await response.json()
      
      if (data.success) {
        // Remove from state
        const newImages = formData.images.filter((_, i) => i !== index)
        const reorderedImages = newImages.map((img, i) => ({
          ...img,
          sortOrder: i + 1,
          imageType: i === 0 ? 'main_image' as const : 'gallery' as const
        }))
        handleInputChange('images', reorderedImages)
      } else {
        setError(data.error || 'Görsel silinirken hata oluştu')
      }
    } catch (err) {
      console.error('Delete image error:', err)
      setError('Görsel silinirken hata oluştu')
    } finally {
      setDeletingImageId(null)
    }
  }

  // Update image metadata using API PUT
  const updateImageMetadata = async (imageId: number, metadata: { description?: string; altText?: string; sortOrder?: number }): Promise<void> => {
    try {
      setUpdatingImageId(imageId)
      
      const response = await fetch(`/api/upload?imageId=${imageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata)
      })
      
      const data: ApiResponse<any> = await response.json()
      
      if (!data.success) {
        setError(data.error || 'Görsel güncellenirken hata oluştu')
      }
    } catch (err) {
      console.error('Update image error:', err)
      setError('Görsel güncellenirken hata oluştu')
    } finally {
      setUpdatingImageId(null)
    }
  }

  // Move image
  const moveImage = async (fromIndex: number, toIndex: number): Promise<void> => {
    const newImages = [...formData.images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    
    // Reorder and update main image
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      sortOrder: i + 1,
      imageType: i === 0 ? 'main_image' as const : 'gallery' as const
    }))
    
    handleInputChange('images', reorderedImages)

    // Update sort orders in API if images have IDs
    for (let i = 0; i < reorderedImages.length; i++) {
      const img = reorderedImages[i]
      if (img.imageId) {
        await updateImageMetadata(img.imageId, { sortOrder: i + 1 })
      }
    }
  }

  // Bulk delete images using API PATCH
  const bulkDeleteImages = async (imageIds: number[]): Promise<void> => {
    try {
      const response = await fetch('/api/upload', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          imageIds
        })
      })
      
      const data: ApiResponse<any> = await response.json()
      
      if (data.success) {
        // Remove deleted images from state
        const newImages = formData.images.filter(img => !imageIds.includes(img.imageId!))
        const reorderedImages = newImages.map((img, i) => ({
          ...img,
          sortOrder: i + 1,
          imageType: i === 0 ? 'main_image' as const : 'gallery' as const
        }))
        handleInputChange('images', reorderedImages)
      } else {
        setError(data.error || 'Görseller silinirken hata oluştu')
      }
    } catch (err) {
      console.error('Bulk delete error:', err)
      setError('Görseller silinirken hata oluştu')
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const errors: ValidationError[] = []
    
    if (!formData.furnitureName.trim()) {
      errors.push({ field: 'furnitureName', message: 'Mobilya adı zorunludur' })
    }
    
    if (!formData.furnitureType.trim()) {
      errors.push({ field: 'furnitureType', message: 'Mobilya tipi zorunludur' })
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.push({ field: 'price', message: 'Geçerli bir fiyat giriniz' })
    }
    
    if (formData.images.length === 0) {
      errors.push({ field: 'images', message: 'En az bir görsel olmalıdır' })
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  // Get validation error for field
  const getValidationError = (field: string): string | undefined => {
    const error = validationErrors.find(e => e.field === field)
    return error?.message
  }

  // Submit form
  const handleSubmit = async (): Promise<void> => {
    
    if (!validateForm()) {
      setError('Lütfen tüm zorunlu alanları doldurun')
      return
    }
    
    try {
      setSaving(true)
      setError('')
      
      const submitData = {
        furnitureName: formData.furnitureName.trim(),
        furnitureType: formData.furnitureType.trim(),
        categoryId: formData.categoryId,
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        isActive: formData.isActive,
        colorIds: formData.colorIds,
        properties: formData.properties,
        images: formData.images.map(img => ({
          imageId: img.imageId,
          fileName: img.fileName,
          filePath: img.webPath,
          fileSize: img.fileSize,
          fileType: img.fileType,
          description: img.description,
          altText: img.altText,
          width: img.width,
          height: img.height,
          sortOrder: img.sortOrder,
          imageType: img.imageType
        }))
      }
      
      const response = await fetch(`/api/furniture/${furnitureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        router.push(`/admin/furniture/${furnitureId}`)
      } else {
        setError(data.error || 'Güncelleme sırasında hata oluştu')
        if (data.validationErrors) {
          setValidationErrors(data.validationErrors.map((msg: string) => ({
            field: 'general',
            message: msg
          })))
        }
      }
    } catch (err) {
      console.error('Submit error:', err)
      setError('Bağlantı hatası oluştu')
    } finally {
      setSaving(false)
    }
  }

  // Get categories by level for hierarchical display
  const getCategoriesByLevel = () => {
    const mainCategories = categories.filter(c => c.categoryLevel === 1)
    const subCategories = categories.filter(c => c.categoryLevel > 1)
    
    return { mainCategories, subCategories }
  }

  const { mainCategories, subCategories } = getCategoriesByLevel()

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <EditIcon />
              <span>Mobilya Düzenle</span>
            </h1>
            <p className="text-gray-600 mt-2">
              {originalFurniture?.furnitureName || 'Mobilya bilgilerini düzenleyin'}
            </p>
          </div>
          
          <Link
            href={`/admin/furniture/${furnitureId}`}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <BackIcon />
            <span>Detaya Dön</span>
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoaderIcon />
          <span className="ml-2 text-gray-600">Mobilya yükleniyor...</span>
        </div>
      )}

      {/* Form */}
      {!loading && originalFurniture && (
        <div className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Temel Bilgiler
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Furniture Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobilya Adı *
                </label>
                <input
                  type="text"
                  value={formData.furnitureName}
                  onChange={(e) => handleInputChange('furnitureName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    getValidationError('furnitureName') ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Örn: Modern Üç Kişilik Koltuk"
                />
                {getValidationError('furnitureName') && (
                  <p className="mt-1 text-sm text-red-600">{getValidationError('furnitureName')}</p>
                )}
              </div>

              {/* Furniture Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobilya Tipi *
                </label>
                <input
                  type="text"
                  value={formData.furnitureType}
                  onChange={(e) => handleInputChange('furnitureType', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    getValidationError('furnitureType') ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Örn: Koltuk, Masa, Sandalye"
                />
                {getValidationError('furnitureType') && (
                  <p className="mt-1 text-sm text-red-600">{getValidationError('furnitureType')}</p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fiyat (TL) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    getValidationError('price') ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {getValidationError('price') && (
                  <p className="mt-1 text-sm text-red-600">{getValidationError('price')}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durum
                </label>
                <select
                  value={formData.isActive.toString()}
                  onChange={(e) => handleInputChange('isActive', e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Pasif</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Mobilya hakkında detaylı bilgi..."
              />
            </div>
          </div>

          {/* Category Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <CategoryIcon />
              <span>Kategori Seçimi *</span>
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <select
                value={formData.categoryId || ''}
                onChange={(e) => handleInputChange('categoryId', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Kategori Seçin</option>
                
                {/* Main Categories */}
                {mainCategories.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.categoryName}
                  </option>
                ))}
                
                {/* Sub Categories */}
                {subCategories.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.parent?.categoryName} → {category.categoryName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Color Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <ColorIcon />
              <span>Renk Seçimi</span>
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {colors.map((color) => (
                <div
                  key={color.colorId}
                  className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                    formData.colorIds.includes(color.colorId)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleColorToggle(color.colorId)}
                >
                  <div className="flex items-center space-x-2">
                    {color.colorCode && (
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.colorCode }}
                      />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {color.colorName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {formData.colorIds.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">
                  {formData.colorIds.length} renk seçildi
                </span>
              </div>
            )}
          </div>

          {/* Properties */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <PropertyIcon />
              <span>Özellikler</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {properties.map((property) => (
                <div key={property.propertyId}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {property.propertyName}
                    {property.description && (
                      <span className="text-gray-500 font-normal"> - {property.description}</span>
                    )}
                  </label>
                  
                  {property.propertyType === 'boolean' ? (
                    <select
                      value={getPropertyValue(property.propertyId)}
                      onChange={(e) => handlePropertyChange(property.propertyId, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Seçin</option>
                      <option value="true">Evet</option>
                      <option value="false">Hayır</option>
                    </select>
                  ) : property.propertyType === 'number' ? (
                    <input
                      type="number"
                      value={getPropertyValue(property.propertyId)}
                      onChange={(e) => handlePropertyChange(property.propertyId, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Sayısal değer"
                    />
                  ) : property.propertyType === 'date' ? (
                    <input
                      type="date"
                      value={getPropertyValue(property.propertyId)}
                      onChange={(e) => handlePropertyChange(property.propertyId, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <input
                      type="text"
                      value={getPropertyValue(property.propertyId)}
                      onChange={(e) => handlePropertyChange(property.propertyId, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Metin değer"
                    />
                  )}
                </div>
              ))}
            </div>
            
            {formData.properties.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-green-700">
                  {formData.properties.length} özellik değeri girildi
                </span>
              </div>
            )}
          </div>

          {/* Image Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <ImageIcon />
              <span>Görseller * (API Entegreli)</span>
            </h2>
            
            {/* Upload Button */}
            <div className="mb-6">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-gray-300 bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploading ? <LoaderIcon /> : <UploadIcon />}
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">
                      {uploading ? 'Görseller API\'ye yükleniyor...' : 'Yeni görsel eklemek için tıklayın'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG veya JPEG (MAX. 10MB, MAX. 10 dosya)</p>
                  <p className="text-xs text-blue-500 mt-1">Sharp optimizasyon ve database kayıt dahil</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {getValidationError('images') && (
                <p className="mt-2 text-sm text-red-600">{getValidationError('images')}</p>
              )}
            </div>

            {/* Image List */}
            {formData.images.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    Mevcut Görseller ({formData.images.length})
                  </h3>
                  {formData.images.some(img => img.imageId) && (
                    <button
                      type="button"
                      onClick={() => {
                        const imageIds = formData.images.filter(img => img.imageId).map(img => img.imageId!)
                        if (imageIds.length > 0 && confirm(`${imageIds.length} görseli silmek istediğinizden emin misiniz?`)) {
                          bulkDeleteImages(imageIds)
                        }
                      }}
                      className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Hepsini Sil
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative border border-gray-200 rounded-lg p-2">
                      {/* Image Preview */}
                      <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden relative">
                        <img
                          src={image.webPath}
                          alt={image.altText || image.fileName}
                          className="w-full h-full object-cover"
                        />
                        {/* API Status Indicator */}
                        <div className="absolute top-2 right-2">
                          {image.imageId ? (
                            <span className="inline-block w-3 h-3 bg-green-500 rounded-full" title="API'de kayıtlı" />
                          ) : (
                            <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full" title="Yeni yüklendi, henüz kaydedilmedi" />
                          )}
                        </div>
                      </div>
                      
                      {/* Image Info */}
                      <div className="text-xs text-gray-600 mb-2">
                        <div className="truncate" title={image.fileName}>{image.fileName}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`inline-block px-2 py-1 rounded text-xs ${
                            image.imageType === 'main_image' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {image.imageType === 'main_image' ? 'Ana Görsel' : 'Galeri'}
                          </span>
                          {image.width && image.height && (
                            <span className="text-gray-400">
                              {image.width}×{image.height}
                            </span>
                          )}
                        </div>
                        {image.imageId && (
                          <div className="text-green-600 text-xs mt-1">ID: {image.imageId}</div>
                        )}
                      </div>
                      
                      {/* Controls */}
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => moveImage(index, index - 1)}
                              disabled={updatingImageId === image.imageId}
                              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 bg-blue-50 rounded disabled:opacity-50"
                              title="Yukarı taşı"
                            >
                              ↑
                            </button>
                          )}
                          {index < formData.images.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveImage(index, index + 1)}
                              disabled={updatingImageId === image.imageId}
                              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 bg-blue-50 rounded disabled:opacity-50"
                              title="Aşağı taşı"
                            >
                              ↓
                            </button>
                          )}
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          disabled={deletingImageId === image.imageId}
                          className="text-red-600 hover:text-red-800 px-2 py-1 bg-red-50 rounded disabled:opacity-50"
                          title={image.imageId ? "API'den sil" : "Listeden kaldır"}
                        >
                          {deletingImageId === image.imageId ? <LoaderIcon /> : <TrashIcon />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>API Özellikleri:</strong> Sharp optimizasyon, database entegrasyonu, 
                    fiziksel dosya yönetimi ve metadata güncelleme dahil.
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    <strong>Klasör:</strong> /uploads/furniture/{getCategoryName(formData.categoryId).toLowerCase()}/{formData.furnitureName.toLowerCase().replace(/\s+/g, '-')}/
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href={`/admin/furniture/${furnitureId}`}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </Link>
            
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || uploading || deletingImageId !== null || updatingImageId !== null}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {saving ? <LoaderIcon /> : <SaveIcon />}
              <span>{saving ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}