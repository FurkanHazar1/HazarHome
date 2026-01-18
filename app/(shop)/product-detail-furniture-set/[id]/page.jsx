import Footer1 from "@/components/footers/Footer1";
import Header2 from "@/components/headers/Header4";
import Products from "@/components/shopDetails/Products";
import RecentProducts from "@/components/shopDetails/RecentProducts";
import FurnitureDetailsTab from "@/components/shopDetails/FurnitureDetailsTab";
import React from "react";
import Link from "next/link";
import FurnitureSetDetailsPopup from "@/components/shopDetails/FurnitureSetDetailsPopup";
import { getCategoryById } from "@/lib/category-mapping";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // Cache for 1 hour

// Fetch data directly from DB
async function getProduct(id) {
  try {
    const setId = parseInt(id);
    if (isNaN(setId)) return null;

    const product = await prisma.furnitureSet.findUnique({
      where: { setId },
      include: {
        category: true,
        furnitureSetImages: {
          include: { image: true },
          orderBy: { sortOrder: 'asc' }
        },
        furnitureSetItems: {
          include: {
            furniture: {
              include: {
                images: { include: { image: true }, take: 1 }
              }
            }
          }
        }
      }
    });

    if (!product) return null;

    // Transform to match component expectations
    return {
      ...product,
      id: product.setId,
      title: product.setName,
      imgSrc: product.furnitureSetImages?.[0]?.image?.filePath,
      categorySlug: product.category?.categoryName?.toLowerCase() || 'furniture-set',
      setItems: product.furnitureSetItems.map(item => ({
        id: item.furnitureId,
        name: item.furniture?.furnitureName,
        quantity: item.quantity,
        image: item.furniture?.images?.[0]?.image?.filePath
      }))
    };
  } catch (error) {
    console.error('Error fetching set directly:', error);
    return null;
  }
}

export default async function page({ params }) {
  const { id } = await params;
  const product = await getProduct(id);
  
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
              <span className="text">{product.title || product.setName}</span>
            </div>
          </div>
        </div>
      </div>
      <FurnitureSetDetailsPopup product={product} />
      <FurnitureDetailsTab product={product} />
      <Products />
      <Footer1 />
    </>
  );
}
