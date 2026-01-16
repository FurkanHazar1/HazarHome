import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface UpdateData {
  isPopular?: boolean;
  popularOrder?: number | null;
}

// GET: Popüler ürünleri listele (vitrin için ve admin panel için)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    // Popüler mobilyalar
    const popularFurniture = await prisma.furniture.findMany({
      where: {
        isActive: true,
        isPopular: true
      },
      include: {
        images: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          take: 1,
          include: { image: true }
        },
        category: {
          select: {
            categoryName: true
          }
        }
      },
      orderBy: {
        popularOrder: 'asc'
      }
    });

    // Popüler takımlar
    const popularSets = await prisma.furnitureSet.findMany({
      where: {
        isActive: true,
        isPopular: true
      },
      include: {
        furnitureSetImages: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          take: 1,
          include: { image: true }
        },
        category: {
          select: {
            categoryName: true
          }
        }
      },
      orderBy: {
        popularOrder: 'asc'
      }
    });

    // İkisini birleştir ve sırala
    const allPopular = [
      ...popularFurniture.map(f => {
        const image = f.images[0]?.image;
        let filePath = image?.filePath || '';
        
        // Clean up path and ensure it starts with /uploads/ if it's a relative path
        let imgSrc = '/images/products/placeholder.jpg';
        if (filePath) {
          filePath = filePath.replace(/\\/g, '/');
          if (filePath.startsWith('http') || filePath.startsWith('/')) {
            imgSrc = filePath;
          } else {
            // Remove leading 'public/' or 'uploads/' if present to avoid duplication
            const cleanPath = filePath.replace(/^(public\/|uploads\/)/, '');
            imgSrc = `/uploads/${cleanPath}`;
          }
        }

        return {
          id: f.furnitureId,
          title: f.furnitureName,
          price: Number(f.price),
          imgSrc,
          type: 'furniture' as const,
          furnitureType: f.furnitureType,
          category: f.category?.categoryName || '',
          categoryId: f.categoryId,
          popularOrder: f.popularOrder ?? 9999,
          isPopular: true
        };
      }),
      ...popularSets.map(s => {
        const image = s.furnitureSetImages[0]?.image;
        let filePath = image?.filePath || '';
        
        // Clean up path and ensure it starts with /uploads/ if it's a relative path
        let imgSrc = '/images/products/placeholder.jpg';
        if (filePath) {
          filePath = filePath.replace(/\\/g, '/');
          if (filePath.startsWith('http') || filePath.startsWith('/')) {
            imgSrc = filePath;
          } else {
            // Remove leading 'public/' or 'uploads/' if present to avoid duplication
            const cleanPath = filePath.replace(/^(public\/|uploads\/)/, '');
            imgSrc = `/uploads/${cleanPath}`;
          }
        }

        return {
          id: s.setId,
          title: s.setName || '',
          price: Number(s.price),
          imgSrc,
          type: 'furniture_set' as const,
          furnitureType: 'Takım',
          category: s.category?.categoryName || '',
          categoryId: s.categoryId,
          popularOrder: s.popularOrder ?? 9999,
          isPopular: true
        };
      })
    ].sort((a, b) => (a.popularOrder) - (b.popularOrder));

    // Limit uygula
    const result = limit > 0 ? allPopular.slice(0, limit) : allPopular;

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching popular products:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch popular products' }, { status: 500 });
  }
}

// POST: Ürünü popüler yap/çıkar veya sıralamasını güncelle (Sadece Admin)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, type, isPopular, popularOrder } = body;

    if (id === undefined || !type) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const updateData: UpdateData = {};
    if (typeof isPopular !== 'undefined') updateData.isPopular = isPopular;
    if (typeof popularOrder !== 'undefined') updateData.popularOrder = popularOrder;

    if (type === 'furniture') {
      await prisma.furniture.update({
        where: { furnitureId: Number(id) },
        data: updateData
      });
    } else if (type === 'furniture_set') {
      const setId = typeof id === 'string' && id.startsWith('fs_') 
        ? parseInt(id.replace('fs_', ''), 10) 
        : Number(id);
      
      await prisma.furnitureSet.update({
        where: { setId: setId },
        data: updateData
      });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid product type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating popular product:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update product' 
    }, { status: 500 });
  }
}