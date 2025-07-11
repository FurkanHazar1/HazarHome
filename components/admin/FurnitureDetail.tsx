'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// TypeScript interfaces
interface Category {
  categoryId: number
  categoryName: string
  categoryPath?: string
  categoryLevel?: number
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
}

interface Image {
  imageId: number
  fileName: string
  filePath: string
  fileSize?: number
  fileType?: string
  description?: string
  altText?: string
  width?: number
  height?: number
  originalFileName?: string
}

interface FurnitureImage {
  sortOrder: number
  imageType: string
  isActive: boolean
  image: Image
}

interface FurnitureColor {
  isAvailable: boolean
  color: Color
}

interface FurnitureProperty {
  propertyValue: string
  isActive: boolean
  property: Property
}

interface BreadcrumbItem {
  categoryId: number
  categoryName: string
}

interface ImageGallery {
  mainImages: FurnitureImage[]
  galleryImages: FurnitureImage[]
  totalImages: number
}

interface FurnitureStats {
  totalColors: number
  totalProperties: number
  totalImages: number
}

interface Furniture {
  furnitureId: number
  furnitureName: string
  furnitureType: string
  description?: string
  price: number
  isActive: boolean
  createdAt: string
  category?: Category
  colors: FurnitureColor[]
  properties: FurnitureProperty[]
  images: FurnitureImage[]
  breadcrumb: BreadcrumbItem[]
  imageGallery: ImageGallery
  stats: FurnitureStats
}

interface APIResponse {
  success: boolean
  data?: Furniture
  error?: string
  message?: string
}

interface StatusUpdateResponse {
  success: boolean
  message?: string
  error?: string
}

// Modern Icon components using SVG
const FurnitureIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m7 21-3-3h16l-3 3" />
  </svg>
)

const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const EditIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const DeleteIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const ImageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m4 16 4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const ColorIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
  </svg>
)

const PropertyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
)

const CategoryIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
  </svg>
)

const PriceIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const StatusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const LoaderIcon = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const ExpandIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ChevronLeftIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)

const ChevronRightLargeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

interface FurnitureDetailProps {
  furnitureId: string
}

