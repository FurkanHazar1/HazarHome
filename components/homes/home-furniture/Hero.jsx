"use client";
import Link from "next/link";
import { sliderData2 } from "@/data/heroslides";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import { Pagination } from "swiper/modules";
export default function Hero() {
  return (
    <section className="tf-slideshow slideshow-effect slider-effect-fade style-padding position-relative">
      <Swiper
        dir="ltr"
        modules={[Pagination]}
        pagination={{ clickable: true, el: ".spd164" }}
        className="swiper tf-sw-effect"
      >
        {sliderData2.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className={`slider-effect wrap-slider `}>
              <div className={`content-left  ${slide.backgroundColor}`}>
                <div className="container">
                  <div className="row">
                    <div className="col-md-6 col-12">
                      <div className="box-content">
                        <h1
                          className={`heading fade-item fade-item-${index + 1}`}
                        >
                          {slide.heading.split("\n")[0]}
                          <br />
                          {slide.heading.split("\n")[1]}
                        </h1>
                        <p className={`desc fade-item fade-item-${index + 2}`}>
                          {slide.description}
                        </p>
                        <Link
                          href={`/shop-collection-list`} // Direct link added here
                          className={`fade-item fade-item-${
                            index + 3
                          } tf-btn btn-light-icon animate-hover-btn btn-xl radius-3`}
                        >
                          <span>Mobilyaları İncele</span>
                          <i className="icon icon-arrow-right" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="img-slider" style={{
                height: '500px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Image
                  className="lazyload hero-image-fixed"
                  data-src={slide.imgSrc}
                  alt={slide.altText}
                  src={slide.imgSrc}
                  width={1890}
                  height={1580}
                  priority
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="wrap-pagination">
        <div className="container">
          <div className="sw-dots sw-pagination-slider spd164" />
        </div>
      </div>
    </section>
  );
}
