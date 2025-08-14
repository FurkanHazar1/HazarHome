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
    // New structure: /uploads/images/furniture-sets/{category-slug}/{id}/image_{sortOrder}.jpg
    normalizedPath.startsWith('/uploads/') ? normalizedPath : `/uploads/${normalizedPath.replace(/^uploads\//, '')}`,
    // Legacy fallback
    normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`,
    // API serve fallback (deprecated but still functional)
    `/api/images/serve/${normalizedPath.replace(/^uploads\//, '')}`
  ]
  
  return urlOptions
}

// Types
interface Category {
  categoryId: number
  categoryName: string
  categoryPath: string
  categoryLevel: number
  isActive: boolean
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

interface Furniture {
  furnitureId: number
  furnitureName: string
  furnitureType: string
  price: number
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

interface FurnitureSetImage {
  sortOrder: number
  imageType: string
  isActive: boolean
  image: ImageData
}

interface FurnitureSetColor {
  isAvailable: boolean
  color: Color
}

interface FurnitureSetProperty {
  propertyId: number
  propertyValue: string
  isActive: boolean
  property: Property
}

interface FurnitureItem {
  furnitureId: number
  quantity: number
  sortOrder: number
  itemTotalPrice: number
  formattedItemPrice: string
  formattedItemTotalPrice: string
  furniture: Furniture
}

interface FurnitureSet {
  setId: number
  setName: string
  description?: string
  price: number
  isActive: boolean
  createdAt: string
  category?: Category
  furnitureSetImages: FurnitureSetImage[]
  furnitureSetColors: FurnitureSetColor[]
  furnitureSetProperties: FurnitureSetProperty[]
  furnitureItems: FurnitureItem[]
}

interface NewImageFile {
  file: File
  preview: string
  imageType: 'main' | 'gallery'
  sortOrder: number
  tempId: string
}

// Modern Dark Theme Icons
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

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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

// Enhanced Image Component with Dark Theme
const FurnitureSetImageDisplay = ({ 
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

export default function FurnitureSetEdit({ setId }: { setId: number }) {
  const router = useRouter()
  
  // State management
  const [furnitureSet, setFurnitureSet] = useState<FurnitureSet | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  
  // Form data
  const [formData, setFormData] = useState({
    setName: '',
    categoryId: '',
    description: '',
    price: '',
    isActive: true
  })
  
  // Options data
  const [categories, setCategories] = useState<Category[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [furnitureList, setFurnitureList] = useState<Furniture[]>([])
  
  // Current selections
  const [selectedColors, setSelectedColors] = useState<number[]>([])
  const [selectedProperties, setSelectedProperties] = useState<{ propertyId: number; propertyValue: string }[]>([])
  const [selectedFurniture, setSelectedFurniture] = useState<{ furnitureId: number; quantity: number; sortOrder: number }[]>([])
  
  // Image management
  const [existingImages, setExistingImages] = useState<FurnitureSetImage[]>([])
  const [newImages, setNewImages] = useState<NewImageFile[]>([])
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([])
  const [imageOrderUpdates, setImageOrderUpdates] = useState<{[key: number]: number}>({}) // Track sort order changes
  
  // UI State
  const [showFurnitureModal, setShowFurnitureModal] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Load initial data
  useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('🔄 Loading furniture set data...', setId)
      
      // Load furniture set details
      const setResponse = await fetch(`/api/furniture-sets/${setId}?includeDetails=true&includeFurnitureDetails=true&calculatePricing=true`)
      
      if (!setResponse.ok) {
        throw new Error(`HTTP ${setResponse.status}: ${setResponse.statusText}`)
      }
      
      const setData = await setResponse.json()
      
      if (!setData.success) {
        setError(setData.error || 'Mobilya takımı bulunamadı')
        return
      }
      
      const set = setData.data
      setFurnitureSet(set)
      
      console.log('✅ Furniture set loaded:', set.setName)
      
      // Set form data
      setFormData({
        setName: set.setName || '',
        categoryId: set.category?.categoryId?.toString() || '',
        description: set.description || '',
        price: set.price?.toString() || '',
        isActive: set.isActive
      })
      
      // Set existing selections
      setSelectedColors(set.furnitureSetColors?.map((fc: FurnitureSetColor) => fc.color.colorId) || [])
      setSelectedProperties(set.furnitureSetProperties?.map((fp: FurnitureSetProperty) => ({
        propertyId: fp.propertyId,
        propertyValue: fp.propertyValue
      })) || [])
      setSelectedFurniture(set.furnitureItems?.map((item: FurnitureItem) => ({
        furnitureId: item.furnitureId,
        quantity: item.quantity,
        sortOrder: item.sortOrder
      })) || [])
      
      // ✅ API uyumlu thumbnail filtering
      const fullSizeImages = (set.furnitureSetImages || []).filter((img: FurnitureSetImage) => 
        img.imageType !== 'thumbnail'
      )
      setExistingImages(fullSizeImages)
      
      console.log(`📸 Loaded ${fullSizeImages.length} main images (thumbnails filtered out)`)
      
      // Load options
      console.log('🔄 Loading options data...')
      
      const [categoriesRes, colorsRes, propertiesRes, furnitureRes] = await Promise.all([
        fetch('/api/categories?level=1&active=true'), // ✅ Düzeltilmiş endpoint
        fetch('/api/colors?active=true'),
        fetch('/api/properties?active=true'),
        fetch('/api/furniture?active=true&limit=100')
      ])
      
      // Check all responses
      if (!categoriesRes.ok) throw new Error(`Categories API error: ${categoriesRes.status}`)
      if (!colorsRes.ok) throw new Error(`Colors API error: ${colorsRes.status}`)
      if (!propertiesRes.ok) throw new Error(`Properties API error: ${propertiesRes.status}`)
      if (!furnitureRes.ok) throw new Error(`Furniture API error: ${furnitureRes.status}`)
      
      const [categoriesData, colorsData, propertiesData, furnitureData] = await Promise.all([
        categoriesRes.json(),
        colorsRes.json(),
        propertiesRes.json(),
        furnitureRes.json()
      ])
      
      // Set options data
      if (categoriesData.success) {
        setCategories(categoriesData.data)
        console.log(`✅ Loaded ${categoriesData.data.length} categories`)
      } else {
        console.warn('Categories load failed:', categoriesData.error)
      }
      
      if (colorsData.success) {
        setColors(colorsData.data)
        console.log(`✅ Loaded ${colorsData.data.length} colors`)
      }
      
      if (propertiesData.success) {
        setProperties(propertiesData.data)
        console.log(`✅ Loaded ${propertiesData.data.length} properties`)
      }
      
      if (furnitureData.success) {
        setFurnitureList(furnitureData.data)
        console.log(`✅ Loaded ${furnitureData.data.length} furniture items`)
      }
      
    } catch (err) {
      console.error('❌ Data loading error:', err)
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Bağlantı hatası. İnternet bağlantınızı kontrol edin ve sayfayı yenileyin.')
      } else if (err instanceof Error && err.message.includes('HTTP')) {
        if (err.message.includes('404')) {
          setError('Mobilya takımı bulunamadı. Belki silinmiş olabilir.')
        } else if (err.message.includes('403')) {
          setError('Bu işlem için yetkiniz yok.')
        } else {
          setError(`Sunucu hatası: ${err.message}`)
        }
      } else {
        setError('Veriler yüklenirken beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin.')
      }
    } finally {
      setLoading(false)
    }
  }
  
  if (setId) {
    loadData()
  }
}, [setId])

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

