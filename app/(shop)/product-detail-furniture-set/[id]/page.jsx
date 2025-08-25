import Footer1 from "@/components/footers/Footer1";
import Header2 from "@/components/headers/Header4";
import Products from "@/components/shopDetails/Products";
import RecentProducts from "@/components/shopDetails/RecentProducts";
import FurnitureDetailsTab from "@/components/shopDetails/FurnitureDetailsTab";
import React from "react";
import Link from "next/link";
import FurnitureSetDetailsPopup from "@/components/shopDetails/FurnitureSetDetailsPopup";
export const metadata = {
  title:
    "Furniture Set Detail || HazarHome - Mobilya ve Ev Dekorasyonu",
  description: "HazarHome - Kaliteli Mobilya ve Ev Dekorasyonu Takımları",
};
import { testFurnitureProducts } from "@/data/products";
import ProductSinglePrevNext from "@/components/common/ProductSinglePrevNext";
export default async function page({ params }) {const { id } = await params
  const product =
    testFurnitureProducts.filter((elm) => elm.id == id && elm.type === "furniture_set")[0] || 
    testFurnitureProducts.find(p => p.type === "furniture_set");
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
              <Link href={`/${product.category}`} className="text">
                {product.category}
              </Link>
              <i className="icon icon-arrow-right" />
              <span className="text">{product.title}</span>
            </div>
            <ProductSinglePrevNext currentId={product.id} />
          </div>
        </div>
      </div>
      <FurnitureSetDetailsPopup product={product} />
      <FurnitureDetailsTab product={product} />
      <Products />
      <RecentProducts />
      <Footer1 />
    </>
  );
}
