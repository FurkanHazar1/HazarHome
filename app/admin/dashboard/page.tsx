// app/admin/dashboard/page.tsx
import AdminDashboard from '@/components/admin/AdminDashboard'

export default function DashboardPage() {
  return (
    <div>
      <AdminDashboard />
    </div>
  )
}

export const metadata = {
  title: 'Dashboard - HazarHome Admin',
  description: 'Admin panel dashboard ve istatistikler',
}