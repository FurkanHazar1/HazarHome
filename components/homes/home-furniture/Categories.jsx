"use client";
import Link from "next/link";
import { mainCategories } from "@/data/menu";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import { Pagination } from "swiper/modules";
export default function Categories() {
  return (
    <section className="flat-spacing-15 bg_beige-3 flat-control-sw">
      <div className="container">
        <div className="flat-title flex-row justify-content-between px-0">
          <span className="title wow fadeInUp" data-wow-delay="0s">
            Shop by categories
          </span>
          <div className="box-sw-navigation">
            <div className="sw-dots style-2 medium sw-pagination-collection justify-content-center spd163" />
          </div>
        </div>
      </div>
      <div className="container-full slider-layout-right">
        <Swiper
          dir="ltr"
          className="swiper tf-sw-collection sw-wrapper-right"
          slidesPerView={"auto"}
          spaceBetween={15}
          breakpoints={{
            0: {
              slidesPerView: 2.5,
              spaceBetween: 30,
            },
            768: {
              slidesPerView: 4.5,
              spaceBetween: 30,
            },
            1024: {
              slidesPerView: 4.5,
              spaceBetween: 30,
            },
          }}
          loop={false}
          autoplay={false}
          modules={[Pagination]}
          pagination={{ clickable: true, el: ".spd163" }}
        >
          <div className="swiper-wrapper">
            {mainCategories.map((item, index) => (
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
                        width={674}
                        height={942}
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
      </div>
    </section>
  );
}
