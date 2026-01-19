import Footer1 from "@/components/footers/Footer1";
import Header2 from "@/components/headers/Header4";
import Products from "@/components/shopDetails/Products";
import FurnitureSetDetailsPopup from "@/components/shopDetails/FurnitureSetDetailsPopup";
import FurnitureSetDetailsTab from "@/components/shopDetails/FurnitureSetDetailsTab";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import React from "react";

export const revalidate = 3600; // Cache for 1 hour

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
      categorySlug: product.category?.categoryName?.toLowerCase() || 'furniture-set',
      setItems: product.furnitureSetItems.map(item => ({
        id: item.furnitureId,
        name: item.furniture?.furnitureName,
        quantity: item.quantity,
        image: item.furniture?.images?.[0]?.image?.filePath
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

  return (
    <>
      <Header2 />
      <FurnitureSetDetailsPopup product={product} />
      <FurnitureSetDetailsTab product={product} />
      <Products />
      <Footer1 />
    </>
  );
}