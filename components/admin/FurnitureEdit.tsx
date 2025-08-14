'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// Utility function for image URLs - Updated for new system
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
  
  return urlOptions
}

// Types (Enhanced with new API features)
interface Category {
  categoryId: number
  categoryName: string
  categoryPath: string
  categoryLevel: number
  isActive: boolean
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
  isActive: boolean
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

interface FurnitureColor {
  isAvailable: boolean
  color: Color
}

interface FurnitureProperty {
  propertyId: number
  propertyValue: string
  isActive: boolean
  property: Property
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
  images: FurnitureImage[]
  colors: FurnitureColor[]
  properties: FurnitureProperty[]
  // Enhanced with new API features
  imageGallery?: {
    main: FurnitureImage[]
    gallery: FurnitureImage[]
    thumbnails: FurnitureImage[]
    totalImages: number
    counts: {
      main: number
      gallery: number
      thumbnails: number
    }
  }
  metadata?: {
    categoryBasedPath?: string
    hasMainImage: boolean
    hasGalleryImages: boolean
    hasThumbnails: boolean
  }
}

interface NewImageFile {
  file: File
  preview: string
  imageType: 'main' | 'gallery'
  sortOrder: number
  tempId: string
}

// Modern Dark Theme Icons (same as before)
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const SaveIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h8m0 0h2a2 2 0 002-2V9a2 2 0 00-2-2h-2m0 0V5a2 2 0 00-2-2H8a2 2 0 00-2 2v2m0 0v6m0 0V9" />
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

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const UpIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
)

const DownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const StarIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)

const GalleryIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const FolderIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
)

