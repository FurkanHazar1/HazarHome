export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              HazarHome Admin
            </h1>
            <div className="flex space-x-4">
              <a href="/admin/categories" className="text-blue-600 hover:text-blue-800">
                Kategoriler
              </a>
              <a href="/admin/furniture" className="text-blue-600 hover:text-blue-800">
                Mobilyalar
              </a>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}