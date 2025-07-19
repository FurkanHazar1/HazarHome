'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// TypeScript interfaces
interface DashboardStats {
  categories: {
    total: number
    active: number
    mainCategories: number
    subCategories: number
  }
  properties: {
    total: number
    active: number
    used: number
    unused: number
    byType: { [key: string]: number }
  }
  colors: {
    total: number
    active: number
  }
  furniture: {
    total: number
    active: number
  }
  furnitureSets: {
    total: number
    active: number
    totalFurnitureInSets: number
    averageSetPrice: number
  }
  images: {
    total: number
    totalSize: number
  }
}

interface QuickStat {
  title: string
  value: number
  icon: string
  gradient: string
  link: string
  description: string
  change?: number
  changeType?: 'up' | 'down' | 'neutral'
}

export default function DarkAdminDashboard() {
  // State management
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [refreshing, setRefreshing] = useState<boolean>(false)

  // Dashboard verilerini yükle
  const loadDashboardData = async (): Promise<void> => {
    try {
      setLoading(true)
      
      // Paralel API çağrıları
      const [categoriesRes, propertiesRes, colorsRes, furnitureRes, setsRes] = await Promise.all([
        fetch('/api/categories/setup'),
        fetch('/api/properties/setup'), 
        fetch('/api/colors/setup'),
        fetch('/api/furniture?active=true&limit=1'), // Sadece count için
        fetch('/api/furniture-sets?active=true&limit=1') // Sadece count için
      ])

      const [categoriesData, propertiesData, colorsData, furnitureData, setsData] = await Promise.all([
        categoriesRes.json(),
        propertiesRes.json(),
        colorsRes.json(),
        furnitureRes.json(),
        setsRes.json()
      ])

      // İstatistikleri birleştir
      const dashboardStats: DashboardStats = {
        categories: {
          total: categoriesData.data?.istatistikler?.toplamKategori || 0,
          active: categoriesData.data?.istatistikler?.toplamKategori || 0,
          mainCategories: categoriesData.data?.istatistikler?.level1 || 0,
          subCategories: categoriesData.data?.istatistikler?.level2 || 0
        },
        properties: {
          total: propertiesData.data?.istatistikler?.toplamOzellik || 0,
          active: propertiesData.data?.istatistikler?.toplamOzellik || 0,
          used: propertiesData.data?.istatistikler?.usage?.used || 0,
          unused: propertiesData.data?.istatistikler?.usage?.unused || 0,
          byType: propertiesData.data?.istatistikler?.byType || {}
        },
        colors: {
          total: colorsData.data?.totalColors || 0,
          active: colorsData.data?.totalColors || 0
        },
        furniture: {
          total: furnitureData.pagination?.total || 0,
          active: furnitureData.pagination?.total || 0
        },
        furnitureSets: {
          total: setsData.pagination?.total || 0,
          active: setsData.pagination?.total || 0,
          totalFurnitureInSets: 0, // Bu API'dan gelebilir
          averageSetPrice: 0
        },
        images: {
          total: 0, // Images API'sından gelecek
          totalSize: 0
        }
      }

      setStats(dashboardStats)
      setError('')
    } catch (err) {
      console.error('Dashboard yükleme hatası:', err)
      setError('Dashboard verileri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  // Refresh function
  const refreshDashboard = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  // Component mount'da veri yükle
  useEffect(() => {
    loadDashboardData()
  }, [])

  // Quick stats kartları
  const getQuickStats = (): QuickStat[] => {
    if (!stats) return []
    
    return [
      {
        title: 'Toplam Kategori',
        value: stats.categories.total,
        icon: '📂',
        gradient: 'from-blue-600 to-blue-700',
        link: '/admin/categories',
        description: `${stats.categories.mainCategories} ana, ${stats.categories.subCategories} alt kategori`,
        change: 5,
        changeType: 'up'
      },
      {
        title: 'Toplam Özellik',
        value: stats.properties.total,
        icon: '🏷️',
        gradient: 'from-emerald-600 to-emerald-700',
        link: '/admin/properties',
        description: `${stats.properties.used} kullanılan, ${stats.properties.unused} kullanılmayan`,
        change: 2,
        changeType: 'up'
      },
      {
        title: 'Aktif Renkler',
        value: stats.colors.total,
        icon: '🎨',
        gradient: 'from-purple-600 to-purple-700',
        link: '/admin/colors',
        description: 'Renk paleti koleksiyonu',
        change: 0,
        changeType: 'neutral'
      },
      {
        title: 'Toplam Mobilya',
        value: stats.furniture.total,
        icon: '🪑',
        gradient: 'from-orange-600 to-orange-700',
        link: '/admin/furniture',
        description: 'Tekil mobilya ürünleri',
        change: 8,
        changeType: 'up'
      },
      {
        title: 'Mobilya Setleri',
        value: stats.furnitureSets.total,
        icon: '🛋️',
        gradient: 'from-indigo-600 to-indigo-700',
        link: '/admin/furniture-sets',
        description: 'Takım mobilya koleksiyonları',
        change: 3,
        changeType: 'up'
      }
    ]
  }

  // Sistem durumu
  const getSystemHealth = () => {
    if (!stats) return 'loading'
    
    const totalItems = stats.categories.total + stats.properties.total + stats.colors.total + stats.furniture.total + stats.furnitureSets.total
    
    if (totalItems === 0) return 'empty'
    if (totalItems < 20) return 'basic'
    if (totalItems < 100) return 'good'
    return 'excellent'
  }

  const getHealthConfig = (health: string) => {
    switch (health) {
      case 'empty': return { 
        color: 'text-red-400', 
        bg: 'bg-red-900/30', 
        text: 'Sistem Boş',
        icon: '⚠️'
      }
      case 'basic': return { 
        color: 'text-yellow-400', 
        bg: 'bg-yellow-900/30', 
        text: 'Temel Kurulum',
        icon: '🚀'
      }
      case 'good': return { 
        color: 'text-blue-400', 
        bg: 'bg-blue-900/30', 
        text: 'İyi Durumda',
        icon: '✅'
      }
      case 'excellent': return { 
        color: 'text-green-400', 
        bg: 'bg-green-900/30', 
        text: 'Mükemmel',
        icon: '🌟'
      }
      default: return { 
        color: 'text-gray-400', 
        bg: 'bg-gray-700/30', 
        text: 'Kontrol Ediliyor',
        icon: '⏳'
      }
    }
  }

  const healthConfig = getHealthConfig(getSystemHealth())

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent flex items-center space-x-3">
                <span className="text-3xl">🏠</span>
                <span>HazarHome Admin</span>
              </h1>
              <p className="text-gray-400 mt-2 text-lg">
                Mobilya yönetim sistemi • {new Date().toLocaleDateString('tr-TR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            {/* Sistem Durumu ve Kontroller */}
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshDashboard}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800/60 text-gray-300 border border-gray-700 rounded-lg hover:bg-gray-700/60 transition-all duration-200 disabled:opacity-50 backdrop-blur-sm"
              >
                <span className={`text-lg ${refreshing ? 'animate-spin' : ''}`}>
                  {refreshing ? '⏳' : '🔄'}
                </span>
                <span>Yenile</span>
              </button>
              
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium ${healthConfig.color} ${healthConfig.bg} border border-gray-700/50 backdrop-blur-sm`}>
                <span className="text-lg">{healthConfig.icon}</span>
                <span>{healthConfig.text}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/40 border border-red-800/50 text-red-300 px-6 py-4 rounded-xl mb-6 flex items-center space-x-3 backdrop-blur-sm" role="alert">
            <span className="text-xl">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p className="text-gray-400 text-lg">Dashboard yükleniyor...</p>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && stats && (
          <>
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
              {getQuickStats().map((stat, index) => (
                <Link
                  key={stat.title}
                  href={stat.link}
                  className="group relative bg-gray-800/60 rounded-2xl border border-gray-700/50 p-6 hover:bg-gray-700/60 hover:-translate-y-1 transition-all duration-300 overflow-hidden backdrop-blur-sm"
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center text-white text-2xl shadow-lg`}>
                        {stat.icon}
                      </div>
                      {stat.change !== undefined && (
                        <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                          stat.changeType === 'up' ? 'text-green-400 bg-green-900/30' : 
                          stat.changeType === 'down' ? 'text-red-400 bg-red-900/30' : 
                          'text-gray-400 bg-gray-700/30'
                        }`}>
                          <span className="mr-1">
                            {stat.changeType === 'up' ? '↗️' : stat.changeType === 'down' ? '↘️' : '→'}
                          </span>
                          {stat.change}
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-sm font-medium text-gray-400 mb-1">
                      {stat.title}
                    </h3>
                    <p className="text-3xl font-bold text-white mb-2">
                      {stat.value.toLocaleString('tr-TR')}
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {stat.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Main Content - Hızlı İşlemler (Full Width) */}
            <div className="mb-8">
              <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <span className="text-2xl">⚡</span>
                    <span>Hızlı İşlemler</span>
                  </h2>
                  <div className="text-sm text-gray-400">
                    Sık kullanılan yönetim araçları
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {/* Kategori İşlemleri */}
                  <div className="border border-gray-700/50 rounded-xl p-5 hover:border-gray-600/50 hover:bg-gray-700/30 transition-all duration-200">
                    <h3 className="font-semibold text-gray-200 mb-4 flex items-center">
                      <span className="text-xl mr-2">📂</span>
                      <span>Kategoriler</span>
                      <span className="ml-auto bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full text-xs border border-blue-800/50">
                        {stats.categories.total}
                      </span>
                    </h3>
                    <div className="space-y-3">
                      <Link
                        href="/admin/categories"
                        className="w-full bg-gradient-to-r from-blue-900/40 to-blue-800/40 text-blue-300 px-4 py-3 rounded-lg text-sm hover:from-blue-800/50 hover:to-blue-700/50 transition-all flex items-center justify-between group border border-blue-800/30"
                      >
                        <span>Kategori Yönet</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </Link>
                    </div>
                  </div>

                  {/* Özellik İşlemleri */}
                  <div className="border border-gray-700/50 rounded-xl p-5 hover:border-gray-600/50 hover:bg-gray-700/30 transition-all duration-200">
                    <h3 className="font-semibold text-gray-200 mb-4 flex items-center">
                      <span className="text-xl mr-2">🏷️</span>
                      <span>Özellikler</span>
                      <span className="ml-auto bg-green-900/50 text-green-300 px-2 py-1 rounded-full text-xs border border-green-800/50">
                        {stats.properties.total}
                      </span>
                    </h3>
                    <div className="space-y-3">
                      <Link
                        href="/admin/properties"
                        className="w-full bg-gradient-to-r from-green-900/40 to-green-800/40 text-green-300 px-4 py-3 rounded-lg text-sm hover:from-green-800/50 hover:to-green-700/50 transition-all flex items-center justify-between group border border-green-800/30"
                      >
                        <span>Özellik Yönet</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </Link>
                    </div>
                  </div>

                  {/* Renk İşlemleri */}
                  <div className="border border-gray-700/50 rounded-xl p-5 hover:border-gray-600/50 hover:bg-gray-700/30 transition-all duration-200">
                    <h3 className="font-semibold text-gray-200 mb-4 flex items-center">
                      <span className="text-xl mr-2">🎨</span>
                      <span>Renkler</span>
                      <span className="ml-auto bg-purple-900/50 text-purple-300 px-2 py-1 rounded-full text-xs border border-purple-800/50">
                        {stats.colors.total}
                      </span>
                    </h3>
                    <div className="space-y-3">
                      <Link
                        href="/admin/colors"
                        className="w-full bg-gradient-to-r from-purple-900/40 to-purple-800/40 text-purple-300 px-4 py-3 rounded-lg text-sm hover:from-purple-800/50 hover:to-purple-700/50 transition-all flex items-center justify-between group border border-purple-800/30"
                      >
                        <span>Renk Yönet</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </Link>
                    </div>
                  </div>

                  {/* Mobilya İşlemleri */}
                  <div className="border border-gray-700/50 rounded-xl p-5 hover:border-gray-600/50 hover:bg-gray-700/30 transition-all duration-200">
                    <h3 className="font-semibold text-gray-200 mb-4 flex items-center">
                      <span className="text-xl mr-2">🪑</span>
                      <span>Mobilyalar</span>
                      <span className="ml-auto bg-orange-900/50 text-orange-300 px-2 py-1 rounded-full text-xs border border-orange-800/50">
                        {stats.furniture.total}
                      </span>
                    </h3>
                    <div className="space-y-3">
                      <Link
                        href="/admin/furniture"
                        className="w-full bg-gradient-to-r from-orange-900/40 to-orange-800/40 text-orange-300 px-4 py-3 rounded-lg text-sm hover:from-orange-800/50 hover:to-orange-700/50 transition-all flex items-center justify-between group border border-orange-800/30"
                      >
                        <span>Mobilya Yönet</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </Link>
                      <Link
                        href="/admin/furniture/add"
                        className="w-full bg-gradient-to-r from-emerald-900/40 to-emerald-800/40 text-emerald-300 px-4 py-3 rounded-lg text-sm hover:from-emerald-800/50 hover:to-emerald-700/50 transition-all flex items-center border border-emerald-800/30"
                      >
                        <span className="text-lg mr-2">➕</span>
                        <span>Mobilya Ekle</span>
                      </Link>
                    </div>
                  </div>

                  {/* Mobilya Setleri İşlemleri */}
                  <div className="border border-gray-700/50 rounded-xl p-5 hover:border-gray-600/50 hover:bg-gray-700/30 transition-all duration-200">
                    <h3 className="font-semibold text-gray-200 mb-4 flex items-center">
                      <span className="text-xl mr-2">🛋️</span>
                      <span>Mobilya Setleri</span>
                      <span className="ml-auto bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded-full text-xs border border-indigo-800/50">
                        {stats.furnitureSets.total}
                      </span>
                    </h3>
                    <div className="space-y-3">
                      <Link
                        href="/admin/furniture-sets"
                        className="w-full bg-gradient-to-r from-indigo-900/40 to-indigo-800/40 text-indigo-300 px-4 py-3 rounded-lg text-sm hover:from-indigo-800/50 hover:to-indigo-700/50 transition-all flex items-center justify-between group border border-indigo-800/30"
                      >
                        <span>Set Yönet</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </Link>
                      <Link
                        href="/admin/furniture-sets/add"
                        className="w-full bg-gradient-to-r from-emerald-900/40 to-emerald-800/40 text-emerald-300 px-4 py-3 rounded-lg text-sm hover:from-emerald-800/50 hover:to-emerald-700/50 transition-all flex items-center border border-emerald-800/30"
                      >
                        <span className="text-lg mr-2">➕</span>
                        <span>Set Oluştur</span>
                      </Link>
                    </div>
                  </div>

                  {/* Sistem İşlemleri */}
                  <div className="border border-gray-700/50 rounded-xl p-5 hover:border-gray-600/50 hover:bg-gray-700/30 transition-all duration-200">
                    <h3 className="font-semibold text-gray-200 mb-4 flex items-center">
                      <span className="text-xl mr-2">⚙️</span>
                      <span>Sistem</span>
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={refreshDashboard}
                        disabled={refreshing}
                        className="w-full bg-gradient-to-r from-gray-800/60 to-gray-700/60 text-gray-300 px-4 py-3 rounded-lg text-sm hover:from-gray-700/70 hover:to-gray-600/70 transition-all flex items-center disabled:opacity-50 border border-gray-700/30"
                      >
                        <span className={`text-lg mr-2 ${refreshing ? 'animate-spin' : ''}`}>
                          {refreshing ? '⏳' : '🔄'}
                        </span>
                        <span>Yenile</span>
                      </button>
                      <Link
                        href="/admin/settings"
                        className="w-full bg-gradient-to-r from-gray-800/60 to-gray-700/60 text-gray-300 px-4 py-3 rounded-lg text-sm hover:from-gray-700/70 hover:to-gray-600/70 transition-all flex items-center border border-gray-700/30"
                      >
                        <span className="text-lg mr-2">⚙️</span>
                        <span>Ayarlar</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sistem Özeti */}
            <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <span className="text-2xl">🏠</span>
                <span>Sistem Özeti</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-700/40 rounded-xl p-4 border border-gray-600/30">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Toplam İçerik</span>
                    <span className="font-bold text-white text-xl">
                      {(stats.categories.total + stats.properties.total + stats.colors.total + stats.furniture.total + stats.furnitureSets.total).toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-700/40 rounded-xl p-4 border border-gray-600/30">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Ana Kategoriler</span>
                    <span className="font-bold text-blue-400 text-xl">{stats.categories.mainCategories}</span>
                  </div>
                </div>
                
                <div className="bg-gray-700/40 rounded-xl p-4 border border-gray-600/30">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Tekil Mobilyalar</span>
                    <span className="font-bold text-orange-400 text-xl">{stats.furniture.total}</span>
                  </div>
                </div>
                
                <div className="bg-gray-700/40 rounded-xl p-4 border border-gray-600/30">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Mobilya Setleri</span>
                    <span className="font-bold text-indigo-400 text-xl">{stats.furnitureSets.total}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-700/50">
                <div className={`flex items-center justify-center space-x-3 px-6 py-4 rounded-xl ${healthConfig.bg} border border-gray-600/30`}>
                  <span className="text-2xl">{healthConfig.icon}</span>
                  <span className={`font-semibold text-lg ${healthConfig.color}`}>
                    {healthConfig.text}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}