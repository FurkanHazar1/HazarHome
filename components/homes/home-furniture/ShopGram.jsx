"use client";

import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import Link from "next/link";

// ShopGram özel stilleri (CSS-in-JS)
const shopgramStyle = {
  width: "100%",
  aspectRatio: "5/4",
  height: "auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};
const shopgramImgStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
  aspectRatio: "5/4",
};

export default function ShopGram() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPopular() {
      try {
        const response = await fetch('/api/products/popular?limit=10');
        const data = await response.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error("Error fetching popular products for ShopGram:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPopular();
  }, []);

  if (loading) return null;
  if (products.length === 0) return null;

  return (
    <section className="pb-0 flat-spacing-18">
      <div className="container-full px-0">
        <div className="flat-title wow fadeInUp" data-wow-delay="0s">
          <span className="title">Popüler Ürünlerimiz</span>
          <p className="sub-title">
            Seveceğiniz ürünlerimizden bazıları.
          </p>
        </div>
        <Swiper
          dir="ltr"
          className="swiper tf-sw-shop-gallery"
          slidesPerView={5}
          breakpoints={{
            1200: { slidesPerView: 5 },
            992: { slidesPerView: 4 },
            768: { slidesPerView: 3 }, // data-tablet
            576: { slidesPerView: 2 }, // data-mobile
            0: { slidesPerView: 2 }, // data-mobile
          }}
          spaceBetween={0} // data-space-lg
        >
          {products.map((item, index) => (
            <SwiperSlide key={`${item.type}-${item.id}`}>
              <Link href={item.type === 'furniture_set' ? `/product-detail-furniture-set/${item.id}` : `/product-detail-furniture/${item.id}`}>
                <div
                  className="gallery-item hover-img rounded-0 wow fadeInUp"
                  data-wow-delay={`${index * 0.1}s`}
                >
                  <div style={shopgramStyle}>
                    <Image
                      className="lazyload img-hover"
                      alt={item.title}
                      src={item.imgSrc}
                      width={500}
                      height={500}
                      style={shopgramImgStyle}
                    />
                  </div>
                  {/* Hover'da ürün adını göstermek isterseniz buraya eklenebilir */}
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
