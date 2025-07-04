// app/api/properties/[id]/route.ts - Güncellenmiş Tekil Özellik API
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Tek özellik detayı (geliştirilmiş)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = parseInt(params.id)

    if (isNaN(propertyId)) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz özellik ID\'si'
      }, { status: 400 })
    }

    const property = await prisma.property.findUnique({
      where: { propertyId },
      include: {
        furnitureProperties: {
          include: {
            furniture: {
              select: {
                furnitureId: true,
                furnitureName: true,
                furnitureType: true,
                price: true,
                isActive: true,
                createdAt: true
              }
            }
          },
          take: 10,
          orderBy: { furniture: { furnitureName: 'asc' } }
        },
        furnitureSetProperties: {
          include: {
            furnitureSet: {
              select: {
                setId: true,
                setName: true,
                price: true,
                isActive: true,
                createdAt: true
              }
            }
          },
          take: 10,
          orderBy: { furnitureSet: { setName: 'asc' } }
        },
        _count: {
          select: {
            furnitureProperties: true,
            furnitureSetProperties: true
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json({
        success: false,
        error: 'Özellik bulunamadı'
      }, { status: 404 })
    }

    // Kullanım analizi
    const usageAnalysis = {
      totalUsage: property._count.furnitureProperties + property._count.furnitureSetProperties,
      furnitureUsage: property._count.furnitureProperties,
      furnitureSetUsage: property._count.furnitureSetProperties,
      isUsed: property._count.furnitureProperties > 0 || property._count.furnitureSetProperties > 0,
      canBeDeleted: property._count.furnitureProperties === 0 && property._count.furnitureSetProperties === 0
    }

    // En yaygın değerler
    const [commonValues, recentUsage] = await Promise.all([
      // En çok kullanılan değerler
      prisma.furnitureProperty.groupBy({
        by: ['propertyValue'],
        where: { propertyId },
        _count: { propertyValue: true },
        orderBy: { _count: { propertyValue: 'desc' } },
        take: 5
      }),
      // Son kullanımlar
      prisma.furnitureProperty.findMany({
        where: { propertyId },
        include: {
          furniture: {
            select: {
              furnitureId: true,
              furnitureName: true,
              createdAt: true
            }
          }
        },
        orderBy: { furniture: { createdAt: 'desc' } },
        take: 5
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        ...property,
        usage: usageAnalysis,
        analytics: {
          commonValues: commonValues.map(cv => ({
            value: cv.propertyValue,
            count: cv._count.propertyValue
          })),
          recentUsage: recentUsage.map(ru => ({
            furnitureId: ru.furniture.furnitureId,
            furnitureName: ru.furniture.furnitureName,
            propertyValue: ru.propertyValue,
            usedAt: ru.furniture.createdAt
          }))
        }
      }
    })

  } catch (error) {
    console.error('Özellik detay hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Özellik getirilemedi'
    }, { status: 500 })
  }
}

// PUT - Özellik güncelle (geliştirilmiş)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = parseInt(params.id)
    
    if (isNaN(propertyId)) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz özellik ID\'si'
      }, { status: 400 })
    }

    const data = await request.json()
    const { propertyName, propertyType, description, isActive } = data

    // Mevcut özelliği kontrol et
    const existingProperty = await prisma.property.findUnique({
      where: { propertyId },
      include: {
        _count: {
          select: {
            furnitureProperties: true,
            furnitureSetProperties: true
          }
        }
      }
    })

    if (!existingProperty) {
      return NextResponse.json({
        success: false,
        error: 'Özellik bulunamadı'
      }, { status: 404 })
    }

    // Validasyonlar
    if (propertyName !== undefined) {
      if (!propertyName || propertyName.trim().length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Özellik adı boş olamaz'
        }, { status: 400 })
      }

      if (propertyName.length > 50) {
        return NextResponse.json({
          success: false,
          error: 'Özellik adı 50 karakterden uzun olamaz'
        }, { status: 400 })
      }

      // Özellik adı benzersizlik kontrolü (kendisi hariç)
      const duplicateProperty = await prisma.property.findFirst({
        where: {
          propertyName: {
            equals: propertyName.trim(),
            mode: 'insensitive'
          },
          propertyId: { not: propertyId }
        }
      })

      if (duplicateProperty) {
        return NextResponse.json({
          success: false,
          error: 'Bu özellik adı zaten başka bir özellik tarafından kullanılıyor'
        }, { status: 400 })
      }
    }

    // Özellik tipi kontrolü
    if (propertyType !== undefined) {
      const validTypes = ['text', 'number', 'date', 'boolean']
      if (!validTypes.includes(propertyType)) {
        return NextResponse.json({
          success: false,
          error: `Geçerli özellik tipleri: ${validTypes.join(', ')}`
        }, { status: 400 })
      }

      // Eğer özellik kullanılıyorsa tip değişikliği riskli olabilir
      const totalUsage = existingProperty._count.furnitureProperties + existingProperty._count.furnitureSetProperties
      if (totalUsage > 0 && propertyType !== existingProperty.propertyType) {
        return NextResponse.json({
          success: false,
          error: 'Kullanımda olan özelliğin tipi değiştirilemez',
          details: `Bu özellik ${totalUsage} yerde kullanılıyor`
        }, { status: 400 })
      }
    }

    // Açıklama validasyonu
    if (description !== undefined && description && description.length > 500) {
      return NextResponse.json({
        success: false,
        error: 'Açıklama 500 karakterden uzun olamaz'
      }, { status: 400 })
    }

    // isActive false yapılırken kullanım kontrolü
    if (isActive === false) {
      const totalUsage = existingProperty._count.furnitureProperties + existingProperty._count.furnitureSetProperties
      if (totalUsage > 0) {
        return NextResponse.json({
          success: false,
          error: 'Kullanımda olan özellik pasif yapılamaz',
          details: `Bu özellik ${totalUsage} yerde kullanılıyor`
        }, { status: 400 })
      }
    }

    // Güncelleme verileri hazırla
    const updateData: any = {}
    
    if (propertyName !== undefined) {
      updateData.propertyName = propertyName.trim()
    }
    
    if (propertyType !== undefined) {
      updateData.propertyType = propertyType
    }
    
    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }
    
    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    const updatedProperty = await prisma.property.update({
      where: { propertyId },
      data: updateData,
      include: {
        _count: {
          select: {
            furnitureProperties: true,
            furnitureSetProperties: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Özellik başarıyla güncellendi',
      data: updatedProperty
    })

  } catch (error) {
    console.error('Özellik güncelleme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Özellik güncellenemedi'
    }, { status: 500 })
  }
}

