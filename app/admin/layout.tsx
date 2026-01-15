'use client'

import { useState, useEffect, JSX } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

interface NavItem {
  name: string
  href: string
  
  icon: JSX.Element
}

// Icons
const Icons = {
  Dashboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>,
  Furniture: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
  Sets: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>,
  Categories: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"/></svg>,
  Colors: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z"/></svg>,
  Properties: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>,
  Search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  Logout: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>,
  Menu: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>,
  Close: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: Icons.Dashboard },
  { name: 'Mobilyalar', href: '/admin/furniture', icon: Icons.Furniture },
  { name: 'Takımlar', href: '/admin/furniture-sets', icon: Icons.Sets },
  { name: 'Kategoriler', href: '/admin/categories', icon: Icons.Categories },
  { name: 'Renkler', href: '/admin/colors', icon: Icons.Colors },
  { name: 'Özellikler', href: '/admin/properties', icon: Icons.Properties },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  const pathname = usePathname()
  const router = useRouter()
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
      // Parallel search
      const [furnRes, setsRes] = await Promise.all([
        fetch(`/api/furniture?search=${encodeURIComponent(query)}&limit=5`),
        fetch(`/api/furniture-sets?search=${encodeURIComponent(query)}&limit=5`)
      ])
      
      const furnData = await furnRes.json()
      const setsData = await setsRes.json()

      const results = [
        ...(furnData.data || []).map((i: any) => ({ ...i, type: 'furniture', label: 'Mobilya', url: `/admin/furniture/${i.furnitureId}` })),
        ...(setsData.data || []).map((i: any) => ({ ...i, type: 'set', label: 'Takım', url: `/admin/furniture-sets/${i.setId}`, furnitureName: i.setName }))
      ]

      setSearchResults(results)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSearching(false)
    }
  }

  // Close things on route change
  useEffect(() => {
    setSidebarOpen(false)
    setIsSearchOpen(false)
    setSearchQuery('')
  }, [pathname])

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700/50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        
        {/* Logo */}
        <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-700/50 bg-slate-800">
          <div className="w-8 h-8 relative">
            <Image src="/logo.svg" alt="Logo" fill className="object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">HazarHome</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Yönetim Paneli</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30 border border-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {session?.user?.name?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{session?.user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-400 truncate">{session?.user?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition p-1">
              {Icons.Logout}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="h-16 bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50"
            >
              {Icons.Menu}
            </button>
            
            {/* Search Trigger */}
            <div className="hidden sm:block relative">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="w-64 flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-slate-400 hover:border-slate-600 transition text-left"
              >
                {Icons.Search}
                <span>Hızlı arama yap...</span>
                <span className="ml-auto text-xs bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">⌘K</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50"
            >
              {Icons.Search}
            </button>
            
            {/* Notification Bell (Static for now) */}
            <button className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-900 scroll-smooth">
          {children}
        </main>

      </div>

      {/* Global Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[70vh]">
            
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-700">
              <div className="text-slate-400">{Icons.Search}</div>
              <input 
                type="text" 
                placeholder="Mobilya, takım veya kategori ara..." 
                className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-slate-500"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  handleSearch(e.target.value)
                }}
                autoFocus
              />
              {isSearching && <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>}
              <button onClick={() => setIsSearchOpen(false)} className="text-sm bg-slate-700 text-slate-300 px-2 py-1 rounded hover:text-white">ESC</button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-2">
              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((item, idx) => (
                    <Link 
                      key={`${item.type}-${idx}`} 
                      href={item.url} 
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-700/50 transition group"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${item.type === 'furniture' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-pink-500/20 text-pink-400'}`}>
                        {item.type === 'furniture' ? '🪑' : '🛋️'}
                      </div>
                      <div>
                        <h4 className="text-white font-medium group-hover:text-indigo-300 transition">{item.furnitureName}</h4>
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                          <span className="uppercase tracking-wider font-bold text-[10px]">{item.label}</span>
                          {item.category && <span>• {item.category.categoryName}</span>}
                        </p>
                      </div>
                      <div className="ml-auto text-slate-500 group-hover:text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="py-12 text-center text-slate-500">
                  <p>Sonuç bulunamadı.</p>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500">
                  <p>Aramaya başlamak için yazın...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}