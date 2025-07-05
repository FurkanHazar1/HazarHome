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
  }
}

interface RecentActivity {
  id: string
  type: 'category' | 'property' | 'furniture' | 'color'
  action: 'created' | 'updated' | 'deleted'
  itemName: string
  timestamp: string
}

interface QuickStat {
  title: string
  value: number
  icon: string
  color: string
  link: string
  description: string
}

// Icon components
const DashboardIcon = () => <span className="text-2xl">📊</span>
const CategoryIcon = () => <span className="text-2xl">📂</span>
const PropertyIcon = () => <span className="text-2xl">🏷️</span>
const ColorIcon = () => <span className="text-2xl">🎨</span>
const FurnitureIcon = () => <span className="text-2xl">🪑</span>
const SetIcon = () => <span className="text-2xl">🛋️</span>
const PlusIcon = () => <span className="text-lg">➕</span>
const TrendUpIcon = () => <span className="text-lg">📈</span>
const TrendDownIcon = () => <span className="text-lg">📉</span>
const LoaderIcon = () => <span className="text-lg animate-spin">⏳</span>
const SettingsIcon = () => <span className="text-lg">⚙️</span>
const CleanIcon = () => <span className="text-lg">🧹</span>

export default function AdminDashboard() {
  // State management
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  // Dashboard verilerini yükle
  const loadDashboardData = async (): Promise<void> => {
    try {
      setLoading(true)
      
      // Paralel API çağrıları
      const [categoriesRes, propertiesRes, colorsRes] = await Promise.all([
        fetch('/api/categories/setup'),
        fetch('/api/properties/setup'), 
        fetch('/api/colors/setup')
      ])

      const [categoriesData, propertiesData, colorsData] = await Promise.all([
        categoriesRes.json(),
        propertiesRes.json(),
        colorsRes.json()
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
          total: 0, // Bu API'lar henüz yok, placeholder
          active: 0
        },
        furnitureSets: {
          total: 0,
          active: 0
        }
      }

      setStats(dashboardStats)
      
      // Mock recent activity (gerçek API olmadığı için)
      setRecentActivity([
        {
          id: '1',
          type: 'category',
          action: 'created',
          itemName: 'Salon Takımı',
          timestamp: new Date().toISOString()
        },
        {
          id: '2', 
          type: 'property',
          action: 'created',
          itemName: 'Malzeme',
          timestamp: new Date(Date.now() - 30000).toISOString()
        }
      ])

      setError('')
    } catch (err) {
      console.error('Dashboard yükleme hatası:', err)
      setError('Dashboard verileri yüklenemedi')
    } finally {
      setLoading(false)
    }
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
        color: 'bg-blue-500',
        link: '/admin/categories',
        description: `${stats.categories.mainCategories} ana, ${stats.categories.subCategories} alt`
      },
      {
        title: 'Toplam Özellik',
        value: stats.properties.total,
        icon: '🏷️',
        color: 'bg-green-500',
        link: '/admin/properties',
        description: `${stats.properties.used} kullanılan, ${stats.properties.unused} kullanılmayan`
      },
      {
        title: 'Toplam Renk',
        value: stats.colors.total,
        icon: '🎨',
        color: 'bg-purple-500',
        link: '/admin/colors',
        description: 'Aktif renkler'
      },
      {
        title: 'Toplam Mobilya',
        value: stats.furniture.total,
        icon: '🪑',
        color: 'bg-orange-500',
        link: '/admin/furniture',
        description: 'Tekil mobilyalar'
      },
      {
        title: 'Mobilya Setleri',
        value: stats.furnitureSets.total,
        icon: '🛋️',
        color: 'bg-indigo-500',
        link: '/admin/furniture-sets',
        description: 'Takım mobilyalar'
      }
    ]
  }

  // Sistem durumu
  const getSystemHealth = () => {
    if (!stats) return 'loading'
    
    const totalItems = stats.categories.total + stats.properties.total + stats.colors.total
    
    if (totalItems === 0) return 'empty'
    if (totalItems < 10) return 'basic'
    if (totalItems < 50) return 'good'
    return 'excellent'
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'empty': return 'text-red-600 bg-red-100'
      case 'basic': return 'text-yellow-600 bg-yellow-100'
      case 'good': return 'text-blue-600 bg-blue-100'
      case 'excellent': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getHealthText = (health: string) => {
    switch (health) {
      case 'empty': return 'Sistem Boş'
      case 'basic': return 'Temel Kurulum'
      case 'good': return 'İyi Durumda'
      case 'excellent': return 'Mükemmel'
      default: return 'Kontrol Ediliyor'
    }
  }

  // Zaman formatı
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Az önce'
    if (minutes < 60) return `${minutes} dakika önce`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} saat önce`
    return date.toLocaleDateString('tr-TR')
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'category': return '📂'
      case 'property': return '🏷️'
      case 'furniture': return '🪑'
      case 'color': return '🎨'
      default: return '📝'
    }
  }

  const getActionText = (action: string) => {
    switch (action) {
      case 'created': return 'oluşturuldu'
      case 'updated': return 'güncellendi'
      case 'deleted': return 'silindi'
      default: return action
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'text-green-600'
      case 'updated': return 'text-blue-600'
      case 'deleted': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <DashboardIcon />
              <span>Admin Dashboard</span>
            </h1>
            <p className="text-gray-600 mt-2">
              HazarHome yönetim paneline hoş geldiniz
            </p>
          </div>
          
          {/* Sistem Durumu */}
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(getSystemHealth())}`}>
              {getHealthText(getSystemHealth())}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date().toLocaleDateString('tr-TR')} - {new Date().toLocaleTimeString('tr-TR')}
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoaderIcon />
          <span className="ml-2 text-gray-600">Dashboard yükleniyor...</span>
        </div>
      )}

      {/* Dashboard Content */}
      {!loading && stats && (
        <>
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {getQuickStats().map((stat, index) => (
              <Link
                key={stat.title}
                href={stat.link}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className={`${stat.color} rounded-lg p-3 text-white text-2xl`}>
                    {stat.icon}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value.toLocaleString('tr-TR')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hızlı İşlemler */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Hızlı İşlemler
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Kategori İşlemleri */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <CategoryIcon />
                      <span className="ml-2">Kategoriler</span>
                    </h3>
                    <div className="space-y-2">
                      <Link
                        href="/admin/categories"
                        className="w-full bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-100 transition-colors flex items-center justify-between"
                      >
                        <span>Kategori Yönet</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {stats.categories.total}
                        </span>
                      </Link>

                    </div>
                  </div>

                  {/* Özellik İşlemleri */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <PropertyIcon />
                      <span className="ml-2">Özellikler</span>
                    </h3>
                    <div className="space-y-2">
                      <Link
                        href="/admin/properties"
                        className="w-full bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm hover:bg-green-100 transition-colors flex items-center justify-between"
                      >
                        <span>Özellik Yönet</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          {stats.properties.total}
                        </span>
                      </Link>

                    </div>
                  </div>
                  {/* Mobilya İşlemleri */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <FurnitureIcon />
                      <span className="ml-2">Mobilyalar</span>
                    </h3>
                    <div className="space-y-2">
                      <Link
                        href="/admin/furniture"
                        className="w-full bg-orange-50 text-orange-700 px-3 py-2 rounded-lg text-sm hover:bg-orange-100 transition-colors flex items-center justify-between"
                      >
                        <span>Mobilya Yönet</span>
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                          {stats.furniture.total}
                        </span>
                      </Link>
                      <Link
                        href="/admin/furniture/add"
                        className="w-full bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm hover:bg-green-100 transition-colors flex items-center"
                      >
                        <PlusIcon />
                        <span className="ml-2">Mobilya Ekle</span>
                      </Link>
                    </div>
                  </div>

                  {/* Renk İşlemleri */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <ColorIcon />
                      <span className="ml-2">Renkler</span>
                    </h3>
                    <div className="space-y-2">
                      <Link
                        href="/admin/colors"
                        className="w-full bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-sm hover:bg-purple-100 transition-colors flex items-center justify-between"
                      >
                        <span>Renk Yönet</span>
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                          {stats.colors.total}
                        </span>
                      </Link>

                    </div>
                  </div>

                  {/* Sistem İşlemleri */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <SettingsIcon />
                      <span className="ml-2">Sistem</span>
                    </h3>
                    <div className="space-y-2">

                      <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors flex items-center"
                      >
                        <span className="text-lg">🔄</span>
                        <span className="ml-2">Sayfayı Yenile</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </>
      )}
    </div>
  )
}