"use client";

import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { ProductCard } from "@/components/shopCards/ProductCard";
import Link from "next/link";
import { Navigation, Pagination } from "swiper/modules";

// API'den rastgele ürünleri çek
async function fetchRandomProducts() {
  try {
    const response = await fetch('/api/products?random=true&limit=8&active=true&includeDetails=true');
    if (!response.ok) {
      console.error('API response not OK:', response.status);
      return [];
    }
    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Error fetching random products:', error);
    return [];
  }
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const randomProducts = await fetchRandomProducts();
      setProducts(randomProducts);
      setLoading(false);
    }

    loadProducts();
  }, []);
  if (loading) {
    return (
      <section className="flat-spacing-12 has-line-bottom">
        <div className="container">
          <div className="flat-title wow fadeInUp" data-wow-delay="0s">
            <span className="title">Trending now</span>
          </div>
          <div className="text-center py-5">
            <p>Ürünler yükleniyor...</p>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="flat-spacing-12 has-line-bottom">
        <div className="container">
          <div className="flat-title wow fadeInUp" data-wow-delay="0s">
            <span className="title">Trending now</span>
          </div>
          <div className="text-center py-5">
            <p>Şu anda gösterilecek ürün bulunmuyor.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flat-spacing-12 has-line-bottom">
      <div className="container">
        <div className="flat-title wow fadeInUp" data-wow-delay="0s">
          <span className="title">Trending now</span>
          <div className="d-flex gap-16 align-items-center box-pagi-arr">
            <div className="nav-sw-arrow nav-next-slider nav-next-product snbp166">
              <span className="icon icon-arrow1-left" />
            </div>
            <Link
              href={`/product-style-05`}
              className="tf-btn btn-line fs-12 fw-6"
            >
              VIEW ALL
            </Link>
            <div className="nav-sw-arrow nav-prev-slider nav-prev-product snbn166">
              <span className="icon icon-arrow1-right" />
            </div>
          </div>
        </div>
        <div className="hover-sw-nav hover-sw-2">
          <Swiper
            dir="ltr"
            spaceBetween={30}
            breakpoints={{
              1200: {
                slidesPerView: 4,
              },
              992: {
                slidesPerView: 4,
              },
              768: {
                slidesPerView: 3,
              },
              0: {
                slidesPerView: 1,
              },
            }}
            className="swiper tf-sw-product-sell wrap-sw-over"
            modules={[Navigation, Pagination]}
            navigation={{
              prevEl: ".snbp166",
              nextEl: ".snbn166",
            }}
            pagination={{ clickable: true, el: ".spd166" }}
          >
            {products.map((product, index) => (
              <SwiperSlide className="swiper-slide" key={`${product.type}-${product.id}-${index}`}>
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="nav-sw nav-next-slider nav-next-product box-icon w_46 round snbp166">
            <span className="icon icon-arrow-left" />
          </div>
          <div className="nav-sw nav-prev-slider nav-prev-product box-icon w_46 round snbn166">
            <span className="icon icon-arrow-right" />
          </div>
        </div>
      </div>
    </section>
  );
}