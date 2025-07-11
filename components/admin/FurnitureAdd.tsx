'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// TypeScript interfaces
interface Category {
  categoryId: number
  categoryName: string
  categoryPath?: string
  categoryLevel: number
  parentId?: number | null
  children?: Category[]
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

interface ImageFile {
  file: File
  preview: string
  imageType: string
  sortOrder: number
  id: string // Unique identifier for React keys
}

interface FormData {
  furnitureName: string
  furnitureType: string
  parentCategoryId: string
  categoryId: string
  description: string
  price: string
  isActive: boolean
  colorIds: number[]
  properties: PropertyValue[]
}

interface APIResponse {
  success: boolean
  data?: any
  error?: string
  message?: string
  validationErrors?: string[]
  imageResults?: {
    uploaded: number
    total: number
    details: any[]
  }
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

const SaveIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const ImageIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m4 16 4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const UploadIcon = () => (
  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const StarIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const DragIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
)

// ✅ DÜZELTME 1: Güvenilir Image Preview Component
interface ImagePreviewComponentProps {
  image: ImageFile
  index: number
  onRemove: (id: string) => void
  onTypeChange: (id: string, newType: string) => void
}

const ImagePreviewComponent: React.FC<ImagePreviewComponentProps> = ({ 
  image, 
  index, 
  onRemove, 
  onTypeChange 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Debug log
  useEffect(() => {
    console.log(`🖼️ Image Preview Component mounted for: ${image.file.name}`, {
      previewUrl: image.preview,
      fileSize: image.file.size,
      fileType: image.file.type
    })
  }, [image])

  const handleImageLoad = () => {
    console.log('✅ Image loaded successfully:', image.file.name)
    setImageLoaded(true)
    setImageError(false)
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('❌ Image load error for:', image.file.name, e)
    setImageError(true)
    setImageLoaded(false)
  }

  return (
    <div className="relative group">
      <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm group-hover:shadow-md transition-shadow bg-gray-50">
        {!imageError && image.preview ? (
          <img
            src={image.preview}
            alt={`Preview ${index + 1} - ${image.file.name}`}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ 
              maxWidth: '100%', 
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          // Fallback UI
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-3">
            <ImageIcon />
            <p className="text-xs text-gray-600 mt-2 text-center font-medium break-words">
              {image.file.name}
            </p>
            <p className="text-xs text-gray-500">
              {imageError ? 'Yüklenemedi' : 'Yükleniyor...'}
            </p>
            <div className="text-xs text-gray-400 mt-1 text-center">
              <div>{(image.file.size / 1024 / 1024).toFixed(2)}MB</div>
              <div>{image.file.type}</div>
            </div>
          </div>
        )}
        
        {/* Loading overlay */}
        {!imageLoaded && !imageError && image.preview && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-xs text-gray-600 mt-2">Yükleniyor...</p>
          </div>
        )}
      </div>
      
      {/* Hover controls */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-xl flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={() => onRemove(image.id)}
            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors shadow-lg"
            title="Resmi Sil"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      
      {/* Image type selector */}
      <div className="absolute top-2 left-2">
        <select
          value={image.imageType}
          onChange={(e) => onTypeChange(image.id, e.target.value)}
          className="text-xs bg-white/95 backdrop-blur-sm border border-gray-200 rounded-md px-2 py-1 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="main_image">Ana Görsel</option>
          <option value="gallery_image">Galeri</option>
        </select>
      </div>
      
      {/* Main image badge */}
      {image.imageType === 'main_image' && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-white p-1.5 rounded-lg shadow-lg">
          <StarIcon />
        </div>
      )}
      
      {/* Sort order */}
      <div className="absolute bottom-2 right-2 bg-gray-900/80 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
        #{image.sortOrder}
      </div>
    </div>
  )
}

export default function FurnitureAdd() {
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState<FormData>({
    furnitureName: '',
    furnitureType: '',
    parentCategoryId: '',
    categoryId: '',
    description: '',
    price: '',
    isActive: true,
    colorIds: [],
    properties: []
  })

  // Image state
  const [images, setImages] = useState<ImageFile[]>([])
  const [dragActive, setDragActive] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)

