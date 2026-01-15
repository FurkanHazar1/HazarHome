'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function FurnitureDetail({ furnitureId }: { furnitureId: number }) {
  const router = useRouter()
  const [furniture, setFurniture] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    // Cache busting
    const timestamp = new Date().getTime()
    fetch(`/api/furniture/${furnitureId}?includeDetails=true&t=${timestamp}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFurniture(data.data)
          if (data.data.images?.length > 0) {
            // Sort by sortOrder
            const sorted = data.data.images.sort((a: any, b: any) => a.sortOrder - b.sortOrder)
            setSelectedImage(getImageUrl(sorted[0].image.filePath))
          }
        }
      })
      .finally(() => setLoading(false))
  }, [furnitureId])

  const getImageUrl = (path?: string) => {
    if (!path) return ''
    // Ensure clean path for /uploads/
    let cleanPath = path.replace(/\\/g, '/')
    if (cleanPath.startsWith('public/')) cleanPath = cleanPath.replace('public/', '')
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath
    if (!cleanPath.startsWith('/uploads/')) cleanPath = '/uploads/' + cleanPath.replace(/^\//, '')
    
    // Add version query param for cache busting
    return `${cleanPath}?v=${furniture?.updatedAt ? new Date(furniture.updatedAt).getTime() : Date.now()}`
  }

  const handleDelete = async () => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await fetch(`/api/furniture/${furnitureId}`, { method: 'DELETE' })
    router.push('/admin/furniture')
  }

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Yükleniyor...</div>
  if (!furniture) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-400">Mobilya bulunamadı</div>

  const sortedImages = furniture.images?.sort((a: any, b: any) => a.sortOrder - b.sortOrder) || []

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold">{furniture.furnitureName}</h1>
              <p className="text-slate-400">{furniture.category?.categoryName} / {furniture.furnitureType}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link 
              href={`/admin/furniture/${furnitureId}/edit`}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              Düzenle
            </Link>
            <button 
              onClick={handleDelete}
              className="px-5 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              Sil
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-black rounded-2xl overflow-hidden border border-slate-700 relative shadow-2xl">
              {selectedImage ? (
                <Image src={selectedImage} alt="Selected" fill className="object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">Görsel Yok</div>
              )}
            </div>
            
            <div className="grid grid-cols-5 gap-3">
              {sortedImages.map((item: any, idx: number) => {
                const url = getImageUrl(item.image.filePath)
                return (
                  <button 
                    key={idx}
                    onClick={() => setSelectedImage(url)}
                    className={`aspect-square relative rounded-xl overflow-hidden border-2 transition ${selectedImage === url ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-700 opacity-60 hover:opacity-100'}`}
                  >
                    <Image src={url} alt={`Thumb ${idx}`} fill className="object-cover" />
                    <div className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-white/20">
                      {item.sortOrder}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Column: Info */}
          <div className="space-y-6">
            
            {/* Stats Card */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <div className="text-slate-400 text-sm mb-1">Fiyat</div>
                <div className="text-2xl font-bold text-green-400">
                  {furniture.price > 0 ? `₺${furniture.price.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}
                </div>
              </div>
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <div className="text-slate-400 text-sm mb-1">Durum</div>
                <div className={`text-2xl font-bold ${furniture.isActive ? 'text-green-400' : 'text-red-400'}`}>
                  {furniture.isActive ? 'Aktif' : 'Pasif'}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3">Açıklama</h3>
              <p className="text-slate-300 leading-relaxed">
                {furniture.description || 'Açıklama bulunmuyor.'}
              </p>
            </div>

            {/* Properties */}
            {furniture.properties?.length > 0 && (
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Özellikler</h3>
                <div className="grid grid-cols-1 gap-3">
                  {furniture.properties.map((p: any) => (
                    <div key={p.propertyId} className="flex justify-between py-2 border-b border-slate-700/50">
                      <span className="text-slate-400">{p.property?.propertyName}</span>
                      <span className="font-medium text-white">{p.propertyValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attributes */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Diğer Bilgiler</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-700/50">
                  <span className="text-slate-400">ID</span>
                  <span className="font-mono text-indigo-300">#{furniture.furnitureId}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-700/50">
                  <span className="text-slate-400">Oluşturulma</span>
                  <span>{new Date(furniture.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-700/50">
                  <span className="text-slate-400">Güncellenme</span>
                  <span>{furniture.updatedAt ? new Date(furniture.updatedAt).toLocaleDateString('tr-TR') : '-'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}