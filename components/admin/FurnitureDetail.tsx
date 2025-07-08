'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// TypeScript interfaces
interface Category {
  categoryId: number
  categoryName: string
  categoryPath: string
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
}

interface FurnitureImage {
  id: number
  imageType: string
  sortOrder: number
  isActive: boolean
  image: {
    imageId: number
    fileName: string
    filePath: string
    altText: string
    width?: number
    height?: number
    fileSize?: number
  }
}

// API Response types for upload integration
interface ApiResponse<T> {
  success: boolean
  message?: string
  error?: string
  details?: string
  data?: T
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

interface FurnitureDetail {
  furnitureId: number
  furnitureName: string
  furnitureType: string
  price: number
  description: string
  isActive: boolean
  createdAt: string
  category?: Category
  colors?: Array<{
    id: number
    isAvailable: boolean
    color: Color
  }>
  properties?: Array<{
    id: number
    propertyValue: string
    isActive: boolean
    property: Property
  }>
  images?: FurnitureImage[]
  breadcrumb: Array<{
    categoryId: number
    categoryName: string
  }>
  imageGallery: {
    mainImages: FurnitureImage[]
    galleryImages: FurnitureImage[]
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
const FurnitureIcon = () => <span className="text-xl">🪑</span>
const BackIcon = () => <span className="text-lg">←</span>
const EditIcon = () => <span className="text-lg">✏️</span>
const DeleteIcon = () => <span className="text-lg">🗑️</span>
const CategoryIcon = () => <span className="text-sm">📂</span>
const ColorIcon = () => <span className="text-sm">🎨</span>
const PropertyIcon = () => <span className="text-sm">🏷️</span>
const ImageIcon = () => <span className="text-sm">🖼️</span>
const LoaderIcon = () => <span className="text-lg animate-spin">⏳</span>
const StatusIcon = () => <span className="text-sm">🔄</span>
const PriceIcon = () => <span className="text-sm">💰</span>
const InfoIcon = () => <span className="text-sm">ℹ️</span>
const StatsIcon = () => <span className="text-sm">📊</span>
const CalendarIcon = () => <span className="text-sm">📅</span>
const TrashIcon = () => <span className="text-sm">🗑️</span>
const RefreshIcon = () => <span className="text-sm">🔄</span>

export default function FurnitureDetail({ furnitureId }: FurnitureDetailProps) {
  const router = useRouter()
  
  // State management
  const [furniture, setFurniture] = useState<FurnitureDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [deleting, setDeleting] = useState<boolean>(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)
  const [refreshingImages, setRefreshingImages] = useState<boolean>(false)

  // Load furniture detail
  const loadFurnitureDetail = async (): Promise<void> => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/furniture/${furnitureId}`)
      const data = await response.json()
      
      if (data.success) {
        setFurniture(data.data)
      } else {
        setError(data.error || 'Mobilya bulunamadı')
      }
    } catch (err) {
      console.error('Furniture detail loading error:', err)
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  // Load images from upload API
  const loadImagesFromAPI = async (): Promise<void> => {
    try {
      setRefreshingImages(true)
      
      const response = await fetch(`/api/upload?furnitureId=${furnitureId}`)
      const data: ApiResponse<ImageListItem[]> = await response.json()
      
      if (data.success && data.data && furniture) {
        // Convert API images to furniture image format
        const apiImages: FurnitureImage[] = data.data.map((img, index) => ({
          id: img.imageId,
          imageType: img.imageType,
          sortOrder: img.sortOrder,
          isActive: true,
          image: {
            imageId: img.imageId,
            fileName: img.fileName,
            filePath: img.webPath, // Use webPath for display
            altText: img.altText || img.fileName,
            width: img.width,
            height: img.height,
            fileSize: img.fileSize
          }
        }))
        
        // Update furniture state with fresh images
        const mainImages = apiImages.filter(img => img.imageType === 'main_image')
        const galleryImages = apiImages.filter(img => img.imageType === 'gallery')
        
        setFurniture(prev => prev ? {
          ...prev,
          images: apiImages,
          imageGallery: {
            mainImages,
            galleryImages,
            totalImages: apiImages.length
          },
          stats: {
            ...prev.stats,
            totalImages: apiImages.length
          }
        } : null)
      }
    } catch (err) {
      console.error('Images loading error:', err)
    } finally {
      setRefreshingImages(false)
    }
  }

  // Delete image using upload API
  const deleteImage = async (imageId: number): Promise<void> => {
    if (!confirm('Bu görseli silmek istediğinizden emin misiniz?')) return
    
    try {
      setDeletingImageId(imageId)
      
      const response = await fetch(`/api/upload?imageId=${imageId}`, {
        method: 'DELETE'
      })
      
      const data: ApiResponse<any> = await response.json()
      
      if (data.success) {
        // Refresh images from API
        await loadImagesFromAPI()
        
        // Reset selected index if needed
        const allImages = getAllImages()
        if (selectedImageIndex >= allImages.length && allImages.length > 0) {
          setSelectedImageIndex(allImages.length - 1)
        }
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

  // Load data on mount
  useEffect(() => {
    loadFurnitureDetail()
  }, [furnitureId])

  // Load images from API when furniture is loaded
  useEffect(() => {
    if (furniture) {
      loadImagesFromAPI()
    }
  }, [furniture?.furnitureId])

  // Delete furniture
  const handleDelete = async (): Promise<void> => {
    if (!furniture) return
    
    const confirmed = confirm(
      `"${furniture.furnitureName}" mobilyasını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
    )
    
    if (!confirmed) return
    
    try {
      setDeleting(true)
      
      const response = await fetch(`/api/furniture/${furnitureId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        router.push('/admin/furniture')
      } else {
        setError(data.error || 'Silme işlemi başarısız')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError('Silme sırasında hata oluştu')
    } finally {
      setDeleting(false)
    }
  }

  // Toggle status
  const toggleStatus = async (): Promise<void> => {
    if (!furniture) return
    
    try {
      const response = await fetch(`/api/furniture`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: [furniture.furnitureId],
          isActive: !furniture.isActive
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setFurniture(prev => prev ? { ...prev, isActive: !prev.isActive } : prev)
      } else {
        setError('Durum değiştirme başarısız')
      }
    } catch (err) {
      console.error('Status toggle error:', err)
      setError('Durum değiştirme sırasında hata oluştu')
    }
  }

  // Format price
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price)
  }

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Bilinmiyor'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  // Get all images for gallery
  const getAllImages = (): FurnitureImage[] => {
    if (!furniture) return []
    return [...(furniture.imageGallery.mainImages || []), ...(furniture.imageGallery.galleryImages || [])]
  }

  const allImages = getAllImages()

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoaderIcon />
          <span className="ml-2 text-gray-600">Mobilya yükleniyor...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && furniture && (
        <>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                {/* Breadcrumb */}
                {furniture.breadcrumb && furniture.breadcrumb.length > 0 && (
                  <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                    <Link href="/admin/furniture" className="hover:text-gray-700">
                      Mobilyalar
                    </Link>
                    {furniture.breadcrumb.map((item, index) => (
                      <span key={item.categoryId} className="flex items-center space-x-2">
                        <span>→</span>
                        <span>{item.categoryName}</span>
                      </span>
                    ))}
                    <span>→</span>
                    <span className="text-gray-900">{furniture.furnitureName}</span>
                  </nav>
                )}
                
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                  <FurnitureIcon />
                  <span>{furniture.furnitureName}</span>
                  <span className={`px-3 py-1 text-sm rounded-full ${
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
              
              <div className="flex items-center space-x-3">
                <Link
                  href="/admin/furniture"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <BackIcon />
                  <span>Geri Dön</span>
                </Link>
                
                <button
                  onClick={toggleStatus}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    furniture.isActive
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  <StatusIcon />
                  <span>{furniture.isActive ? 'Pasif Yap' : 'Aktif Yap'}</span>
                </button>
                
                <Link
                  href={`/admin/furniture/${furnitureId}/edit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <EditIcon />
                  <span>Düzenle</span>
                </Link>
                
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {deleting ? <LoaderIcon /> : <DeleteIcon />}
                  <span>{deleting ? 'Siliniyor...' : 'Sil'}</span>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ImageIcon />
                    <span className="text-sm text-gray-600">Toplam Görsel</span>
                  </div>
                  <button
                    onClick={loadImagesFromAPI}
                    disabled={refreshingImages}
                    className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    title="Görselleri yenile"
                  >
                    {refreshingImages ? <LoaderIcon /> : <RefreshIcon />}
                  </button>
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{furniture.stats.totalImages}</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <ColorIcon />
                  <span className="text-sm text-gray-600">Renk Seçeneği</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{furniture.stats.totalColors}</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <PropertyIcon />
                  <span className="text-sm text-gray-600">Özellik</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{furniture.stats.totalProperties}</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <CalendarIcon />
                  <span className="text-sm text-gray-600">Oluşturma</span>
                </div>
                <div className="text-sm font-medium text-gray-900 mt-1">{formatDate(furniture.createdAt)}</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Images */}
            <div className="space-y-4">
              {/* Main Image Display */}
              {allImages.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="aspect-square bg-gray-100 relative">
                    <img
                      src={allImages[selectedImageIndex]?.image.filePath || '/images/placeholder-furniture.jpg'}
                      alt={allImages[selectedImageIndex]?.image.altText || furniture.furnitureName}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Image Type Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        allImages[selectedImageIndex]?.imageType === 'main_image'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {allImages[selectedImageIndex]?.imageType === 'main_image' ? 'Ana Görsel' : 'Galeri'}
                      </span>
                    </div>

                    {/* Delete Image Button */}
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={() => deleteImage(allImages[selectedImageIndex].image.imageId)}
                        disabled={deletingImageId === allImages[selectedImageIndex].image.imageId}
                        className="bg-red-500 bg-opacity-80 text-white p-2 rounded-full hover:bg-opacity-90 transition-opacity disabled:opacity-50"
                        title="Görseli sil"
                      >
                        {deletingImageId === allImages[selectedImageIndex].image.imageId ? <LoaderIcon /> : <TrashIcon />}
                      </button>
                    </div>

                    {/* Navigation Arrows */}
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedImageIndex(prev => prev > 0 ? prev - 1 : allImages.length - 1)}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => setSelectedImageIndex(prev => prev < allImages.length - 1 ? prev + 1 : 0)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                        >
                          →
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    {allImages.length > 1 && (
                      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {selectedImageIndex + 1} / {allImages.length}
                      </div>
                    )}
                  </div>

                  {/* Image Info */}
                  <div className="p-4">
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{allImages[selectedImageIndex]?.image.fileName}</div>
                        <div className="text-green-600 text-xs">ID: {allImages[selectedImageIndex]?.image.imageId}</div>
                      </div>
                      {allImages[selectedImageIndex]?.image.width && allImages[selectedImageIndex]?.image.height && (
                        <div>
                          {allImages[selectedImageIndex]?.image.width} × {allImages[selectedImageIndex]?.image.height} px
                        </div>
                      )}
                      {allImages[selectedImageIndex]?.image.fileSize && (
                        <div>{formatFileSize(allImages[selectedImageIndex]?.image.fileSize)}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Tüm Görseller</h3>
                    <span className="text-xs text-gray-500">API entegreli</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {allImages.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors relative ${
                          selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image.image.filePath}
                          alt={image.image.altText}
                          className="w-full h-full object-cover"
                        />
                        {/* Sort order badge */}
                        <div className="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                          {image.sortOrder}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No Images */}
              {allImages.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <ImageIcon />
                  <p className="text-gray-500 mt-2">Henüz görsel eklenmemiş</p>
                  <Link
                    href={`/admin/furniture/${furnitureId}/edit`}
                    className="inline-block mt-3 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Görsel eklemek için düzenle
                  </Link>
                </div>
              )}
            </div>

            {/* Information */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <InfoIcon />
                  <span>Temel Bilgiler</span>
                </h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Mobilya Adı</label>
                      <div className="text-sm text-gray-900 mt-1">{furniture.furnitureName}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Mobilya Tipi</label>
                      <div className="text-sm text-gray-900 mt-1">{furniture.furnitureType}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Fiyat</label>
                      <div className="text-lg font-bold text-blue-600 mt-1">{formatPrice(furniture.price)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Kategori</label>
                      <div className="text-sm text-gray-900 mt-1">
                        {furniture.category?.categoryName || 'Kategori atanmamış'}
                      </div>
                    </div>
                  </div>
                  
                  {furniture.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Açıklama</label>
                      <div className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{furniture.description}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Colors */}
              {furniture.colors && furniture.colors.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <ColorIcon />
                    <span>Renk Seçenekleri ({furniture.colors.length})</span>
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {furniture.colors.map((furnitureColor) => (
                      <div
                        key={furnitureColor.id}
                        className={`border rounded-lg p-3 ${
                          furnitureColor.isAvailable ? 'border-gray-200' : 'border-gray-100 opacity-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {furnitureColor.color.colorCode && (
                            <div
                              className="w-6 h-6 rounded-full border border-gray-300"
                              style={{ backgroundColor: furnitureColor.color.colorCode }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {furnitureColor.color.colorName}
                            </div>
                            {furnitureColor.color.colorCode && (
                              <div className="text-xs text-gray-500">
                                {furnitureColor.color.colorCode}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {!furnitureColor.isAvailable && (
                          <div className="text-xs text-red-600 mt-1">Mevcut değil</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Properties */}
              {furniture.properties && furniture.properties.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <PropertyIcon />
                    <span>Özellikler ({furniture.properties.length})</span>
                  </h2>
                  
                  <div className="space-y-3">
                    {furniture.properties.map((furnitureProperty) => (
                      <div
                        key={furnitureProperty.id}
                        className={`border rounded-lg p-3 ${
                          furnitureProperty.isActive ? 'border-gray-200' : 'border-gray-100 opacity-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {furnitureProperty.property.propertyName}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {furnitureProperty.propertyValue}
                            </div>
                            {furnitureProperty.property.description && (
                              <div className="text-xs text-gray-500 mt-1">
                                {furnitureProperty.property.description}
                              </div>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            furnitureProperty.property.propertyType === 'text' ? 'bg-blue-100 text-blue-800' :
                            furnitureProperty.property.propertyType === 'number' ? 'bg-green-100 text-green-800' :
                            furnitureProperty.property.propertyType === 'boolean' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {furnitureProperty.property.propertyType}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* System Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <StatsIcon />
                  <span>Sistem Bilgileri</span>
                </h2>
                
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mobilya ID:</span>
                    <span className="text-gray-900 font-mono">#{furniture.furnitureId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Oluşturma Tarihi:</span>
                    <span className="text-gray-900">{formatDate(furniture.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Durum:</span>
                    <span className={`font-medium ${furniture.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {furniture.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">API Entegrasyonu:</span>
                    <span className="text-green-600 font-medium">✓ Aktif</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Not Found */}
      {!loading && !furniture && !error && (
        <div className="text-center py-12">
          <FurnitureIcon />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Mobilya bulunamadı</h3>
          <p className="mt-1 text-sm text-gray-500">
            Belirtilen ID'ye sahip mobilya mevcut değil.
          </p>
          <div className="mt-6">
            <Link
              href="/admin/furniture"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <BackIcon />
              <span className="ml-2">Mobilya Listesine Dön</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}