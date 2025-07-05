// components/admin/FurnitureDetail.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// TypeScript interfaces
interface FurnitureDetail {
  furnitureId: number
  furnitureName: string
  furnitureType: string
  categoryId: number | null
  description: string | null
  price: number
  isActive: boolean
  createdAt: string
  category?: {
    categoryId: number
    categoryName: string
    categoryPath: string
    categoryLevel: number
    parent?: {
      categoryId: number
      categoryName: string
    }
  }
  furnitureColors: Array<{
    colorId: number
    isAvailable: boolean
    color: {
      colorId: number
      colorName: string
      colorCode: string
      isActive: boolean
    }
  }>
  furnitureProperties: Array<{
    propertyId: number
    propertyValue: string
    isActive: boolean
    property: {
      propertyId: number
      propertyName: string
      propertyType: string
      description: string
    }
  }>
  furnitureImages: Array<{
    imageId: number
    sortOrder: number
    imageType: string
    isActive: boolean
    image: {
      imageId: number
      fileName: string
      filePath: string
      fileSize: number | null
      fileType: string | null
      description: string | null
      altText: string | null
      width: number | null
      height: number | null
      originalFileName: string | null
    }
  }>
  breadcrumb: Array<{
    categoryId: number
    categoryName: string
  }>
  imageGallery: {
    mainImages: any[]
    galleryImages: any[]
    totalImages: number
  }
  stats: {
    totalColors: number
    totalProperties: number
    totalImages: number
  }
}

interface FurnitureDetailProps {
  furnitureId: string
}

// Icon components
const FurnitureIcon = () => <span className="text-2xl">🪑</span>
const BackIcon = () => <span className="text-lg">⬅️</span>
const EditIcon = () => <span className="text-lg">✏️</span>
const DeleteIcon = () => <span className="text-lg">🗑️</span>
const LoaderIcon = () => <span className="text-lg animate-spin">⏳</span>
const ColorIcon = () => <span className="text-sm">🎨</span>
const PropertyIcon = () => <span className="text-sm">🏷️</span>
const ImageIcon = () => <span className="text-sm">🖼️</span>
const CalendarIcon = () => <span className="text-sm">📅</span>
const PriceIcon = () => <span className="text-sm">💰</span>
const CategoryIcon = () => <span className="text-sm">📂</span>
const ToggleIcon = () => <span className="text-sm">🔄</span>

