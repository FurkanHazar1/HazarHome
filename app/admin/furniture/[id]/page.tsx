import FurnitureDetail from '@/components/admin/FurnitureDetail'

interface FurnitureDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function FurnitureDetailPage({ params }: FurnitureDetailPageProps) {
  const { id } = await params
  
  return (
    <div>
      <FurnitureDetail furnitureId={parseInt(id)} />
    </div>
  )
}

export const metadata = {
  title: 'Mobilya Detayı - HazarHome Admin',
  description: 'Mobilya detay görüntüleme ve düzenleme',
}