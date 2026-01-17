import { prisma } from '@/lib/prisma'
import FeatureEditor from '@/components/admin/FeatureEditor'
import { notFound } from 'next/navigation'

export default async function EditFeaturePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const feature = await prisma.feature.findUnique({
    where: { featureId: parseInt(id) },
    include: {
      image: true,
      pins: {
        include: {
          furniture: true,
          furnitureSet: true
        }
      }
    }
  })

  if (!feature) {
    notFound()
  }

  // Helper to serialize Decimal types
  const serializeData = (data: any): any => {
    return JSON.parse(JSON.stringify(data, (key, value) => {
      if (typeof value === 'object' && value !== null && (value.constructor?.name === 'Decimal' || value.isDecimal === true || typeof value.toFixed === 'function')) {
        return value.toString()
      }
      return value
    }))
  }

  const serializedFeature = serializeData(feature)

  return <FeatureEditor initialData={serializedFeature} isNew={false} />
}
