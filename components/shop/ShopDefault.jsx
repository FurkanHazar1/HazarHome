"use client";
import { layouts } from "@/data/shop";
import { testFurnitureProducts } from "@/data/products";
import { getProductsByCategory, getProductsBySubCategory, getProductsByMainCategory } from "@/utils/categoryHelpers";
import ProductGrid from "./ProductGrid";
import { useState, useEffect } from "react";
import Pagination from "../common/Pagination";
import ShopFilter from "./ShopFilter";
import Sorting from "./Sorting";
import Subcollections from "./Subcollections";

export default function ShopDefault({ category = null, subCategory = null, categories = null }) {
  const [gridItems, setGridItems] = useState(4);
  const [products, setProducts] = useState([]);
  const [finalSorted, setFinalSorted] = useState([]);

  // Kategori veya alt kategoriye göre ürünleri filtrele
  useEffect(() => {
    let filteredProducts = [];

    if (subCategory) {
      // Alt kategori varsa o kategoriye ait ürünleri getir
      filteredProducts = getProductsBySubCategory(subCategory);
    } else if (category) {
      // Ana kategori varsa sadece o ana kategoriye ait ürünleri getir (alt kategorilerden ürünler dahil olmasın)
      filteredProducts = getProductsByCategory(category);
    } else {
      // Hiçbiri yoksa tüm mobilya ürünlerini göster
      filteredProducts = testFurnitureProducts;
    }

    console.log('Filtered products for category:', category, 'subCategory:', subCategory, 'products:', filteredProducts.length);
    setProducts(filteredProducts);
    setFinalSorted(filteredProducts);
  }, [category, subCategory]);

  return (
    <>
      {/* Eğer categories prop'u varsa Subcollections'ı göster */}
      {categories && <Subcollections categories={categories} />}
      
      <section className="flat-spacing-2">
        <div className="container">
          <div className="tf-shop-control grid-3 align-items-center">
            <div className="tf-control-filter">
              <a
                href="#filterShop"
                data-bs-toggle="offcanvas"
                aria-controls="offcanvasLeft"
                className="tf-btn-filter"
              >
                <span className="icon icon-filter" />
                <span className="text">Filter</span>
              </a>
            </div>
            <ul className="tf-control-layout d-flex justify-content-center">
              {layouts.map((layout, index) => (
                <li
                  key={index}
                  className={`tf-view-layout-switch ${layout.className} ${
                    gridItems == layout.dataValueGrid ? "active" : ""
                  }`}
                  onClick={() => setGridItems(layout.dataValueGrid)}
                >
                  <div className="item">
                    <span className={`icon ${layout.iconClass}`} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="tf-control-sorting d-flex justify-content-end">
              <div className="tf-dropdown-sort" data-bs-toggle="dropdown">
                <Sorting setFinalSorted={setFinalSorted} products={products} />
              </div>
            </div>
          </div>
          <div className="wrapper-control-shop">
            <div className="meta-filter-shop" />
            <ProductGrid allproducts={finalSorted} gridItems={gridItems} />
            {/* pagination */}
            {finalSorted.length ? (
              <ul className="tf-pagination-wrap tf-pagination-list tf-pagination-btn">
                <Pagination />
              </ul>
            ) : (
              <div className="text-center py-5">
                <p>Bu kategoride henüz ürün bulunmamaktadır.</p>
              </div>
            )}
          </div>
        </div>
      </section>
      <ShopFilter setProducts={setProducts} initialProducts={products} />
    </>
  );
}
