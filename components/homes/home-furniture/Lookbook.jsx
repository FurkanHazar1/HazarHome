"use client";
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import LookbookComponent from "@/components/common/LookbookComponent";
import { Navigation, Pagination } from "swiper/modules";
import { toPublicUrl } from "@/lib/image-helpers";



export default function Lookbook() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/features?active=true')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFeatures(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load lookbook features', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="min-h-[500px] flex items-center justify-center">Yükleniyor...</div>;
  }

  if (features.length === 0) {
    return null; // Don't show anything if no lookbooks
  }

  return (
    <section className="flat-spacing-27 pb-0">
      <div className="flat-title wow fadeInUp" data-wow-delay="0s">
        <span className="title">Evinizi Güzelleştirin</span>
      </div>
      <div className="hover-sw-nav view-default">
        <Swiper
          dir="ltr"
          className="swiper tf-sw-lookbook slideshow-lookbook-furniture"
          slidesPerView={'auto'}
          spaceBetween={20}
          breakpoints={{
            768: {
              slidesPerView: 'auto',
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 'auto',
              spaceBetween: 20,
            },
          }}
          modules={[Navigation, Pagination]}
          navigation={{
            prevEl: ".snbp164",
            nextEl: ".snbn164",
          }}
          pagination={{ clickable: true, el: ".spd164" }}
        >
          {features.map((feature, index) => (
            <SwiperSlide key={feature.featureId || index} className="swiper-slide" style={{ width: 'auto' }}>
              <div className={`wrap-lookbook lookbook-${(index % 2) + 1}`} style={{ width: 'auto' }}>
                <div className="image" style={{ position: 'relative', width: 'fit-content' }}>
                  <Image
                    className="lookbook-main-img"
                    alt={feature.title || "Lookbook"}
                    src={feature.image?.filePath ? toPublicUrl(feature.image.filePath) : '/images/slider/slider-1.jpg'}
                    width={feature.image?.width || 2153}
                    height={feature.image?.height || 1059}
                    priority={index === 0}
                    style={{ width: 'auto', height: 'var(--lookbook-img-height, 70vh)', display: 'block', maxWidth: 'none' }}
                  />
                  
                  {/* Pins */}
                  {feature.pins?.map((pin, pinIndex) => {
                    // Determine product data
                    let productData = null;
                    if (pin.furniture) {
                      productData = {
                        href: `/product-detail-furniture/${pin.furniture.furnitureId}`,
                        imgSrc: toPublicUrl(pin.furniture.images?.[0]?.image?.filePath) || '/images/products/furniture_1.jpg',
                        title: pin.furniture.furnitureName,
                        price: Number(pin.furniture.price),
                        width: 600,
                        height: 600
                      };
                    } else if (pin.furnitureSet) {
                      productData = {
                        href: `/product-detail-furniture-set/${pin.furnitureSet.setId}`,
                        imgSrc: toPublicUrl(pin.furnitureSet.furnitureSetImages?.[0]?.image?.filePath) || '/images/products/furniture_1.jpg',
                        title: pin.furnitureSet.setName,
                        price: Number(pin.furnitureSet.price),
                        width: 600,
                        height: 600
                      };
                    }

                    if (!productData) return null;

                    const isNearTop = pin.yPosition < 30;
                    const isLeft = pin.xPosition < 50;
                    const dropdownStyle = {
                      position: "absolute",
                      // Smart positioning to prevent overflow
                      left: isLeft ? '0' : 'auto',
                      right: isLeft ? 'auto' : '0',
                      transform: 'none',
                      minWidth: '280px', // Ensure enough width
                      width: 'max-content',
                      maxWidth: '90vw',
                      zIndex: 9999,
                      margin: isNearTop ? '10px 0' : '0 0 10px 0'
                    };

                    return (
                      <div 
                        key={pinIndex} 
                        className="lookbook-item"
                        style={{
                            top: `${pin.yPosition}%`,
                            left: `${pin.xPosition}%`,
                            position: 'absolute',
                            transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div className="inner">
                          <div className={`btn-group dropdown ${isNearTop ? '' : 'dropup'}`}>
                            <button
                              className="tf-pin-btn"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              <span />
                            </button>
                            <ul className="dropdown-menu p-0 border-0" style={dropdownStyle}>
                              <LookbookComponent product={productData} className={isNearTop ? "position-top" : ""} />
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SwiperSlide>
          ))}

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