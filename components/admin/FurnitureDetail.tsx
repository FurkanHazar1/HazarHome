'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'


const getImageUrl = (filePath: string): string[] => {
  if (!filePath) return []
  
  console.log('🔧 Processing image path:', filePath)
  
  const normalizedPath = filePath.replace(/\\/g, '/')
  const cleanPath = normalizedPath.replace(/^uploads\//, '')
  
  const urlOptions = [
    `/api/images/serve/${cleanPath}`,
    `/uploads/${cleanPath}`,
    `/${normalizedPath}`,
    `/${cleanPath}`
  ]
  
  console.log('🔗 Generated URLs:', urlOptions)
  return urlOptions
}
// FIXED: Unified interfaces matching API response
interface Category {
  categoryId: number
  categoryName: string
  categoryPath: string
  categoryLevel?: number
  description?: string
  isActive?: boolean
  parent?: {
    categoryId: number
    categoryName: string
    categoryPath: string
  }
  children?: {
    categoryId: number
    categoryName: string
  }[]
}

interface Color {
  colorId: number
  colorName: string
  colorCode: string
  isActive: boolean
  createdAt?: string
  isAvailable?: boolean
}

interface Property {
  propertyId: number
  propertyName: string
  propertyType: string
  description?: string
  isActive?: boolean
}

interface ImageData {
  imageId: number
  fileName: string
  filePath: string
  altText: string
  description?: string
  width?: number
  height?: number
  fileSize?: number
  fileType?: string
  originalFileName?: string
  uploadedAt?: string
  sortOrder: number
  url?: string
}

interface FurnitureImage {
  sortOrder: number
  imageType: string
  isActive: boolean
  image: ImageData
}

interface ImageGallery {
  main?: FurnitureImage[]
  gallery?: FurnitureImage[]
  thumbnails?: FurnitureImage[]
  mainImages?: FurnitureImage[]
  galleryImages?: FurnitureImage[]
  thumbnailImages?: FurnitureImage[]
  totalImages: number
  counts?: {
    main: number
    gallery: number
    thumbnails: number
  }
}

interface FurnitureProperty {
  propertyId: number
  propertyName: string
  propertyValue: string
  description?: string
  isActive: boolean
}

interface BreadcrumbItem {
  categoryId: number
  categoryName: string
  categoryPath: string
}

interface FurnitureStats {
  totalColors: number
  totalProperties: number
  totalImages: number
  totalFurnitureSets: number
  activeColors: number
  activeProperties: number
  activeImages: number
}

interface FurnitureMetadata {
  createdAt: string
  formattedPrice: string
  categoryLevel?: number
  hasMainImage: boolean
  hasGalleryImages: boolean
  hasThumbnails: boolean
  categoryBasedPath?: string
}

interface FurnitureDetail {
  furnitureId: number
  furnitureName: string
  furnitureType: string
  description?: string
  price: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
  category?: Category
  breadcrumb: BreadcrumbItem[]
  imageGallery: ImageGallery
  colorOptions: Color[]
  propertiesByType: { [key: string]: FurnitureProperty[] }
  stats: FurnitureStats
  metadata: FurnitureMetadata
}

interface ApiResponse {
  success: boolean
  data?: FurnitureDetail
  error?: string
  details?: string
}

// Enhanced Icon Components
const ArrowLeftIcon = () => (
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

const LoaderIcon = () => (
  <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const TagIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
)

const ImageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m4 16 4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ColorIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const ZoomInIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
  </svg>
)

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)

// Enhanced Image Component with zoom and fallback
const FurnitureImageDisplay = ({ 
  image, 
  alt, 
  className = "w-full h-full",
  showZoom = false,
  showFallback = true,
  onZoom,
  priority = false
}: {
  image: ImageData | null
  alt: string
  className?: string
  showZoom?: boolean
  onZoom?: () => void
  priority?: boolean
  showFallback?: boolean
}) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const urls = useMemo(() => {
    return image ? getImageUrl(image.filePath) : []
  }, [image])

  const handleImageError = useCallback(() => {
    if (currentUrlIndex < urls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1)
      setImageError(false)
    } else {
      setImageError(true)
    }
  }, [currentUrlIndex, urls.length])

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
    setImageError(false)
  }, [])

if (!image || imageError || !urls[currentUrlIndex]) {
    return showFallback ? (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300`}>
        <ImageIcon />
      </div>
    ) : null
  }

  return (
    <div className={`${className} relative group overflow-hidden rounded-lg`}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
          <LoaderIcon />
        </div>
      )}
      
      <Image
        src={urls[currentUrlIndex]}
        alt={alt}
        fill
        priority={priority}
        className={`object-cover transition-all duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        } ${showZoom ? 'group-hover:scale-105 cursor-zoom-in' : ''}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      
      {showZoom && onZoom && imageLoaded && (
        <button
          onClick={onZoom}
          className="group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center"
        >
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white rounded-full p-2 shadow-lg">
            <ZoomInIcon />
          </div>
        </button>
      )}
      
      <div className="absolute inset-0 ring-1 ring-black ring-opacity-10 rounded-lg"></div>
    </div>
  )
}

