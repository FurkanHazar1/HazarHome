import Footer1 from "@/components/footers/Footer1";
import Header2 from "@/components/headers/Header4";
import Topbar1 from "@/components/headers/Topbar1";
import ShopDefault from "@/components/shop/ShopDefault";
import Subcollections from "@/components/shop/Subcollections";
import React from "react";
import { 
  oturmaOdasiCategories, 
  yemekOdasiCategories, 
  yatakOdasiCategories 
} from "@/data/menu";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // 1 hour cache

// Kategori mapping'i
const categoryMappings = {
  'oturma-odasi': { title: 'Oturma Odası Takımları', description: 'Oturma odası için en yeni ve şık mobilyalar', categories: oturmaOdasiCategories, mainCategory: 'oturma-odasi' },
  'yemek-odasi': { title: 'Yemek Odası Takımları', description: 'Yemek odası için en yeni ve şık mobilyalar', categories: yemekOdasiCategories, mainCategory: 'yemek-odasi' },
  'yatak-odasi': { title: 'Yatak Odası Takımları', description: 'Yatak odası için en yeni ve şık mobilyalar', categories: yatakOdasiCategories, mainCategory: 'yatak-odasi' }
};

// Alt kategoriler için mapping
const getSubCategoryMapping = () => {
  const subCategories = {};
  [...oturmaOdasiCategories, ...yemekOdasiCategories, ...yatakOdasiCategories].forEach(item => {
    const slug = item.href.replace('/', '');
    subCategories[slug] = {
      title: item.name,
      description: `${item.name} kategorisindeki tüm ürünler`,
      parentCategory: item.href.includes('oturma') ? 'oturma-odasi' : item.href.includes('yemek') ? 'yemek-odasi' : 'yatak-odasi',
      categoryData: item
    };
  });
  return subCategories;
};

// Data Fetcher
async function getCategoryProducts(categorySlug, subCategorySlug = null) {
  try {
    const where = { isActive: true };
    
    if (subCategorySlug) {
      // Find category by slug (handle potential undefined)
      const subCatMap = getSubCategoryMapping();
      const subCat = subCatMap[subCategorySlug];
      
      if (subCat) {
         // Try to match by exact category name first
         where.category = { categoryName: { equals: subCat.title, mode: 'insensitive' } };
      } else {
         // Fallback to simple slug replacement
         const subCatName = subCategorySlug.replace(/-/g, ' ');
         where.category = { categoryName: { equals: subCatName, mode: 'insensitive' } };
      }
    } else if (categorySlug) {
      // Parent category logic
      if (categorySlug === 'oturma-odasi') {
         where.category = { parent: { categoryName: { contains: 'Oturma', mode: 'insensitive' } } };
      } else if (categorySlug === 'yemek-odasi') {
         where.category = { parent: { categoryName: { contains: 'Yemek', mode: 'insensitive' } } };
      } else if (categorySlug === 'yatak-odasi') {
         where.category = { parent: { categoryName: { contains: 'Yatak', mode: 'insensitive' } } };
      }
    }

    // 1. Fetch Furnitures
    const products = await prisma.furniture.findMany({
      where,
      include: {
        images: { where: { isActive: true }, include: { image: true }, orderBy: { sortOrder: 'asc' } },
        category: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch Furniture Sets (Takımlar) - Same criteria
    const sets = await prisma.furnitureSet.findMany({
      where,
      include: {
        furnitureSetImages: { where: { isActive: true }, include: { image: true }, orderBy: { sortOrder: 'asc' } },
        category: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format Furnitures
    const formattedFurnitures = products.map(p => ({
      ...p,
      id: p.furnitureId,
      title: p.furnitureName,
      imgSrc: p.images.find(img => img.sortOrder === 1)?.image?.filePath || p.images[0]?.image?.filePath,
      imgHoverSrc: p.images.find(img => img.sortOrder === 2)?.image?.filePath || p.images[0]?.image?.filePath,
      price: Number(p.price),
      type: 'furniture'
    }));

    // Format Sets
    const formattedSets = sets.map(s => ({
      ...s,
      id: s.setId,
      title: s.setName,
      imgSrc: s.furnitureSetImages.find(img => img.sortOrder === 1)?.image?.filePath || s.furnitureSetImages[0]?.image?.filePath,
      imgHoverSrc: s.furnitureSetImages.find(img => img.sortOrder === 2)?.image?.filePath || s.furnitureSetImages[0]?.image?.filePath,
      price: Number(s.price),
      type: 'furniture_set'
    }));

    // Combine and Sort by Date
    return [...formattedSets, ...formattedFurnitures].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  } catch (error) {
    console.error("Error fetching category products:", error);
    return [];
  }
}

export default async function CategoryPage({ params, searchParams }) {
  const { category } = await params;
  const resolvedSearchParams = await searchParams;
  const page = resolvedSearchParams?.page ? parseInt(resolvedSearchParams.page, 10) : 1;
  const pageSize = 12;
  
  const categoryData = categoryMappings[category];
  const subCategoryData = getSubCategoryMapping()[category];

  if (categoryData) {
    const products = await getCategoryProducts(category);
    return (
      <>
        <Topbar1 /><Header2 />
        <div className="tf-page-title bg_grey-13" style={{ backgroundImage: 'none' }}>
          <div className="container-full">
            <div className="heading text-center">{categoryData.title}</div>
            <p className="text-center text-2 text_black-2 mt_5">{categoryData.description}</p>
          </div>
        </div>
        <div className="bg_white"><Subcollections categories={categoryData.categories} /></div>
        <ShopDefault category={categoryData.mainCategory} page={page} pageSize={pageSize} initialProducts={products} />
        <Footer1 />
      </>
    );
  }

  if (subCategoryData) {
    const products = await getCategoryProducts(null, category);
    let parentCategories = subCategoryData.parentCategory === 'oturma-odasi' ? oturmaOdasiCategories : subCategoryData.parentCategory === 'yemek-odasi' ? yemekOdasiCategories : yatakOdasiCategories;

    return (
      <>
        <Topbar1 /><Header2 />
        <div className="tf-page-title bg_grey-13" style={{ backgroundImage: 'none' }}>
          <div className="container-full">
            <div className="heading text-center">{subCategoryData.title}</div>
            <p className="text-center text-2 text_black-2 mt_5">{subCategoryData.description}</p>
          </div>
        </div>
        <div className="bg_white"><Subcollections categories={parentCategories} /></div>
        <ShopDefault category={subCategoryData.parentCategory} subCategory={category} page={page} pageSize={pageSize} initialProducts={products} />
        <Footer1 />
      </>
    );
  }

  notFound();
}

export async function generateStaticParams() {
  return [
    ...Object.keys(categoryMappings).map(key => ({ category: key })),
    ...Object.keys(getSubCategoryMapping()).map(key => ({ category: key }))
  ];
}