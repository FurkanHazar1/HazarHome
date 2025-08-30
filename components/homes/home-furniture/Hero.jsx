"use client";
import Link from "next/link";
import { sliderData2 } from "@/data/heroslides";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import { Autoplay, EffectFade, Navigation } from "swiper/modules";
export default function Hero() {
  return (
    <section className="tf-slideshow slideshow-effect slider-effect-fade style-padding position-relative">
      <div className="hover-sw-nav">
        <Swiper
          dir="ltr"
          modules={[Autoplay, EffectFade, Navigation]}
          effect="fade"
          fadeEffect={{
            crossFade: true
          }}
          speed={800}
          navigation={{
            prevEl: ".snbp-hero",
            nextEl: ".snbn-hero",
          }}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
          }}
          loop={true}
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
                          href={slide.src} // Direct link added here
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
                height: '600px',
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
                  width={1000}
                  height={600}
                  priority
                  style={{
                    width: '1000px',
                    height: '600px',
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="nav-sw nav-next-slider nav-next-collection box-icon w_46 round snbp-hero">
        <span className="icon icon-arrow-left" />
      </div>
      <div className="nav-sw nav-prev-slider nav-prev-collection box-icon w_46 round snbn-hero">
        <span className="icon icon-arrow-right" />
      </div>
      </div>
    </section>
  );
}
