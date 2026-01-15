'use client'

import { useState, useEffect } from 'react'

interface Color {
  colorId: number
  colorName: string
  colorCode: string
  isActive: boolean
  _count?: {
    furnitureColors: number
    furnitureSetColors: number
  }
}

export default function ColorManagement() {
  const [colors, setColors] = useState<Color[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingColor, setEditingColor] = useState<Color | null>(null)
  
  const [formData, setFormData] = useState({
    colorName: '',
    colorCode: '#000000',
    isActive: true
  })

  const fetchColors = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/colors')
      const data = await res.json()
      if (data.success) setColors(data.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchColors()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Bu rengi silmek istediğinize emin misiniz?')) return
    try {
      const res = await fetch(`/api/colors/${id}`, { method: 'DELETE' })
      if (res.ok) fetchColors()
    } catch (error) {
      console.error(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingColor ? `/api/colors/${editingColor.colorId}` : '/api/colors'
      const method = editingColor ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        fetchColors()
        setShowModal(false)
        resetForm()
      } else {
        alert('İşlem başarısız')
      }
    } catch (error) {
      console.error(error)
    }
  }

  const startEdit = (color: Color) => {
    setEditingColor(color)
    setFormData({
      colorName: color.colorName,
      colorCode: color.colorCode || '#000000',
      isActive: color.isActive
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingColor(null)
    setFormData({ colorName: '', colorCode: '#000000', isActive: true })
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Renk Yönetimi</h1>
            <p className="text-slate-400 mt-1">Ürün renk seçeneklerini yönetin</p>
          </div>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-5 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition shadow-lg shadow-pink-600/20 font-medium flex items-center gap-2"
          >
            <span>+</span> Yeni Renk
          </button>
        </div>

        {/* Colors Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {loading ? (
            <div className="col-span-full text-center text-white py-10">Yükleniyor...</div>
          ) : (
            colors.map(color => (
              <div key={color.colorId} className="group bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-pink-500/50 transition shadow-lg">
                <div 
                  className="h-24 w-full relative" 
                  style={{ backgroundColor: color.colorCode }}
                >
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-1 rounded-lg backdrop-blur-sm">
                    <button onClick={() => startEdit(color)} className="p-1 text-blue-300 hover:text-white">✏️</button>
                    <button onClick={() => handleDelete(color.colorId)} className="p-1 text-red-300 hover:text-white">🗑️</button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white">{color.colorName}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${color.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {color.isActive ? 'AKTİF' : 'PASİF'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mb-2">{color.colorCode}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <span>📦</span>
                    <span>{(color._count?.furnitureColors || 0) + (color._count?.furnitureSetColors || 0)} Üründe Kullanılıyor</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{editingColor ? 'Renk Düzenle' : 'Yeni Renk'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Renk Adı</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-pink-500 text-white"
                    value={formData.colorName}
                    onChange={e => setFormData({...formData, colorName: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 block mb-1">Renk Kodu</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      className="h-12 w-12 bg-transparent border-0 cursor-pointer"
                      value={formData.colorCode}
                      onChange={e => setFormData({...formData, colorCode: e.target.value})}
                    />
                    <input 
                      type="text" 
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-pink-500 text-white font-mono uppercase"
                      value={formData.colorCode}
                      onChange={e => setFormData({...formData, colorCode: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-pink-500 bg-slate-900 border-slate-700 rounded"
                    checked={formData.isActive}
                    onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  />
                  <span className="text-white">Aktif</span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">İptal</button>
                  <button type="submit" className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium">Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}