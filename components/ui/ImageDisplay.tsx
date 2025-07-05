// components/ui/ImageDisplay.tsx - Görsel Gösterim Component'i
'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImageDisplayProps {
  src: string
  alt: string
  className?: string
  fallbackSrc?: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
}

export default function ImageDisplay({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = '/images/placeholder-furniture.jpg',
  width,
  height,
  fill = false,
  priority = false
}: ImageDisplayProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const handleError = () => {
    console.warn(`Image failed to load: ${imgSrc}`)
    setError(true)
    setImgSrc(fallbackSrc)
  }

  const handleLoad = () => {
    setLoading(false)
    setError(false)
  }

  // For Next.js Image component
  if (fill) {
    return (
      <div className={`relative ${className}`}>
        {loading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
        )}
        <Image
          src={imgSrc}
          alt={alt}
          fill
          priority={priority}
          className={`object-cover ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onError={handleError}
          onLoad={handleLoad}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {error && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Görsel yüklenemedi</span>
          </div>
        )}
      </div>
    )
  }

  // For regular img tag with specified dimensions
  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{ width, height }}
        />
      )}
      <Image
        src={imgSrc}
        alt={alt}
        width={width || 400}
        height={height || 400}
        priority={priority}
        className={`${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
      />
      {error && (
        <div 
          className="absolute inset-0 bg-gray-100 flex items-center justify-center"
          style={{ width, height }}
        >
          <span className="text-gray-400 text-sm">Görsel yüklenemedi</span>
        </div>
      )}
    </div>
  )
}