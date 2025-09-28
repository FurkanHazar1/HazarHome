
"use client";
import React, { useEffect, useState } from "react";


// Lookbook dropdown taşma önleyici stil
const lookbookDropdownMenuStyle = {
  position: "absolute",
  left: "50%",
  top: "100%",
  transform: "translateX(-50%)",
  maxWidth: "100%",
  overflowWrap: "break-word",
  zIndex: 9999,
};
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import LookbookComponent from "@/components/common/LookbookComponent";
import { lookbookProducts } from "@/data/products";
import { Navigation, Pagination } from "swiper/modules";
export default function Lookbook() {
  // Responsive image style state
  const [imageStyle, setImageStyle] = useState({
    width: '100vw',
    height: '100vh',
    objectFit: 'cover',
    objectPosition: 'center',
  });

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= 768) {
        setImageStyle({
          width: '100%',
          height: '60vw',
          objectFit: 'cover',
          objectPosition: 'center',
        });
      } else {
        setImageStyle({
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          objectPosition: 'center',
        });
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return (
    <section className="flat-spacing-27 pb-0">
      <div className="flat-title wow fadeInUp" data-wow-delay="0s">
        <span className="title">Evinizi Güzelleştirin</span>
      </div>
      <div className="hover-sw-nav view-default">
        <Swiper
          dir="ltr"
          className="swiper tf-sw-lookbook slideshow-lookbook-furniture"
          slidesPerView={1.4} // Mapping data-preview to slidesPerView
          spaceBetween={15} // Mapping data-space-md to spaceBetween
          breakpoints={{
            768: {
              // Mapping for tablet view
              slidesPerView: 1.4, // Mapping data-tablet to slidesPerView
              spaceBetween: 30, // Mapping data-space-lg to spaceBetween
            },
            1024: {
              // Mapping for larger screens
              slidesPerView: 1.4, // Same as data-preview for large screens
              spaceBetween: 30, // Mapping data-space-lg to spaceBetween
            },
          }}
          modules={[Navigation, Pagination]}
          navigation={{
            prevEl: ".snbp164",
            nextEl: ".snbn164",
          }}
          pagination={{ clickable: true, el: ".spd164" }}
        >
          <SwiperSlide className="swiper-slide">
            <div className="wrap-lookbook lookbook-1">
              <div className="image" style={{ overflow: "hidden" }}>
                <Image
                  className="lazyload"
                  data-src="/uploads/images/furniture-sets/yatak-odasi/4/image_1.jpg"
                  alt="image-lookbook"
                  src="/uploads/images/furniture-sets/yatak-odasi/4/image_1.jpg"
                  width={2153}
                  height={1059}
                  style={imageStyle}
                />
              </div>
              <div className="lookbook-item item-1">
                <div className="inner">
                  <div className="btn-group dropdown dropup dropdown-center">
                    <button
                      className="tf-pin-btn"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <span />
                    </button>
                    <ul className="dropdown-menu p-0 border-0" style={lookbookDropdownMenuStyle}>
                      <LookbookComponent product={lookbookProducts[0]} />
                    </ul>
                  </div>
                </div>
              </div>
              <div className="lookbook-item item-2">
                <div className="inner">
                  <div className="btn-group dropdown dropup dropdown-center">
                    <button
                      className="tf-pin-btn"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <span />
                    </button>
                    <ul className="dropdown-menu p-0 border-0" style={lookbookDropdownMenuStyle}>
                      <LookbookComponent product={lookbookProducts[1]} />
                    </ul>
                  </div>
                </div>
              </div>
              <div className="lookbook-item item-3">
                <div className="inner">
                  <div className="btn-group dropdown dropup dropdown-center">
                    <button
                      className="tf-pin-btn"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <span />
                    </button>
                    <ul className="dropdown-menu p-0 border-0" style={lookbookDropdownMenuStyle}>
                      <LookbookComponent product={lookbookProducts[2]} />
                    </ul>
                  </div>
                </div>
              </div>
              <div className="lookbook-item item-4">
                <div className="inner">
                  <div className="btn-group dropdown dropup dropdown-center">
                    <button
                      className="tf-pin-btn"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <span />
                    </button>
                    <ul className="dropdown-menu p-0 border-0" style={lookbookDropdownMenuStyle}>
                      <LookbookComponent product={lookbookProducts[3]} />
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide className="swiper-slide">
            <div className="wrap-lookbook lookbook-2">
              <div className="image" style={{ overflow: "hidden" }}>
                <Image
                  className="lazyload"
                  data-src="/uploads/images/furniture-sets/oturma-odasi/21/image_1.jpg"
                  alt="image-lookbook"
                  src="/uploads/images/furniture-sets/oturma-odasi/21/image_1.jpg"
                  width={2153}
                  height={1059}
                  style={imageStyle}
                />
              </div>
              <div className="lookbook-item item-1">
                <div className="inner">
                  <div className="btn-group dropdown dropup dropdown-center">
                    <button
                      className="tf-pin-btn"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <span />
                    </button>
                    <ul className="dropdown-menu p-0 border-0" style={lookbookDropdownMenuStyle}>
                      <LookbookComponent product={lookbookProducts[8]} />
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide className="swiper-slide">
            <div className="wrap-lookbook lookbook-3">
              <div className="image" style={{ overflow: "hidden" }}>
                <Image
                  className="lazyload"
                  data-src="/uploads/images/furniture-sets/yemek-odasi/5/image_1.jpg"
                  alt="image-lookbook"
                  src="/uploads/images/furniture-sets/yemek-odasi/5/image_1.jpg"
                  width={1435}
                  height={706}
                  style={imageStyle}
                />
              </div>
              <div className="lookbook-item item-1">
                <div className="inner">
                  <div className="btn-group dropdown dropup dropdown-center">
                    <button
                      className="tf-pin-btn"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <span />
                    </button>
                    <ul className="dropdown-menu p-0 border-0" style={lookbookDropdownMenuStyle}>
                      <LookbookComponent product={lookbookProducts[9]} />
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>

          <div className="nav-sw style-2 nav-next-slider nav-next-lookbook box-icon w_46 round snbp164">
            <span className="icon icon-arrow-left" />
          </div>
          <div className="nav-sw style-2 nav-prev-slider nav-prev-lookbook box-icon w_46 round snbn164">
            <span className="icon icon-arrow-right" />
          </div>
          <div className="wrap-pagination">
            <div className="container-full">
              <div className="sw-dots sw-pagination-lookbook justify-content-center spd164" />
            </div>
          </div>
        </Swiper>
      </div>
    </section>
  );
}
