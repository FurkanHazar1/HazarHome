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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Basic stats - simplified
        const response = await fetch('/api/furniture')
        const furniture = await response.json()
        
        setStats({
          furniture: Array.isArray(furniture) ? furniture.length : 0,
          furnitureSets: 0, // Simplified
          categories: 0,    // Simplified
          colors: 0         // Simplified
        })
      } catch (error) {
        console.error('Stats yüklenirken hata:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const quickActions = [
    { 
      title: 'Mobilya Ekle', 
      href: '/admin/furniture/add', 
      icon: '🪑', 
      color: 'from-emerald-500 to-teal-600',
      description: 'Yeni mobilya ürünü ekle'
    },
    { 
      title: 'Takım Oluştur', 
      href: '/admin/furniture-sets/add', 
      icon: '🛋️', 
      color: 'from-blue-500 to-indigo-600',
      description: 'Mobilya takımı oluştur'
    },
    { 
      title: 'Kategori Yönet', 
      href: '/admin/categories', 
      icon: '📂', 
      color: 'from-purple-500 to-violet-600',
      description: 'Kategorileri düzenle'
    },
    { 
      title: 'Özellik Yönet', 
      href: '/admin/properties', 
      icon: '�️', 
      color: 'from-pink-500 to-rose-600',
      description: 'Ürün özelliklerini düzenle'
    }
  ]

  const managementLinks = [
    { title: 'Mobilyalar', href: '/admin/furniture', icon: '🪑', count: stats.furniture },
    { title: 'Mobilya Takımları', href: '/admin/furniture-sets', icon: '🛋️', count: stats.furnitureSets },
    { title: 'Kategoriler', href: '/admin/categories', icon: '📂', count: stats.categories },
    { title: 'Özellikler', href: '/admin/properties', icon: '�️', count: 0 },
    { title: 'Renkler', href: '/admin/colors', icon: '�', count: stats.colors }
  ]

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header - Mobile-first sizing */}
      <div className="text-center">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
          HazarHome Admin Panel
        </h1>
        <p className="text-xs sm:text-sm lg:text-base text-gray-400">
          Mobilya yönetim sistemi
        </p>
      </div>

      {/* Quick Actions Grid - Mobile-optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className={`group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br ${action.color} border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:scale-105 hover:shadow-xl`}
          >
            <div className="p-3 sm:p-4 lg:p-6 text-center relative z-10">
              <div className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3 lg:mb-4 transform group-hover:scale-110 transition-transform duration-300">
                {action.icon}
              </div>
              <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-white mb-1 sm:mb-2">
                {action.title}
              </h3>
              <p className="text-xs sm:text-xs lg:text-sm text-white/80 hidden sm:block">
                {action.description}
              </p>
            </div>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
        ))}
      </div>

      {/* Management Grid - Mobile-first design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {managementLinks.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className="group bg-gray-800/60 hover:bg-gray-800/80 border border-gray-700/50 hover:border-gray-600/50 rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
              <div className="text-lg sm:text-xl lg:text-2xl">
                {link.icon}
              </div>
              {loading ? (
                <div className="w-6 h-4 sm:w-8 sm:h-5 lg:w-10 lg:h-6 bg-gray-700 animate-pulse rounded" />
              ) : (
                <span className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  {link.count}
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white group-hover:text-blue-300 transition-colors duration-300">
              {link.title}
            </h3>
            <p className="text-xs sm:text-sm lg:text-sm text-gray-400 mt-1">
              Yönetim paneli
            </p>
          </Link>
        ))}
      </div>

      {/* Recent Activity - Simplified for mobile */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6">
        <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-3 sm:mb-4 lg:mb-6">
          🕒 Son Aktiviteler
        </h2>
        <div className="space-y-2 sm:space-y-3 lg:space-y-4">
          <div className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-700/50 last:border-b-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center">
                <span className="text-xs sm:text-sm lg:text-base">✓</span>
              </div>
              <div>
                <p className="text-xs sm:text-sm lg:text-base text-white">
                  Sistem hazır
                </p>
                <p className="text-xs sm:text-xs lg:text-sm text-gray-400">
                  Panel başarıyla yüklendi
                </p>
              </div>
            </div>
            <span className="text-xs sm:text-xs lg:text-sm text-gray-400">
              Şimdi
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
