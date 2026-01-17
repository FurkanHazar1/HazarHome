"use client";
import { useEffect, useState } from "react";
import { Pagination, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import Link from "next/link";
import { iconBoxData } from "@/data/features"; // Fallback data

export default function Features() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatures() {
      try {
        const res = await fetch("/api/features?active=true");
        if (res.ok) {
          const data = await res.json();
          setFeatures(data);
        }
      } catch (error) {
        console.error("Failed to fetch features", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatures();
  }, []);

  // If no dynamic features, fallback to original IconBox (or return null if strictly replacement requested, but fallback is safer)
  if (!loading && features.length === 0) {
     return (
      <section
        className="flat-spacing-7 flat-iconbox wow fadeInUp"
        data-wow-delay="0s"
      >
        <div className="container">
          <div className="wrap-carousel wrap-mobile">
            <Swiper
              dir="ltr"
              slidesPerView={4}
              spaceBetween={30}
              breakpoints={{
                1200: { slidesPerView: 4 },
                800: { slidesPerView: 3 },
                600: { slidesPerView: 2 },
                0: { slidesPerView: 1 },
              }}
              className="swiper tf-sw-mobile"
              modules={[Pagination]}
              pagination={{ clickable: true, el: ".spd103" }}
            >
              {iconBoxData.map((elm, i) => (
                <SwiperSlide key={i} className="swiper-slide">
                  <div className="tf-icon-box style-border-line text-center">
                    <div className="icon">
                      <i className={elm.iconClass} />
                    </div>
                    <div className="content">
                      <div className="title">{elm.title}</div>
                      <p>{elm.description}</p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            <div className="sw-dots style-2 sw-pagination-mb justify-content-center spd103" />
          </div>
        </div>
      </section>
    );
  }

  if (loading) return null;

  return (
    <section className="flat-spacing-7 flat-lookbook wow fadeInUp" data-wow-delay="0s">
      <div className="container-fluid">
        <div className="lookbook-slider-wrap relative">
          <Swiper
            dir="ltr"
            slidesPerView={1}
            spaceBetween={0}
            className="swiper tf-sw-lookbook h-full"
            modules={[Pagination, Navigation]}
            pagination={{ clickable: true, el: ".spd-lookbook" }}
            navigation={{ nextEl: ".sn-lookbook-next", prevEl: ".sn-lookbook-prev" }}
            loop={features.length > 1}
          >
            {features.map((feature, i) => (
              <SwiperSlide key={feature.featureId} className="swiper-slide">
                <div className="relative w-full h-[500px] md:h-[700px] bg-gray-100 overflow-hidden group">
                  {/* Background Image */}
                  {feature.image && (
                    <Image
                      src={`/${feature.image.filePath}`}
                      alt={feature.title || "Lookbook"}
                      fill
                      className="object-cover w-full h-full"
                      priority={i === 0}
                    />
                  )}
                  
                  {/* Overlay for text legibility if needed, or gradient */}
                  {/* <div className="absolute inset-0 bg-black/10"></div> */}

                  {/* Hotspots */}
                  {feature.pins?.map((pin, pIdx) => {
                    const product = pin.furniture || pin.furnitureSet;
                    if (!product) return null;
                    
                    const linkUrl = pin.furniture 
                      ? `/product-detail/${product.furnitureId}` // Assuming route
                      : `/product-detail-furniture-set/${product.setId}`; // Assuming route

                    const name = pin.furniture ? product.furnitureName : product.setName;
                    const price = product.price;

                    return (
                      <div
                        key={pIdx}
                        className="absolute lookbook-point"
                        style={{ left: `${pin.xPosition}%`, top: `${pin.yPosition}%` }}
                      >
                        <div className="relative group/pin">
                          {/* The Dot */}
                          <div className="w-8 h-8 -ml-4 -mt-4 bg-white rounded-full shadow-lg cursor-pointer flex items-center justify-center animate-pulse-slow hover:animate-none hover:scale-110 transition-transform duration-300 z-10 relative">
                             <div className="w-3 h-3 bg-black rounded-full"></div>
                          </div>

                          {/* The Tooltip (Product Card) */}
                          <div className="absolute left-1/2 bottom-full mb-4 -translate-x-1/2 w-48 bg-white p-3 rounded shadow-xl opacity-0 invisible group-hover/pin:opacity-100 group-hover/pin:visible transition-all duration-300 z-20 pointer-events-none group-hover/pin:pointer-events-auto">
                            <div className="text-center">
                               {/* Optional: Show product thumb if available */}
                               <Link href={linkUrl} className="block text-sm font-medium text-black hover:text-red-500 mb-1 line-clamp-2 leading-snug">
                                 {name}
                               </Link>
                               <div className="absolute left-1/2 bottom-[-6px] -translate-x-1/2 w-3 h-3 bg-white rotate-45"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Caption */}
                  {(feature.title || feature.description) && (
                    <div className="absolute bottom-10 left-10 md:bottom-20 md:left-20 max-w-md text-white drop-shadow-md z-10 pointer-events-none">
                      {feature.title && <h2 className="text-3xl md:text-5xl font-bold mb-2">{feature.title}</h2>}
                      {feature.description && <p className="text-lg md:text-xl opacity-90">{feature.description}</p>}
                    </div>
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          
          {/* Navigation Buttons */}
          <div className="sw-dots style-2 sw-pagination-mb justify-content-center spd-lookbook absolute bottom-5 left-0 right-0 z-20" />
        </div>
      </div>
    </section>
  );
}
