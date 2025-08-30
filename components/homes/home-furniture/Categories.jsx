"use client";
import Link from "next/link";
import { subCategories } from "@/data/menu";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import { Pagination, Navigation } from "swiper/modules";
export default function Categories() {
  return (
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
                slidesPerView: 2.5,
                spaceBetween: 30,
                slidesPerGroup: 2,
              },
              768: {
                slidesPerView: 4.5,
                spaceBetween: 30,
                slidesPerGroup: 3,
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
                      <Link
                        href={item.href}
                        className="collection-image img-style"
                      >
                        <Image
                          className="lazyload"
                          data-src={item.src}
                          alt={item.alt}
                          src={item.src}
                          width={300}
                          height={400}
                          style={{ width: '300px', height: '400px', objectFit: 'cover', objectPosition: 'center' }}
                        />
                      </Link>
                      <div className="collection-content">
                        <Link
                          href={item.href}
                          className="tf-btn collection-title hover-icon"
                        >
                          <span>{item.name}</span>
                          <i className="icon icon-arrow1-top-left" />
                        </Link>
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
  );
}
