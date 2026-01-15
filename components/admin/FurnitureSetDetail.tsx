'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function FurnitureSetDetail({ setId }: { setId: number }) {
  const router = useRouter()
  const [set, setSet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    const timestamp = new Date().getTime()
    fetch(`/api/furniture-sets/${setId}?includeFurnitureDetails=true&t=${timestamp}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSet(data.data)
          if (data.data.furnitureSetImages?.length > 0) {
            const sorted = data.data.furnitureSetImages.sort((a: any, b: any) => a.sortOrder - b.sortOrder)
            setSelectedImage(getImageUrl(sorted[0].image.filePath))
          }
        }
      })
      .finally(() => setLoading(false))
  }, [setId])

  const getImageUrl = (path?: string) => {
    if (!path) return ''
    const cleanPath = path.replace(/\\/g, '/').replace('uploads/', '')
    return `/uploads/${cleanPath}?v=${set?.updatedAt ? new Date(set.updatedAt).getTime() : Date.now()}`
  }

  const handleDelete = async () => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await fetch(`/api/furniture-sets/${setId}`, { method: 'DELETE' })
    router.push('/admin/furniture-sets')
  }

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Yükleniyor...</div>
  if (!set) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-400">Takım bulunamadı</div>

  const sortedImages = set.furnitureSetImages?.sort((a: any, b: any) => a.sortOrder - b.sortOrder) || []

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold">{set.setName}</h1>
              <p className="text-slate-400">{set.category?.categoryName}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link 
              href={`/admin/furniture-sets/${setId}/edit`}
              className="px-5 py-2 bg-pink-600 hover:bg-pink-700 rounded-xl transition flex items-center gap-2"
            >
              Düzenle
            </Link>
            <button 
              onClick={handleDelete}
              className="px-5 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl transition flex items-center gap-2"
            >
              Sil
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-slate-700 relative shadow-2xl">
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
                    className={`aspect-square relative rounded-xl overflow-hidden border-2 transition ${selectedImage === url ? 'border-pink-500 ring-2 ring-pink-500/30' : 'border-slate-700 opacity-60 hover:opacity-100'}`}
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

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <div className="text-slate-400 text-sm mb-1">Takım Fiyatı</div>
                <div className="text-2xl font-bold text-pink-400">
                  {set.price > 0 ? `₺${set.price.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}
                </div>
              </div>
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <div className="text-slate-400 text-sm mb-1">Durum</div>
                <div className={`text-2xl font-bold ${set.isActive ? 'text-green-400' : 'text-red-400'}`}>
                  {set.isActive ? 'Aktif' : 'Pasif'}
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3">Takım İçeriği</h3>
              <div className="space-y-3">
                {set.furnitureSetItems?.map((item: any) => {
                  const itemImage = item.furniture?.images?.[0]?.image?.filePath
                  return (
                    <Link 
                      href={`/admin/furniture/${item.furnitureId}`}
                      key={item.furnitureId} 
                      className="flex justify-between items-center p-3 bg-slate-900 rounded-xl border border-slate-700/50 hover:border-slate-600 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 bg-black rounded-lg overflow-hidden border border-slate-700 flex-shrink-0">
                          {itemImage ? (
                            <Image src={getImageUrl(itemImage) || ''} alt={item.furniture?.furnitureName} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">IMG</div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-200 group-hover:text-pink-400 transition-colors">{item.furniture?.furnitureName}</div>
                          <div className="text-xs text-slate-500">{item.furniture?.furnitureType}</div>
                        </div>
                      </div>
                      <span className="bg-slate-800 px-3 py-1 rounded-lg text-sm text-slate-400">x{item.quantity}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3">Açıklama</h3>
              <p className="text-slate-300 leading-relaxed">
                {set.description || 'Açıklama bulunmuyor.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
