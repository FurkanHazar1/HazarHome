"use client";

import { galleryItems } from "@/data/productGallery";

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
            768: { slidesPerView: 5 }, // data-tablet
            576: { slidesPerView: 3 }, // data-mobile
            0: { slidesPerView: 2 }, // data-mobile
          }}
          spaceBetween={0} // data-space-lg
          //   pagination={{clickable:true, clickable: true }} // for pagination
          //   modules={[Pagination]}
        >
          {galleryItems.map((item, index) => (
            <SwiperSlide key={index}>
              <Link  href={item.href}>
              <div
                className="gallery-item hover-img rounded-0 wow fadeInUp"
                data-wow-delay={item.delay}
              >
               
                <div style={shopgramStyle}>
                  <Image
                    className="lazyload img-hover"
                    data-src={item.src}
                    alt={item.alt}
                    src={item.src}
                    width={500}
                    height={500}
                    style={shopgramImgStyle}
                  />
                </div>
              
              </div>
               </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
