"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Gallery, Item } from "react-photoswipe-gallery";
import { Navigation, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { toPublicUrl } from "@/lib/image-helpers";

export default function SliderWithGalleryPopup({
  currentColor = "Beige",
  handleColor = () => {},
  firstImage,
  images: propImages = [],
}) {

  // Sabit görsel boyutları tanımlayalım - 4:3 oranında
  // Responsive ana görsel boyutları
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;
  const MAIN_IMAGE_WIDTH = isMobile ? 320 : 720;
  const MAIN_IMAGE_HEIGHT = isMobile ? 240 : 540; // 4:3 oranı
  // Thumbnail boyutları orantısal ve responsive olacak şekilde ayarlanıyor
  // Sabit px yerine yüzde ve aspect-ratio ile çerçeve kullanıyoruz
  // (ör: %100 genişlik, 4/3 oran)

  // Convert propImages to the expected format with id and dataValue
  const processedPropImages = propImages && propImages.length > 0 
    ? propImages.map((img, index) => {
        const imageSrc = toPublicUrl(img.image?.filePath || img.filePath || img.src || img.imgSrc || img);
          
        return {
          id: index + 1,
          src: imageSrc,
          alt: img.image?.altText || img.alt || "",
          width: MAIN_IMAGE_WIDTH,
          height: MAIN_IMAGE_HEIGHT,
          originalWidth: img.image?.width || 1200,
          originalHeight: img.image?.height || 1600,
          // Only assign dataValue if specifically provided or matched with color
          dataValue: img.color || img.image?.description || "",
        };
      })
    : [];

  // Use processed prop images if available, otherwise use default images
  const images = processedPropImages.length > 0 ? processedPropImages : (firstImage ? [{
    id: 1,
    src: toPublicUrl(firstImage),
    alt: "",
    width: MAIN_IMAGE_WIDTH,
    height: MAIN_IMAGE_HEIGHT,
    dataValue: (currentColor && typeof currentColor === 'string' ? currentColor.toLowerCase() : "beige"),
  }] : []);

  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const swiperRef = useRef(null);
  useEffect(() => {
    if (currentColor && typeof currentColor === 'string' && images && images.length > 0) {
      const colorImage = images.find(
        (elm) => elm.dataValue && elm.dataValue.toLowerCase() === currentColor.toLowerCase()
      );
      if (colorImage && colorImage.id !== undefined && swiperRef.current) {
        const slideIndex = Math.max(0, colorImage.id - 1); // Ensure slideIndex is not negative
        swiperRef.current.slideTo(slideIndex);
      }
    }
  }, [currentColor, images]);

  return (
    <>
      <Swiper
        dir="ltr"
        direction="vertical"
        slidesPerView={isMobile ? 4 : 4}
        className="tf-product-media-thumbs other-image-zoom"
        onSwiper={setThumbsSwiper}
        modules={[Thumbs]}
        breakpoints={{
          0: {
            direction: "horizontal",
            spaceBetween: 2,
          },
          600: {
            direction: "horizontal",
            spaceBetween: 4,
          },
          900: {
            direction: "vertical",
            spaceBetween: 2,
          },
          1150: {
            direction: "vertical",
            spaceBetween: 2,
          },
        }}
        style={{
          height: isMobile ? 80 : MAIN_IMAGE_HEIGHT,
          maxHeight: isMobile ? 80 : MAIN_IMAGE_HEIGHT,
          minHeight: isMobile ? 80 : MAIN_IMAGE_HEIGHT,
          marginBottom: isMobile ? 8 : 0,
        }}
      >
        {images.map((slide, index) => (
          <SwiperSlide key={index} className="stagger-item">
            <div
              className="item"
              style={{
                width: isMobile ? 60 : '100%',
                height: isMobile ? 60 : `${Math.floor(MAIN_IMAGE_HEIGHT / 5)}px`,
                maxWidth: isMobile ? 60 : '90px',
                aspectRatio: isMobile ? '1/1' : '5/4',
                backgroundColor: '#f8f6f0',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: isMobile ? '0 4px' : '0 auto',
                position: 'relative',
              }}
            >
              <Image
                alt={slide.alt || ""}
                src={slide.src}
                fill={true}
                loading="lazy"
                unoptimized={true}
                style={{
                  objectFit: 'contain',
                  objectPosition: 'center',
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#b1aeaea5',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                }}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <Gallery>
        <Swiper
          dir="ltr"
          spaceBetween={isMobile ? 4 : 10}
          slidesPerView={1}
          navigation={{
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          }}
          className="tf-product-media-main tf-product-zoom-inner"
          id="gallery-swiper-started"
          thumbs={{ swiper: thumbsSwiper }}
          modules={[Thumbs, Navigation]}
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          onSlideChange={(swiper) => {
            if (images && images[swiper.activeIndex] && images[swiper.activeIndex].dataValue) {
              handleColor(images[swiper.activeIndex].dataValue);
            }
          }}
          style={{
            minHeight: isMobile ? 180 : MAIN_IMAGE_HEIGHT,
            maxHeight: isMobile ? 240 : MAIN_IMAGE_HEIGHT,
            height: isMobile ? 200 : MAIN_IMAGE_HEIGHT,
            marginBottom: isMobile ? 8 : 0,
          }}
        >
          {images.map((slide, index) => (
            <SwiperSlide key={index}>
              <Item
                original={slide.src}
                thumbnail={slide.src}
                width={slide.originalWidth || slide.width}
                height={slide.originalHeight || slide.height}
              >
                {({ ref, open }) => (
                  <a
                    className="item"
                    data-pswp-width={slide.originalWidth || slide.width}
                    data-pswp-height={slide.originalHeight || slide.height}
                    onClick={open}
                    style={{ 
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                      width: '100%'
                    }}
                  >
                    <div style={{ 
                      width: isMobile ? 320 : MAIN_IMAGE_WIDTH, 
                      height: isMobile ? 180 : MAIN_IMAGE_HEIGHT, 
                      position: 'relative',
                      overflow: 'hidden',
                      aspectRatio: isMobile ? '16/9' : '4/3',
                      backgroundColor: '#f8f6f0',
                      borderRadius: '18px'
                    }}>
                      <Image
                        alt={slide.alt || "image"}
                        src={slide.src}
                        fill={true}
                        priority={index === 0}
                        loading={index === 0 ? undefined : "lazy"}
                        sizes="(max-width: 768px) 100vw, 720px"
                        unoptimized={true}
                        style={{ 
                          objectFit: 'contain',
                          objectPosition: 'center',
                          backgroundColor: '#f8f6f0'
                        }}
                      />
                    </div>
                  </a>
                )}
              </Item>
            </SwiperSlide>
          ))}

          {/* Navigation buttons */}
          <div className="swiper-button-next button-style-arrow thumbs-next"></div>
          <div className="swiper-button-prev button-style-arrow thumbs-prev"></div>
        </Swiper>
      </Gallery>
    </>
  );
}
