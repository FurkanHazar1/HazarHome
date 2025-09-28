"use client";
import Link from "next/link";
import { subCategories } from "@/data/menu";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import { Pagination, Navigation } from "swiper/modules";
export default function Categories() {
  return (
    <>
      <style jsx>{`
        .responsive-category-btn {
          font-size: 9px !important;
          padding: 10px 25px !important;
        }
        
        @media (max-width: 768px) {
          .responsive-category-btn {
                        <Image
                          className="lazyload category-img"
                          data-src={item.src}
                          alt={item.alt}
                          src={item.src}
                          width={1200}
                          height={900}
                          style={{ width: '100%', height: 'auto', aspectRatio: '4/3', objectFit: 'cover', objectPosition: 'center', maxHeight: '340px' }}
                        />
          }
        }
      `}</style>
        <style jsx>{`
          .responsive-category-btn {
            font-size: 9px !important;
            padding: 10px 25px !important;
          }
          .category-img {
            max-height: 340px;
            min-height: 180px;
          }
          @media (max-width: 1024px) {
            .category-img {
              max-height: 260px;
              min-height: 120px;
            }
          }
          @media (max-width: 768px) {
            .responsive-category-btn {
              font-size: 8px !important;
              padding: 8px 18px !important;
            }
            .category-img {
              max-height: 340px;
              min-height: 220px;
            }
          }
          @media (max-width: 480px) {
            .responsive-category-btn {
              font-size: 7px !important;
              padding: 6px 15px !important;
            }
            .category-img {
              max-height: 280px;
              min-height: 180px;
            }
          }
        `}</style>
      <section className="flat-spacing-15 bg_beige-3 flat-control-sw">
      <div className="container">
        <div className="flat-title flex-row justify-content-between px-0">
          <span className="title wow fadeInUp" data-wow-delay="0s">
            Mobilyalar
          </span>
          <div className="box-sw-navigation">
            <div className="sw-dots style-2 medium sw-pagination-collection justify-content-center spd163" />
          </div>
        </div>
      </div>
      <div className="container-full slider-layout-right">
        <div className="hover-sw-nav">
          <Swiper
            dir="ltr"
            className="swiper tf-sw-collection sw-wrapper-right"
            slidesPerView={"auto"}
            slidesPerGroup={3}
            spaceBetween={15}
            breakpoints={{
              0: {
                slidesPerView: 1.2, // Mobilde daha büyük görsel için
                spaceBetween: 10,
                slidesPerGroup: 1,
              },
              480: {
                slidesPerView: 1.5,
                spaceBetween: 15,
                slidesPerGroup: 1,
              },
              768: {
                slidesPerView: 3.5,
                spaceBetween: 20,
                slidesPerGroup: 2,
              },
              1024: {
                slidesPerView: 4.5,
                spaceBetween: 30,
                slidesPerGroup: 4,
              },
            }}
            loop={false}
            autoplay={false}
            modules={[Pagination, Navigation]}
            pagination={{ 
              clickable: true, 
              el: ".spd163",
              type: "bullets",
              dynamicBullets: false,
              renderBullet: function (index, className) {
                return '<span class="' + className + '"></span>';
              }
            }}
            navigation={{
              prevEl: ".snbp163",
              nextEl: ".snbn163",
            }}
          >
            <div className="swiper-wrapper">
              {subCategories.map((item, index) => (
                <SwiperSlide key={index}>
                  <div className="collection-item large hover-img">
                    <div className="collection-inner">
                      <div 
                        className="collection-image img-style"
                        style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px' }}
                      >
                        <Image
                          className="lazyload"
                          data-src={item.src}
                          alt={item.alt}
                          src={item.src}
                          width={800}
                          height={600}
                          style={{ width: '100%', height: 'auto', aspectRatio: '4/3', objectFit: 'cover', objectPosition: 'center' }}
                        />
                        <div 
                          className="collection-content"
                          style={{ 
                            position: 'absolute',
                            bottom: '15px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 10,
                            width: '90%',
                            display: 'flex',
                            justifyContent: 'center'
                          }}
                        >
                          <Link
                            href={item.href}
                            className="tf-btn collection-title hover-icon responsive-category-btn"
                            style={{ 
                              justifyContent: 'center', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '5px',
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              padding: '10px 25px',
                              borderRadius: '2px',
                              color: '#333',
                              textDecoration: 'none',
                              fontWeight: '500',
                              fontSize: '12px',
                              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                              transition: 'all 0.3s ease',
                              whiteSpace: 'nowrap',
                              minWidth: 'auto'
                            }}
                          >
                            <span>{item.name}</span>
                            <i className="icon icon-arrow1-top-left" style={{ color: '#000', fontSize: '8px' }} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </div>
          </Swiper>
          <div className="nav-sw nav-next-slider nav-next-collection box-icon w_46 round snbp163">
            <span className="icon icon-arrow-left" />
          </div>
          <div className="nav-sw nav-prev-slider nav-prev-collection box-icon w_46 round snbn163">
            <span className="icon icon-arrow-right" />
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