  // Furniture management
  const addFurniture = (furniture: Furniture) => {
    const exists = selectedFurniture.find(item => item.furnitureId === furniture.furnitureId)
    if (!exists) {
      setSelectedFurniture(prev => [...prev, {
        furnitureId: furniture.furnitureId,
        quantity: 1,
        sortOrder: prev.length + 1
      }])
    }
    setShowFurnitureModal(false)
  }

  const updateFurnitureQuantity = (furnitureId: number, quantity: number) => {
    if (quantity <= 0) {
      setSelectedFurniture(prev => prev.filter(item => item.furnitureId !== furnitureId))
    } else {
      setSelectedFurniture(prev => 
        prev.map(item => 
          item.furnitureId === furnitureId 
            ? { ...item, quantity }
            : item
        )
      )
    }
  }

  // Image management
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
          imageType: index === 0 && existingImages.length === 0 ? 'main' : 'gallery',
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
    const imageToRemove = existingImages.find(img => img.image.imageId === imageId)
    if (!imageToRemove) return

    // Add to removed list (this will cascade delete thumbnails in backend)
    setRemovedImageIds(prev => [...prev, imageId])
    
    // Remove from existing images
    setExistingImages(prev => prev.filter(img => img.image.imageId !== imageId))
    
    // Remove from order updates if exists
    setImageOrderUpdates(prev => {
      const updated = { ...prev }
      delete updated[imageId]
      return updated
    })
  }

  const removeNewImage = (tempId: string) => {
    setNewImages(prev => prev.filter(img => img.tempId !== tempId))
  }

  const changeExistingImageType = (imageId: number, newType: 'main' | 'gallery') => {
    setExistingImages(prev => prev.map(img => {
      if (img.image.imageId === imageId) {
        return { ...img, imageType: newType }
      }
      // If setting this as main, make other main images gallery
      if (newType === 'main' && img.imageType === 'main') {
        return { ...img, imageType: 'gallery' }
      }
      return img
    }))
    
    // Also check new images
    if (newType === 'main') {
      setNewImages(prev => prev.map(img => {
        if (img.imageType === 'main') {
          return { ...img, imageType: 'gallery' }
        }
        return img
      }))
    }
  }

  const changeNewImageType = (tempId: string, newType: 'main' | 'gallery') => {
    setNewImages(prev => prev.map(img => {
      if (img.tempId === tempId) {
        return { ...img, imageType: newType }
      }
      // If setting this as main, make other main images gallery
      if (newType === 'main' && img.imageType === 'main') {
        return { ...img, imageType: 'gallery' }
      }
      return img
    }))
    
    // Also check existing images
    if (newType === 'main') {
      setExistingImages(prev => prev.map(img => {
        if (img.imageType === 'main') {
          return { ...img, imageType: 'gallery' }
        }
        return img
      }))
    }
  }

  // Sort order management for existing images
  const updateExistingImageOrder = (imageId: number, newSortOrder: number) => {
    const currentImage = existingImages.find(img => img.image.imageId === imageId)
    if (!currentImage) return
    
    const totalImages = existingImages.length + newImages.length
    if (newSortOrder < 1 || newSortOrder > totalImages) return
    
    // Track the change for API update
    setImageOrderUpdates(prev => ({
      ...prev,
      [imageId]: newSortOrder
    }))
    
    // Update local state for UI
    setExistingImages(prev => {
      const updatedImages = prev.map(img => 
        img.image.imageId === imageId 
          ? { ...img, sortOrder: newSortOrder }
          : img
      )
      
      // Reorder images to avoid conflicts
      return updatedImages.sort((a, b) => {
        const aOrder = imageOrderUpdates[a.image.imageId] || a.sortOrder
        const bOrder = imageOrderUpdates[b.image.imageId] || b.sortOrder
        return aOrder - bOrder
      })
    })
  }

  const moveExistingImageUp = (imageId: number) => {
    const currentImage = existingImages.find(img => img.image.imageId === imageId)
    if (!currentImage) return
    
    const currentOrder = imageOrderUpdates[imageId] || currentImage.sortOrder
    if (currentOrder <= 1) return
    
    updateExistingImageOrder(imageId, currentOrder - 1)
  }

  const moveExistingImageDown = (imageId: number) => {
    const currentImage = existingImages.find(img => img.image.imageId === imageId)
    if (!currentImage) return
    
    const totalImages = existingImages.length + newImages.length
    const currentOrder = imageOrderUpdates[imageId] || currentImage.sortOrder
    if (currentOrder >= totalImages) return
    
    updateExistingImageOrder(imageId, currentOrder + 1)
  }

  // Sort order management for new images  
  const updateNewImageOrder = (tempId: string, newSortOrder: number) => {
    const totalImages = existingImages.length + newImages.length
    if (newSortOrder < 1 || newSortOrder > totalImages) return
    
    setNewImages(prev => {
      const imageToMove = prev.find(img => img.tempId === tempId)
      if (!imageToMove) return prev
      
      const otherImages = prev.filter(img => img.tempId !== tempId)
      
      // Update the moved image's sort order
      const updatedImage = { ...imageToMove, sortOrder: newSortOrder }
      
      // Recalculate all sort orders
      const allImages = [...otherImages, updatedImage].sort((a, b) => a.sortOrder - b.sortOrder)
      
      return allImages.map((img, index) => ({
        ...img,
        sortOrder: index + 1 + existingImages.length
      }))
    })
  }

  const moveNewImageUp = (tempId: string) => {
    const currentImage = newImages.find(img => img.tempId === tempId)
    if (!currentImage || currentImage.sortOrder <= existingImages.length + 1) return
    
    updateNewImageOrder(tempId, currentImage.sortOrder - 1)
  }

  const moveNewImageDown = (tempId: string) => {
    const currentImage = newImages.find(img => img.tempId === tempId)
    const totalImages = existingImages.length + newImages.length
    if (!currentImage || currentImage.sortOrder >= totalImages) return
    
    updateNewImageOrder(tempId, currentImage.sortOrder + 1)
  }

  // Validation
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.setName.trim()) {
      newErrors.setName = 'Takım adı gereklidir'
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Kategori seçimi gereklidir'
    }

    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Geçerli bir fiyat giriniz'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

