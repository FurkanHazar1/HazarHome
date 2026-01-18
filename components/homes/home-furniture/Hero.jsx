"use client";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import { Autoplay, EffectFade, Navigation } from "swiper/modules";
import { useState, useEffect } from "react";
import { toPublicUrl } from "@/lib/image-helpers";

export default function Hero({ slides: initialSlides }) {
  const [slides, setSlides] = useState(initialSlides || []);
  const [loading, setLoading] = useState(!initialSlides);

  useEffect(() => {
    if (initialSlides) return; // Don't fetch if we already have data
    const fetchSlides = async () => {
      try {
        const res = await fetch('/api/hero?activeOnly=true');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSlides(data);
        }
      } catch (error) {
        console.error('Failed to fetch hero slides', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
  }, []);

  if (loading) return null; // Or a skeleton loader
  if (slides.length === 0) return null;

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
          speed={300}
          navigation={{
            prevEl: ".snbp-hero",
            nextEl: ".snbn-hero",
          }}
          autoplay={{
            delay: 6000,
            disableOnInteraction: false,
          }}
          loop={slides.length > 1}
          className="swiper tf-sw-effect"
        >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className={`slider-effect wrap-slider `}>
              <div 
                className={`content-left`}
                style={{ 
                  backgroundColor: slide.backgroundColor && (slide.backgroundColor.startsWith('#') || slide.backgroundColor.startsWith('rgb')) 
                    ? slide.backgroundColor 
                    : undefined 
                }}
              >
                <div className={`container ${!slide.backgroundColor?.startsWith('#') && !slide.backgroundColor?.startsWith('rgb') ? slide.backgroundColor : ''}`}>
                  <div className="row">
                    <div className="col-md-6 col-12">
                      <div className="box-content">
                        <h1
                          className={`heading fade-item fade-item-${index + 1}`}
                        >
                          {slide.title}
                        </h1>
                        <p className={`desc fade-item fade-item-${index + 2}`}>
                          {slide.subtitle}
                        </p>
                        <Link
                          href={slide.link}
                          className={`fade-item fade-item-${
                            index + 3
                          } tf-btn btn-light-icon animate-hover-btn btn-xl radius-3`}
                        >
                          <span>{slide.buttonText}</span>
                          <i className="icon icon-arrow-right" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="img-slider" style={{
                height: '100%', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Image
                  className="hero-image-fixed"
                  src={toPublicUrl(slide.imageUrl)}
                  alt={slide.title}
                  width={1200}
                  height={800}
                  priority={index === 0}
                  loading={index === 0 ? undefined : "lazy"}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
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
