'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { AuthWrapper } from '@/components/auth/auth-wrapper'


interface NavItem {
  name: string
  href: string
  icon: string
  badge?: number
}

interface NavSection {
  title: string
  items: NavItem[]
}

export default function DarkAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/login' })
  }

  // Search function
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Search furniture
      const furnitureResponse = await fetch(`/api/furniture?search=${encodeURIComponent(query)}`)
      const furniture = await furnitureResponse.json()
      
      // Search furniture sets
      const setsResponse = await fetch(`/api/furniture-sets?search=${encodeURIComponent(query)}`)
      const sets = await setsResponse.json()

      const results = [
        ...((Array.isArray(furniture) ? furniture : []).map((item: any) => ({
          ...item,
          type: 'furniture',
          href: `/admin/furniture/${item.id}`
        }))),
        ...((Array.isArray(sets) ? sets : []).map((item: any) => ({
          ...item,
          type: 'furniture-set',
          href: `/admin/furniture-sets/${item.id}`
        })))
      ]

      setSearchResults(results)
    } catch (error) {
      console.error('Arama hatası:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Close search when route changes
  useEffect(() => {
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }, [pathname])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Navigation sections - Sadeleştirilmiş
  const navigationSections: NavSection[] = [
    {
      title: 'Yönetim',
      items: [
        { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
        { name: 'Kategoriler', href: '/admin/categories', icon: '📂' },
        { name: 'Mobilyalar', href: '/admin/furniture', icon: '🪑' },
        { name: 'Mobilya Takımları', href: '/admin/furniture-sets', icon: '🛋️' },
        { name: 'Renkler', href: '/admin/colors', icon: '🎨' },
        { name: 'Özellikler', href: '/admin/properties', icon: '🏷️' },
      ]
    }
  ]

  // Check if link is active
  const isActiveLink = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin' || pathname === '/admin/dashboard'
    }
    return pathname.startsWith(href)
  }

  // Get current page title
  const getCurrentPageTitle = () => {
    for (const section of navigationSections) {
      for (const item of section.items) {
        if (isActiveLink(item.href)) {
          return item.name
        }
      }
    }
    return 'Admin Panel'
  }

  // Generate breadcrumb
  const getBreadcrumb = () => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumb = [{ name: 'Ana Sayfa', href: '/admin/dashboard' }]
    
    // If we're already on dashboard, don't add duplicate
    if (pathname === '/admin' || pathname === '/admin/dashboard') {
      return breadcrumb
    }
    
    let currentPath = ''
    for (let i = 1; i < pathSegments.length; i++) {
      currentPath += `/${pathSegments[i]}`
      const fullPath = `/admin${currentPath}`
      
      // Find the name from navigation
      let segmentName = pathSegments[i]
      for (const section of navigationSections) {
        for (const item of section.items) {
          if (item.href === fullPath) {
            segmentName = item.name
            break
          }
        }
      }
      
      breadcrumb.push({
        name: segmentName.charAt(0).toUpperCase() + segmentName.slice(1),
        href: fullPath
      })
    }
    
    return breadcrumb
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900">
      {/* Top Navigation - Mobil optimized */}
      <nav className="bg-gray-800/80 backdrop-blur-sm shadow-xl border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-12 sm:h-14 lg:h-16">
            {/* Logo and Mobile Menu Button */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-1.5 sm:p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700/60 transition-all duration-200"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              
              <Link href="/admin/dashboard" className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 ml-1 sm:ml-2 lg:ml-0">
                {/* SVG Logo */}
                <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 relative flex items-center justify-center">
                  <Image
                    src="/logo.svg"
                    alt="HazarHome"
                    width={40}
                    height={40}
                    className="w-full h-full"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm sm:text-base lg:text-xl leading-tight">HazarHome</span>
                  <span className="text-gray-400 text-xs sm:text-sm lg:text-sm leading-tight">Admin Panel</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigationSections[0].items.map((item, index) => (
                <Link
                  key={`desktop-nav-${index}-${item.href}`}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActiveLink(item.href)
                      ? 'bg-blue-600/20 text-blue-300 shadow-sm border border-blue-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/60'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded-full border border-red-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-700/60 rounded-lg transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Notifications */}
              <button className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-700/60 rounded-lg transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-300 hover:text-white hover:bg-gray-700/60 rounded-lg transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-medium">A</span>
                  </div>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-700/50">
                      <p className="text-sm font-medium text-white">{session?.user?.name || 'Admin'}</p>
                      <p className="text-xs text-gray-400">{session?.user?.email}</p>
                      <p className="text-xs text-blue-400 font-medium">{session?.user?.role}</p>
                    </div>
                    <Link href="/admin/profile" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/60 hover:text-white transition-all duration-200">
                      👤 Profil
                    </Link>
                    <Link href="/admin/settings" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/60 hover:text-white transition-all duration-200">
                      ⚙️ Ayarlar
                    </Link>
                    <hr className="my-1 border-gray-700/50" />
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all duration-200"
                    >
                      🚪 Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-700/50 bg-gray-800/90 backdrop-blur-sm">
            <div className="px-4 py-2 space-y-1">
              {navigationSections.map((section, sectionIndex) => (
                <div key={`mobile-section-${sectionIndex}`}>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {section.title}
                  </div>
                  {section.items.map((item, itemIndex) => (
                    <Link
                      key={`mobile-${sectionIndex}-${itemIndex}-${item.href}`}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActiveLink(item.href)
                          ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700/60'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded-full ml-auto border border-red-500/30">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Breadcrumb */}
      <div className="bg-gray-800/60 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <nav className="flex items-center space-x-2 text-sm">
              {getBreadcrumb().map((item, index) => (
                <div key={`breadcrumb-${index}-${item.href}`} className="flex items-center">
                  {index > 0 && (
                    <svg className="w-4 h-4 text-gray-500 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  <Link
                    href={item.href}
                    className={`${
                      index === getBreadcrumb().length - 1
                        ? 'text-white font-medium'
                        : 'text-gray-400 hover:text-gray-200'
                    } transition-colors duration-200`}
                  >
                    {item.name}
                  </Link>
                </div>
              ))}
            </nav>
            
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>🕒</span>
              <span>{new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Quick Actions Sidebar - Only on desktop */}
      <div className="hidden xl:block fixed right-6 top-1/2 transform -translate-y-1/2 z-40">
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-4 space-y-3">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-400 mb-3">Hızlı İşlemler</p>
          </div>
          
          <Link
            href="/admin/furniture/add"
            className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            title="Mobilya Ekle"
          >
            <span className="text-xl">🪑</span>
          </Link>
          
          <Link
            href="/admin/furniture-sets/add"
            className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            title="Set Oluştur"
          >
            <span className="text-xl">🛋️</span>
          </Link>
          
          <Link
            href="/admin/categories"
            className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            title="Kategori Yönet"
          >
            <span className="text-xl">📂</span>
          </Link>
          
          <Link
            href="/admin/colors"
            className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            title="Renk Yönet"
          >
            <span className="text-xl">🎨</span>
          </Link>
        </div>
      </div>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm"
              onClick={() => setIsSearchOpen(false)}
            />
            
            <div className="relative inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Arama</h3>
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Mobilya veya mobilya seti ara..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      handleSearch(e.target.value)
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                
                {/* Search Results */}
                <div className="mt-4 max-h-96 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((item, index) => (
                        <Link
                          key={`search-${item.type}-${item.id}`}
                          href={item.href}
                          className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <span className="text-2xl">
                                {item.type === 'furniture' ? '🪑' : '🛋️'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {item.type === 'furniture' ? 'Mobilya' : 'Mobilya Seti'}
                                {item.category && ` • ${item.category.name}`}
                              </p>
                            </div>
                            <div className="text-gray-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : searchQuery && !isSearching ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-sm">Sonuç bulunamadı</p>
                    </div>
                  ) : !searchQuery ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-sm">Arama yapmak için yazın...</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(isMobileMenuOpen || isUserMenuOpen) && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => {
            setIsMobileMenuOpen(false)
            setIsUserMenuOpen(false)
          }}
        />
      )}
    </div>
  )
}