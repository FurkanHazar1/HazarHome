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

export const metadata = {
  title:
    "Furniture Set Detail || HazarHome - Mobilya ve Ev Dekorasyonu",
  description: "HazarHome - Kaliteli Mobilya ve Ev Dekorasyonu Takımları",
};

import ProductSinglePrevNext from "@/components/common/ProductSinglePrevNext";

// API'den ürün verisini çek
async function getProduct(id) {
  try {
    // Önce furniture_set olarak dene
    let response = await fetch(`http://localhost:3000/api/products/${id}?type=furniture_set&includeInactive=false&groupImagesByType=true`, {
      cache: 'no-store'
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
    }
    
    // Furniture_set bulunamazsa, furniture olarak dene (özellikle "Takım" türündeki)
    response = await fetch(`http://localhost:3000/api/products/${id}?type=furniture&includeInactive=false&groupImagesByType=true`, {
      cache: 'no-store'
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data && result.data.furnitureType === "Takım") {
        return result.data;
      }
    }
    
    return null;
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
            <ProductSinglePrevNext currentId={product.id} />
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
