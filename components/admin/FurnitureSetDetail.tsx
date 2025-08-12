'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

// Utility function for image URLs - Updated for new system
const getImageUrl = (filePath: string): string[] => {
  if (!filePath) return []
  
  // New system: Direct public URLs
  const normalizedPath = filePath.replace(/\\/g, '/')
  
  // Priority order for new image system
  const urlOptions = [
    // New structure: /uploads/images/furniture-sets/{category-slug}/{id}/image_{sortOrder}.jpg
    normalizedPath.startsWith('/uploads/') ? normalizedPath : `/uploads/${normalizedPath.replace(/^uploads\//, '')}`,
    // Legacy fallback
    normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`,
    // API serve fallback (deprecated but still functional)
    `/api/images/serve/${normalizedPath.replace(/^uploads\//, '')}`
  ]
  
  return urlOptions
}

// Types (same as original but condensed for space)
interface Category {
  categoryId: number
  categoryName: string
  categoryPath: string
  categoryLevel?: number
  description?: string
  isActive?: boolean
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
  sortOrder: number
  url?: string
}

interface FurnitureSetImage {
  sortOrder: number
  imageType: string
  isActive: boolean
  image: ImageData
}

interface ImageGallery {
  main?: FurnitureSetImage[]
  gallery?: FurnitureSetImage[]
  thumbnails?: FurnitureSetImage[]
  totalImages: number
}

interface FurnitureSetProperty {
  propertyId: number
  propertyName: string
  propertyValue: string
  description?: string
  isActive: boolean
}

interface FurnitureItem {
  furnitureId: number
  quantity: number
  sortOrder: number
  itemTotalPrice: number
  formattedItemPrice: string
  formattedItemTotalPrice: string
  furniture: {
    furnitureId: number
    furnitureName: string
    furnitureType: string
    price: number
    isActive: boolean
    images?: Array<{
      image: ImageData
      imageType: string
      sortOrder: number
      isActive: boolean
    }>
  }
}

interface PricingAnalysis {
  setPrice: number
  totalIndividualPrice: number
  savings: number
  savingsPercentage: number
  isSetCheaper: boolean
  formattedSetPrice: string
  formattedIndividualPrice: string
  formattedSavings: string
}

interface FurnitureSetStats {
  totalColors: number
  totalProperties: number
  totalImages: number
  totalFurnitureItems: number
  totalQuantity: number
  uniqueFurnitureCount: number
  activeFurnitureCount: number
}

interface FurnitureSetDetail {
  setId: number
  setName: string
  description?: string
  price: number
  isActive: boolean
  createdAt: string
  category?: Category
  imageGallery: ImageGallery
  colorOptions: Color[]
  propertiesByType: { [key: string]: FurnitureSetProperty[] }
  furnitureItems: FurnitureItem[]
  pricingAnalysis?: PricingAnalysis
  stats: FurnitureSetStats
  metadata: {
    formattedPrice: string
    hasMainImage: boolean
    hasGalleryImages: boolean
  }
}

// Modern Dark Theme Icons
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

const ImageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m4 16 4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const ZoomInIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
  </svg>
)

const TagIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const CurrencyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const PackageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const ColorIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
  </svg>
)

const StarIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)

// Enhanced Image Component with Dark Theme
const FurnitureSetImageDisplay = ({ 
  image, 
  alt, 
  className = "w-full h-full",
  showZoom = false,
  onZoom,
  priority = false
}: {
  image: ImageData | null
  alt: string
  className?: string
  showZoom?: boolean
  onZoom?: () => void
  priority?: boolean
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
    return (
      <div className={`${className} bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700`}>
        <div className="text-slate-500">
          <ImageIcon />
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} relative group overflow-hidden rounded-xl`}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse rounded-xl flex items-center justify-center">
          <LoaderIcon />
        </div>
      )}
      
      <Image
        src={urls[currentUrlIndex]}
        alt={alt}
        fill
        priority={priority}
        className={`object-cover transition-all duration-500 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        } ${showZoom ? 'group-hover:scale-110 cursor-zoom-in' : ''}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      
      {showZoom && onZoom && imageLoaded && (
        <button
          onClick={onZoom}
          className="bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center"
        >
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-full p-3 shadow-lg">
            <ZoomInIcon />
          </div>
        </button>
      )}
      
      <div className="absolute inset-0 ring-1 ring-white ring-opacity-10 rounded-xl"></div>
    </div>
  )
}

