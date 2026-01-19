import Footer1 from "@/components/footers/Footer1";
import Header4 from "@/components/headers/Header4";
import Features from "@/components/homes/home-6/Features";
import Announcment from "@/components/homes/home-furniture/Announcment";
import Banner from "@/components/homes/home-furniture/Banner";
import Categories from "@/components/homes/home-furniture/Categories";
import Collection from "@/components/homes/home-furniture/Collection";
import Hero from "@/components/homes/home-furniture/Hero";
import Lookbook from "@/components/homes/home-furniture/Lookbook";
import Products from "@/components/homes/home-furniture/Products";
import ShopGram from "@/components/homes/home-furniture/ShopGram";
import React from "react";
import { prisma } from "@/lib/prisma";
import { toPublicUrl } from "@/lib/image-utils";

export const metadata = {
  title: "Hazar Home || Ferahlığın Anahtarı",
  description: "Hazar Home - Kaliteli Mobilya ve Ev Dekorasyonu Ürünleri",
};

// Data Fetching Functions using direct DB access to prevent build-time fetch errors
async function getHeroSlides() {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return slides.map(slide => ({
      ...slide,
      imageUrl: toPublicUrl(slide.imageUrl)
    }));
  } catch (error) {
    console.error("Direct DB fetch failed for hero slides:", error);
    return [];
  }
}

async function getLookbookFeatures() {
  try {
    const features = await prisma.feature.findMany({
      where: { isActive: true },
      include: {
        image: true,
        pins: {
          include: {
            furniture: {
              include: {
                images: { where: { imageType: 'main' }, include: { image: true } }
              }
            },
            furnitureSet: {
              include: {
                furnitureSetImages: { where: { imageType: 'main' }, include: { image: true } }
              }
            }
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    return features.map(feature => ({
      ...feature,
      image: feature.image ? { ...feature.image, url: toPublicUrl(feature.image.filePath) } : null,
      pins: feature.pins.map(pin => ({
        ...pin,
        furniture: pin.furniture ? {
          ...pin.furniture,
          images: pin.furniture.images.map(fi => ({
            ...fi,
            image: { ...fi.image, url: toPublicUrl(fi.image.filePath) }
          }))
        } : null,
        furnitureSet: pin.furnitureSet ? {
          ...pin.furnitureSet,
          furnitureSetImages: pin.furnitureSet.furnitureSetImages.map(fsi => ({
            ...fsi,
            image: { ...fsi.image, url: toPublicUrl(fsi.image.filePath) }
          }))
        } : null
      }))
    }));
  } catch (error) {
    console.error("Direct DB fetch failed for features:", error);
    return [];
  }
}

async function getRandomProducts() {
  try {
    // Get random active furniture
    const furnitures = await prisma.furniture.findMany({
      where: { isActive: true },
      include: {
        images: { where: { isActive: true }, include: { image: true }, orderBy: { sortOrder: 'asc' } },
        category: true
      },
      take: 20 // Fetch more to randomize in JS
    });

    // Transform to match component expectations
    const formatted = furnitures.map(product => {
      const mainImage = product.images.find(img => img.sortOrder === 1)?.image?.filePath || product.images[0]?.image?.filePath;
      const hoverImage = product.images.find(img => img.sortOrder === 2)?.image?.filePath || mainImage;

      return {
        ...product,
        id: product.furnitureId,
        title: product.furnitureName,
        imgSrc: mainImage,
        imgHoverSrc: hoverImage,
        type: 'furniture'
      };
    });

    return formatted.sort(() => 0.5 - Math.random()).slice(0, 8);
  } catch (error) {
    console.error("Direct DB fetch failed for random products:", error);
    return [];
  }
}

export default async function page() {
  // Parallel data fetching on the server
  const [slides, featuresData, products] = await Promise.all([
    getHeroSlides(),
    getLookbookFeatures(),
    getRandomProducts()
  ]);

  return (
    <>
      <div className="color-primary-2">
        <Announcment />
        <Header4 />
        <Hero slides={slides} />
        <Collection />
        <Categories />
        <Banner />
        <Products products={products} />
        <Lookbook features={featuresData} />
        <ShopGram />
        <Footer1 bgColor="background-gray" />
      </div>
    </>
  );
}