// Image Zoom Modal
const ImageZoomModal = ({ 
  image, 
  isOpen, 
  onClose 
}: {
  image: ImageData | null
  isOpen: boolean
  onClose: () => void
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !image) return null

  const imageUrl = image.url || `/api/images/serve/${image.filePath.replace(/^uploads\//, '')}`

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-7xl max-h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="relative">
          <Image
            src={imageUrl}
            alt={image.altText || 'Furniture image'}
            width={image.width || 800}
            height={image.height || 600}
            className="max-w-full max-h-[90vh] object-contain"
          />
          
          {image.fileName && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
              {image.fileName}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FurnitureDetail({ furnitureId }: { furnitureId: number }) {
  const router = useRouter()
  
  // State management
  const [furniture, setFurniture] = useState<FurnitureDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  
  // Image gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [showImageZoom, setShowImageZoom] = useState<boolean>(false)
  const [zoomImage, setZoomImage] = useState<ImageData | null>(null)
  
  // UI state
  const [activeTab, setActiveTab] = useState<string>('details')

  // Load furniture details
  const loadFurnitureDetail = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = new URLSearchParams({
        groupImagesByType: 'true',
        includeInactive: 'false'
      })

      console.log('🔄 Loading furniture detail:', furnitureId)

      const response = await fetch(`/api/furniture/${furnitureId}?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      
      if (data.success && data.data) {
        setFurniture(data.data)
        console.log('✅ Furniture detail loaded:', data.data)
      } else {
        setError(data.error || 'Mobilya detayları yüklenemedi')
      }
    } catch (err) {
      console.error('❌ Furniture detail loading error:', err)
      setError('Mobilya detayları yüklenemedi. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }, [furnitureId])

  // Delete furniture
  const handleDelete = async () => {
    if (!furniture) return
    
    const confirmed = window.confirm(
      `"${furniture.furnitureName}" mobilyasını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
    )
    
    if (!confirmed) return

    try {
      const response = await fetch(`/api/furniture/${furniture.furnitureId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        router.push('/admin/furniture?deleted=true')
      } else {
        setError(result.error || 'Silme işlemi başarısız')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError('Silme işlemi başarısız. Lütfen tekrar deneyin.')
    }
  }

  // Image gallery functions
  const getAllImages = useMemo(() => {
    if (!furniture?.imageGallery) return []
    
    const allImages: FurnitureImage[] = []
    
    // Add main images first
    if (furniture.imageGallery.main) {
      allImages.push(...furniture.imageGallery.main)
    } else if (furniture.imageGallery.mainImages) {
      allImages.push(...furniture.imageGallery.mainImages)
    }
    
    // Add gallery images
    if (furniture.imageGallery.gallery) {
      allImages.push(...furniture.imageGallery.gallery)
    } else if (furniture.imageGallery.galleryImages) {
      allImages.push(...furniture.imageGallery.galleryImages)
    }
    
    return allImages.sort((a, b) => a.sortOrder - b.sortOrder)
  }, [furniture?.imageGallery])

  const selectedImage = useMemo(() => {
    return getAllImages[selectedImageIndex]?.image || null
  }, [getAllImages, selectedImageIndex])

  const handleImageZoom = useCallback((image: ImageData) => {
    setZoomImage(image)
    setShowImageZoom(true)
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

  // Load data on mount
  useEffect(() => {
    loadFurnitureDetail()
  }, [loadFurnitureDetail])

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
              <div className="flex items-center space-x-4">
                <LoaderIcon />
                <span className="text-gray-600 font-medium">Mobilya detayları yükleniyor...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && furniture && (
          <>
            {/* Header with Breadcrumb */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => router.back()}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all duration-200"
                >
                  <ArrowLeftIcon />
                  <span>Geri</span>
                </button>
                
                <div className="flex items-center space-x-3">
                  <Link
                    href={`/admin/furniture/${furniture.furnitureId}/edit`}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <EditIcon />
                    <span>Düzenle</span>
                  </Link>
                  
                  <button
                    onClick={handleDelete}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <DeleteIcon />
                    <span>Sil</span>
                  </button>
                </div>
              </div>

              {/* Breadcrumb */}
              {furniture.breadcrumb && furniture.breadcrumb.length > 0 && (
                <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                  <Link href="/admin/furniture" className="hover:text-blue-600">
                    Mobilyalar
                  </Link>
                  {furniture.breadcrumb.map((item, index) => (
                    <div key={item.categoryId} className="flex items-center space-x-2">
                      <ChevronRightIcon />
                      <span className="text-gray-800">{item.categoryName}</span>
                    </div>
                  ))}
                  <ChevronRightIcon />
                  <span className="text-gray-800 font-medium">{furniture.furnitureName}</span>
                </nav>
              )}

              {/* Title and Status */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {furniture.furnitureName}
                  </h1>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg text-gray-600">{furniture.furnitureType}</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      furniture.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {furniture.isActive ? '✓ Aktif' : '✕ Pasif'}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {furniture.metadata.formattedPrice}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    ID: {furniture.furnitureId}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              
              {/* Image Gallery */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                  <div className="aspect-square relative">
                    {selectedImage ? (
                      <FurnitureImageDisplay
                        image={selectedImage}
                        alt={furniture.furnitureName}
                        showZoom={true}
                        onZoom={() => handleImageZoom(selectedImage)}
                        priority={true}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <ImageIcon />
                          <p className="text-sm mt-2">Görsel bulunamadı</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Thumbnail Navigation */}
                {getAllImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {getAllImages.map((imageItem, index) => (
                      <button
                        key={`${imageItem.image.imageId}-${index}`}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          selectedImageIndex === index
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <FurnitureImageDisplay
                          image={imageItem.image}
                          alt={`${furniture.furnitureName} - ${index + 1}`}
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Image Stats */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{furniture.stats.totalImages}</div>
                      <div className="text-sm text-gray-600">Toplam Görsel</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{furniture.stats.activeImages}</div>
                      <div className="text-sm text-gray-600">Aktif Görsel</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {(furniture.imageGallery.main?.length || furniture.imageGallery.mainImages?.length || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Ana Görsel</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Information */}
              <div className="space-y-6">
                
                {/* Quick Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TagIcon />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Kategori</h3>
                        <p className="text-sm text-gray-600">{furniture.category?.categoryName || 'Kategorisiz'}</p>
                      </div>
                    </div>
                    {furniture.category?.description && (
                      <p className="text-sm text-gray-500">{furniture.category.description}</p>
                    )}
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CalendarIcon />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Oluşturulma</h3>
                        <p className="text-sm text-gray-600">{formatDate(furniture.createdAt)}</p>
                      </div>
                    </div>
                    {furniture.updatedAt && furniture.updatedAt !== furniture.createdAt && (
                      <p className="text-sm text-gray-500">
                        Güncellendi: {formatDate(furniture.updatedAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                {furniture.description && (
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center space-x-2 mb-4">
                      <InfoIcon />
                      <h3 className="text-lg font-semibold text-gray-900">Açıklama</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{furniture.description}</p>
                  </div>
                )}

                {/* Colors */}
                {furniture.colorOptions && furniture.colorOptions.length > 0 && (
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center space-x-2 mb-4">
                      <ColorIcon />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Renkler ({furniture.colorOptions.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {furniture.colorOptions.map(color => (
                        <div key={color.colorId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div
                            className="w-8 h-8 rounded-full border-2 border-white shadow-md ring-1 ring-gray-200"
                            style={{ backgroundColor: color.colorCode }}
                            title={color.colorCode}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{color.colorName}</p>
                            <p className="text-xs text-gray-500">{color.colorCode}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats Summary */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">İstatistikler</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">{furniture.stats.totalColors}</div>
                      <div className="text-sm text-gray-600">Toplam Renk</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">{furniture.stats.totalProperties}</div>
                      <div className="text-sm text-gray-600">Toplam Özellik</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Properties Section */}
            {Object.keys(furniture.propertiesByType).length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <TagIcon />
                    <span>Özellikler ({furniture.stats.totalProperties})</span>
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-6">
                    {Object.entries(furniture.propertiesByType).map(([type, properties]) => (
                      <div key={type} className="border-l-4 border-blue-500 pl-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                          {type} ({properties.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {properties.map((property) => (
                            <div key={property.propertyId} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900">{property.propertyName}</h4>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  property.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {property.isActive ? 'Aktif' : 'Pasif'}
                                </span>
                              </div>
                              <p className="text-gray-700 font-medium">{property.propertyValue}</p>
                              {property.description && (
                                <p className="text-sm text-gray-500 mt-1">{property.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Metadata Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Teknik Bilgiler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Mobilya ID:</span>
                  <p className="text-gray-900">{furniture.furnitureId}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Kategori Seviyesi:</span>
                  <p className="text-gray-900">{furniture.metadata.categoryLevel || 'Bilinmiyor'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Ana Görsel:</span>
                  <p className="text-gray-900">{furniture.metadata.hasMainImage ? 'Var' : 'Yok'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Galeri Görselleri:</span>
                  <p className="text-gray-900">{furniture.metadata.hasGalleryImages ? 'Var' : 'Yok'}</p>
                </div>
              </div>
              
              {furniture.metadata.categoryBasedPath && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="font-medium text-gray-600">Kategori Tabanlı Path:</span>
                  <p className="text-sm text-gray-700 font-mono mt-1">{furniture.metadata.categoryBasedPath}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Image Zoom Modal */}
        <ImageZoomModal
          image={zoomImage}
          isOpen={showImageZoom}
          onClose={() => setShowImageZoom(false)}
        />
      </div>
    </div>
  )
}