// Image Zoom Modal with Dark Theme
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

  const imageUrl = image.url || `/uploads/${image.filePath.replace(/^uploads\//, '')}`

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="relative max-w-7xl max-h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 backdrop-blur-sm rounded-full p-2 transition-all duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="relative">
          <Image
            src={imageUrl}
            alt={image.altText || 'Furniture set image'}
            width={image.width || 800}
            height={image.height || 600}
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
          />
          
          {image.fileName && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-white border-opacity-20">
              {image.fileName}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ApiResponse {
  success: boolean
  data?: FurnitureSetDetail
  error?: string
  details?: string
}

export default function ModernFurnitureSetDetail({ setId }: { setId: number }) {
  const router = useRouter()
  
  // State management
  const [furnitureSet, setFurnitureSet] = useState<FurnitureSetDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  
  // Image gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [showImageZoom, setShowImageZoom] = useState<boolean>(false)
  const [zoomImage, setZoomImage] = useState<ImageData | null>(null)
  
  // Load furniture set details from API
  const loadFurnitureSetDetail = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = new URLSearchParams({
        groupImagesByType: 'true',
        includeFurnitureDetails: 'true',
        calculatePricing: 'true',
        includeInactive: 'false'
      })

      console.log('🔄 Loading furniture set detail:', setId)

      const response = await fetch(`/api/furniture-sets/${setId}?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      
      if (data.success && data.data) {
        setFurnitureSet(data.data)
        console.log('✅ Furniture set detail loaded:', data.data)
      } else {
        setError(data.error || 'Mobilya takımı detayları yüklenemedi')
      }
    } catch (err) {
      console.error('❌ Furniture set detail loading error:', err)
      setError('Mobilya takımı detayları yüklenemedi. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }, [setId])

  // Delete furniture set
  const handleDelete = async () => {
    if (!furnitureSet) return
    
    const confirmed = window.confirm(
      `"${furnitureSet.setName}" mobilya takımını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
    )
    
    if (!confirmed) return

    try {
      const response = await fetch(`/api/furniture-sets/${furnitureSet.setId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        router.push('/admin/furniture-sets?deleted=true')
      } else {
        setError(result.error || 'Silme işlemi başarısız')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError('Silme işlemi başarısız. Lütfen tekrar deneyin.')
    }
  }

  // Load data on mount
  useEffect(() => {
    loadFurnitureSetDetail()
  }, [loadFurnitureSetDetail])

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Image gallery functions
  const getAllImages = useMemo(() => {
    if (!furnitureSet?.imageGallery) return []
    
    const allImages: FurnitureSetImage[] = []
    
    if (furnitureSet.imageGallery.main) {
      allImages.push(...furnitureSet.imageGallery.main)
    }
    
    if (furnitureSet.imageGallery.gallery) {
      allImages.push(...furnitureSet.imageGallery.gallery)
    }
    
    return allImages.sort((a, b) => a.sortOrder - b.sortOrder)
  }, [furnitureSet?.imageGallery])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-indigo-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 border border-white/20 shadow-2xl">
              <div className="flex items-center space-x-4">
                <LoaderIcon />
                <span className="text-white font-medium text-lg">Mobilya takımı detayları yükleniyor...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-100 px-6 py-4 rounded-2xl mb-6 shadow-lg">
            <div className="flex items-center space-x-2">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && furnitureSet && (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => router.back()}
                  className="group flex items-center space-x-3 px-6 py-3 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-2xl transition-all duration-300 border border-white/20 hover:border-white/30"
                >
                  <ArrowLeftIcon />
                  <span className="font-medium">Geri Dön</span>
                </button>
                
                <div className="flex items-center space-x-4">
                  <Link
                    href={`/admin/furniture-sets/${furnitureSet?.setId || 0}/edit`}
                    className="group flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <EditIcon />
                    <span className="font-medium">Düzenle</span>
                  </Link>
                  
                  <button
                    onClick={handleDelete}
                    className="group flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <DeleteIcon />
                    <span className="font-medium">Sil</span>
                  </button>
                </div>
              </div>

              {/* Title Section */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center space-x-3 px-6 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-4 border border-white/20">
                  <TagIcon />
                  <span className="text-white/80 font-medium">{furnitureSet?.category?.categoryName || 'Kategorisiz'}</span>
                </div>
                
                <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent mb-4 leading-tight">
                  {furnitureSet?.setName || 'Mobilya Takımı'}
                </h1>
                
                <div className="flex items-center justify-center space-x-6 text-white/80">
                  <div className="flex items-center space-x-2">
                    <PackageIcon />
                    <span>{furnitureSet?.stats?.uniqueFurnitureCount || 0} Mobilya</span>
                  </div>
                  <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                  <div className="flex items-center space-x-2">
                    <span>{furnitureSet?.stats?.totalQuantity || 0} Adet</span>
                  </div>
                  <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                  <div className={`inline-flex items-center px-4 py-1 rounded-full text-sm font-medium ${
                    furnitureSet?.isActive 
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {furnitureSet?.isActive ? '✓ Aktif' : '✕ Pasif'}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                    {furnitureSet?.metadata?.formattedPrice || '₺0'}
                  </div>
                  {furnitureSet?.pricingAnalysis?.isSetCheaper && (
                    <div className="mt-2 inline-flex items-center space-x-2 px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full border border-green-500/30">
                      <StarIcon />
                      <span className="text-green-300 font-medium">
                        {furnitureSet.pricingAnalysis.formattedSavings} tasarruf
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-12">
              
              {/* Image Gallery - 7 columns */}
              <div className="xl:col-span-7 space-y-6">
                <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 shadow-2xl">
                  <div className="aspect-square relative rounded-2xl overflow-hidden mb-6">
                    {selectedImage ? (
                      <FurnitureSetImageDisplay
                        image={selectedImage}
                        alt={furnitureSet.setName}
                        showZoom={true}
                        onZoom={() => handleImageZoom(selectedImage)}
                        priority={true}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center rounded-2xl">
                        <div className="text-center text-slate-400">
                          <ImageIcon />
                          <p className="text-sm mt-2">Görsel bulunamadı</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Navigation */}
                  {getAllImages.length > 1 && (
                    <div className="grid grid-cols-5 gap-3">
                      {getAllImages.map((imageItem, index) => (
                        <button
                          key={`${imageItem.image.imageId}-${index}`}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`group aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                            selectedImageIndex === index
                              ? 'border-blue-500 ring-2 ring-blue-500/50 scale-105'
                              : 'border-white/20 hover:border-white/40'
                          }`}
                        >
                          <FurnitureSetImageDisplay
                            image={imageItem.image}
                            alt={`${furnitureSet.setName} - ${index + 1}`}
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Image Stats */}
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    {[
                      { label: "Toplam Görsel", value: furnitureSet?.stats?.totalImages || 0, color: "from-blue-500 to-blue-600" },
                      { label: "Ana Görsel", value: furnitureSet?.imageGallery?.main?.length || 0, color: "from-purple-500 to-purple-600" },
                      { label: "Galeri", value: furnitureSet?.imageGallery?.gallery?.length || 0, color: "from-green-500 to-green-600" }
                    ].map((stat, index) => (
                      <div key={index} className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                        <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                          {stat.value}
                        </div>
                        <div className="text-sm text-white/70 mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Info Panel - 5 columns */}
              <div className="xl:col-span-5 space-y-6">
                
                {/* Pricing Analysis */}
                {furnitureSet.pricingAnalysis && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <CurrencyIcon />
                      </div>
                      <h3 className="text-2xl font-bold text-white">Fiyat Analizi</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                        <span className="text-white/80 font-medium">Takım Fiyatı:</span>
                        <span className="text-2xl font-bold text-blue-300">{furnitureSet?.pricingAnalysis?.formattedSetPrice || '₺0'}</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                        <span className="text-white/80 font-medium">Tek Tek Fiyat:</span>
                        <span className="text-xl font-medium text-white">{furnitureSet?.pricingAnalysis?.formattedIndividualPrice || '₺0'}</span>
                      </div>
                      
                      <div className="border-t border-white/20 pt-6">
                        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                          <span className="font-bold text-white text-lg">
                            {furnitureSet?.pricingAnalysis?.isSetCheaper ? 'Toplam Tasarruf:' : 'Fark:'}
                          </span>
                          <div className="text-right">
                            <span className={`text-3xl font-bold ${
                              furnitureSet?.pricingAnalysis?.isSetCheaper ? 'text-green-300' : 'text-red-300'
                            }`}>
                              {furnitureSet?.pricingAnalysis?.isSetCheaper ? '-' : '+'}
                              {furnitureSet?.pricingAnalysis?.formattedSavings || '₺0'}
                            </span>
                            <div className={`text-sm ${
                              furnitureSet?.pricingAnalysis?.isSetCheaper ? 'text-green-400' : 'text-red-400'
                            }`}>
                              (%{Math.abs(furnitureSet?.pricingAnalysis?.savingsPercentage || 0).toFixed(1)})
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {furnitureSet.description && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-white">Açıklama</h3>
                    </div>
                    <p className="text-white/80 leading-relaxed text-lg">{furnitureSet?.description || 'Açıklama bulunmuyor.'}</p>
                  </div>
                )}

                {/* Colors */}
                {furnitureSet?.colorOptions && furnitureSet.colorOptions.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                        <ColorIcon />
                      </div>
                      <h3 className="text-2xl font-bold text-white">
                        Renkler ({furnitureSet.colorOptions.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {furnitureSet.colorOptions.map(color => (
                        <div key={color.colorId} className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl border border-white/10">
                          <div
                            className="w-12 h-12 rounded-full border-4 border-white/30 shadow-lg ring-2 ring-white/20"
                            style={{ backgroundColor: color.colorCode }}
                            title={color.colorCode}
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-white">{color.colorName}</p>
                            <p className="text-sm text-white/60">{color.colorCode}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl">
                  <h3 className="text-2xl font-bold text-white mb-6">İstatistikler</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Toplam Adet", value: furnitureSet?.stats?.totalQuantity || 0, color: "from-blue-500 to-blue-600", icon: "📦" },
                      { label: "Farklı Mobilya", value: furnitureSet?.stats?.uniqueFurnitureCount || 0, color: "from-green-500 to-green-600", icon: "🪑" },
                      { label: "Renkler", value: furnitureSet?.stats?.totalColors || 0, color: "from-purple-500 to-purple-600", icon: "🎨" },
                      { label: "Özellikler", value: furnitureSet?.stats?.totalProperties || 0, color: "from-yellow-500 to-yellow-600", icon: "🏷️" }
                    ].map((stat, index) => (
                      <div key={index} className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 group hover:bg-white/10 transition-all duration-300">
                        <div className="text-3xl mb-2">{stat.icon}</div>
                        <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                          {stat.value}
                        </div>
                        <div className="text-sm text-white/70">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Created Date */}
                <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 shadow-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-slate-500 rounded-lg flex items-center justify-center">
                      <CalendarIcon />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Oluşturulma Tarihi</h4>
                      <p className="text-white/70">{furnitureSet?.createdAt ? formatDate(furnitureSet.createdAt) : 'Bilinmiyor'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Furniture Items Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden mb-12">
              <div className="bg-gradient-to-r from-orange-600/80 to-red-600/80 backdrop-blur-sm px-8 py-6 border-b border-white/10">
                <h2 className="text-3xl font-bold text-white flex items-center space-x-3">
                  <PackageIcon />
                  <span>Takımdaki Mobilyalar ({furnitureSet?.stats?.uniqueFurnitureCount || 0})</span>
                </h2>
              </div>
              
              <div className="p-8">
                {furnitureSet?.furnitureItems && furnitureSet.furnitureItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {furnitureSet.furnitureItems.map((item, index) => (
                      <div key={item.furnitureId} className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                        {/* Furniture Image */}
                        <div className="aspect-square mb-6 rounded-xl overflow-hidden bg-slate-800/50">
                          {item.furniture?.images && item.furniture.images.length > 0 ? (
                            <FurnitureSetImageDisplay
                              image={item.furniture.images[0].image}
                              alt={item.furniture.furnitureName}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon />
                            </div>
                          )}
                        </div>
                        
                        {/* Furniture Info */}
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-bold text-white text-lg mb-1">{item.furniture?.furnitureName || 'Bilinmeyen Mobilya'}</h3>
                            <p className="text-white/60">{item.furniture?.furnitureType || 'Bilinmeyen Tip'}</p>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <span className="text-white/80 font-medium">Adet:</span>
                            <span className="font-bold text-blue-300 text-xl">{item.quantity || 0}</span>
                          </div>
                          
                          <div className="border-t border-white/20 pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-white/80">Birim Fiyat:</span>
                              <span className="font-medium text-white">{item.formattedItemPrice || '₺0'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                              <span className="font-bold text-white">Toplam:</span>
                              <span className="font-bold text-2xl text-green-300">{item.formattedItemTotalPrice || '₺0'}</span>
                            </div>
                          </div>
                          
                          <div className="pt-2">
                            <Link
                              href={`/admin/furniture/${item.furniture?.furnitureId || 0}`}
                              className="inline-flex items-center text-blue-300 hover:text-blue-200 font-medium group-hover:translate-x-1 transition-all duration-200"
                            >
                              Detayları Gör
                              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </Link>
                          </div>
                          
                          {item.furniture && !item.furniture.isActive && (
                            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                              <span className="text-sm text-red-300 font-medium">⚠️ Bu mobilya artık aktif değil</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-white/40 mb-4">
                      <PackageIcon />
                    </div>
                    <p className="text-white/60">Bu takımda henüz mobilya bulunmuyor.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Properties Section */}
            {furnitureSet?.propertiesByType && Object.keys(furnitureSet.propertiesByType).length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-600/80 to-teal-600/80 backdrop-blur-sm px-8 py-6 border-b border-white/10">
                  <h2 className="text-3xl font-bold text-white flex items-center space-x-3">
                    <TagIcon />
                    <span>Özellikler ({furnitureSet?.stats?.totalProperties || 0})</span>
                  </h2>
                </div>
                
                <div className="p-8">
                  <div className="space-y-8">
                    {Object.entries(furnitureSet.propertiesByType).map(([type, properties]) => (
                      <div key={type} className="border-l-4 border-gradient-to-b from-blue-500 to-purple-500 pl-8">
                        <h3 className="text-2xl font-bold text-white mb-6 capitalize flex items-center space-x-2">
                          <span>{type}</span>
                          <span className="text-sm bg-white/20 px-3 py-1 rounded-full">({properties?.length || 0})</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {properties?.map((property) => (
                            <div key={property.propertyId} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="font-bold text-white text-lg">{property.propertyName}</h4>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  property.isActive 
                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                }`}>
                                  {property.isActive ? 'Aktif' : 'Pasif'}
                                </span>
                              </div>
                              <p className="text-white font-semibold text-xl">{property.propertyValue}</p>
                              {property.description && (
                                <p className="text-white/60 mt-2">{property.description}</p>
                              )}
                            </div>
                          )) || []}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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