// DELETE - Özellik sil (geliştirilmiş)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = parseInt(params.id)

    if (isNaN(propertyId)) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz özellik ID\'si'
      }, { status: 400 })
    }

    // Özelliği ve bağımlılıklarını kontrol et
    const property = await prisma.property.findUnique({
      where: { propertyId },
      include: {
        furnitureProperties: {
          include: {
            furniture: {
              select: {
                furnitureId: true,
                furnitureName: true
              }
            }
          }
        },
        furnitureSetProperties: {
          include: {
            furnitureSet: {
              select: {
                setId: true,
                setName: true
              }
            }
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json({
        success: false,
        error: 'Özellik bulunamadı'
      }, { status: 404 })
    }

    // Bağımlılık kontrolleri
    const issues = []
    const usageDetails = []
    
    if (property.furnitureProperties.length > 0) {
      issues.push(`${property.furnitureProperties.length} mobilyada kullanılıyor`)
      usageDetails.push(...property.furnitureProperties.map(fp => ({
        type: 'furniture',
        id: fp.furniture.furnitureId,
        name: fp.furniture.furnitureName,
        value: fp.propertyValue
      })))
    }
    
    if (property.furnitureSetProperties.length > 0) {
      issues.push(`${property.furnitureSetProperties.length} mobilya setinde kullanılıyor`)
      usageDetails.push(...property.furnitureSetProperties.map(fsp => ({
        type: 'furnitureSet',
        id: fsp.furnitureSet.setId,
        name: fsp.furnitureSet.setName || `Set ${fsp.furnitureSet.setId}`,
        value: fsp.propertyValue
      })))
    }

    if (issues.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Özellik silinemez',
        issues,
        details: {
          propertyName: property.propertyName,
          totalUsage: property.furnitureProperties.length + property.furnitureSetProperties.length,
          usage: usageDetails.slice(0, 5) // İlk 5 kullanımı göster
        }
      }, { status: 400 })
    }

    await prisma.property.delete({
      where: { propertyId }
    })

    return NextResponse.json({
      success: true,
      message: `"${property.propertyName}" özelliği başarıyla silindi`
    })

  } catch (error) {
    console.error('Özellik silme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Özellik silinemedi'
    }, { status: 500 })
  }
}

// PATCH - Özellik değerlerini toplu güncelle
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = parseInt(params.id)
    
    if (isNaN(propertyId)) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz özellik ID\'si'
      }, { status: 400 })
    }

    const data = await request.json()
    const { action, oldValue, newValue, furnitureIds, furnitureSetIds } = data

    if (action === 'replaceValue') {
      // Belirli bir değeri başka bir değerle değiştir
      if (!oldValue || !newValue) {
        return NextResponse.json({
          success: false,
          error: 'Eski ve yeni değer belirtilmeli'
        }, { status: 400 })
      }

      const [updatedFurniture, updatedFurnitureSets] = await Promise.all([
        prisma.furnitureProperty.updateMany({
          where: {
            propertyId,
            propertyValue: oldValue
          },
          data: {
            propertyValue: newValue
          }
        }),
        prisma.furnitureSetProperty.updateMany({
          where: {
            propertyId,
            propertyValue: oldValue
          },
          data: {
            propertyValue: newValue
          }
        })
      ])

      return NextResponse.json({
        success: true,
        message: `"${oldValue}" değeri "${newValue}" ile değiştirildi`,
        updated: {
          furniture: updatedFurniture.count,
          furnitureSets: updatedFurnitureSets.count
        }
      })

    } else if (action === 'removeValue') {
      // Belirli bir değeri tamamen kaldır
      if (!oldValue) {
        return NextResponse.json({
          success: false,
          error: 'Kaldırılacak değer belirtilmeli'
        }, { status: 400 })
      }

      const [deletedFurniture, deletedFurnitureSets] = await Promise.all([
        prisma.furnitureProperty.deleteMany({
          where: {
            propertyId,
            propertyValue: oldValue
          }
        }),
        prisma.furnitureSetProperty.deleteMany({
          where: {
            propertyId,
            propertyValue: oldValue
          }
        })
      ])

      return NextResponse.json({
        success: true,
        message: `"${oldValue}" değeri kaldırıldı`,
        removed: {
          furniture: deletedFurniture.count,
          furnitureSets: deletedFurnitureSets.count
        }
      })

    } else {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz işlem. Geçerli işlemler: replaceValue, removeValue'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Özellik değer güncelleme hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Özellik değerleri güncellenemedi'
    }, { status: 500 })
  }
}