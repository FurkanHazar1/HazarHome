'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

// FIXED: Updated image URL function for new image system
const getImageUrl = (filePath: string): string[] => {
  if (!filePath) return []
  
  // New system: Direct public URLs
  const normalizedPath = filePath.replace(/\\/g, '/')
  
  // Priority order for new image system
  const urlOptions = [
    // New structure: /uploads/images/furnitures/{category-slug}/{id}/image_{sortOrder}.jpg
    normalizedPath.startsWith('/uploads/') ? normalizedPath : `/uploads/${normalizedPath.replace(/^uploads\//, '')}`,
    // Legacy fallback
    normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`,
    // API serve fallback (deprecated but still functional)
    `/api/images/serve/${normalizedPath.replace(/^uploads\//, '')}`
  ]
  
  // FIXED: Filter out thumbnail URLs to ensure we get original images
  return urlOptions.filter(url => 
    !url.includes('/thumbnails/') && 
    !url.includes('_thumb.')
  )
}
// Types - matching API response
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
  totalImages: number
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
  activeColors: number
  activeProperties: number
  activeImages: number
}

interface FurnitureMetadata {
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

const ColorIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
  </svg>
)

const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const FurnitureIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m7 21-3-3h16l-3 3" />
  </svg>
)

const StarIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)

