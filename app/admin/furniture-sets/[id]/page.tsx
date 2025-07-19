// app/furniture-sets/[id]/page.tsx
import FurnitureSetDetail from '@/components/admin/FurnitureSetDetail'

interface FurnitureSetDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function FurnitureSetDetailPage({ 
  params 
}: FurnitureSetDetailPageProps) {
  const { id } = await params
  const setId = parseInt(id)

  if (isNaN(setId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Hatalı ID</h1>
          <p className="text-gray-600 mt-2">Geçersiz mobilya takımı ID'si</p>
        </div>
      </div>
    )
  }

  return <FurnitureSetDetail setId={setId} />
}

export async function generateMetadata({ params }: FurnitureSetDetailPageProps) {
  const { id } = await params
  
  return {
    title: `Mobilya Takımı Detayı - #${id}`,
    description: 'Mobilya takımı detayları, fiyat analizi ve içindeki mobilyalar'
  }
}