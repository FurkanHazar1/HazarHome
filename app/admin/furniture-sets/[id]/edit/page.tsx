import { notFound } from 'next/navigation'
import FurnitureSetEdit from '@/components/admin/FurnitureSetEdit'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function FurnitureSetEditPage({ params }: PageProps) {
  const { id } = await params
  const setId = parseInt(id)
  
  // ID validation
  if (isNaN(setId) || setId <= 0) {
    notFound()
  }

  return <FurnitureSetEdit setId={setId} />
}

// Optional: Add metadata
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  
  return {
    title: `Mobilya Takımı Düzenle - ${id}`,
    description: 'Mobilya takımı bilgilerini güncelleyin'
  }
}