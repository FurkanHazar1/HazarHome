'use client'

import { useState, useEffect } from 'react'

interface Property {
  propertyId: number
  propertyName: string
  propertyType: 'text' | 'number' | 'date' | 'boolean'
  description?: string
  isActive: boolean
  _count?: {
    furnitureProperties: number
    furnitureSetProperties: number
  }
}

export default function PropertyManagement() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  
  const [formData, setFormData] = useState({
    propertyName: '',
    propertyType: 'text',
    description: '',
    isActive: true
  })

  // Load Properties
  const fetchProperties = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/properties')
      const data = await res.json()
      if (data.success) setProperties(data.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Bu özelliği silmek istediğinize emin misiniz?')) return
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' })
      if (res.ok) fetchProperties()
    } catch (error) {
      console.error(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingProperty ? `/api/properties/${editingProperty.propertyId}` : '/api/properties'
      const method = editingProperty ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        fetchProperties()
        setShowModal(false)
        resetForm()
      } else {
        alert('İşlem başarısız')
      }
    } catch (error) {
      console.error(error)
    }
  }

  const startEdit = (prop: Property) => {
    setEditingProperty(prop)
    setFormData({
      propertyName: prop.propertyName,
      propertyType: prop.propertyType,
      description: prop.description || '',
      isActive: prop.isActive
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingProperty(null)
    setFormData({ propertyName: '', propertyType: 'text', description: '', isActive: true })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <span className="text-blue-400">📝</span>
      case 'number': return <span className="text-green-400">🔢</span>
      case 'date': return <span className="text-orange-400">📅</span>
      case 'boolean': return <span className="text-purple-400">☑️</span>
      default: return <span>❓</span>
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Özellik Yönetimi</h1>
            <p className="text-slate-400 mt-1">Ürün özelliklerini tanımlayın</p>
          </div>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-lg shadow-emerald-600/20 font-medium flex items-center gap-2"
          >
            <span>+</span> Yeni Özellik
          </button>
        </div>

        {/* Properties Table */}
        <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-900/50 text-xs uppercase font-medium text-slate-300">
                <tr>
                  <th className="px-6 py-4">Özellik Adı</th>
                  <th className="px-6 py-4">Tip</th>
                  <th className="px-6 py-4">Açıklama</th>
                  <th className="px-6 py-4 text-center">Kullanım</th>
                  <th className="px-6 py-4 text-center">Durum</th>
                  <th className="px-6 py-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8">Yükleniyor...</td></tr>
                ) : (
                  properties.map(prop => (
                    <tr key={prop.propertyId} className="hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4 font-medium text-white">{prop.propertyName}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 bg-slate-900/50 w-fit px-3 py-1 rounded-lg border border-slate-700">
                          {getTypeIcon(prop.propertyType)}
                          <span className="capitalize">{prop.propertyType}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate">{prop.description || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-slate-300 font-bold">
                          {(prop._count?.furnitureProperties || 0) + (prop._count?.furnitureSetProperties || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${prop.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {prop.isActive ? 'AKTİF' : 'PASİF'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => startEdit(prop)} className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition">✏️</button>
                        <button onClick={() => handleDelete(prop.propertyId)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition">🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{editingProperty ? 'Özellik Düzenle' : 'Yeni Özellik'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Özellik Adı</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 text-white"
                    value={formData.propertyName}
                    onChange={e => setFormData({...formData, propertyName: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 block mb-1">Veri Tipi</label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 text-white appearance-none"
                    value={formData.propertyType}
                    onChange={e => setFormData({...formData, propertyType: e.target.value as any})}
                  >
                    <option value="text">📝 Metin (Örn: Ahşap, Metal)</option>
                    <option value="number">🔢 Sayı (Örn: Genişlik, Yükseklik)</option>
                    <option value="date">📅 Tarih</option>
                    <option value="boolean">☑️ Evet/Hayır (Örn: Yataklı mı?)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-400 block mb-1">Açıklama</label>
                  <textarea 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 text-white resize-none"
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="flex items-center gap-3 py-2">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-emerald-500 bg-slate-900 border-slate-700 rounded"
                    checked={formData.isActive}
                    onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  />
                  <span className="text-white">Aktif</span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">İptal</button>
                  <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}