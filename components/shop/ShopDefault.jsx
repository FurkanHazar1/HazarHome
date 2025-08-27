"use client";
import { layouts } from "@/data/shop";
import { categorySlugToId, getCategoryBySlug } from "@/lib/category-mapping";
import ProductGrid from "./ProductGrid";
import { useState, useEffect } from "react";
import Pagination from "../common/Pagination";
import ShopFilter from "./ShopFilter";
import Sorting from "./Sorting";
import Subcollections from "./Subcollections";

// API'den ürünleri çek
async function fetchProducts(categorySlug = null, subCategorySlug = null) {
  try {
    const params = new URLSearchParams();
    
    if (subCategorySlug) {
      const subCategoryId = categorySlugToId(subCategorySlug);
      if (subCategoryId) {
        params.append('subCategory', subCategoryId.toString());
      }
    } else if (categorySlug) {
      const categoryId = categorySlugToId(categorySlug);
      if (categoryId) {
        params.append('category', categoryId.toString());
      }
    }
    
    params.append('active', 'true');
    params.append('limit', '100');
    params.append('includeDetails', 'true');
    
    const response = await fetch(`/api/products?${params.toString()}`);
    
    if (!response.ok) {
      console.error('API response not OK:', response.status);
      return [];
    }
    
    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default function ShopDefault({ category = null, subCategory = null, categories = null }) {
  const [gridItems, setGridItems] = useState(4);
  const [products, setProducts] = useState([]);
  const [finalSorted, setFinalSorted] = useState([]);
  const [loading, setLoading] = useState(true);

  // Kategori veya alt kategoriye göre ürünleri API'den çek
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      
      const fetchedProducts = await fetchProducts(category, subCategory);
      
      console.log('Fetched products for category:', category, 'subCategory:', subCategory, 'products:', fetchedProducts.length);
      setProducts(fetchedProducts);
      setFinalSorted(fetchedProducts);
      setLoading(false);
    }

    loadProducts();
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
            {loading ? (
              <div className="text-center py-5">
                <p>Ürünler yükleniyor...</p>
              </div>
            ) : (
              <ProductGrid allproducts={finalSorted} gridItems={gridItems} />
            )}
            {/* pagination */}
            {!loading && finalSorted.length ? (
              <ul className="tf-pagination-wrap tf-pagination-list tf-pagination-btn">
                <Pagination />
              </ul>
            ) : !loading && (
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
