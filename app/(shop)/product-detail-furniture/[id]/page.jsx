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

import { toPublicUrl } from "@/lib/image-helpers";

export const revalidate = 3600; // Cache for 1 hour

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProduct(id);
  
  if (!product) return { title: "Ürün Bulunamadı" };

  return {
    title: `${product.title} | Hazar Home`,
    description: `${product.title} - ${product.description || 'Kaliteli ve şık mobilya.'} Uygun fiyat ve taksit seçenekleriyle Hazar Home'da.`,
    openGraph: {
      images: [toPublicUrl(product.imgSrc)],
    },
  };
}

// Standard fetch function (More stable for Next.js 16)
async function getProduct(id) {
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
}

export default async function page({ params }) {
  const { id } = await params;
  const product = await getProduct(id);
  
  if (!product) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": toPublicUrl(product.imgSrc),
    "description": product.description || product.title,
    "brand": {
      "@type": "Brand",
      "name": "Hazar Home"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://hazarhome.com/product-detail-furniture/${product.id}`,

    }
  };
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header2 />
      <FurnitureDetailsPopup product={product} />
      <FurnitureDetailsTab product={product} />
      <Products />
      <Footer1 />
    </>
  );
}