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

export const metadata = {
  title: "Hazar Home || Ferahlığın Anahtarı",
  description: "Hazar Home - Kaliteli Mobilya ve Ev Dekorasyonu Ürünleri",
};

// Data Fetching Functions
async function getHeroSlides() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/hero?activeOnly=true`, { 
    next: { revalidate: 3600, tags: ['hero-slides'] } 
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data.data || []);
}

async function getLookbookFeatures() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/features?active=true`, { 
    next: { revalidate: 3600, tags: ['features'] } 
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data.data || []);
}

async function getRandomProducts() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/products?random=true&limit=8&active=true&includeDetails=true`, { 
    next: { revalidate: 3600, tags: ['products'] } 
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.success ? data.data : [];
}

export default async function page() {
  // Paralel veri çekme (Hız için)
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