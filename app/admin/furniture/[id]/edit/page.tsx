// app/admin/furniture/[id]/edit/page.tsx
import FurnitureEdit from '@/components/admin/FurnitureEdit'

interface FurnitureEditPageProps {
  params: {
    id: string
  }
}

export default function FurnitureEditPage({ params }: FurnitureEditPageProps) {
  return (
    <div>
      <FurnitureEdit furnitureId={params.id} />
    </div>
  )
}

export const metadata = {
  title: 'Mobilya Düzenle - HazarHome Admin',
  description: 'Mobilya düzenleme formu',
}