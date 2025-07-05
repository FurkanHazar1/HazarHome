'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// TypeScript interfaces
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

interface ImageData {
  fileName: string
  filePath: string
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

export default function FurnitureAdd() {
  const router = useRouter()
  
  // State management
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  
  // Data states
  const [categories, setCategories] = useState<Category[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  
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

  // Load form data
  const loadFormData = async (): Promise<void> => {
    try {
      setLoading(true)
      
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
    } finally {
      setLoading(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    loadFormData()
  }, [])

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

  // Handle image upload (simulated)
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files
    if (!files) return

    // Simulate image upload process
    Array.from(files).forEach((file, index) => {
      const imageData: ImageData = {
        fileName: file.name,
        filePath: `/uploads/furniture/${Date.now()}-${file.name}`, // Simulated path
        fileSize: file.size,
        fileType: file.type.split('/')[1],
        altText: formData.furnitureName || 'Mobilya görseli',
        sortOrder: formData.images.length + index + 1,
        imageType: formData.images.length === 0 ? 'main_image' : 'gallery'
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageData]
      }))
    })
  }

  // Remove image
  const removeImage = (index: number): void => {
    const newImages = formData.images.filter((_, i) => i !== index)
    // Reorder sort orders
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      sortOrder: i + 1,
      imageType: i === 0 ? 'main_image' as const : 'gallery' as const
    }))
    
    handleInputChange('images', reorderedImages)
  }

  // Move image
  const moveImage = (fromIndex: number, toIndex: number): void => {
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
      errors.push({ field: 'images', message: 'En az bir görsel eklemelisiniz' })
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
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    
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
        images: formData.images
      }
      
      const response = await fetch('/api/furniture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        router.push(`/admin/furniture/${data.data.furnitureId}`)
      } else {
        setError(data.error || 'Mobilya eklenirken hata oluştu')
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
              <FurnitureIcon />
              <span>Yeni Mobilya Ekle</span>
            </h1>
            <p className="text-gray-600 mt-2">
              Sisteme yeni mobilya ekleyin
            </p>
          </div>
          
          <Link
            href="/admin/furniture"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <BackIcon />
            <span>Geri Dön</span>
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
          <span className="ml-2 text-gray-600">Form yükleniyor...</span>
        </div>
      )}

      {/* Form */}
      {!loading && (
        <form onSubmit={handleSubmit} className="space-y-8">
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
              <span>Kategori Seçimi</span>
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

          {/* Image Upload */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <ImageIcon />
              <span>Görseller *</span>
            </h2>
            
            {/* Upload Button */}
            <div className="mb-6">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadIcon />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Görsel yüklemek için tıklayın</span>
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG veya JPEG (MAX. 10MB)</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
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
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Yüklenen Görseller ({formData.images.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative border border-gray-200 rounded-lg p-2">
                      <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                        <ImageIcon />
                      </div>
                      
                      <div className="text-xs text-gray-600 mb-2">
                        <div className="truncate">{image.fileName}</div>
                        <div className={`inline-block px-2 py-1 rounded text-xs ${
                          image.imageType === 'main_image' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {image.imageType === 'main_image' ? 'Ana Görsel' : 'Galeri'}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => moveImage(index, index - 1)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              ↑
                            </button>
                          )}
                          {index < formData.images.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveImage(index, index + 1)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              ↓
                            </button>
                          )}
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>İpucu:</strong> İlk görsel ana görsel olarak kullanılacaktır. 
                    Sıralamayı yukarı/aşağı butonlarıyla değiştirebilirsiniz.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href="/admin/furniture"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </Link>
            
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {saving ? <LoaderIcon /> : <SaveIcon />}
              <span>{saving ? 'Kaydediliyor...' : 'Mobilya Ekle'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}