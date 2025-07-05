// app/admin/furniture/page.tsx
import FurnitureManagement from '@/components/admin/FurnitureManagement'

export default function FurniturePage() {
  return (
    <div>
      <FurnitureManagement />
    </div>
  )
}

export const metadata = {
  title: 'Mobilya Yönetimi - HazarHome Admin',
  description: 'Mobilya ekleme, düzenleme ve yönetim paneli',
}