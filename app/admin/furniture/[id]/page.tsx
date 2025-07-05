import FurnitureDetail from '@/components/admin/FurnitureDetail'

interface FurnitureDetailPageProps {
  params: {
    id: string
  }
}

export default function FurnitureDetailPage({ params }: FurnitureDetailPageProps) {
  return (
    <div>
      <FurnitureDetail furnitureId={params.id} />
    </div>
  )
}

export const metadata = {
  title: 'Mobilya Detayı - HazarHome Admin',
  description: 'Mobilya detay görüntüleme ve düzenleme',
}