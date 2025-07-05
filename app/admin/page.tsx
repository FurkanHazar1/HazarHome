// app/admin/page.tsx
import AdminDashboard from '@/components/admin/AdminDashboard'

export default function AdminMainPage() {
  return (
    <div>
      <AdminDashboard />
    </div>
  )
}

// Optional: You can also add metadata for SEO
export const metadata = {
  title: 'HazarHome Admin Dashboard',
  description: 'Mobilya e-ticaret yönetim paneli',
}