// Submit form
const handleSubmit = async () => {
  if (!validateForm()) return
  
  setSaving(true)
  setError('')
  setSuccess('')

  try {
    const submitData = new FormData()
    
    // Basic info
    submitData.append('setName', formData.setName.trim())
    submitData.append('categoryId', formData.categoryId)
    submitData.append('description', formData.description.trim())
    submitData.append('price', formData.price)
    submitData.append('isActive', formData.isActive.toString())
    
    // Furniture items
    if (selectedFurniture.length > 0) {
      submitData.append('furnitureItems', JSON.stringify(selectedFurniture))
    }
    
    // Colors
    if (selectedColors.length > 0) {
      submitData.append('colorIds', JSON.stringify(selectedColors))
    }
    
    // Properties
    if (selectedProperties.length > 0) {
      submitData.append('properties', JSON.stringify(selectedProperties))
    }
    
    // Images to remove
    if (removedImageIds.length > 0) {
      submitData.append('removeImageIds', JSON.stringify(removedImageIds))
    }
    
    // ✅ API uyumlu format - Image order updates
    if (Object.keys(imageOrderUpdates).length > 0) {
      const updateImageOrderData = Object.entries(imageOrderUpdates).map(([imageId, sortOrder]) => ({
        imageId: parseInt(imageId),
        sortOrder
      }))
      submitData.append('updateImageOrder', JSON.stringify(updateImageOrderData))
    }
    
    // Image type mappings for new images
    const imageTypeMappings: {[key: string]: 'main' | 'gallery'} = {}
    newImages.forEach(img => {
      imageTypeMappings[img.file.name] = img.imageType
    })
    if (Object.keys(imageTypeMappings).length > 0) {
      submitData.append('imageTypeMappings', JSON.stringify(imageTypeMappings))
    }
    
    // New images
    newImages.forEach(img => {
      submitData.append('newImages', img.file)
    })

    console.log('🚀 Submitting furniture set update...', {
      removedImages: removedImageIds.length,
      newImages: newImages.length,
      orderUpdates: Object.keys(imageOrderUpdates).length
    })

    const response = await fetch(`/api/furniture-sets/${setId}`, {
      method: 'PUT',
      body: submitData
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()

    if (result.success) {
      setSuccess('✅ Mobilya takımı başarıyla güncellendi!')
      
      // Image operation sonuçlarını log'la
      if (result.imageOperations) {
        console.log(`📸 Resim işlemleri: ${result.imageOperations.uploaded} yüklendi, ${result.imageOperations.deleted} silindi`)
      }
      
      setTimeout(() => {
        router.push(`/admin/furniture-sets/${setId}`)
      }, 2000)
    } else {
      // Enhanced error handling
      if (result.validationErrors && Array.isArray(result.validationErrors)) {
        const newErrors: {[key: string]: string} = {}
        result.validationErrors.forEach((error: string) => {
          const errorLower = error.toLowerCase()
          if (errorLower.includes('name') || errorLower.includes('takım')) {
            newErrors.setName = error
          } else if (errorLower.includes('category') || errorLower.includes('kategori')) {
            newErrors.categoryId = error
          } else if (errorLower.includes('price') || errorLower.includes('fiyat')) {
            newErrors.price = error
          } else {
            setError(error)
          }
        })
        setErrors(newErrors)
      } else {
        setError(result.error || 'Güncelleme sırasında hata oluştu')
      }
    }
  } catch (error) {
    console.error('❌ Submit error:', error)
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      setError('Bağlantı hatası. İnternet bağlantınızı kontrol edin ve tekrar deneyin.')
    } else if (error instanceof Error && error.message.includes('HTTP')) {
      setError(`Sunucu hatası: ${error.message}`)
    } else {
      setError('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.')
    }
  } finally {
    setSaving(false)
  }
}

  // Auto-hide messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Calculate pricing
  const calculateTotalPrice = () => {
    return selectedFurniture.reduce((sum, item) => {
      const furniture = furnitureList.find(f => f.furnitureId === item.furnitureId)
      return sum + (Number(furniture?.price) || 0) * item.quantity
    }, 0)
  }

  const totalIndividualPrice = calculateTotalPrice()
  const setPrice = parseFloat(formData.price) || 0
  const savings = totalIndividualPrice - setPrice

  // Get selected category
  const selectedCategory = categories.find(cat => cat.categoryId === parseInt(formData.categoryId))

  // Success screen
  if (success && !saving) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 border border-white/20 shadow-2xl text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckIcon />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Başarılı!</h2>
          <p className="text-white/80 mb-6">Mobilya takımı başarıyla güncellendi.</p>
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
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => router.back()}
                className="group flex items-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-2 sm:py-3 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-xl sm:rounded-2xl transition-all duration-300 border border-white/20 hover:border-white/30 text-sm sm:text-base"
              >
                <ArrowLeftIcon />
                <span className="font-medium">Geri Dön</span>
              </button>
            </div>
            
            <div className="text-center w-full lg:w-auto">
              <div className="inline-flex items-center space-x-2 sm:space-x-3 px-3 sm:px-6 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full mb-3 sm:mb-4 border border-white/20 text-xs sm:text-base">
                <span className="text-lg sm:text-2xl">✏️</span>
                <span className="text-white/80 font-medium">Mobilya Takımı Düzenle</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent leading-tight px-4">
                {furnitureSet?.setName || 'Mobilya Takımı Düzenle'}
              </h1>
            </div>

            <div className="hidden lg:block w-32"></div> {/* Spacer for balance */}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12 sm:py-20">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-12 border border-white/20 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-center sm:text-left">
                <LoaderIcon />
                <span className="text-white font-medium text-sm sm:text-lg">Veriler yükleniyor...</span>
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

        {/* Form */}
        {!loading && furnitureSet && (
          <div className="space-y-6 sm:space-y-8">
            
            {/* Basic Information */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-sm px-4 sm:px-8 py-4 sm:py-6 border-b border-white/10">
                <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center space-x-2 sm:space-x-3">
                  <span className="text-xl sm:text-3xl">📋</span>
                  <span>Temel Bilgiler</span>
                </h2>
              </div>
              
              <div className="p-4 sm:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-white/90">
                      Takım Adı *
                    </label>
                    <input
                      type="text"
                      name="setName"
                      value={formData.setName}
                      onChange={handleInputChange}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border rounded-lg sm:rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base ${
                        errors.setName ? 'border-red-400 bg-red-500/20' : 'border-white/20'
                      }`}
                      placeholder="Örn: Modern Salon Takımı"
                      required
                    />
                    {errors.setName && <p className="text-xs sm:text-sm text-red-300 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{errors.setName}</span>
                    </p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-white/90">
                      Kategori *
                    </label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border rounded-lg sm:rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base ${
                        errors.categoryId ? 'border-red-400 bg-red-500/20' : 'border-white/20'
                      }`}
                      required
                    >
                      <option value="" className="text-gray-900">Kategori seçin</option>
                      {categories.map(category => (
                        <option key={category.categoryId} value={category.categoryId} className="text-gray-900">
                          {category.categoryName}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && <p className="text-xs sm:text-sm text-red-300 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{errors.categoryId}</span>
                    </p>}
                    {selectedCategory && (
                      <div className="mt-2 sm:mt-3 p-3 sm:p-4 bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/20">
                        <div className="text-xs sm:text-sm text-white/80">
                          <span className="font-semibold">Seçilen Kategori:</span> {selectedCategory.categoryName}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-white/90">
                      Fiyat (₺) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 pl-8 sm:pl-12 bg-white/10 backdrop-blur-sm border rounded-lg sm:rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base ${
                          errors.price ? 'border-red-400 bg-red-500/20' : 'border-white/20'
                        }`}
                        placeholder="0.00"
                        required
                      />
                      <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                        <span className="text-white/60 text-sm sm:text-lg">₺</span>
                      </div>
                    </div>
                    {errors.price && <p className="text-xs sm:text-sm text-red-300 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{errors.price}</span>
                    </p>}
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-xs sm:text-sm font-medium text-white/90">Aktif olarak yayınla</span>
                    </label>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-white/90">
                    Açıklama
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-sm sm:text-base"
                    placeholder="Takım hakkında detaylar..."
                  />
                </div>
              </div>
            </div>

            {/* Furniture Selection */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600/80 to-red-600/80 backdrop-blur-sm px-8 py-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                    <span className="text-3xl">🪑</span>
                    <span>Mobilyalar ({selectedFurniture.length})</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowFurnitureModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all duration-200"
                  >
                    <PlusIcon />
                    <span>Mobilya Ekle</span>
                  </button>
                </div>
              </div>

              <div className="p-8">
                {selectedFurniture.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-white/30 rounded-xl bg-white/5">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                        <span className="text-3xl">🪑</span>
                      </div>
                      <div>
                        <p className="text-white/80 font-medium">Henüz mobilya eklenmedi</p>
                        <button
                          type="button"
                          onClick={() => setShowFurnitureModal(true)}
                          className="mt-2 text-orange-300 hover:text-orange-100 font-medium transition-colors"
                        >
                          Mobilya ekleyin
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedFurniture.map((item) => {
                      const furniture = furnitureList.find(f => f.furnitureId === item.furnitureId)
                      const itemTotal = (Number(furniture?.price) || 0) * item.quantity
                      
                      return (
                        <div key={item.furnitureId} className="group relative bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-white mb-1">{furniture?.furnitureName}</h3>
                              <p className="text-sm text-white/60 mb-2">{furniture?.furnitureType}</p>
                              <div className="flex items-center space-x-2">
                                <span className="text-2xl">💰</span>
                                <span className="text-sm text-white/80">
                                  ₺{Number(furniture?.price)?.toLocaleString('tr-TR')} × {item.quantity} = 
                                  <span className="font-semibold text-green-300 ml-1">
                                    ₺{itemTotal.toLocaleString('tr-TR')}
                                  </span>
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2 bg-white/10 rounded-xl border border-white/20 p-2">
                                <button
                                  type="button"
                                  onClick={() => updateFurnitureQuantity(item.furnitureId, item.quantity - 1)}
                                  className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-medium text-white">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateFurnitureQuantity(item.furnitureId, item.quantity + 1)}
                                  className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => updateFurnitureQuantity(item.furnitureId, 0)}
                                className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                                title="Mobilyayı kaldır"
                              >
                                <DeleteIcon />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Price Summary */}
                {selectedFurniture.length > 0 && (
                  <div className="mt-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
                    <h3 className="font-semibold text-green-300 mb-4 flex items-center space-x-2">
                      <span className="text-2xl">💰</span>
                      <span>Fiyat Özeti</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/80">Toplam Mobilya Fiyatı:</span>
                        <span className="font-medium text-white">₺{totalIndividualPrice.toLocaleString('tr-TR')}</span>
                      </div>
                      {setPrice > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-white/80">Takım Fiyatı:</span>
                            <span className="font-medium text-white">₺{setPrice.toLocaleString('tr-TR')}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold border-t border-green-400/30 pt-3">
                            <span className="text-white">{savings > 0 ? 'Tasarruf:' : 'Fark:'}</span>
                            <span className={savings > 0 ? 'text-green-300' : 'text-red-300'}>
                              {savings > 0 ? '-' : '+'}₺{Math.abs(savings).toLocaleString('tr-TR')}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
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
                          </label>
                          <input
                            type="text"
                            value={existingProperty?.propertyValue || ''}
                            onChange={(e) => updateProperty(property.propertyId, e.target.value)}
                            placeholder={`${property.propertyName} değeri`}
                            className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Modern Images Section */}
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Görseller</span>
                  <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                    {existingImages.length + newImages.length}
                  </span>
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Modern Upload Area */}
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    id="furniture-set-edit-image-upload"
                  />
                  <label
                    htmlFor="furniture-set-edit-image-upload"
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-600 rounded-2xl bg-gradient-to-br from-gray-700/50 to-gray-800/50 hover:from-indigo-600/10 hover:to-purple-600/10 hover:border-indigo-500/50 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                      Yeni Görseller Yükle
                    </h3>
                    <p className="text-gray-400 text-center text-sm mb-3">
                      Dosyaları buraya sürükleyip bırakın veya seçmek için tıklayın
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>📎 Çoklu seçim</span>
                      <span>📏 Maks 100MB</span>
                      <span>🖼️ JPG, PNG, GIF, WebP</span>
                    </div>
                  </label>
                </div>

                {/* Existing Images - Modern Grid */}
                {existingImages.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        Mevcut Görseller
                      </h3>
                      <div className="text-sm text-gray-400">
                        {existingImages.filter(img => img.imageType === 'main').length} ana, {existingImages.filter(img => img.imageType === 'gallery').length} galeri
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {existingImages
                        .sort((a, b) => {
                          const aOrder = imageOrderUpdates[a.image.imageId] || a.sortOrder
                          const bOrder = imageOrderUpdates[b.image.imageId] || b.sortOrder
                          return aOrder - bOrder
                        })
                        .map((imageItem) => {
                          const currentOrder = imageOrderUpdates[imageItem.image.imageId] || imageItem.sortOrder
                          const totalImages = existingImages.length + newImages.length
                          
                          return (
                            <div key={imageItem.image.imageId} className="group relative bg-gray-700 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                              <div className="aspect-square relative overflow-hidden">
                                <FurnitureSetImageDisplay
                                  image={imageItem.image}
                                  alt={imageItem.image.altText || 'Furniture image'}
                                />
                                
                                {/* Image Type Badge */}
                                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${
                                  imageItem.imageType === 'main'
                                    ? 'bg-yellow-500/90 text-white border border-yellow-400/50' 
                                    : 'bg-blue-500/90 text-white border border-blue-400/50'
                                }`}>
                                  {imageItem.imageType === 'main' ? '⭐ Ana Görsel' : '📸 Galeri'}
                                </div>
                                
                                {/* Sort Order Badge */}
                                <div className="absolute top-3 right-3 w-8 h-8 bg-black/70 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-sm font-bold border border-white/20">
                                  {currentOrder}
                                </div>
                                
                                {/* Delete Button */}
                                <button
                                  type="button"
                                  onClick={() => removeExistingImage(imageItem.image.imageId)}
                                  className="absolute bottom-3 right-3 p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
                                  title="Görseli Sil"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                              
                              <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium text-gray-300 truncate" title={imageItem.image.fileName}>
                                    {imageItem.image.fileName}
                                  </div>
                                  {imageItem.image.fileSize && (
                                    <span className="text-xs text-gray-500">
                                      {(imageItem.image.fileSize / 1024 / 1024).toFixed(1)}MB
                                    </span>
                                  )}
                                </div>
                                
                                {/* Image Type Controls */}
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => changeExistingImageType(imageItem.image.imageId, 'main')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                                      imageItem.imageType === 'main'
                                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' 
                                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                    }`}
                                  >
                                    ⭐ Ana
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => changeExistingImageType(imageItem.image.imageId, 'gallery')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                                      imageItem.imageType === 'gallery'
                                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' 
                                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                    }`}
                                  >
                                    📸 Galeri
                                  </button>
                                </div>
                                
                                {/* Modern Sort Controls */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1">
                                    <button
                                      type="button"
                                      onClick={() => moveExistingImageUp(imageItem.image.imageId)}
                                      disabled={currentOrder <= 1}
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
                                      disabled={currentOrder >= totalImages}
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
                                    max={totalImages}
                                    value={currentOrder}
                                    onChange={(e) => updateExistingImageOrder(imageItem.image.imageId, parseInt(e.target.value) || 1)}
                                    className="w-16 px-2 py-1 text-sm border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-600 text-white text-center"
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* New Images */}
                {newImages.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center space-x-2">
                      <span>🆕</span>
                      <span>Yeni Görseller ({newImages.length})</span>
                      <span className="text-sm text-white/60 font-normal">(Kaydetince yüklenecek)</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {newImages
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((image) => {
                          const totalImages = existingImages.length + newImages.length
                          
                          return (
                            <div key={image.tempId} className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden group hover:bg-white/15 transition-all duration-200">
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
                                  className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-red-600/80 transition-all duration-200 opacity-0 group-hover:opacity-100"
                                  title="Yeni görseli kaldır"
                                >
                                  <DeleteIcon />
                                </button>
                                
                                {/* Sort Order Badge */}
                                <div className="absolute top-2 left-2 bg-green-600/80 backdrop-blur-sm text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold border-2 border-white/30">
                                  {image.sortOrder}
                                </div>
                                
                                {/* New Badge */}
                                <div className="absolute top-14 left-2 bg-green-500/80 backdrop-blur-sm text-white rounded-full px-3 py-1 text-xs font-bold">
                                  YENİ
                                </div>
                                
                                {/* Main Image Badge */}
                                {image.imageType === 'main' && (
                                  <div className="absolute top-24 left-2 bg-yellow-500/80 backdrop-blur-sm text-white rounded-full px-3 py-1 text-xs font-bold flex items-center space-x-1">
                                    <StarIcon />
                                    <span>ANA</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-medium text-white/90 truncate">
                                    {image.file.name}
                                  </span>
                                  <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded">
                                    {(image.file.size / 1024 / 1024).toFixed(1)}MB
                                  </span>
                                </div>
                                
                                {/* Sort Order Controls */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-1">
                                    <button
                                      type="button"
                                      onClick={() => moveNewImageUp(image.tempId)}
                                      disabled={image.sortOrder <= existingImages.length + 1}
                                      className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-all duration-200"
                                      title="Yukarı taşı"
                                    >
                                      <UpIcon />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveNewImageDown(image.tempId)}
                                      disabled={image.sortOrder >= totalImages}
                                      className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-all duration-200"
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
                                      max={totalImages}
                                      value={image.sortOrder}
                                      onChange={(e) => updateNewImageOrder(image.tempId, parseInt(e.target.value) || image.sortOrder)}
                                      className="w-16 px-2 py-1 text-xs bg-white/10 border border-white/30 rounded text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                                    />
                                  </div>
                                </div>
                                
                                {/* Image Type & Main Toggle */}
                                <div className="flex items-center justify-between">
                                  <div className="flex space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => changeNewImageType(image.tempId, 'main')}
                                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        image.imageType === 'main'
                                          ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-400/50'
                                          : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/30'
                                      }`}
                                    >
                                      <StarIcon />
                                      <span>Ana Görsel</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => changeNewImageType(image.tempId, 'gallery')}
                                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        image.imageType === 'gallery'
                                          ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50'
                                          : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/30'
                                      }`}
                                    >
                                      <GalleryIcon />
                                      <span>Galeri</span>
                                    </button>
                                  </div>
                                  
                                  {/* Quick Main Toggle */}
                                  {image.imageType !== 'main' && (
                                    <button
                                      type="button"
                                      onClick={() => changeNewImageType(image.tempId, 'main')}
                                      className="text-xs bg-yellow-600/20 text-yellow-300 px-3 py-1 rounded-lg hover:bg-yellow-600/30 transition-colors border border-yellow-500/30"
                                      title="Ana görsel yap"
                                    >
                                      ⭐ Ana Yap
                                    </button>
                                  )}
                                </div>
                                
                                {/* Warning for Main Image */}
                                {image.imageType === 'main' && (
                                  <div className="mt-2 text-xs text-yellow-300 bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-2">
                                    🌟 Bu ana görsel olacak. Diğer ana görseller galeri olur.
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
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
                        <p className="text-white/80 font-medium">Bu takımda henüz görsel yok</p>
                        <p className="text-sm text-white/60 mt-1">
                          Yukarıdaki dosya seçici ile görsel ekleyebilirsiniz
                        </p>
                        <p className="text-xs text-white/50 mt-2">
                          💡 Ana görsel seçmeyi unutmayın!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 sm:px-8 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg sm:rounded-xl hover:bg-white/20 transition-all duration-200 font-medium text-sm sm:text-base order-2 sm:order-1"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center justify-center space-x-2 px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg text-sm sm:text-base order-1 sm:order-2"
              >
                {saving ? <LoaderIcon /> : <SaveIcon />}
                <span>{saving ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Furniture Selection Modal */}
      {showFurnitureModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[80vh] sm:max-h-96 overflow-hidden shadow-2xl border border-white/20">
            <div className="bg-gradient-to-r from-orange-600/80 to-red-600/80 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-white/20">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                <span className="text-xl sm:text-2xl">🪑</span>
                <span>Mobilya Seç</span>
              </h3>
              <button
                onClick={() => setShowFurnitureModal(false)}
                className="text-white hover:text-white/80 p-1 sm:p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                <span className="text-lg sm:text-xl">×</span>
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] sm:max-h-80">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {furnitureList
                  .filter(furniture => !selectedFurniture.find(item => item.furnitureId === furniture.furnitureId))
                  .map(furniture => (
                  <div
                    key={furniture.furnitureId}
                    className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-orange-400 hover:bg-white/20 cursor-pointer transition-all duration-200"
                    onClick={() => addFurniture(furniture)}
                  >
                    <h4 className="font-semibold text-white group-hover:text-orange-200 transition-colors text-sm sm:text-base">
                      {furniture.furnitureName}
                    </h4>
                    <p className="text-xs sm:text-sm text-white/60 mt-1">{furniture.furnitureType}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-sm sm:text-lg">💰</span>
                      <span className="text-xs sm:text-sm font-medium text-green-300">
                        ₺{Number(furniture.price).toLocaleString('tr-TR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}