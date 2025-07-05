// app/admin/furniture/add/page.tsx
import FurnitureAdd from '@/components/admin/FurnitureAdd'

export default function FurnitureAddPage() {
  return (
    <div>
      <FurnitureAdd />
    </div>
  )
}

export const metadata = {
  title: 'Yeni Mobilya Ekle - HazarHome Admin',
  description: 'Yeni mobilya ekleme formu',
}