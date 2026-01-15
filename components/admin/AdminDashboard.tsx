'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    furniture: 0,
    furnitureSets: 0,
    categories: 0,
    colors: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentItems, setRecentItems] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [furnRes, setsRes, catRes, colorRes] = await Promise.all([
          fetch('/api/furniture?limit=5&includeDetails=true'),
          fetch('/api/furniture-sets?limit=5'),
          fetch('/api/categories'),
          fetch('/api/colors')
        ])
        
        const furnData = await furnRes.json()
        const setsData = await setsRes.json()
        const catData = await catRes.json()
        const colorData = await colorRes.json()
        
        setStats({
          furniture: furnData.pagination?.total || 0,
          furnitureSets: setsData.pagination?.total || 0,
          categories: catData.data?.length || 0,
          colors: colorData.data?.length || 0
        })

        // Combine recent items
        const combined = [
          ...(furnData.data || []).map((i: any) => ({ ...i, type: 'furniture', date: i.createdAt })),
          ...(setsData.data || []).map((i: any) => ({ ...i, type: 'set', date: i.createdAt, furnitureName: i.setName }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

        setRecentItems(combined)

      } catch (error) {
        console.error('Dashboard data error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const statCards = [
    { title: 'Toplam Mobilya', value: stats.furniture, icon: '🪑', color: 'from-blue-500 to-indigo-600', link: '/admin/furniture' },
    { title: 'Mobilya Takımları', value: stats.furnitureSets, icon: '🛋️', color: 'from-pink-500 to-rose-600', link: '/admin/furniture-sets' },
    { title: 'Kategoriler', value: stats.categories, icon: '📂', color: 'from-emerald-500 to-teal-600', link: '/admin/categories' },
    { title: 'Renk Seçenekleri', value: stats.colors, icon: '🎨', color: 'from-violet-500 to-purple-600', link: '/admin/colors' },
  ]

  const quickActions = [
    { title: 'Mobilya Ekle', desc: 'Yeni ürün girişi yap', href: '/admin/furniture/add', icon: '➕', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { title: 'Takım Oluştur', desc: 'Yeni set oluştur', href: '/admin/furniture-sets/add', icon: '✨', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
    { title: 'Özellik Ekle', desc: 'Teknik detay tanımla', href: '/admin/properties', icon: '⚙️', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  ]

  return (
    <div className="space-y-8 p-6">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 sm:p-10 shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Hoş Geldiniz, Admin 👋</h1>
          <p className="text-indigo-100 text-lg max-w-2xl">
            Mağaza yönetim panelinizdesiniz. Buradan ürünlerinizi, kategorilerinizi ve diğer tüm içerikleri kolayca yönetebilirsiniz.
          </p>
        </div>
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-black/10 rounded-full blur-2xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <Link 
            href={stat.link} 
            key={idx}
            className={`relative group overflow-hidden rounded-2xl p-6 bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all hover:shadow-xl hover:-translate-y-1`}
          >
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${stat.color} w-24 h-24 rounded-bl-full`}></div>
            <div className="relative z-10">
              <div className="text-3xl mb-4">{stat.icon}</div>
              <div className="text-3xl font-bold text-white mb-1">
                {loading ? <div className="h-8 w-16 bg-slate-700 animate-pulse rounded"></div> : stat.value}
              </div>
              <div className="text-sm text-slate-400 font-medium">{stat.title}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Son Eklenenler</h2>
            <Link href="/admin/furniture" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">Tümünü Gör →</Link>
          </div>
          
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Yükleniyor...</div>
            ) : recentItems.length > 0 ? (
              <div className="divide-y divide-slate-700/50">
                {recentItems.map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center gap-4 hover:bg-slate-700/30 transition">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${item.type === 'furniture' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-pink-500/20 text-pink-400'}`}>
                      {item.type === 'furniture' ? '🪑' : '🛋️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{item.furnitureName}</h4>
                      <p className="text-xs text-slate-400">
                        {item.category?.categoryName || 'Kategorisiz'} • {new Date(item.date).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${item.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {item.isActive ? 'AKTİF' : 'PASİF'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">Henüz veri yok.</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Hızlı İşlemler</h2>
          <div className="grid gap-4">
            {quickActions.map((action, idx) => (
              <Link 
                key={idx} 
                href={action.href}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.02] ${action.color} bg-slate-800 border-slate-700 hover:border-current`}
              >
                <div className="text-2xl">{action.icon}</div>
                <div>
                  <h4 className="font-bold text-slate-200">{action.title}</h4>
                  <p className="text-xs text-slate-400">{action.desc}</p>
                </div>
                <div className="ml-auto opacity-50">→</div>
              </Link>
            ))}
          </div>

          {/* System Info Widget */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Sistem Durumu</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Sunucu</span>
                <span className="text-green-400">● Çevrimiçi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Veritabanı</span>
                <span className="text-green-400">● Bağlı</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Versiyon</span>
                <span className="text-slate-300">v2.4.0</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}