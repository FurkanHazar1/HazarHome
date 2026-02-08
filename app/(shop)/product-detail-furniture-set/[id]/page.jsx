import Footer1 from "@/components/footers/Footer1";
import Header2 from "@/components/headers/Header4";
import Products from "@/components/shopDetails/Products";
import FurnitureSetDetailsPopup from "@/components/shopDetails/FurnitureSetDetailsPopup";
import FurnitureDetailsTab from "@/components/shopDetails/FurnitureDetailsTab";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import React from "react";

import { toPublicUrl } from "@/lib/image-helpers";

export const revalidate = 3600; // Cache for 1 hour

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getSet(id);
  
  if (!product) return { title: "Takım Bulunamadı" };

  return {
    title: `${product.title} | Hazar Home`,
    description: `${product.title} - ${product.description || 'Şık ve modern mobilya takımı.'} En uygun fiyatlarla Hazar Home'da.`,
    openGraph: {
      images: [toPublicUrl(product.imgSrc)],
    },
  };
}

async function getSet(id) {
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

    return {
      ...product,
      id: product.setId,
      title: product.setName,
      imgSrc: product.furnitureSetImages?.[0]?.image?.filePath,
      images: product.furnitureSetImages.map(img => ({
        image: {
          filePath: img.image?.filePath,
          altText: img.image?.altText || product.setName,
          width: img.image?.width,
          height: img.image?.height
        }
      })),
      categorySlug: product.category?.categoryName?.toLowerCase() || 'furniture-set',
      setItems: product.furnitureSetItems.map(item => ({
        id: item.furnitureId,
        name: item.furniture?.furnitureName,
        quantity: item.quantity,
        image: toPublicUrl(item.furniture?.images?.[0]?.image?.filePath)
      }))
    };
  } catch (error) {
    console.error('Error fetching set:', error);
    return null;
  }
}

export default async function page({ params }) {
  const { id } = await params;
  const product = await getSet(id);
  
  if (!product) {
    notFound();
  }

  // Ensure type is set for tabs
  const productWithStatus = { ...product, type: 'furniture_set' };

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
      "url": `https://hazarhome.com/product-detail-furniture-set/${product.id}`,
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header2 />
      <FurnitureSetDetailsPopup product={productWithStatus} />
      <FurnitureDetailsTab product={productWithStatus} />
      <Products />
      <Footer1 />
    </>
  );
}