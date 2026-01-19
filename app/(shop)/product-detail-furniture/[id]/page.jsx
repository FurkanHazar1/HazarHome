import Footer1 from "@/components/footers/Footer1";
import Header2 from "@/components/headers/Header4";
import Products from "@/components/shopDetails/Products";
import RecentProducts from "@/components/shopDetails/RecentProducts";
import FurnitureDetailsTab from "@/components/shopDetails/FurnitureDetailsTab";
import React from "react";
import Link from "next/link";
import FurnitureDetailsPopup from "@/components/shopDetails/FurnitureDetailsPopup";
import { getCategoryById } from "@/lib/category-mapping";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const revalidate = 3600; // Fallback 1 hour

// Fetch data with caching and tagging
const getCachedProduct = unstable_cache(
  async (id) => {
    try {
      const furnitureId = parseInt(id);
      if (isNaN(furnitureId)) return null;

      const product = await prisma.furniture.findUnique({
        where: { furnitureId },
        include: {
          category: true,
          images: {
            include: { image: true },
            orderBy: { sortOrder: 'asc' }
          },
          properties: {
            include: { property: true }
          },
          colors: {
            include: { color: true }
          }
        }
      });

      if (!product) return null;

      return {
        ...product,
        id: product.furnitureId,
        title: product.furnitureName,
        imgSrc: product.images?.[0]?.image?.filePath,
        categorySlug: product.category?.categoryName?.toLowerCase() || 'furniture',
        colors: product.colors.map(c => ({
          id: c.colorId,
          name: c.color.colorName,
          value: c.color.colorCode
        }))
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },
  ['product-detail'],
  { revalidate: 3600, tags: ['products'] }
);

export default async function page({ params }) {
  const { id } = await params;
  const product = await getCachedProduct(id);
  
  if (!product) {
    notFound();
  }
  
  // Kategori bilgisini kontrol et - hem ana kategori (level 1) hem alt kategori (level 2) kabul et
  const category = getCategoryById(product.category?.categoryId);
  if (!category || (category.level !== 1 && category.level !== 2)) {
    notFound();
  }
  return (
    <>
      <Header2 />
      <div className="tf-breadcrumb">
        <div className="container">
          <div className="tf-breadcrumb-wrap d-flex justify-content-between flex-wrap align-items-center">
            <div className="tf-breadcrumb-list">
              <Link href={`/`} className="text">
                Home
              </Link>
              <i className="icon icon-arrow-right" />
              {product.category?.categoryName && (
                <>
                  <Link href={`/${product.categorySlug || 'category'}`} className="text">
                    {product.category.categoryName}
                  </Link>
                  <i className="icon icon-arrow-right" />
                </>
              )}
              <span className="text">{product.title || product.furnitureName}</span>
            </div>
          
          </div>
        </div>
      </div>
      <FurnitureDetailsPopup product={product} />
      <FurnitureDetailsTab product={product} />
      <Products />
      <Footer1 />
    </>
  );
}