export default function FurnitureDetail({ furnitureId }: FurnitureDetailProps) {
  const router = useRouter()

  // State management
  const [furniture, setFurniture] = useState<Furniture | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false)

  // Image gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [showImageModal, setShowImageModal] = useState<boolean>(false)
  const [imageLoadError, setImageLoadError] = useState<Set<number>>(new Set())

  // Enhanced image component with better loading states
  const ImageWithFallback = ({ 
    filePath, 
    alt, 
    className, 
    onLoad, 
    onError 
  }: {
    filePath: string
    alt: string
    className: string
    onLoad?: () => void
    onError?: () => void
  }) => {
    const [currentUrlIndex, setCurrentUrlIndex] = useState(0)
    const [imageError, setImageError] = useState(false)
    const [imageLoading, setImageLoading] = useState(true)
    const [imageLoaded, setImageLoaded] = useState(false)
    
    const urls = useMemo(() => {
      if (!filePath) return []
      
      const normalizedPath = filePath.replace(/\\/g, '/')
      const cleanPath = normalizedPath.replace(/^uploads\//, '')
      
      return [
        `/api/images/serve/${cleanPath}`,           // API serving (works!)
        `/uploads/${cleanPath}`,                    // Static serving (fallback)
      ]
    }, [filePath])
    
    const handleImageError = () => {
      console.error(`❌ Image failed to load (attempt ${currentUrlIndex + 1}):`, {
        url: urls[currentUrlIndex],
        filePath: filePath
      })
      
      if (currentUrlIndex < urls.length - 1) {
        console.log(`🔄 Trying fallback URL ${currentUrlIndex + 2}:`, urls[currentUrlIndex + 1])
        setCurrentUrlIndex(prev => prev + 1)
        setImageLoading(true) // Reset loading state for new URL
      } else {
        console.error('❌ All URL attempts failed for:', filePath)
        setImageError(true)
        setImageLoading(false)
        onError?.()
      }
    }
    
    const handleImageLoad = () => {
      console.log(`✅ Image loaded successfully on attempt ${currentUrlIndex + 1}:`, urls[currentUrlIndex])
      setImageLoaded(true)
      setImageLoading(false)
      setImageError(false)
      onLoad?.()
    }
    
    const handleImageLoadStart = () => {
      setImageLoading(true)
      setImageLoaded(false)
    }
    
    if (imageError || !urls[currentUrlIndex]) {
      return (
        <div className={`${className} bg-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-gray-300`}>
          <ImageIcon />
          <p className="text-xs text-gray-500 mt-1 text-center px-2">
            Yüklenemedi
          </p>
          <p className="text-xs text-gray-400 mt-1 text-center px-2">
            {filePath.split('/').pop()}
          </p>
        </div>
      )
    }
    
    return (
      <div className={`${className} relative`}>
        {/* Loading overlay */}
        {imageLoading && !imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center animate-pulse">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-xs text-gray-600 mt-2">Yükleniyor...</p>
            </div>
          </div>
        )}
        
        <img
          key={`${currentUrlIndex}-${urls[currentUrlIndex]}`} // Force re-render on URL change
          src={urls[currentUrlIndex]}
          alt={alt}
          className={`${className} ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoadStart={handleImageLoadStart}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            minHeight: '100%',
            objectFit: 'cover'
          }}
        />
      </div>
    )
  }

  // Memoized values
  const allImages = useMemo(() => {
    if (!furniture) return []
    return [
      ...furniture.imageGallery.mainImages,
      ...furniture.imageGallery.galleryImages
    ]
  }, [furniture])

  const availableColors = useMemo(() => 
    furniture?.colors.filter(fc => fc.isAvailable) || [],
    [furniture?.colors]
  )

  const activeProperties = useMemo(() => 
    furniture?.properties.filter(fp => fp.isActive) || [],
    [furniture?.properties]
  )

  // Load furniture details
  const loadFurnitureDetail = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError('')
      
      console.log('🔄 Loading furniture details for ID:', furnitureId)
      const response = await fetch(`/api/furniture/${furnitureId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: APIResponse = await response.json()
      
      if (data.success && data.data) {
        console.log('✅ Furniture data loaded successfully')
        console.log('📊 Image data from API:', {
          totalImages: data.data.stats.totalImages,
          mainImages: data.data.imageGallery.mainImages.length,
          galleryImages: data.data.imageGallery.galleryImages.length
        })
        
        // Debug all image paths
        const allImagesData = [
          ...data.data.imageGallery.mainImages,
          ...data.data.imageGallery.galleryImages
        ]
        
        allImagesData.forEach((img, index) => {
          console.log(`🖼️ Image ${index + 1}:`, {
            id: img.image.imageId,
            fileName: img.image.fileName,
            filePath: img.image.filePath,
            imageType: img.imageType,
            isActive: img.isActive
          })
        })
        
        setFurniture(data.data)
      } else {
        setError(data.error || data.message || 'Mobilya detayları yüklenemedi')
      }
    } catch (err) {
      console.error('❌ Furniture detail loading error:', err)
      setError('Mobilya detayları yüklenemedi. Lütfen sayfayı yenileyin.')
    } finally {
      setLoading(false)
    }
  }, [furnitureId])

  // Delete furniture
  const handleDelete = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`/api/furniture/${furnitureId}`, {
        method: 'DELETE'
      })

      const data: StatusUpdateResponse = await response.json()

      if (data.success) {
        router.push('/admin/furniture')
      } else {
        setError(data.error || 'Silme işlemi başarısız')
      }
    } catch (err) {
      console.error('Silme hatası:', err)
      setError('Silme işlemi başarısız. Lütfen tekrar deneyin.')
    } finally {
      setShowDeleteConfirm(false)
    }
  }, [furnitureId, router])

  // Toggle furniture status
  const handleStatusToggle = useCallback(async (): Promise<void> => {
    if (!furniture) return

    try {
      setUpdatingStatus(true)
      
      const response = await fetch('/api/furniture', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: [furniture.furnitureId],
          isActive: !furniture.isActive
        })
      })

      const data: StatusUpdateResponse = await response.json()

      if (data.success) {
        setFurniture(prev => prev ? { ...prev, isActive: !prev.isActive } : null)
        setError('')
      } else {
        setError(data.error || 'Durum güncelleme başarısız')
      }
    } catch (err) {
      console.error('Durum güncelleme hatası:', err)
      setError('Durum güncelleme başarısız. Lütfen tekrar deneyin.')
    } finally {
      setUpdatingStatus(false)
    }
  }, [furniture])

  // Image modal navigation
  const showPreviousImage = useCallback((): void => {
    if (allImages.length > 0) {
      setSelectedImageIndex(prev => (prev > 0 ? prev - 1 : allImages.length - 1))
    }
  }, [allImages.length])

  const showNextImage = useCallback((): void => {
    if (allImages.length > 0) {
      setSelectedImageIndex(prev => (prev < allImages.length - 1 ? prev + 1 : 0))
    }
  }, [allImages.length])

  // Handle image load error
  const handleImageError = useCallback((imageId: number) => {
    setImageLoadError(prev => new Set(prev).add(imageId))
  }, [])

  // Format functions
  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price)
  }, [])

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  const formatFileSize = useCallback((bytes?: number): string => {
    if (!bytes) return 'Bilinmiyor'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }, [])

  const getResolution = useCallback((image: Image): string => {
    return image.width && image.height 
      ? `${image.width} x ${image.height} pixels`
      : 'Bilinmiyor'
  }, [])

  // Load data on component mount
  useEffect(() => {
    if (furnitureId) {
      loadFurnitureDetail()
    }
  }, [furnitureId, loadFurnitureDetail])

  // Handle keyboard navigation in image modal
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showImageModal && allImages.length > 0) {
        switch (e.key) {
          case 'ArrowLeft':
            showPreviousImage()
            break
          case 'ArrowRight':
            showNextImage()
            break
          case 'Escape':
            setShowImageModal(false)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showImageModal, allImages.length, showPreviousImage, showNextImage])

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <LoaderIcon />
              <p className="text-gray-600 font-medium">Mobilya detayları yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error State
  if (error && !furniture) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertIcon />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Hata Oluştu</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <div className="mt-6">
              <Link
                href="/admin/furniture"
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <BackIcon />
                <span className="ml-2">Mobilya Listesine Dön</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!furniture) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FurnitureIcon />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Mobilya Bulunamadı
              </h3>
              <p className="text-gray-600 mb-6">
                Bu ID'de bir mobilya mevcut değil.
              </p>
              <Link
                href="/admin/furniture"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BackIcon />
                <span className="ml-2">Mobilya Listesine Dön</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FurnitureIcon />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                  <span>{furniture.furnitureName}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    furniture.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {furniture.isActive ? '✓ Aktif' : '✕ Pasif'}
                  </span>
                </h1>
                
                {/* Breadcrumb */}
                {furniture.breadcrumb && furniture.breadcrumb.length > 0 && (
                  <nav className="flex items-center space-x-2 mt-2">
                    <CategoryIcon />
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      {furniture.breadcrumb.map((item, index) => (
                        <div key={item.categoryId} className="flex items-center space-x-2">
                          <span className="hover:text-gray-900 transition-colors">{item.categoryName}</span>
                          {index < furniture.breadcrumb.length - 1 && <ChevronRightIcon />}
                        </div>
                      ))}
                    </div>
                  </nav>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleStatusToggle}
                disabled={updatingStatus}
                className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors font-medium shadow-sm ${
                  furniture.isActive
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300'
                    : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {updatingStatus ? <LoaderIcon /> : <StatusIcon />}
                <span className="ml-2">
                  {updatingStatus 
                    ? 'Güncelleniyor...' 
                    : furniture.isActive 
                      ? 'Pasifleştir' 
                      : 'Aktifleştir'
                  }
                </span>
              </button>
              
              <Link
                href={`/admin/furniture/${furniture.furnitureId}/edit`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                <EditIcon />
                <span className="ml-2">Düzenle</span>
              </Link>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
              >
                <DeleteIcon />
                <span className="ml-2">Sil</span>
              </button>
              
              <Link
                href="/admin/furniture"
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium shadow-sm"
              >
                <BackIcon />
                <span className="ml-2">Geri Dön</span>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { 
                icon: PriceIcon, 
                label: 'Fiyat', 
                value: formatPrice(furniture.price), 
                color: 'blue',
                description: 'Satış fiyatı'
              },
              { 
                icon: ColorIcon, 
                label: 'Renkler', 
                value: furniture.stats.totalColors.toString(), 
                color: 'purple',
                description: `${availableColors.length} mevcut`
              },
              { 
                icon: PropertyIcon, 
                label: 'Özellikler', 
                value: furniture.stats.totalProperties.toString(), 
                color: 'green',
                description: `${activeProperties.length} aktif`
              },
              { 
                icon: ImageIcon, 
                label: 'Görseller', 
                value: furniture.stats.totalImages.toString(), 
                color: 'orange',
                description: `${furniture.imageGallery.mainImages.length} ana görsel`
              }
            ].map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.label}</h3>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                    <stat.icon />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertIcon />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">ℹ️</span>
                Temel Bilgiler
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Mobilya Adı</label>
                  <p className="text-gray-900 font-semibold text-lg">{furniture.furnitureName}</p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Mobilya Tipi</label>
                  <p className="text-gray-900">{furniture.furnitureType}</p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Kategori</label>
                  <p className="text-gray-900">
                    {furniture.category?.categoryName || 'Kategorisiz'}
                    {furniture.category?.parent && (
                      <span className="text-gray-500 text-sm ml-2">
                        ({furniture.category.parent.categoryName})
                      </span>
                    )}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Fiyat</label>
                  <p className="text-gray-900 font-bold text-xl text-blue-600">{formatPrice(furniture.price)}</p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Durum</label>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      furniture.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {furniture.isActive ? '✓ Aktif' : '✕ Pasif'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Oluşturma Tarihi</label>
                  <div className="flex items-center space-x-2 text-gray-900">
                    <CalendarIcon />
                    <span>{formatDate(furniture.createdAt)}</span>
                  </div>
                </div>
              </div>

              {furniture.description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="text-sm font-medium text-gray-500 block mb-2">Açıklama</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{furniture.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Colors */}
            {furniture.colors.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">🎨</span>
                    <span>Renkler</span>
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({furniture.colors.length} toplam, {availableColors.length} mevcut)
                    </span>
                  </div>
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {furniture.colors.map(({ color, isAvailable }) => (
                    <div
                      key={color.colorId}
                      className={`relative border-2 rounded-xl p-4 transition-all ${
                        isAvailable 
                          ? 'border-green-200 bg-green-50 hover:border-green-300' 
                          : 'border-red-200 bg-red-50 opacity-75'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-12 h-12 rounded-full border-2 border-white shadow-md flex-shrink-0"
                          style={{ backgroundColor: color.colorCode }}
                          title={color.colorCode}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {color.colorName}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {color.colorCode}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            isAvailable
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isAvailable ? '✓ Mevcut' : '✗ Mevcut Değil'}
                        </span>
                      </div>
                      
                      {!color.isActive && (
                        <div className="absolute top-2 right-2">
                          <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded-full">
                            Pasif
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Properties */}
            {furniture.properties.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">🏷️</span>
                  <span>Özellikler</span>
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({furniture.properties.length} toplam, {activeProperties.length} aktif)
                  </span>
                </h2>
                
                <div className="space-y-4">
                  {furniture.properties.map(({ property, propertyValue, isActive }) => (
                    <div
                      key={property.propertyId}
                      className={`border rounded-xl p-4 transition-all ${
                        isActive 
                          ? 'border-gray-200 bg-white hover:border-gray-300' 
                          : 'border-red-200 bg-red-50 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-sm font-semibold text-gray-900">
                              {property.propertyName}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              property.propertyType === 'text' ? 'bg-blue-100 text-blue-800' :
                              property.propertyType === 'number' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {property.propertyType}
                            </span>
                          </div>
                          
                          {property.description && (
                            <p className="text-xs text-gray-500 mb-2">
                              {property.description}
                            </p>
                          )}
                          
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-900 font-medium">
                              {propertyValue}
                            </p>
                          </div>
                        </div>
                        
                        <div className="ml-4 flex flex-col items-end space-y-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isActive ? '✓ Aktif' : '✗ Pasif'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Image Gallery */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">📸</span>
                  <span>Görseller</span>
                </div>
                <span className="text-sm text-gray-500">
                  {furniture.imageGallery.totalImages} görsel
                </span>
              </h2>
              
              {allImages.length > 0 ? (
                <div className="space-y-6">
                  {/* Main Images */}
                  {furniture.imageGallery.mainImages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        Ana Görseller ({furniture.imageGallery.mainImages.length})
                      </h3>
                      <div className="space-y-3">
                        {furniture.imageGallery.mainImages.map((furnitureImage, index) => (
                          <div
                            key={furnitureImage.image.imageId}
                            className="relative group cursor-pointer"
                            onClick={() => {
                              setSelectedImageIndex(index)
                              setShowImageModal(true)
                            }}
                          >
                            <div className="aspect-video rounded-lg overflow-hidden border-2 border-yellow-200 shadow-sm">
                              {!imageLoadError.has(furnitureImage.image.imageId) ? (
                                <ImageWithFallback
                                  filePath={furnitureImage.image.filePath}
                                  alt={furnitureImage.image.altText || 'Ana görsel'}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onLoad={() => {
                                    console.log('✅ Main image loaded:', furnitureImage.image.fileName)
                                  }}
                                  onError={() => {
                                    console.error('❌ Main image failed to load:', {
                                      fileName: furnitureImage.image.fileName,
                                      filePath: furnitureImage.image.filePath,
                                      imageId: furnitureImage.image.imageId
                                    })
                                    handleImageError(furnitureImage.image.imageId)
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
                                  <ImageIcon />
                                  <p className="text-xs text-gray-500 mt-1">Yüklenemedi</p>
                                </div>
                              )}
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-full p-2">
                                <ExpandIcon />
                              </div>
                            </div>
                            <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              Ana Görsel
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gallery Images */}
                  {furniture.imageGallery.galleryImages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Galeri Görselleri ({furniture.imageGallery.galleryImages.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {furniture.imageGallery.galleryImages.map((furnitureImage, index) => (
                          <div
                            key={furnitureImage.image.imageId}
                            className="relative group cursor-pointer"
                            onClick={() => {
                              setSelectedImageIndex(furniture.imageGallery.mainImages.length + index)
                              setShowImageModal(true)
                            }}
                          >
                            <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                              {!imageLoadError.has(furnitureImage.image.imageId) ? (
                                <ImageWithFallback
                                  filePath={furnitureImage.image.filePath}
                                  alt={furnitureImage.image.altText || 'Galeri görseli'}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  onError={() => handleImageError(furnitureImage.image.imageId)}
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
                                  <ImageIcon />
                                  <p className="text-xs text-gray-500 mt-1">Yüklenemedi</p>
                                </div>
                              )}
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-full p-1.5">
                                <ExpandIcon />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Gallery Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Ana Görseller:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {furniture.imageGallery.mainImages.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Galeri:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {furniture.imageGallery.galleryImages.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <ImageIcon />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Görsel Yok</h3>
                  <p className="text-sm text-gray-500">
                    Bu mobilya için henüz görsel eklenmemiş
                  </p>
                  <Link
                    href={`/admin/furniture/${furniture.furnitureId}/edit`}
                    className="inline-flex items-center px-3 py-2 mt-4 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <EditIcon />
                    <span className="ml-1">Görsel Ekle</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Image Modal */}
        {showImageModal && allImages.length > 0 && allImages[selectedImageIndex] && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-6xl max-h-full w-full">
              {/* Close Button */}
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all backdrop-blur-sm"
              >
                <CloseIcon />
              </button>

              {/* Navigation Buttons */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={showPreviousImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                  >
                    <ChevronLeftIcon />
                  </button>
                  <button
                    onClick={showNextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                  >
                    <ChevronRightLargeIcon />
                  </button>
                </>
              )}

              {/* Image Container */}
              <div className="relative bg-white rounded-lg overflow-hidden shadow-2xl">
                <div className="relative min-h-[60vh] flex items-center justify-center">
                  <ImageWithFallback
                    filePath={allImages[selectedImageIndex].image.filePath}
                    alt={allImages[selectedImageIndex].image.altText || 'Furniture image'}
                    className="max-w-full max-h-[80vh] object-contain mx-auto block"
                  />
                </div>
                
                {/* Image Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-6">
                  <div className="flex items-end justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">
                        {allImages[selectedImageIndex].image.fileName || 'Bilinmeyen dosya'}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-300">
                        <span>{getResolution(allImages[selectedImageIndex].image)}</span>
                        <span>•</span>
                        <span>{formatFileSize(allImages[selectedImageIndex].image.fileSize)}</span>
                        <span>•</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          allImages[selectedImageIndex].imageType === 'main_image'
                            ? 'bg-yellow-500 text-yellow-900'
                            : 'bg-blue-500 text-blue-900'
                        }`}>
                          {allImages[selectedImageIndex].imageType === 'main_image' ? 'Ana Görsel' : 'Galeri'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-300 mb-1">
                        {selectedImageIndex + 1} / {allImages.length}
                      </div>
                      <div className="flex space-x-1">
                        {allImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === selectedImageIndex 
                                ? 'bg-white' 
                                : 'bg-white bg-opacity-40 hover:bg-opacity-60'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-auto">
              <div className="p-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
                  <DeleteIcon />
                </div>
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Mobilya Silme Onayı
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-700 font-medium mb-2">
                      "{furniture.furnitureName}" mobilyasını silmek istediğinizden emin misiniz?
                    </p>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>• Bu işlem geri alınamaz</p>
                      <p>• Tüm görseller silinecek ({furniture.stats.totalImages} adet)</p>
                      <p>• Renk ve özellik bağlantıları kaldırılacak</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Evet, Sil
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}