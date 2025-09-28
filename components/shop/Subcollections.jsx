"use client";

import { collectionSlides2 } from "@/data/categories";
import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import Image from "next/image";
import { Navigation, Pagination } from "swiper/modules";

export default function Subcollections({ categories = null }) {
  // Eğer categories prop'u verilmişse onu kullan, yoksa default data'yı kullan
  const slideData = categories || collectionSlides2;
  
  return (
    <section className="flat-spacing-3 pb_0">
      <div className="container">
        <div className="hover-sw-nav subcollections-swiper-wrapper" style={{position: 'relative'}}>
          <Swiper
            dir="ltr"
            slidesPerView={5}
            spaceBetween={30}
            breakpoints={{
              1200: { slidesPerView: 5, spaceBetween: 30 },
              1024: { slidesPerView: 4, spaceBetween: 24 },
              768: { slidesPerView: 3, spaceBetween: 18 },
              576: { slidesPerView: 2, spaceBetween: 12 },
              0: { slidesPerView: 1.2, spaceBetween: 8 },
            }}
            loop={false}
            autoplay={false}
            modules={[Navigation, Pagination]}
            navigation={{
              prevEl: ".snbp306",
              nextEl: ".snbn306",
            }}
            pagination={{ clickable: true, el: ".spd306" }}
          >
            {slideData.map((slide, index) => (
              <SwiperSlide key={index}>
                <div className="collection-item style-2 hover-img">
                  <div className="collection-inner">
                    <Link
                      href={slide.href || `/shop-default`}
                      className="collection-image img-style"
                      style={{ 
                        display: 'block',
                        width: '100%',
                        height: '180px',
                        overflow: 'hidden',
                        borderRadius: '8px'
                      }}
                    >
                      <Image
                        className="lazyload"
                        data-src={slide.src || slide.imgSrc}
                        alt={slide.alt}
                        src={slide.src || slide.imgSrc}
                        width={600}
                        height={721}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center'
                        }}
                      />
                    </Link>
                    <div className="collection-content">
                      <Link
                        href={slide.href || `/shop-default`}
                        className="tf-btn collection-title hover-icon fs-14"
                        style={{ 
                          fontSize: '13px', 
                          padding: '8px 12px',
                          minHeight: 'auto',
                          lineHeight: '1.2'
                        }}
                      >
                        <span>{slide.name || slide.title}</span>
                        <i className="icon icon-arrow1-top-left" style={{ fontSize: '12px' }} />
                      </Link>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          {/* Swiper navigation buttons, centered vertically over images */}
          <div
            className="nav-sw nav-next-slider nav-next-collection box-icon w_46 round snbp306 subcollections-swiper-btn"
            style={{
              position: 'absolute',
              top: '50%',
              left: '12px',
              transform: 'translateY(-50%)',
              zIndex: 10,
              background: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              opacity: 0.92,
              transition: 'opacity 0.2s',
            }}
          >
            <span className="icon icon-arrow-left" />
          </div>
          <div
            className="nav-sw nav-prev-slider nav-prev-collection box-icon w_46 round snbn306 subcollections-swiper-btn"
            style={{
              position: 'absolute',
              top: '50%',
              right: '12px',
              transform: 'translateY(-50%)',
              zIndex: 10,
              background: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              opacity: 0.92,
              transition: 'opacity 0.2s',
            }}
          >
            <span className="icon icon-arrow-right" />
          </div>
          <div className="sw-dots style-2 sw-pagination-collection justify-content-center spd306" />
          {/* Responsive styles for navigation buttons */}
          <style jsx>{`
            @media (max-width: 1024px) {
              .subcollections-swiper-btn {
                width: 34px !important;
                height: 34px !important;
              }
              .snbp306 { left: 4px !important; right: auto !important; }
              .snbn306 { right: 4px !important; left: auto !important; }
            }
            @media (max-width: 768px) {
              .subcollections-swiper-btn {
                width: 28px !important;
                height: 28px !important;
              }
              .snbp306 { left: 0 !important; right: auto !important; }
              .snbn306 { right: 0 !important; left: auto !important; }
            }
            @media (max-width: 576px) {
              .subcollections-swiper-btn {
                width: 22px !important;
                height: 22px !important;
              }
              .snbp306 { left: 0 !important; right: auto !important; }
              .snbn306 { right: 0 !important; left: auto !important; }
            }
          `}</style>
        </div>
      </div>
    </section>
  );
}
