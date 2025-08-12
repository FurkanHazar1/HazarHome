// app/admin/furniture/[id]/edit/page.tsx
import FurnitureEdit from '@/components/admin/FurnitureEdit'

interface FurnitureEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function FurnitureEditPage({ params }: FurnitureEditPageProps) {
  const { id } = await params
  
  return (
    <div>
      <FurnitureEdit furnitureId={parseInt(id)} />
    </div>
  )
}

export const metadata = {
  title: 'Mobilya Düzenle - HazarHome Admin',
  description: 'Mobilya düzenleme formu',
}