  // Options state
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<Category[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [properties, setProperties] = useState<Property[]>([])

  // UI state
  const [loading, setLoading] = useState<boolean>(false)
  const [loadingOptions, setLoadingOptions] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [success, setSuccess] = useState<string>('')
  const [showPreview, setShowPreview] = useState<boolean>(false)

  // Load options for dropdowns with error handling
  const loadOptions = useCallback(async (): Promise<void> => {
    try {
      setLoadingOptions(true)
      setError('')
      
      const [categoriesRes, colorsRes, propertiesRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/colors'),
        fetch('/api/properties')
      ])

      // Load categories
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        if (categoriesData.success) {
          setCategories(categoriesData.data || [])
        } else {
          console.warn('Categories loading failed:', categoriesData.error)
        }
      }

      // Load colors
      if (colorsRes.ok) {
        const colorsData = await colorsRes.json()
        if (colorsData.success) {
          setColors((colorsData.data || []).filter((color: Color) => color.isActive))
        } else {
          console.warn('Colors loading failed:', colorsData.error)
        }
      }

      // Load properties
      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json()
        if (propertiesData.success) {
          setProperties((propertiesData.data || []).filter((prop: Property) => prop.isActive))
        } else {
          console.warn('Properties loading failed:', propertiesData.error)
        }
      }
    } catch (err) {
      console.error('Options yükleme hatası:', err)
      setError('Seçenekler yüklenirken hata oluştu. Lütfen sayfayı yenileyin.')
    } finally {
      setLoadingOptions(false)
    }
  }, [])

  // Handle parent category change
  const handleParentCategoryChange = useCallback((parentCategoryId: string): void => {
    setFormData(prev => ({
      ...prev,
      parentCategoryId,
      categoryId: '' // Reset sub category selection
    }))

    if (parentCategoryId) {
      const selectedParent = categories.find(cat => cat.categoryId === parseInt(parentCategoryId))
      setSubCategories(selectedParent?.children || [])
    } else {
      setSubCategories([])
    }
  }, [categories])

  // Handle form input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else if (name === 'parentCategoryId') {
      handleParentCategoryChange(value)
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }, [handleParentCategoryChange])

  // Handle color selection
  const handleColorToggle = useCallback((colorId: number): void => {
    setFormData(prev => ({
      ...prev,
      colorIds: prev.colorIds.includes(colorId)
        ? prev.colorIds.filter(id => id !== colorId)
        : [...prev.colorIds, colorId]
    }))
  }, [])

  // Handle property value change
  const handlePropertyChange = useCallback((propertyId: number, value: string): void => {
    setFormData(prev => ({
      ...prev,
      properties: prev.properties.some(p => p.propertyId === propertyId)
        ? prev.properties.map(p => 
            p.propertyId === propertyId ? { ...p, propertyValue: value } : p
          )
        : [...prev.properties, { propertyId, propertyValue: value }]
    }))
  }, [])

  // Remove property
  const removeProperty = useCallback((propertyId: number): void => {
    setFormData(prev => ({
      ...prev,
      properties: prev.properties.filter(p => p.propertyId !== propertyId)
    }))
  }, [])

  // ✅ DÜZELTME 2: Geliştirilmiş Image compression
  const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      // Create image element
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }
      
      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img
          
          if (width > maxWidth || height > maxWidth) {
            const ratio = Math.min(maxWidth / width, maxWidth / height)
            width = Math.floor(width * ratio)
            height = Math.floor(height * ratio)
          }
          
          // Set canvas size
          canvas.width = width
          canvas.height = height
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              console.log(`📦 Image compressed: ${file.size} → ${compressedFile.size} bytes`)
              resolve(compressedFile)
            } else {
              reject(new Error('Image compression failed'))
            }
          }, file.type, quality)
          
          // Cleanup
          URL.revokeObjectURL(img.src)
        } catch (error) {
          console.error('❌ Compression error:', error)
          reject(error)
        }
      }
      
      img.onerror = () => {
        console.error('❌ Image load failed for compression')
        reject(new Error('Image load failed'))
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // ✅ DÜZELTME 3: Tamamen yeniden yazılmış handleFileSelect
  const handleFileSelect = useCallback(async (files: FileList): Promise<void> => {
    console.log('📁 Starting file selection process:', files.length, 'files')
    
    // Reset errors
    setError('')
    
    // Validate files
    const validFiles = Array.from(files).filter(file => {
      console.log('🔍 Validating file:', file.name, {
        type: file.type,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
      })
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError(`❌ "${file.name}" geçersiz dosya tipi. Sadece resim dosyaları kabul edilir.`)
        return false
      }
      
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setError(`❌ "${file.name}" çok büyük. Maksimum dosya boyutu 50MB.`)
        return false
      }
      
      return true
    })

    if (validFiles.length === 0) {
      console.log('❌ No valid files to process')
      return
    }

    console.log('✅ Valid files:', validFiles.length)
    
    try {
      setUploadProgress(10)
      const newImages: ImageFile[] = []
      
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        const progressStep = (80 / validFiles.length) * (i + 1)
        
        console.log(`🔄 Processing file ${i + 1}/${validFiles.length}:`, file.name)
        
        try {
          // Compress if needed
          let processedFile = file
          if (file.size > 2 * 1024 * 1024) { // 2MB threshold
            console.log('📦 Compressing large file:', file.name)
            processedFile = await compressImage(file, 1920, 0.85)
          }
          
          // Create preview URL
          const previewUrl = URL.createObjectURL(processedFile)
          console.log('🔗 Created preview URL for:', file.name)
          
          // Create image object
          const newImage: ImageFile = {
            id: `img_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
            file: processedFile,
            preview: previewUrl,
            imageType: (images.length + newImages.length) === 0 ? 'main_image' : 'gallery_image',
            sortOrder: images.length + newImages.length + 1
          }
          
          newImages.push(newImage)
          console.log('✅ Image object created:', newImage.id)
          
          // Update progress
          setUploadProgress(10 + progressStep)
          
        } catch (fileError) {
          console.error(`❌ Failed to process ${file.name}:`, fileError)
          setError(`"${file.name}" işlenirken hata oluştu.`)
        }
      }
      
      if (newImages.length > 0) {
        console.log('📋 Adding', newImages.length, 'images to state')
        setImages(prev => {
          const updated = [...prev, ...newImages]
          console.log('📊 Total images after update:', updated.length)
          return updated
        })
        setUploadProgress(100)
      }
      
    } catch (error) {
      console.error('❌ File selection failed:', error)
      setError('Dosyalar işlenirken hata oluştu.')
    } finally {
      // Reset progress after delay
      setTimeout(() => setUploadProgress(0), 1500)
    }
  }, [images.length])

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [handleFileSelect])

  // ✅ DÜZELTME 4: Memory leak korumalı removeImage
  const removeImage = useCallback((id: string): void => {
    console.log('🗑️ Removing image:', id)
    
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id)
      if (imageToRemove?.preview) {
        // Clean up object URL
        URL.revokeObjectURL(imageToRemove.preview)
        console.log('🧹 Cleaned up preview URL for:', imageToRemove.file.name)
      }
      
      const filteredImages = prev.filter(img => img.id !== id)
      
      // Reorder and reassign main image if necessary
      const reorderedImages = filteredImages.map((img, index) => ({
        ...img,
        sortOrder: index + 1,
        imageType: index === 0 ? 'main_image' : 'gallery_image'
      }))
      
      console.log('📋 Images after removal:', reorderedImages.length)
      return reorderedImages
    })
  }, [])

  // Change image type
  const changeImageType = useCallback((id: string, newType: string): void => {
    console.log('🔄 Changing image type:', id, 'to', newType)
    
    setImages(prev => prev.map(img => {
      if (img.id === id) {
        return { ...img, imageType: newType }
      }
      // If setting as main_image, change other main_images to gallery_image
      if (newType === 'main_image' && img.imageType === 'main_image') {
        return { ...img, imageType: 'gallery_image' }
      }
      return img
    }))
  }, [])

  // Form validation
  const validateForm = useCallback((): boolean => {
    const errors: string[] = []

    if (!formData.furnitureName.trim()) {
      errors.push('Mobilya adı zorunludur')
    } else if (formData.furnitureName.trim().length < 3) {
      errors.push('Mobilya adı en az 3 karakter olmalıdır')
    }

    if (!formData.furnitureType.trim()) {
      errors.push('Mobilya tipi zorunludur')
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.push('Geçerli bir fiyat giriniz')
    } else if (parseFloat(formData.price) > 999999999) {
      errors.push('Fiyat çok yüksek')
    }

    if (!formData.categoryId) {
      errors.push('Kategori seçimi zorunludur')
    }

    if (formData.colorIds.length === 0) {
      errors.push('En az bir renk seçmelisiniz')
    }

    setValidationErrors(errors)
    return errors.length === 0
  }, [formData])

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')
      
      // Create FormData
      const submitFormData = new FormData()
      
      // Add basic data
      submitFormData.append('furnitureName', formData.furnitureName.trim())
      submitFormData.append('furnitureType', formData.furnitureType.trim())
      submitFormData.append('categoryId', formData.categoryId)
      submitFormData.append('description', formData.description.trim())
      submitFormData.append('price', formData.price)
      submitFormData.append('isActive', formData.isActive.toString())
      
      // Add colors and properties
      submitFormData.append('colorIds', JSON.stringify(formData.colorIds))
      submitFormData.append('properties', JSON.stringify(formData.properties))
      
      // Add images (sorted by sortOrder)
      const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder)
      sortedImages.forEach((imageFile) => {
        submitFormData.append('images', imageFile.file)
      })

      const response = await fetch('/api/furniture', {
        method: 'POST',
        body: submitFormData
      })

      const data: APIResponse = await response.json()

      if (data.success) {
        setSuccess(`✅ Mobilya başarıyla eklendi! ${data.imageResults ? `${data.imageResults.uploaded}/${data.imageResults.total} görsel yüklendi.` : ''}`)
        
        // Clean up image URLs before redirect
        images.forEach(img => {
          if (img.preview) {
            URL.revokeObjectURL(img.preview)
          }
        })
        
        // Redirect after success
        setTimeout(() => {
          router.push('/admin/furniture')
        }, 2000)
      } else {
        setError(data.error || data.message || 'Mobilya eklenirken hata oluştu')
        if (data.validationErrors) {
          setValidationErrors(data.validationErrors)
        }
      }
    } catch (err) {
      console.error('Form submission error:', err)
      setError('Mobilya eklenirken hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }, [formData, images, validateForm, router])

  // Memoized values
  const selectedColors = useMemo(() => 
    colors.filter(color => formData.colorIds.includes(color.colorId)),
    [colors, formData.colorIds]
  )

  const mainImage = useMemo(() => 
    images.find(img => img.imageType === 'main_image'),
    [images]
  )

  // ✅ DÜZELTME 5: Enhanced debug logging
  useEffect(() => {
    if (images.length > 0) {
      console.log('🔍 Images state updated:', {
        total: images.length,
        mainImages: images.filter(img => img.imageType === 'main_image').length,
        galleryImages: images.filter(img => img.imageType === 'gallery_image').length
      })
      
      images.forEach((img, index) => {
        console.log(`  ${index + 1}. ${img.file.name}`, {
          id: img.id,
          size: `${(img.file.size / 1024 / 1024).toFixed(2)}MB`,
          type: img.file.type,
          imageType: img.imageType,
          sortOrder: img.sortOrder,
          hasPreview: !!img.preview,
          previewLength: img.preview.length
        })
      })
    }
  }, [images])

  // Load options on mount
  useEffect(() => {
    loadOptions()
  }, [loadOptions])

  // Clear errors when form changes
  useEffect(() => {
    if (error) setError('')
    if (validationErrors.length > 0) setValidationErrors([])
  }, [formData, error, validationErrors.length])

  // ✅ DÜZELTME 6: Proper cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, cleaning up URLs')
      images.forEach(image => {
        if (image.preview && image.preview.startsWith('blob:')) {
          URL.revokeObjectURL(image.preview)
        }
      })
    }
  }, []) // Empty dependency array - only run on unmount

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FurnitureIcon />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Yeni Mobilya Ekle
                </h1>
                <p className="text-gray-600 mt-1">
                  Sisteme yeni mobilya ekleyin
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {showPreview ? 'Formu Göster' : 'Önizleme'}
              </button>
              <Link
                href="/admin/furniture"
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <BackIcon />
                <span className="ml-2">Geri Dön</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loadingOptions && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <LoaderIcon />
              <p className="text-gray-600 font-medium">Seçenekler yükleniyor...</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckIcon />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 font-medium">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertIcon />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 mb-2">
                  Lütfen aşağıdaki hataları düzeltin:
                </h3>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ✅ DÜZELTME 7: Enhanced Preview Mode */}
        {showPreview && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mobilya Önizlemesi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {mainImage ? (
                  <div className="relative">
                    <img
                      src={mainImage.preview}
                      alt="Ana görsel önizleme"
                      className="w-full h-64 object-cover rounded-lg shadow-sm"
                      onError={(e) => {
                        console.error('Preview image failed to load')
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                      Ana Görsel
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon />
                      <p className="text-gray-500 mt-2 text-sm">Ana görsel yüklenmedi</p>
                    </div>
                  </div>
                )}
                
                {/* Gallery images preview */}
                {images.length > 1 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Galeri görselleri ({images.length - 1})</p>
                    <div className="flex space-x-2 overflow-x-auto">
                      {images.filter(img => img.imageType === 'gallery_image').slice(0, 4).map(img => (
                        <img
                          key={img.id}
                          src={img.preview}
                          alt="Galeri önizleme"
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {formData.furnitureName || 'Mobilya Adı'}
                </h3>
                <p className="text-gray-600">
                  {formData.furnitureType || 'Mobilya Tipi'}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formData.price ? `${parseFloat(formData.price).toLocaleString('tr-TR')} TL` : 'Fiyat Belirtilmedi'}
                </p>
                
                {formData.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Açıklama</h4>
                    <p className="text-gray-600 text-sm">{formData.description}</p>
                  </div>
                )}
                
                {selectedColors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Mevcut Renkler</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedColors.map(color => (
                        <div key={color.colorId} className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-full">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300" 
                            style={{ backgroundColor: color.colorCode }}
                          />
                          <span className="text-sm text-gray-700">{color.colorName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {formData.properties.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Özellikler</h4>
                    <div className="space-y-1">
                      {formData.properties.map(prop => {
                        const property = properties.find(p => p.propertyId === prop.propertyId)
                        return (
                          <div key={prop.propertyId} className="text-sm">
                            <span className="text-gray-600">{property?.propertyName}:</span>
                            <span className="ml-2 text-gray-900">{prop.propertyValue}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Durum:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      formData.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {formData.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {!loadingOptions && !showPreview && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">1</span>
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
                    name="furnitureName"
                    value={formData.furnitureName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Örn: Modern 3'lü Koltuk Takımı"
                  />
                </div>

                {/* Furniture Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobilya Tipi *
                  </label>
                  <input
                    type="text"
                    name="furnitureType"
                    value={formData.furnitureType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Örn: Koltuk, Sandalye, Masa"
                  />
                </div>

                {/* Parent Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ana Kategori *
                  </label>
                  <select
                    name="parentCategoryId"
                    value={formData.parentCategoryId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Ana Kategori Seçin</option>
                    {categories.map(category => (
                      <option key={category.categoryId} value={category.categoryId}>
                        {category.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alt Kategori *
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.parentCategoryId}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {formData.parentCategoryId ? 'Alt Kategori Seçin' : 'Önce ana kategori seçin'}
                    </option>
                    {subCategories.map(subCategory => (
                      <option key={subCategory.categoryId} value={subCategory.categoryId}>
                        {subCategory.categoryName}
                      </option>
                    ))}
                  </select>
                  {formData.parentCategoryId && subCategories.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center">
                      <AlertIcon />
                      <span className="ml-1">Bu ana kategorinin alt kategorisi bulunmuyor</span>
                    </p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fiyat (TL) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">₺</span>
                  </div>
                </div>

                {/* Status */}
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <span>Mobilyayı aktif durumda oluştur</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        formData.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {formData.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={1000}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Mobilya hakkında detaylı açıklama yazın..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/1000 karakter
                </p>
              </div>
            </div>

            {/* Colors */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">2</span>
                Renkler *
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({formData.colorIds.length} seçili)
                </span>
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {colors.map(color => (
                  <div
                    key={color.colorId}
                    className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all transform hover:scale-105 ${
                      formData.colorIds.includes(color.colorId)
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => handleColorToggle(color.colorId)}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div
                        className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                        style={{ backgroundColor: color.colorCode }}
                      />
                      <span className="text-sm font-medium text-gray-900 text-center">
                        {color.colorName}
                      </span>
                    </div>
                    
                    {formData.colorIds.includes(color.colorId) && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">
                        <CheckIcon />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {formData.colorIds.length === 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700 flex items-center">
                    <AlertIcon />
                    <span className="ml-2">En az bir renk seçmelisiniz</span>
                  </p>
                </div>
              )}
            </div>

            {/* Properties */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">3</span>
                Özellikler
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({formData.properties.length} özellik)
                </span>
              </h2>
              
              <div className="space-y-4">
                {properties.map(property => {
                  const currentValue = formData.properties.find(p => p.propertyId === property.propertyId)?.propertyValue || ''
                  
                  return (
                    <div key={property.propertyId} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {property.propertyName}
                          {property.description && (
                            <span className="text-gray-500 text-xs ml-2">
                              ({property.description})
                            </span>
                          )}
                        </label>
                        {property.propertyType === 'text' ? (
                          <input
                            type="text"
                            value={currentValue}
                            onChange={(e) => handlePropertyChange(property.propertyId, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder={`${property.propertyName} değeri`}
                          />
                        ) : property.propertyType === 'number' ? (
                          <input
                            type="number"
                            value={currentValue}
                            onChange={(e) => handlePropertyChange(property.propertyId, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder={`${property.propertyName} değeri`}
                          />
                        ) : (
                          <textarea
                            value={currentValue}
                            onChange={(e) => handlePropertyChange(property.propertyId, e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                            placeholder={`${property.propertyName} değeri`}
                          />
                        )}
                      </div>
                      {currentValue && (
                        <button
                          type="button"
                          onClick={() => removeProperty(property.propertyId)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Özelliği Kaldır"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {properties.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Henüz özellik tanımlanmamış</p>
                </div>
              )}
            </div>

            {/* ✅ DÜZELTME 8: Enhanced Images Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">4</span>
                Görseller
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({images.length} görsel)
                </span>
              </h2>
              
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <UploadIcon />
                <div className="mt-4">
                  <p className="text-lg font-medium text-gray-900">
                    Görselleri sürükleyip bırakın
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    veya
                    <label className="mx-1 text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                      dosya seçin
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG, JPEG, WebP • Maksimum 50MB • Otomatik sıkıştırma
                  </p>
                </div>
              </div>

              {/* Upload Progress */}
              {uploadProgress > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Yükleniyor...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-900">
                      Yüklenen Görseller ({images.length})
                    </h3>
                    <div className="text-xs text-gray-500">
                      <span className="inline-flex items-center space-x-1">
                        <StarIcon />
                        <span>ilk görsel ana görsel olur</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((image, index) => (
                        <ImagePreviewComponent
                          key={image.id}
                          image={image}
                          index={index}
                          onRemove={removeImage}
                          onTypeChange={changeImageType}
                        />
                      ))}
                  </div>
                  
                  {/* Image summary */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>
                        Ana görsel: {images.filter(img => img.imageType === 'main_image').length} • 
                        Galeri: {images.filter(img => img.imageType === 'gallery_image').length}
                      </span>
                      <span>
                        Toplam boyut: {(images.reduce((sum, img) => sum + img.file.size, 0) / 1024 / 1024).toFixed(2)}MB
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Mobilyayı Kaydet
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Tüm bilgileri kontrol ettikten sonra mobilyayı sisteme ekleyin
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => router.push('/admin/furniture')}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    disabled={loading}
                  >
                    İptal
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading || loadingOptions}
                    className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <LoaderIcon />
                        <span className="ml-2">Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <SaveIcon />
                        <span className="ml-2">Mobilyayı Kaydet</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Form Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Form Özeti</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Mobilya Adı:</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {formData.furnitureName || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Kategori:</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {formData.categoryId ? 
                        subCategories.find(cat => cat.categoryId === parseInt(formData.categoryId))?.categoryName || '-'
                        : '-'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Fiyat:</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {formData.price ? `${parseFloat(formData.price).toLocaleString('tr-TR')} TL` : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Renkler:</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {formData.colorIds.length} renk seçili
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Görseller:</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {images.length} görsel yüklendi
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Özellikler:</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {formData.properties.length} özellik
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Durum:</span>
                    <p className={`font-medium mt-1 ${formData.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                      {formData.isActive ? 'Aktif' : 'Pasif'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Ana Görsel:</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {mainImage ? '✓ Var' : '✗ Yok'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}