// Enhanced Image Component with Dark Theme
const FurnitureImageDisplay = ({ 
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
    if (!image) return []
    
    // FIXED: Get original image URLs and explicitly filter out thumbnails
    const originalUrls = getImageUrl(image.filePath)
    
    // Additional safety: if image has thumbnail indicators in filename/path, try to get original
    const cleanUrls = originalUrls.map(url => {
      // If URL contains thumbnail indicators, try to construct original URL
      if (url.includes('_thumb.') || url.includes('/thumbnails/')) {
        // Try to construct original image path
        let originalUrl = url
          .replace('/thumbnails/', '/') // Remove thumbnails folder
          .replace('_thumb.', '.') // Remove _thumb suffix
          .replace('/main_thumb.', '/main.') // Handle main thumbnail case
        
        return originalUrl
      }
      return url
    })
    
    return [...new Set(cleanUrls)] // Remove duplicates
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
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 80vw"
        quality={95} // FIXED: Higher quality for original images
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

// FIXED: Enhanced Image Zoom Modal with original image prioritization
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

  // FIXED: Get original image URL, not thumbnail
  const originalUrls = getImageUrl(image.filePath)
  const imageUrl = originalUrls[0] || `/uploads/${image.filePath.replace(/^uploads\//, '')}`

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
            alt={image.altText || 'Furniture image'}
            width={image.width || 1200} // FIXED: Larger default size for original images
            height={image.height || 900}
            className="max-w-full max-h-[90vh] object-contain rounded-xl" 
            quality={100} // FIXED: Maximum quality for zoom view
          />
          
          {image.fileName && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-white border-opacity-20">
              <div className="text-sm font-medium">{image.fileName}</div>
              {image.width && image.height && (
                <div className="text-xs text-white/80 mt-1">
                  {image.width} × {image.height} px
                  {image.fileSize && (
                    <span className="ml-2">• {(image.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface FurnitureDetailProps {
  furnitureId: number
}

export default function ModernFurnitureDetail({ furnitureId }: { furnitureId: number }) {
  const router = useRouter()
  
  // State management
  const [furniture, setFurniture] = useState<FurnitureDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  
  // Image gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [showImageZoom, setShowImageZoom] = useState<boolean>(false)
  const [zoomImage, setZoomImage] = useState<ImageData | null>(null)

  // Load furniture details from API
  const loadFurnitureDetail = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = new URLSearchParams({
        groupImagesByType: 'true',
        includeInactive: 'false',
        includeDetails: 'true', // FIXED: Request detailed image info
        originalImagesOnly: 'true' // FIXED: Request original images only
      })

      console.log('🔄 Loading furniture detail (original images):', furnitureId)

      const response = await fetch(`/api/furniture/${furnitureId}?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      
      if (data.success && data.data) {
        // FIXED: Filter out thumbnail images from the response
        const filteredData = {
          ...data.data,
          imageGallery: {
            ...data.data.imageGallery,
            main: data.data.imageGallery?.main?.filter(img => 
              !img.image.filePath.includes('/thumbnails/') && 
              !img.image.fileName.includes('_thumb.')
            ) || [],
            gallery: data.data.imageGallery?.gallery?.filter(img => 
              !img.image.filePath.includes('/thumbnails/') && 
              !img.image.fileName.includes('_thumb.')
            ) || [],
            // Remove thumbnails completely from the gallery
            thumbnails: []
          }
        }
        
        setFurniture(filteredData)
        console.log('✅ Furniture detail loaded (original images only):', filteredData)
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
    
    // Only include main and gallery images (no thumbnails)
    if (furniture.imageGallery.main) {
      allImages.push(...furniture.imageGallery.main)
    }
    
    if (furniture.imageGallery.gallery) {
      allImages.push(...furniture.imageGallery.gallery)
    }
    
    // FIXED: Additional filtering to ensure no thumbnails slip through
    const originalImages = allImages.filter(img => 
      !img.image.filePath.includes('/thumbnails/') && 
      !img.image.fileName.includes('_thumb.') &&
      img.imageType !== 'thumbnail'
    )
    
    return originalImages.sort((a, b) => a.sortOrder - b.sortOrder)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-indigo-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12 sm:py-20">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 sm:p-12 border border-white/20 shadow-2xl">
              <div className="flex items-center space-x-4">
                <LoaderIcon />
                <span className="text-white font-medium text-sm sm:text-base lg:text-lg">Mobilya detayları yükleniyor...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-100 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl mb-4 sm:mb-6 shadow-lg">
            <div className="flex items-center space-x-2">
              <span className="text-lg sm:text-xl">⚠️</span>
              <span className="font-medium text-sm sm:text-base">{error}</span>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && furniture && (
          <>
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
                <button
                  onClick={() => router.back()}
                  className="group flex items-center space-x-3 px-4 sm:px-6 py-3 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-2xl transition-all duration-300 border border-white/20 hover:border-white/30 w-full sm:w-auto justify-center sm:justify-start"
                >
                  <ArrowLeftIcon />
                  <span className="font-medium">Geri Dön</span>
                </button>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                  <Link
                    href={`/admin/furniture/${furniture?.furnitureId || 0}/edit`}
                    className="group flex items-center space-x-3 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 justify-center"
                  >
                    <EditIcon />
                    <span className="font-medium">Düzenle</span>
                  </Link>
                  
                  <button
                    onClick={handleDelete}
                    className="group flex items-center space-x-3 px-4 sm:px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 justify-center"
                  >
                    <DeleteIcon />
                    <span className="font-medium">Sil</span>
                  </button>
                </div>
              </div>

              {/* Title Section */}
              <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center space-x-3 px-4 sm:px-6 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-4 border border-white/20">
                  <FurnitureIcon />
                  <span className="text-white/80 font-medium text-sm sm:text-base">{furniture?.category?.categoryName || 'Kategorisiz'}</span>
                </div>
                
                <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent mb-4 leading-tight">
                  {furniture?.furnitureName || 'Mobilya'}
                </h1>
                
                <div className="flex items-center justify-center space-x-6 text-white/80">
                  <div className="flex items-center space-x-2">
                    <TagIcon />
                    <span>{furniture?.furnitureType || 'Tip Bilinmiyor'}</span>
                  </div>
                  <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                  <div className={`inline-flex items-center px-4 py-1 rounded-full text-sm font-medium ${
                    furniture?.isActive 
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {furniture?.isActive ? '✓ Aktif' : '✕ Pasif'}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                    {furniture?.metadata?.formattedPrice || '₺0'}
                  </div>
                  <div className="mt-2 text-white/60">
                    ID: {furniture?.furnitureId || 0}
                  </div>
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
                      <FurnitureImageDisplay
                        image={selectedImage}
                        alt={furniture.furnitureName}
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
                          <FurnitureImageDisplay
                            image={imageItem.image}
                            alt={`${furniture.furnitureName} - ${index + 1}`}
                          />
                        </button>
                      ))}
                    </div>
                  )}


                  {/* Image Stats */}
                  <div className="mt-6 grid grid-cols-3 gap-4">
                   {[
                    { 
                      label: "Ana Görsel", 
                      value: furniture?.imageGallery?.main?.length || 0, 
                      color: "from-purple-500 to-purple-600" 
                    },
                    { 
                      label: "Galeri Görseli", 
                      value: furniture?.imageGallery?.gallery?.length || 0, 
                      color: "from-green-500 to-green-600" 
                    }
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
              

              {/* Info Panel - 5 columns*/}
              <div className="xl:col-span-5 space-y-6">
                
                {/* Quick Info Cards */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                        <TagIcon />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Kategori</h3>
                        <p className="text-white/70">{furniture?.category?.categoryName || 'Kategorisiz'}</p>
                      </div>
                    </div>
                    {furniture?.category?.description && (
                      <p className="text-white/60">{furniture.category.description}</p>
                    )}
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <CalendarIcon />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Oluşturulma</h3>
                        <p className="text-white/70">{furniture?.createdAt ? formatDate(furniture.createdAt) : 'Bilinmiyor'}</p>
                      </div>
                    </div>
                    {furniture?.updatedAt && furniture.updatedAt !== furniture.createdAt && (
                      <p className="text-white/60 text-sm">
                        Güncellendi: {formatDate(furniture.updatedAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                {furniture?.description && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <InfoIcon />
                      </div>
                      <h3 className="text-2xl font-bold text-white">Açıklama</h3>
                    </div>
                    <p className="text-white/80 leading-relaxed text-lg">{furniture.description}</p>
                  </div>
                )}

                {/* Colors */}
                {furniture?.colorOptions && furniture.colorOptions.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                        <ColorIcon />
                      </div>
                      <h3 className="text-2xl font-bold text-white">
                        Renkler ({furniture.colorOptions.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {furniture.colorOptions.map(color => (
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
                      { label: "Toplam Renk", value: furniture?.stats?.totalColors || 0, color: "from-purple-500 to-purple-600", icon: "🎨" },
                      { label: "Özellikler", value: furniture?.stats?.totalProperties || 0, color: "from-yellow-500 to-yellow-600", icon: "🏷️" },
                      { label: "Aktif Renkler", value: furniture?.stats?.activeColors || 0, color: "from-green-500 to-green-600", icon: "✅" },
                      { label: "Aktif Özellikler", value: furniture?.stats?.activeProperties || 0, color: "from-blue-500 to-blue-600", icon: "📋" }
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
              </div>
            </div>

            {/* Properties Section */}
            {furniture?.propertiesByType && Object.keys(furniture.propertiesByType).length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-600/80 to-teal-600/80 backdrop-blur-sm px-8 py-6 border-b border-white/10">
                  <h2 className="text-3xl font-bold text-white flex items-center space-x-3">
                    <TagIcon />
                    <span>Özellikler ({furniture?.stats?.totalProperties || 0})</span>
                  </h2>
                </div>
                
                <div className="p-8">
                  <div className="space-y-8">
                    {Object.entries(furniture.propertiesByType).map(([type, properties]) => (
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

            {/* Metadata Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl mt-8">
              <h3 className="text-2xl font-bold text-white mb-6">Teknik Bilgiler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Mobilya ID", value: furniture?.furnitureId || 'Bilinmiyor' },
                  { label: "Kategori Seviyesi", value: furniture?.metadata?.categoryLevel || 'Bilinmiyor' },
                  { label: "Ana Görsel", value: furniture?.metadata?.hasMainImage ? 'Var' : 'Yok' },
                  { label: "Galeri Görselleri", value: furniture?.metadata?.hasGalleryImages ? 'Var' : 'Yok' }
                ].map((item, index) => (
                  <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <span className="font-medium text-white/70 text-sm">{item.label}:</span>
                    <p className="text-white font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
              
              {furniture?.metadata?.categoryBasedPath && (
                <div className="mt-6 pt-6 border-t border-white/20">
                  <span className="font-medium text-white/70">Kategori Tabanlı Path:</span>
                  <p className="text-sm text-white/80 font-mono mt-2 bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                    {furniture.metadata.categoryBasedPath}
                  </p>
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