export default function FurnitureDetail({ furnitureId }: FurnitureDetailProps) {
  const router = useRouter()
  
  // State management
  const [furniture, setFurniture] = useState<FurnitureDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [actionLoading, setActionLoading] = useState<boolean>(false)

  // Mobilya detayını yükle
  const loadFurnitureDetail = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await fetch(`/api/furniture/${furnitureId}`)
      const data = await response.json()

      if (data.success) {
        setFurniture(data.data)
        setError('')
      } else {
        setError(data.error || 'Mobilya detayı yüklenemedi')
      }
    } catch (err) {
      console.error('Mobilya detay yükleme hatası:', err)
      setError('Mobilya detayı yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Component mount
  useEffect(() => {
    if (furnitureId) {
      loadFurnitureDetail()
    }
  }, [furnitureId])

  // Mobilya silme
  const handleDelete = async (): Promise<void> => {
    if (!furniture) return

    const confirmed = window.confirm(`"${furniture.furnitureName}" mobilyası silinecek. Bu işlem geri alınamaz. Emin misiniz?`)
    if (!confirmed) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/furniture/${furnitureId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Mobilya başarıyla silindi!')
        router.push('/admin/furniture')
      } else {
        alert(data.error || 'Silme işlemi başarısız')
      }
    } catch (err) {
      console.error('Mobilya silme hatası:', err)
      alert('Silme işleminde hata oluştu')
    } finally {
      setActionLoading(false)
    }
  }

  // Aktif/Pasif toggle
  const handleToggleStatus = async (): Promise<void> => {
    if (!furniture) return

    try {
      setActionLoading(true)
      const response = await fetch('/api/furniture', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: [furniture.furnitureId],
          isActive: !furniture.isActive
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setFurniture(prev => prev ? { ...prev, isActive: !prev.isActive } : null)
        alert(data.message)
      } else {
        alert(data.error || 'Durum güncelleme başarısız')
      }
    } catch (err) {
      console.error('Durum güncelleme hatası:', err)
      alert('Durum güncellemede hata oluştu')
    } finally {
      setActionLoading(false)
    }
  }

  // Format functions
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <LoaderIcon />
          <span className="ml-2 text-gray-600">Mobilya detayı yükleniyor...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
        <div className="mt-4">
          <Link
            href="/admin/furniture"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Mobilya listesine dön
          </Link>
        </div>
      </div>
    )
  }

  // No furniture found
  if (!furniture) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Mobilya bulunamadı</h3>
          <Link
            href="/admin/furniture"
            className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
          >
            ← Mobilya listesine dön
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
              <Link href="/admin/furniture" className="hover:text-blue-600">
                Mobilyalar
              </Link>
              {furniture.breadcrumb.map((crumb, index) => (
                <span key={crumb.categoryId}>
                  <span className="mx-1">›</span>
                  <span>{crumb.categoryName}</span>
                </span>
              ))}
              <span className="mx-1">›</span>
              <span>{furniture.furnitureName}</span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <FurnitureIcon />
              <span>{furniture.furnitureName}</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                furniture.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {furniture.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </h1>
            <p className="text-gray-600 mt-2">
              {furniture.furnitureType} • {formatPrice(furniture.price)}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Link
              href={`/admin/furniture/${furniture.furnitureId}/edit`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <EditIcon />
              <span>Düzenle</span>
            </Link>
            
            <button
              onClick={handleToggleStatus}
              disabled={actionLoading}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                furniture.isActive
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              } disabled:opacity-50`}
            >
              <ToggleIcon />
              <span>{furniture.isActive ? 'Pasif Yap' : 'Aktif Yap'}</span>
            </button>
            
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <DeleteIcon />
              <span>Sil</span>
            </button>
            
            <Link
              href="/admin/furniture"
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
            >
              <BackIcon />
              <span>Geri</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon - Ana Bilgiler */}
        <div className="lg:col-span-2 space-y-6">
          {/* Temel Bilgiler */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                  <FurnitureIcon />
                  <span>Mobilya Adı</span>
                </div>
                <div className="text-lg font-medium text-gray-900">{furniture.furnitureName}</div>
              </div>

              <div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                  <CategoryIcon />
                  <span>Mobilya Tipi</span>
                </div>
                <div className="text-lg font-medium text-gray-900">{furniture.furnitureType}</div>
              </div>

              <div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                  <PriceIcon />
                  <span>Fiyat</span>
                </div>
                <div className="text-lg font-medium text-gray-900">{formatPrice(furniture.price)}</div>
              </div>

              <div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                  <CalendarIcon />
                  <span>Oluşturma Tarihi</span>
                </div>
                <div className="text-lg font-medium text-gray-900">{formatDate(furniture.createdAt)}</div>
              </div>

              {furniture.category && (
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                    <CategoryIcon />
                    <span>Kategori</span>
                  </div>
                  <div className="text-lg font-medium text-gray-900">
                    {furniture.category.parent && `${furniture.category.parent.categoryName} > `}
                    {furniture.category.categoryName}
                  </div>
                </div>
              )}
            </div>

            {furniture.description && (
              <div className="mt-6">
                <div className="text-sm text-gray-500 mb-2">Açıklama</div>
                <div className="text-gray-900 whitespace-pre-wrap">{furniture.description}</div>
              </div>
            )}
          </div>

          {/* Renkler */}
          {furniture.furnitureColors.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ColorIcon />
                <span className="ml-2">Renk Seçenekleri ({furniture.stats.totalColors})</span>
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {furniture.furnitureColors.map(({ color, isAvailable }) => (
                  <div
                    key={color.colorId}
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      isAvailable ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-gray-25 opacity-50'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: color.colorCode }}
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{color.colorName}</div>
                      <div className="text-xs text-gray-500">
                        {isAvailable ? 'Mevcut' : 'Mevcut Değil'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Özellikler */}
          {furniture.furnitureProperties.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PropertyIcon />
                <span className="ml-2">Özellikler ({furniture.stats.totalProperties})</span>
              </h2>
              
              <div className="space-y-4">
                {furniture.furnitureProperties.map(({ property, propertyValue, isActive }) => (
                  <div
                    key={property.propertyId}
                    className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg border ${
                      isActive ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-gray-25 opacity-50'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">{property.propertyName}</div>
                      <div className="text-xs text-gray-500">{property.propertyType}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm text-gray-900">{propertyValue}</div>
                      {property.description && (
                        <div className="text-xs text-gray-500 mt-1">{property.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Görseller */}
          {furniture.furnitureImages.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ImageIcon />
                <span className="ml-2">Görseller ({furniture.stats.totalImages})</span>
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {furniture.furnitureImages.map(({ image, imageType, sortOrder, isActive }) => (
                  <div
                    key={image.imageId}
                    className={`relative group ${!isActive ? 'opacity-50' : ''}`}
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      {image.filePath ? (
                        <img
                          src={image.filePath}
                          alt={image.altText || furniture.furnitureName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImageIcon />
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2">
                      <div className="text-xs font-medium text-gray-900">{image.fileName}</div>
                      <div className="text-xs text-gray-500">
                        {imageType} • Sıra: {sortOrder}
                        {image.width && image.height && ` • ${image.width}x${image.height}`}
                      </div>
                    </div>

                    {imageType === 'main_image' && (
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        Ana Görsel
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sağ Kolon - İstatistikler ve Hızlı Bilgiler */}
        <div className="space-y-6">
          {/* İstatistikler */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">İstatistikler</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ColorIcon />
                  <span className="text-sm text-gray-600">Renk Sayısı</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{furniture.stats.totalColors}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <PropertyIcon />
                  <span className="text-sm text-gray-600">Özellik Sayısı</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{furniture.stats.totalProperties}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ImageIcon />
                  <span className="text-sm text-gray-600">Görsel Sayısı</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{furniture.stats.totalImages}</span>
              </div>
            </div>
          </div>

          {/* Hızlı İşlemler */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h2>
            
            <div className="space-y-3">
              <Link
                href={`/admin/furniture/${furniture.furnitureId}/edit`}
                className="w-full bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm hover:bg-blue-100 transition-colors flex items-center justify-center space-x-2"
              >
                <EditIcon />
                <span>Mobilyayı Düzenle</span>
              </Link>

              <button
                onClick={handleToggleStatus}
                disabled={actionLoading}
                className={`w-full px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 ${
                  furniture.isActive
                    ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                <ToggleIcon />
                <span>{furniture.isActive ? 'Pasif Yap' : 'Aktif Yap'}</span>
              </button>

              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="w-full bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <DeleteIcon />
                <span>Mobilyayı Sil</span>
              </button>
            </div>
          </div>

          {/* Mobilya Bilgileri */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sistem Bilgileri</h2>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Mobilya ID:</span>
                <span className="ml-2 font-medium text-gray-900">#{furniture.furnitureId}</span>
              </div>
              
              <div>
                <span className="text-gray-500">Kategori ID:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {furniture.categoryId ? `#${furniture.categoryId}` : 'Yok'}
                </span>
              </div>
              
              <div>
                <span className="text-gray-500">Oluşturma:</span>
                <span className="ml-2 font-medium text-gray-900">{formatDate(furniture.createdAt)}</span>
              </div>
              
              <div>
                <span className="text-gray-500">Durum:</span>
                <span className={`ml-2 font-medium ${furniture.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {furniture.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}