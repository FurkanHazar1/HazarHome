'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function FeaturesPage() {
  const [features, setFeatures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchFeatures()
  }, [])

  const fetchFeatures = async () => {
    try {
      const res = await fetch('/api/features')
      const data = await res.json()
      setFeatures(data)
    } catch (error) {
      console.error('Error fetching features:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu özelliği silmek istediğinize emin misiniz?')) return

    try {
      const res = await fetch(`/api/features/${id}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        setFeatures(features.filter(f => f.featureId !== id))
      } else {
        alert('Silme işlemi başarısız oldu.')
      }
    } catch (error) {
      console.error('Error deleting feature:', error)
      alert('Bir hata oluştu.')
    }
  }

  const toggleStatus = async (feature: any) => {
    try {
      // Optimistic update
      const newStatus = !feature.isActive
      setFeatures(features.map(f => 
        f.featureId === feature.featureId ? { ...f, isActive: newStatus } : f
      ))

      const res = await fetch(`/api/features/${feature.featureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...feature,
          isActive: newStatus,
          // Only sending fields that are needed for update, but API expects full object or partial
          // Ideally we should send what API expects. My API implementation takes title, description, etc.
          // Since I'm passing the whole feature object + modified isActive, it should work if API ignores extra relations or we strip them.
          // Let's rely on the API implementation in route.ts which destructures body.
        })
      })

      if (!res.ok) {
        // Revert on failure
        fetchFeatures()
        alert('Durum güncellenemedi.')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      fetchFeatures()
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Yükleniyor...</div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Lookbook Yönetimi</h1>
          <p className="text-slate-400">Anasayfa "Features" alanındaki görsel ve hotspot'ları yönetin.</p>
        </div>
        <Link 
          href="/admin/features/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
          Yeni Ekle
        </Link>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Görsel</th>
                <th className="px-6 py-4 font-medium">Başlık</th>
                <th className="px-6 py-4 font-medium">Nokta Sayısı</th>
                <th className="px-6 py-4 font-medium">Sıra</th>
                <th className="px-6 py-4 font-medium">Durum</th>
                <th className="px-6 py-4 font-medium text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {features.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Henüz kayıtlı özellik yok.
                  </td>
                </tr>
              ) : (
                features.map((feature) => (
                  <tr key={feature.featureId} className="hover:bg-slate-700/30 transition">
                    <td className="px-6 py-4">
                      <div className="w-24 h-16 relative rounded-lg overflow-hidden bg-slate-900">
                        {feature.image ? (
                          <Image 
                            src={`/${feature.image.filePath}`} 
                            alt={feature.title || 'Feature'} 
                            fill 
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-600 text-xs">No Image</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {feature.title || '-'}
                      {feature.description && <p className="text-xs text-slate-500 truncate max-w-xs">{feature.description}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-700 px-2 py-1 rounded text-xs">
                        {feature.pins?.length || 0} nokta
                      </span>
                    </td>
                    <td className="px-6 py-4">{feature.sortOrder}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleStatus(feature)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${feature.isActive ? 'bg-green-600' : 'bg-slate-600'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${feature.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link 
                          href={`/admin/features/${feature.featureId}`}
                          className="text-indigo-400 hover:text-indigo-300 transition"
                        >
                          Düzenle
                        </Link>
                        <button 
                          onClick={() => handleDelete(feature.featureId)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
