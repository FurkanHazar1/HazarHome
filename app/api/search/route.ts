import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toPublicUrl } from '@/lib/image-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = query.trim().toLowerCase();

    // Mobilya arama
    const furnitureResults = await prisma.furniture.findMany({
      where: {
        OR: [
          { furnitureName: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { categoryName: { contains: query, mode: 'insensitive' } } },
          { furnitureType: { contains: query, mode: 'insensitive' } },
          { colors: { some: { color: { colorName: { contains: query, mode: 'insensitive' } } } } },
          { properties: { some: { property: { propertyName: { contains: query, mode: 'insensitive' } } } } },
          { properties: { some: { propertyValue: { contains: query, mode: 'insensitive' } } } }
        ]
      },
      include: {
        category: true,
        images: {
          include: { image: true }
        },
        colors: {
          include: { color: true }
        },
        properties: {
          include: { property: true }
        }
      },
      take: 20
    });

    // Mobilya seti arama
    const furnitureSetResults = await prisma.furnitureSet.findMany({
      where: {
        OR: [
          { setName: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { categoryName: { contains: query, mode: 'insensitive' } } },
          { furnitureSetItems: { some: { furniture: { colors: { some: { color: { colorName: { contains: query, mode: 'insensitive' } } } } } } } }
        ]
      },
      include: {
        category: true,
        furnitureSetImages: {
          include: { image: true }
        },
        furnitureSetItems: {
          include: {
            furniture: {
              include: {
                colors: { include: { color: true } },
                properties: { include: { property: true } }
              }
            }
          }
        }
      },
      take: 10
    });

    // Relevance scoring function
    function calculateRelevanceScore(item: any, searchTerm: string, type: 'furniture' | 'furnitureSet') {
      let score = 0;
      const itemName = type === 'furniture' ? item.furnitureName : item.setName;
      const lowerName = (itemName || '').toLowerCase();
      const lowerDescription = (item.description || '').toLowerCase();
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      if (lowerName === lowerSearchTerm) score += 100;
      else if (lowerName.startsWith(lowerSearchTerm)) score += 80;
      else if (lowerName.includes(lowerSearchTerm)) score += 60;
      
      if (item.category) {
        const categoryName = (item.category.categoryName || '').toLowerCase();
        if (categoryName.includes(lowerSearchTerm)) score += 40;
      }
      
      if (type === 'furniture' && item.colors) {
        item.colors.forEach((colorRelation: any) => {
          if (colorRelation.color?.colorName.toLowerCase().includes(lowerSearchTerm)) {
            score += 25;
          }
        });
      }
      
      if (type === 'furnitureSet' && item.furnitureSetItems) {
        item.furnitureSetItems.forEach((setItem: any) => {
          if (setItem.furniture.colors) {
            setItem.furniture.colors.forEach((colorRelation: any) => {
              if (colorRelation.color?.colorName.toLowerCase().includes(lowerSearchTerm)) {
                score += 25;
              }
            });
          }
        });
      }
      
      if (type === 'furniture' && item.properties) {
        item.properties.forEach((propRelation: any) => {
          if (propRelation.property?.propertyName.toLowerCase().includes(lowerSearchTerm)) {
            score += 20;
          }
          if (propRelation.propertyValue?.toLowerCase().includes(lowerSearchTerm)) {
            score += 15;
          }
        });
      }
      
      if (type === 'furniture' && item.furnitureType) {
        if (item.furnitureType.toLowerCase().includes(lowerSearchTerm)) {
          score += 35;
        }
      }
      
      if (lowerDescription.includes(lowerSearchTerm)) score += 10;
      
      return score;
    }

    // Sonuçları formatla ve puanla
    const formattedResults = [
      ...furnitureResults.map(item => {
        const score = calculateRelevanceScore(item, searchTerm, 'furniture');
        return {
          id: item.furnitureId,
          title: item.furnitureName,
          price: parseFloat(String(item.price)),
          type: 'furniture',
          category: item.category?.categoryName || '',
          imgSrc: toPublicUrl(item.images?.[0]?.image?.filePath),
          href: `/product-detail-furniture/${item.furnitureId}`,
          relevanceScore: score,
          colors: item.colors?.map(c => c.color?.colorName).filter(Boolean) || [],
          properties: item.properties?.map(p => ({
            name: p.property?.propertyName,
            value: p.propertyValue
          })).filter(p => p.name) || []
        };
      }),
      ...furnitureSetResults.map(item => {
        const score = calculateRelevanceScore(item, searchTerm, 'furnitureSet');
        return {
          id: item.setId,
          title: item.setName,
          price: parseFloat(String(item.price || 0)),
          type: 'furniture_set',
          category: item.category?.categoryName || '',
          imgSrc: toPublicUrl(item.furnitureSetImages?.[0]?.image?.filePath),
          href: `/product-detail-furniture-set/${item.setId}`,
          relevanceScore: score,
          furnitureCount: item.furnitureSetItems?.length || 0,
          furnitures: item.furnitureSetItems?.map((sf: any) => sf.furniture.furnitureName).filter(Boolean) || []
        };
      })
    ];

    const sortedResults = formattedResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 15);

    return NextResponse.json({
      results: sortedResults,
      total: sortedResults.length,
      query: query
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { 
        error: 'Arama sırasında bir hata oluştu',
        results: [],
        total: 0
      },
      { status: 500 }
    );
  }
}