"use client";

import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { ProductCard } from "../shopCards/ProductCard";
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
      <section className="flat-spacing-1 pt_0">
        <div className="container">
          <div className="flat-title">
            <span className="title">İnsanlar Bunları da Satın Aldı</span>
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
      <section className="flat-spacing-1 pt_0">
        <div className="container">
          <div className="flat-title">
            <span className="title">İnsanlar Bunları da Satın Aldı</span>
          </div>
          <div className="text-center py-5">
            <p>Şu anda gösterilecek ürün bulunmuyor.</p>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="flat-spacing-1 pt_0">
      <div className="container">
        <div className="flat-title">
          <span className="title">İnsanlar Bunları da Satın Aldı</span>
        </div>
        <div className="hover-sw-nav hover-sw-2">
          <Swiper
            dir="ltr"
            className="swiper tf-sw-product-sell wrap-sw-over"
            slidesPerView={4} // Equivalent to data-preview={4}
            spaceBetween={30} // Equivalent to data-space-lg={30}
            breakpoints={{
              1024: {
                slidesPerView: 4, // Equivalent to data-tablet={3}
              },
              640: {
                slidesPerView: 3, // Equivalent to data-tablet={3}
              },
              0: {
                slidesPerView: 2, // Equivalent to data-mobile={2}
                spaceBetween: 15, // Equivalent to data-space-md={15}
              },
            }}
            modules={[Navigation, Pagination]}
            navigation={{
              prevEl: ".snbp3070",
              nextEl: ".snbn3070",
            }}
            pagination={{ clickable: true, el: ".spd307" }}
          >
            {products.map((product, i) => (
              <SwiperSlide key={product.id || i} className="swiper-slide">
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="nav-sw nav-next-slider nav-next-product box-icon w_46 round snbp3070">
            <span className="icon icon-arrow-left" />
          </div>
          <div className="nav-sw nav-prev-slider nav-prev-product box-icon w_46 round snbn3070">
            <span className="icon icon-arrow-right" />
          </div>
          <div className="sw-dots style-2 sw-pagination-product justify-content-center spd307" />
        </div>
      </div>
    </section>
  );
}
