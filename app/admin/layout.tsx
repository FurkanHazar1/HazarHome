// app/admin/layout.tsx
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              HazarHome Admin
            </h1>
            <div className="flex space-x-6">
              <a 
                href="/admin/categories" 
                className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                📂 Kategoriler
              </a>
              <a 
                href="/admin/properties" 
                className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                🏷️ Özellikler
              </a>
              <a 
                href="/admin/colors" 
                className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                🎨 Renkler
              </a>
              <a 
                href="/admin/furniture" 
                className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                🪑 Mobilyalar
              </a>
              <a 
                href="/admin/dashboard" 
                className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                📊 Dashboard
              </a>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}