// Enhanced Image Component with Dark Theme
const FurnitureImageDisplay = ({ 
  image, 
  alt, 
  className = "w-full h-full",
  showLoader = true
}: {
  image: ImageData | null
  alt: string
  className?: string
  showLoader?: boolean
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
      {!imageLoaded && showLoader && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse rounded-xl flex items-center justify-center">
          <LoaderIcon />
        </div>
      )}
      
      <Image
        src={urls[currentUrlIndex]}
        alt={alt}
        fill
        className={`object-cover transition-all duration-500 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      
      <div className="absolute inset-0 ring-1 ring-white ring-opacity-10 rounded-xl"></div>
    </div>
  )
}

export default function FurnitureEdit({ furnitureId }: { furnitureId: number }) {
  const router = useRouter()
  
  // State management
  const [furniture, setFurniture] = useState<Furniture | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  
  // Form data
  const [formData, setFormData] = useState({
    furnitureName: '',
    furnitureType: '',
    categoryId: '',
    description: '',
    price: '',
    isActive: true
  })
  
  // Options data
  const [categories, setCategories] = useState<Category[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  
  // Current selections
  const [selectedColors, setSelectedColors] = useState<number[]>([])
  const [selectedProperties, setSelectedProperties] = useState<{ propertyId: number; propertyValue: string }[]>([])
  
  // Enhanced image management with category-based support
  const [existingImages, setExistingImages] = useState<FurnitureImage[]>([])
  const [newImages, setNewImages] = useState<NewImageFile[]>([])
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([])
  const [reorganizeFiles, setReorganizeFiles] = useState<boolean>(false)
  const [generateThumbnails, setGenerateThumbnails] = useState<boolean>(true)
  
  // UI State
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Load initial data with enhanced API features
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load furniture details with enhanced features
        const furnitureResponse = await fetch(`/api/furniture/${furnitureId}?includeDetails=true&groupImagesByType=true`)
        const furnitureData = await furnitureResponse.json()
        
        if (!furnitureData.success) {
          setError(furnitureData.error || 'Mobilya bulunamadı')
          return
        }
        
        const furnitureDetails = furnitureData.data
        setFurniture(furnitureDetails)
        
        // Set form data
        setFormData({
          furnitureName: furnitureDetails.furnitureName || '',
          furnitureType: furnitureDetails.furnitureType || '',
          categoryId: furnitureDetails.category?.categoryId?.toString() || '',
          description: furnitureDetails.description || '',
          price: furnitureDetails.price?.toString() || '',
          isActive: furnitureDetails.isActive ?? true
        })
        
        // Set existing selections
        setSelectedColors(furnitureDetails.colors?.map((fc: FurnitureColor) => fc.color.colorId) || [])
        setSelectedProperties(furnitureDetails.properties?.map((fp: FurnitureProperty) => ({
          propertyId: fp.propertyId,
          propertyValue: fp.propertyValue
        })) || [])
        
        // Enhanced image handling - use imageGallery if available, fallback to images
        let imagesToUse: FurnitureImage[] = []
        if (furnitureDetails.imageGallery) {
          // Combine all image types from new API response
          imagesToUse = [
            ...furnitureDetails.imageGallery.main,
            ...furnitureDetails.imageGallery.gallery,
            // Exclude thumbnails from editing interface
          ]
        } else {
          // Fallback to original images array, filter out thumbnails
          imagesToUse = furnitureDetails.images?.filter((img: FurnitureImage) => 
            img.imageType !== 'thumbnail'
          ) || []
        }
        
        setExistingImages(imagesToUse)
        
        // Load options with enhanced category support
        const [categoriesRes, colorsRes, propertiesRes] = await Promise.all([
          fetch('/api/categories?active=true&includeHierarchy=true'),
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
        console.error('Data loading error:', err)
        setError('Veriler yüklenirken hata oluştu')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [furnitureId])

  // Handle form changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Color management
  const toggleColor = (colorId: number) => {
    setSelectedColors(prev => 
      prev.includes(colorId) 
        ? prev.filter(id => id !== colorId)
        : [...prev, colorId]
    )
  }

  // Property management
  const updateProperty = (propertyId: number, value: string) => {
    setSelectedProperties(prev => {
      const exists = prev.find(p => p.propertyId === propertyId)
      if (!value.trim()) {
        return prev.filter(p => p.propertyId !== propertyId)
      }
      if (exists) {
        return prev.map(p => p.propertyId === propertyId ? { ...p, propertyValue: value } : p)
      }
      return [...prev, { propertyId, propertyValue: value }]
    })
  }

  // Enhanced image management with category-based support
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    files.forEach((file, index) => {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} geçerli bir resim dosyası değil.`)
        return
      }

      if (file.size > 100 * 1024 * 1024) {
        setError(`${file.name} dosyası 100MB'dan büyük.`)
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const newImage: NewImageFile = {
          file,
          preview: event.target?.result as string,
          imageType: index === 0 && existingImages.length === 0 && newImages.length === 0 ? 'main' : 'gallery',
          sortOrder: existingImages.length + newImages.length + index + 1,
          tempId: `temp_${Date.now()}_${index}`
        }
        setNewImages(prev => [...prev, newImage])
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ''
  }

  const removeExistingImage = (imageId: number) => {
    setRemovedImageIds(prev => [...prev, imageId])
    setExistingImages(prev => {
      const filteredImages = prev.filter(img => img.image.imageId !== imageId)
      return filteredImages.map((img, index) => ({
        ...img,
        sortOrder: index + 1
      }))
    })
    
    setNewImages(prev => prev.map((img, index) => ({
      ...img,
      sortOrder: existingImages.filter(ei => ei.image.imageId !== imageId).length + index + 1
    })))
  }

  const removeNewImage = (tempId: string) => {
    setNewImages(prev => {
      const filteredImages = prev.filter(img => img.tempId !== tempId)
      return filteredImages.map((img, index) => ({
        ...img,
        sortOrder: existingImages.length + index + 1
      }))
    })
  }

  const changeExistingImageType = (imageId: number, newType: 'main' | 'gallery') => {
    setExistingImages(prev => prev.map(img => {
      if (img.image.imageId === imageId) {
        return { ...img, imageType: newType }
      }
      if (newType === 'main' && img.imageType === 'main') {
        return { ...img, imageType: 'gallery' }
      }
      return img
    }))
  }

  const changeNewImageType = (tempId: string, newType: 'main' | 'gallery') => {
    setNewImages(prev => prev.map(img => {
      if (img.tempId === tempId) {
        return { ...img, imageType: newType }
      }
      if (newType === 'main' && img.imageType === 'main') {
        return { ...img, imageType: 'gallery' }
      }
      return img
    }))
    
    setExistingImages(prev => prev.map(img => {
      if (newType === 'main' && img.imageType === 'main') {
        return { ...img, imageType: 'gallery' }
      }
      return img
    }))
  }

  // Existing image sort order management
  const moveExistingImageUp = (imageId: number) => {
    setExistingImages(prev => {
      const currentIndex = prev.findIndex(img => img.image.imageId === imageId)
      if (currentIndex <= 0) return prev
      
      const newImages = [...prev]
      const temp = newImages[currentIndex]
      newImages[currentIndex] = newImages[currentIndex - 1]
      newImages[currentIndex - 1] = temp
      
      return newImages.map((img, index) => ({
        ...img,
        sortOrder: index + 1
      }))
    })
  }

  const moveExistingImageDown = (imageId: number) => {
    setExistingImages(prev => {
      const currentIndex = prev.findIndex(img => img.image.imageId === imageId)
      if (currentIndex >= prev.length - 1) return prev
      
      const newImages = [...prev]
      const temp = newImages[currentIndex]
      newImages[currentIndex] = newImages[currentIndex + 1]
      newImages[currentIndex + 1] = temp
      
      return newImages.map((img, index) => ({
        ...img,
        sortOrder: index + 1
      }))
    })
  }

  const updateExistingImageSortOrder = (imageId: number, newSortOrder: number) => {
    setExistingImages(prev => {
      if (newSortOrder < 1 || newSortOrder > prev.length) return prev
      
      const currentIndex = prev.findIndex(img => img.image.imageId === imageId)
      if (currentIndex === -1) return prev
      
      const newImages = [...prev]
      const imageToMove = newImages[currentIndex]
      
      newImages.splice(currentIndex, 1)
      newImages.splice(newSortOrder - 1, 0, imageToMove)
      
      return newImages.map((img, index) => ({
        ...img,
        sortOrder: index + 1
      }))
    })
  }

  // New image sort order management
  const moveNewImageUp = (tempId: string) => {
    setNewImages(prev => {
      const currentIndex = prev.findIndex(img => img.tempId === tempId)
      if (currentIndex <= 0) return prev
      
      const newImages = [...prev]
      const temp = newImages[currentIndex]
      newImages[currentIndex] = newImages[currentIndex - 1]
      newImages[currentIndex - 1] = temp
      
      return newImages.map((img, index) => ({
        ...img,
        sortOrder: existingImages.length + index + 1
      }))
    })
  }

  const moveNewImageDown = (tempId: string) => {
    setNewImages(prev => {
      const currentIndex = prev.findIndex(img => img.tempId === tempId)
      if (currentIndex >= prev.length - 1) return prev
      
      const newImages = [...prev]
      const temp = newImages[currentIndex]
      newImages[currentIndex] = newImages[currentIndex + 1]
      newImages[currentIndex + 1] = temp
      
      return newImages.map((img, index) => ({
        ...img,
        sortOrder: existingImages.length + index + 1
      }))
    })
  }

  const updateNewImageSortOrder = (tempId: string, newSortOrder: number) => {
    const totalImages = existingImages.length + newImages.length
    const minOrder = existingImages.length + 1
    const maxOrder = totalImages
    
    if (newSortOrder < minOrder || newSortOrder > maxOrder) return
    
    setNewImages(prev => {
      const currentIndex = prev.findIndex(img => img.tempId === tempId)
      if (currentIndex === -1) return prev
      
      const newImages = [...prev]
      const imageToMove = newImages[currentIndex]
      
      newImages.splice(currentIndex, 1)
      
      const newPosition = newSortOrder - minOrder
      newImages.splice(newPosition, 0, imageToMove)
      
      return newImages.map((img, index) => ({
        ...img,
        sortOrder: existingImages.length + index + 1
      }))
    })
  }

  // Enhanced validation
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.furnitureName.trim()) {
      newErrors.furnitureName = 'Mobilya adı gereklidir'
    } else if (formData.furnitureName.trim().length > 100) {
      newErrors.furnitureName = 'Mobilya adı 100 karakterden uzun olamaz'
    }

    if (!formData.furnitureType.trim()) {
      newErrors.furnitureType = 'Mobilya tipi gereklidir'
    } else if (formData.furnitureType.trim().length > 50) {
      newErrors.furnitureType = 'Mobilya tipi 50 karakterden uzun olamaz'
    }

    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Geçerli bir fiyat giriniz'
    } else if (parseFloat(formData.price) > 999999999.99) {
      newErrors.price = 'Fiyat çok yüksek'
    }

    if (formData.categoryId && isNaN(parseInt(formData.categoryId))) {
      newErrors.categoryId = 'Geçerli bir kategori seçin'
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Açıklama 1000 karakterden uzun olamaz'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Enhanced submit form with category-based features
  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const submitData = new FormData()
      
      // Basic info
      submitData.append('furnitureName', formData.furnitureName.trim())
      submitData.append('furnitureType', formData.furnitureType.trim())
      submitData.append('categoryId', formData.categoryId)
      submitData.append('description', formData.description.trim())
      submitData.append('price', formData.price)
      submitData.append('isActive', formData.isActive.toString())
      
      // Colors
      submitData.append('colorIds', JSON.stringify(selectedColors))
      
      // Properties
      submitData.append('properties', JSON.stringify(selectedProperties))
      
      // Images to remove
      if (removedImageIds.length > 0) {
        submitData.append('removeImageIds', JSON.stringify(removedImageIds))
      }
      
      // Updated sort orders for existing images with enhanced metadata
      const updatedImageOrder = existingImages.map(img => ({
        imageId: img.image.imageId,
        sortOrder: img.sortOrder,
        imageType: img.imageType
      }))
      if (updatedImageOrder.length > 0) {
        submitData.append('updateImageOrder', JSON.stringify(updatedImageOrder))
      }
      
      // Image type mappings for new images
      const imageTypeMappings: {[key: string]: 'main' | 'gallery'} = {}
      newImages.forEach(img => {
        imageTypeMappings[img.file.name] = img.imageType
      })
      if (Object.keys(imageTypeMappings).length > 0) {
        submitData.append('imageTypeMappings', JSON.stringify(imageTypeMappings))
      }
      
      // Enhanced image options
      submitData.append('reorganizeFiles', reorganizeFiles.toString())
      submitData.append('generateThumbnails', generateThumbnails.toString())
      
      // New images
      newImages.forEach(img => {
        submitData.append('newImages', img.file)
      })

      const response = await fetch(`/api/furniture/${furnitureId}`, {
        method: 'PUT',
        body: submitData
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('✅ Mobilya başarıyla güncellendi!')
        
        // Show operation results if available
        if (result.imageOperations) {
          console.log('📁 Image operations completed:', result.imageOperations)
        }
        
        if (result.physicalUpdates) {
          console.log('🔄 Physical file updates:', result.physicalUpdates)
        }
        
        setTimeout(() => {
          router.push(`/admin/furniture/${furnitureId}`)
        }, 2000)
      } else {
        setError(result.error || result.message || 'Güncelleme sırasında hata oluştu')
        
        // Show validation errors if available
        if (result.validationErrors && Array.isArray(result.validationErrors)) {
          const validationText = result.validationErrors.join(', ')
          setError(prev => prev + ' - ' + validationText)
        }
      }
    } catch (error) {
      console.error('Update error:', error)
      setError('Güncelleme sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  // Auto-hide messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 8000)
      return () => clearTimeout(timer)
    }
  }, [error])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // Get selected category with enhanced hierarchy support
  const selectedCategory = categories.find(cat => cat.categoryId === parseInt(formData.categoryId))

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price)
  }

  // Get category path for display
  const getCategoryPath = (category: Category) => {
    if (category.parent) {
      return `${category.parent.categoryName} > ${category.categoryName}`
    }
    return category.categoryName
  }

  // Success screen
  if (success && !saving) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 border border-white/20 shadow-2xl text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckIcon />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Başarılı!</h2>
          <p className="text-white/80 mb-6">Mobilya başarıyla güncellendi.</p>
          <div className="flex items-center justify-center space-x-2 text-white/60">
            <LoaderIcon />
            <span>Yönlendiriliyorsunuz...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-indigo-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="group flex items-center space-x-3 px-4 sm:px-6 py-3 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-2xl transition-all duration-300 border border-white/20 hover:border-white/30"
              >
                <ArrowLeftIcon />
                <span className="font-medium">Geri Dön</span>
              </button>
            </div>
            
            <div className="text-center flex-1">
              <div className="inline-flex items-center space-x-3 px-4 sm:px-6 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-3 sm:mb-4 border border-white/20">
                <span className="text-xl sm:text-2xl">✏️</span>
                <span className="text-white/80 font-medium text-sm sm:text-base">Mobilya Düzenle</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent leading-tight">
                {furniture?.furnitureName || 'Mobilya Düzenle'}
              </h1>
              
              {/* Enhanced metadata display */}
              {furniture?.metadata?.categoryBasedPath && (
                <div className="mt-2 flex items-center justify-center space-x-2 text-white/60 text-xs sm:text-sm">
                  <FolderIcon />
                  <span>{furniture.metadata.categoryBasedPath}</span>
                </div>
              )}
            </div>

            <div className="hidden lg:block w-32"></div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12 sm:py-20">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 sm:p-12 border border-white/20 shadow-2xl">
              <div className="flex items-center space-x-4">
                <LoaderIcon />
                <span className="text-white font-medium text-sm sm:text-base lg:text-lg">Veriler yükleniyor...</span>
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

        {/* Success Message */}
        {success && (
          <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 text-green-100 px-6 py-4 rounded-2xl mb-6 shadow-lg">
            <div className="flex items-center space-x-2">
              <span className="text-xl">✅</span>
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Form */}
        {!loading && furniture && (
          <div className="space-y-8">
            
            {/* Basic Information */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-sm px-8 py-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <span className="text-3xl">📋</span>
                  <span>Temel Bilgiler</span>
                </h2>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white/90">
                      Mobilya Adı *
                    </label>
                    <input
                      type="text"
                      name="furnitureName"
                      value={formData.furnitureName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.furnitureName ? 'border-red-400 bg-red-500/20' : 'border-white/20'
                      }`}
                      placeholder="Örn: Modern Koltuk"
                      maxLength={100}
                      required
                    />
                    {errors.furnitureName && <p className="text-sm text-red-300 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{errors.furnitureName}</span>
                    </p>}
                    <div className="text-xs text-white/60">
                      {formData.furnitureName.length}/100 karakter
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white/90">
                      Mobilya Tipi *
                    </label>
                    <input
                      type="text"
                      name="furnitureType"
                      value={formData.furnitureType}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.furnitureType ? 'border-red-400 bg-red-500/20' : 'border-white/20'
                      }`}
                      placeholder="Örn: Koltuk, Masa, Sandalye"
                      maxLength={50}
                      required
                    />
                    {errors.furnitureType && <p className="text-sm text-red-300 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{errors.furnitureType}</span>
                    </p>}
                    <div className="text-xs text-white/60">
                      {formData.furnitureType.length}/50 karakter
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white/90">
                      Kategori
                    </label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.categoryId ? 'border-red-400 bg-red-500/20' : 'border-white/20'
                      }`}
                    >
                      <option value="" className="text-gray-900">Kategori seçin</option>
                      {categories.map(category => (
                        <option key={category.categoryId} value={category.categoryId} className="text-gray-900">
                          {getCategoryPath(category)}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && <p className="text-sm text-red-300 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{errors.categoryId}</span>
                    </p>}
                    {selectedCategory && (
                      <div className="mt-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                        <div className="text-sm text-white/80">
                          <span className="font-semibold">Seçilen Kategori:</span> {getCategoryPath(selectedCategory)}
                        </div>
                        {selectedCategory.categoryPath && (
                          <div className="text-xs text-white/60 mt-1">
                            <span className="font-semibold">Yol:</span> {selectedCategory.categoryPath}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white/90">
                      Fiyat (₺) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        min="0"
                        max="999999999.99"
                        step="0.01"
                        className={`w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.price ? 'border-red-400 bg-red-500/20' : 'border-white/20'
                        }`}
                        placeholder="0.00"
                        required
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-white/60 text-lg">₺</span>
                      </div>
                    </div>
                    {errors.price && <p className="text-sm text-red-300 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{errors.price}</span>
                    </p>}
                    {formData.price && !isNaN(parseFloat(formData.price)) && (
                      <div className="text-sm text-green-300">
                        💰 {formatPrice(parseFloat(formData.price))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <label className="block text-sm font-semibold text-white/90">
                    Açıklama
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    maxLength={1000}
                    className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none ${
                      errors.description ? 'border-red-400 bg-red-500/20' : 'border-white/20'
                    }`}
                    placeholder="Mobilya hakkında detaylar..."
                  />
                  {errors.description && <p className="text-sm text-red-300 flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>{errors.description}</span>
                  </p>}
                  <div className="text-xs text-white/60">
                    {formData.description.length}/1000 karakter
                  </div>
                </div>

                <div className="mt-6 flex items-center">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-white/90">Aktif olarak yayınla</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Colors */}
            {colors.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 backdrop-blur-sm px-8 py-6 border-b border-white/10">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                    <span className="text-3xl">🎨</span>
                    <span>Renkler ({selectedColors.length} seçili)</span>
                  </h2>
                </div>
                
                <div className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {colors.map(color => (
                      <label key={color.colorId} className="group relative cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedColors.includes(color.colorId)}
                          onChange={() => toggleColor(color.colorId)}
                          className="sr-only"
                        />
                        <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          selectedColors.includes(color.colorId)
                            ? 'border-purple-400 bg-purple-500/20 shadow-lg transform scale-105'
                            : 'border-white/20 hover:border-white/40 hover:bg-white/10'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-white/50 shadow-md"
                              style={{ backgroundColor: color.colorCode || '#ccc' }}
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-white">
                                {color.colorName}
                              </span>
                              {color.colorCode && (
                                <p className="text-xs text-white/60">
                                  {color.colorCode}
                                </p>
                              )}
                            </div>
                          </div>
                          {selectedColors.includes(color.colorId) && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                              <CheckIcon />
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Properties */}
            {properties.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-600/80 to-teal-600/80 backdrop-blur-sm px-8 py-6 border-b border-white/10">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                    <span className="text-3xl">🏷️</span>
                    <span>Özellikler ({selectedProperties.length} tanımlı)</span>
                  </h2>
                </div>
                
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {properties.map(property => {
                      const existingProperty = selectedProperties.find(sp => sp.propertyId === property.propertyId)
                      return (
                        <div key={property.propertyId} className="space-y-2">
                          <label className="block text-sm font-semibold text-white/90">
                            {property.propertyName}
                            {property.description && (
                              <span className="text-xs text-white/60 ml-2">({property.description})</span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={existingProperty?.propertyValue || ''}
                            onChange={(e) => updateProperty(property.propertyId, e.target.value)}
                            placeholder={`${property.propertyName} değeri`}
                            maxLength={200}
                            className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                          />
                          <div className="text-xs text-white/60">
                            {(existingProperty?.propertyValue || '').length}/200 karakter
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Images Section - Modern Design */}
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Ürün Görselleri</span>
                    <span className="bg-white/20 text-white text-sm px-2 py-1 rounded-full">
                      {existingImages.length + newImages.length}
                    </span>
                  </h2>
                  
                  {/* Enhanced Image Options */}
                  <div className="flex items-center space-x-4 text-sm">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={generateThumbnails}
                        onChange={(e) => setGenerateThumbnails(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-white">Otomatik thumbnail</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reorganizeFiles}
                        onChange={(e) => setReorganizeFiles(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-white">Dosyaları yeniden düzenle</span>
                    </label>
                  </div>
                </div>
                
                {/* Category-based path info */}
                {furniture?.metadata?.categoryBasedPath && (
                  <div className="mt-3 flex items-center space-x-2 text-white/70 text-sm">
                    <FolderIcon />
                    <span>Kategoriye göre yol: {furniture.metadata.categoryBasedPath}</span>
                  </div>
                )}
              </div>
              
              <div className="p-6 space-y-6">
                {/* Modern File Upload Area */}
                <div 
                  className="relative border-2 border-dashed border-gray-600 rounded-2xl p-8 transition-all duration-300 hover:border-indigo-500 hover:bg-gray-700/20 group cursor-pointer"
                  onClick={() => document.getElementById('imageInput')?.click()}
                >
                  <input
                    id="imageInput"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Yeni Görsel Ekle
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">
                        Görselleri seçin veya buraya sürükleyip bırakın
                      </p>
                      
                      <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium transform group-hover:scale-105 transition-transform duration-200">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Dosya Seç
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-2 gap-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Maksimum 100MB</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>JPG, PNG, WebP, GIF</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Kategoriye göre düzenleme</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Otomatik thumbnail</span>
                    </div>
                  </div>
                </div>

                {/* Existing Images - Modern Grid */}
                {existingImages.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        Mevcut Görseller
                      </h3>
                      <div className="text-sm text-gray-400">
                        {existingImages.filter(img => img.imageType === 'main' || img.imageType === 'main_image').length} ana, {existingImages.filter(img => img.imageType === 'gallery').length} galeri
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {existingImages.map((imageItem) => (
                        <div key={imageItem.image.imageId} className="group relative bg-gray-700 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                          <div className="aspect-square relative overflow-hidden">
                            <FurnitureImageDisplay
                              image={imageItem.image}
                              alt={imageItem.image.altText || 'Furniture image'}
                            />
                            
                            {/* Image Type Badge */}
                            <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${
                              imageItem.imageType === 'main' || imageItem.imageType === 'main_image'
                                ? 'bg-yellow-500/90 text-white border border-yellow-400/50' 
                                : 'bg-blue-500/90 text-white border border-blue-400/50'
                            }`}>
                              {imageItem.imageType === 'main' || imageItem.imageType === 'main_image' ? '⭐ Ana Görsel' : '📸 Galeri'}
                            </div>
                            
                            {/* Sort Order Badge */}
                            <div className="absolute top-3 right-3 w-8 h-8 bg-black/70 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-sm font-bold border border-white/20">
                              {imageItem.sortOrder || imageItem.image.sortOrder}
                            </div>
                            
                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => removeExistingImage(imageItem.image.imageId)}
                              className="absolute bottom-3 right-3 p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
                              title="Görseli kaldır"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-300 truncate">
                                {imageItem.image.fileName || `Görsel ${imageItem.image.sortOrder}`}
                              </div>
                              {imageItem.image.fileSize && (
                                <span className="text-xs text-gray-500">
                                  {(imageItem.image.fileSize / 1024 / 1024).toFixed(1)}MB
                                </span>
                              )}
                            </div>
                            
                            {/* Modern Sort Controls */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => moveExistingImageUp(imageItem.image.imageId)}
                                  disabled={imageItem.sortOrder === 1}
                                  className="p-2 rounded-lg bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Yukarı taşı"
                                >
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveExistingImageDown(imageItem.image.imageId)}
                                  disabled={imageItem.sortOrder === existingImages.length}
                                  className="p-2 rounded-lg bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Aşağı taşı"
                                >
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>
                              
                              <input
                                type="number"
                                min="1"
                                max={existingImages.length}
                                value={imageItem.sortOrder || imageItem.image.sortOrder}
                                onChange={(e) => updateExistingImageSortOrder(imageItem.image.imageId, parseInt(e.target.value))}
                                className="w-16 px-2 py-1 text-sm border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-600 text-white text-center"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images - Modern Grid */}
                {newImages.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        Yeni Görseller
                      </h3>
                      <div className="text-sm text-gray-400">
                        {newImages.length} yeni görsel
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {newImages.map((image) => (
                        <div key={image.tempId} className="group relative bg-gray-700 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                          <div className="aspect-square relative">
                            <Image
                              src={image.preview}
                              alt={`New image preview`}
                              fill
                              className="object-cover"
                            />
                            
                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={() => removeNewImage(image.tempId)}
                              className="absolute bottom-3 right-3 p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
                              title="Görseli kaldır"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                            
                            {/* Sort Order Badge */}
                            <div className="absolute top-3 right-3 w-8 h-8 bg-black/70 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-sm font-bold border border-white/20">
                              {image.sortOrder}
                            </div>
                          </div>
                          
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-white/90 truncate" title={image.file.name}>
                                {image.file.name}
                              </span>
                              <span className="text-xs text-white/60">
                                {(image.file.size / 1024 / 1024).toFixed(1)}MB
                              </span>
                            </div>
                            
                            {/* Image Type Buttons */}
                            <div className="flex space-x-2 mb-3">
                              <button
                                type="button"
                                onClick={() => changeNewImageType(image.tempId, 'main')}
                                className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  image.imageType === 'main'
                                    ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-400/50'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                                }`}
                              >
                                <StarIcon />
                                <span>Ana</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => changeNewImageType(image.tempId, 'gallery')}
                                className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  image.imageType === 'gallery'
                                    ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
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
                                  onClick={() => moveNewImageUp(image.tempId)}
                                  disabled={newImages.findIndex(img => img.tempId === image.tempId) === 0}
                                  className="p-1 text-white/60 hover:text-white hover:bg-white/20 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                                  title="Yukarı taşı"
                                >
                                  <UpIcon />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveNewImageDown(image.tempId)}
                                  disabled={newImages.findIndex(img => img.tempId === image.tempId) === newImages.length - 1}
                                  className="p-1 text-white/60 hover:text-white hover:bg-white/20 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                                  title="Aşağı taşı"
                                >
                                  <DownIcon />
                                </button>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-white/60">Sıra:</span>
                                <input
                                  type="number"
                                  min={existingImages.length + 1}
                                  max={existingImages.length + newImages.length}
                                  value={image.sortOrder}
                                  onChange={(e) => updateNewImageSortOrder(image.tempId, parseInt(e.target.value))}
                                  className="w-12 px-1 py-1 text-xs bg-white/10 backdrop-blur-sm border border-white/20 rounded text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {existingImages.length === 0 && newImages.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-white/30 rounded-xl bg-white/5">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                        <ImageIcon />
                      </div>
                      <div>
                        <p className="text-white/80 font-medium">Henüz görsel yok</p>
                        <p className="text-sm text-white/60 mt-1">
                          Yukarıdaki dosya seçici ile görsel ekleyebilirsiniz
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Statistics */}
                {(existingImages.length > 0 || newImages.length > 0) && (
                  <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-white">{existingImages.length + newImages.length}</div>
                        <div className="text-xs text-white/60">Toplam Görsel</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-300">
                          {existingImages.filter(img => img.imageType === 'main' || img.imageType === 'main_image').length + 
                           newImages.filter(img => img.imageType === 'main').length}
                        </div>
                        <div className="text-xs text-white/60">Ana Görsel</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-300">
                          {existingImages.filter(img => img.imageType === 'gallery').length + 
                           newImages.filter(img => img.imageType === 'gallery').length}
                        </div>
                        <div className="text-xs text-white/60">Galeri</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-300">{removedImageIds.length}</div>
                        <div className="text-xs text-white/60">Kaldırılan</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-between items-center pt-6">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200 font-medium"
                >
                  İptal
                </button>
                
                {/* Advanced Options Toggle */}
                <div className="flex items-center space-x-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setReorganizeFiles(!reorganizeFiles)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      reorganizeFiles 
                        ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-400/50' 
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    <RefreshIcon />
                    <span>Dosya Düzenleme</span>
                  </button>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg"
              >
                {saving ? <LoaderIcon /> : <SaveIcon />}
                <span>{saving ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}</span>
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-blue-500/10 backdrop-blur-sm rounded-xl border border-blue-500/20">
              <h4 className="text-sm font-semibold text-blue-200 mb-2">💡 İpuçları:</h4>
              <ul className="text-xs text-blue-100/80 space-y-1">
                <li>• Ana görsel ürün kartlarında ve detay sayfasında öne çıkar</li>
                <li>• Galeri görselleri detay sayfasında sırayla gösterilir</li>
                <li>• Otomatik thumbnail seçeneği performansı artırır</li>
                <li>• Dosya düzenleme seçeneği mevcut görselleri yeni kategoriye taşır</li>
                <li>• Kategori değişikliği dosya yollarını otomatik günceller</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}