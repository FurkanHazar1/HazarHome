// components/admin/FurnitureAdd.tsx
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
  description: string
  isActive: boolean
}

interface FormData {
  furnitureName: string
  furnitureType: string
  categoryId: string
  description: string
  price: string
  isActive: boolean
  colorIds: number[]
  properties: { propertyId: number; propertyValue: string }[]
}

// Icon components
const PlusIcon = () => <span className="text-lg">➕</span>
const BackIcon = () => <span className="text-lg">⬅️</span>
const SaveIcon = () => <span className="text-lg">💾</span>
const LoaderIcon = () => <span className="text-lg animate-spin">⏳</span>
const DeleteIcon = () => <span className="text-sm">🗑️</span>

export default function FurnitureAdd() {
  const router = useRouter()
  
  // State management
  const [categories, setCategories] = useState<Category[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [dataLoading, setDataLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Form data
  const [formData, setFormData] = useState<FormData>({
    furnitureName: '',
    furnitureType: '',
    categoryId: '',
    description: '',
    price: '',
    isActive: true,
    colorIds: [],
    properties: []
  })

  // Form verileri için gerekli listeleri yükle
  const loadFormData = async (): Promise<void> => {
    try {
      setDataLoading(true)
      
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
      console.error('Form veri yükleme hatası:', err)
      setError('Form verileri yüklenemedi')
    } finally {
      setDataLoading(false)
    }
  }

  // Component mount
  useEffect(() => {
    loadFormData()
  }, [])

  // Form input değişikliği
  const handleInputChange = (field: keyof FormData, value: any): void => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setValidationErrors([]) // Clear validation errors
  }

  // Renk seçimi
  const handleColorToggle = (colorId: number): void => {
    const newColorIds = formData.colorIds.includes(colorId)
      ? formData.colorIds.filter(id => id !== colorId)
      : [...formData.colorIds, colorId]
    
    handleInputChange('colorIds', newColorIds)
  }

  // Özellik ekleme
  const handleAddProperty = (): void => {
    const newProperty = { propertyId: 0, propertyValue: '' }
    handleInputChange('properties', [...formData.properties, newProperty])
  }

  // Özellik kaldırma
  const handleRemoveProperty = (index: number): void => {
    const newProperties = formData.properties.filter((_, i) => i !== index)
    handleInputChange('properties', newProperties)
  }

  // Özellik güncelleme
  const handlePropertyChange = (index: number, field: 'propertyId' | 'propertyValue', value: string | number): void => {
    const newProperties = [...formData.properties]
    newProperties[index] = { ...newProperties[index], [field]: value }
    handleInputChange('properties', newProperties)
  }

  // Form validasyonu
  const validateForm = (): boolean => {
    const errors: string[] = []

    if (!formData.furnitureName.trim()) {
      errors.push('Mobilya adı zorunludur')
    }

    if (!formData.furnitureType.trim()) {
      errors.push('Mobilya tipi zorunludur')
    }

    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      errors.push('Geçerli bir fiyat girilmelidir')
    }

    // Özellik validasyonu
    for (let i = 0; i < formData.properties.length; i++) {
      const prop = formData.properties[i]
      if (!prop.propertyId || prop.propertyId === 0) {
        errors.push(`${i + 1}. özellik seçilmelidir`)
      }
      if (!prop.propertyValue.trim()) {
        errors.push(`${i + 1}. özellik değeri girilmelidir`)
      }
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)
      setError('')

      const submitData = {
        ...formData,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        price: parseFloat(formData.price),
        properties: formData.properties.filter(p => p.propertyId && p.propertyValue.trim())
      }

      const response = await fetch('/api/furniture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      const data = await response.json()

      if (data.success) {
        alert('Mobilya başarıyla eklendi!')
        router.push('/admin/furniture')
      } else {
        if (data.validationErrors) {
          setValidationErrors(data.validationErrors)
        } else {
          setError(data.error || 'Mobilya eklenemedi')
        }
      }
    } catch (err) {
      console.error('Mobilya ekleme hatası:', err)
      setError('Mobilya eklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Data loading state
  if (dataLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <LoaderIcon />
          <span className="ml-2 text-gray-600">Form verileri yükleniyor...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <PlusIcon />
              <span>Yeni Mobilya Ekle</span>
            </h1>
            <p className="text-gray-600 mt-2">
              Yeni mobilya bilgilerini girin
            </p>
          </div>
          
          <Link
            href="/admin/furniture"
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <BackIcon />
            <span>Geri Dön</span>
          </Link>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Temel Bilgiler */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobilya Adı *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={formData.furnitureName}
                onChange={(e) => handleInputChange('furnitureName', e.target.value)}
                placeholder="Örn: Modern Üçlü Koltuk"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobilya Tipi *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={formData.furnitureType}
                onChange={(e) => handleInputChange('furnitureType', e.target.value)}
                placeholder="Örn: Koltuk, Masa, Dolap"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
              >
                <option value="">Kategori Seçin</option>
                {categories.map(category => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.parent && `${category.parent.categoryName} > `}
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fiyat (TL) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Mobilya hakkında detaylı açıklama..."
            />
          </div>

          <div className="mt-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-700">Aktif durumda</span>
            </label>
          </div>
        </div>

        {/* Renkler */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Renk Seçenekleri</h2>
          
          {colors.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {colors.map(color => (
                <label key={color.colorId} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={formData.colorIds.includes(color.colorId)}
                    onChange={() => handleColorToggle(color.colorId)}
                  />
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: color.colorCode }}
                    />
                    <span className="text-sm text-gray-700">{color.colorName}</span>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Henüz renk tanımlanmamış</p>
          )}
        </div>

        {/* Özellikler */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Mobilya Özellikleri</h2>
            <button
              type="button"
              onClick={handleAddProperty}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
            >
              <PlusIcon />
              <span>Özellik Ekle</span>
            </button>
          </div>

          {formData.properties.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz özellik eklenmemiş</p>
          ) : (
            <div className="space-y-4">
              {formData.properties.map((property, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Özellik
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      value={property.propertyId}
                      onChange={(e) => handlePropertyChange(index, 'propertyId', parseInt(e.target.value))}
                    >
                      <option value={0}>Özellik Seçin</option>
                      {properties.map(prop => (
                        <option key={prop.propertyId} value={prop.propertyId}>
                          {prop.propertyName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Değer
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={property.propertyValue}
                        onChange={(e) => handlePropertyChange(index, 'propertyValue', e.target.value)}
                        placeholder="Özellik değeri"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveProperty(index)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Kaldır"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href="/admin/furniture"
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? <LoaderIcon /> : <SaveIcon />}
            <span>{loading ? 'Kaydediliyor...' : 'Mobilya Ekle'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}