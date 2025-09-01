"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Gallery, Item } from "react-photoswipe-gallery";
import { Navigation, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

export default function SliderWithGalleryPopup({
  currentColor = "Beige",
  handleColor = () => {},
  firstImage,
  images: propImages = [],
}) {

  // Sabit görsel boyutları tanımlayalım - 4:3 oranında
  const MAIN_IMAGE_WIDTH = 720;
  const MAIN_IMAGE_HEIGHT = 540; // 4:3 oranı için (720 * 3/4 = 540)
  const THUMB_IMAGE_WIDTH = 60;
  const THUMB_IMAGE_HEIGHT = 60; // 4:3 oranı için (45 * 3/4 = 60)

  // Convert propImages to the expected format with id and dataValue
  const processedPropImages = propImages && propImages.length > 0 
    ? propImages.map((img, index) => {
        // API veri yapısı desteklenmesi - görsel bilgileri farklı formatlarda olabilir
        const imageSrc = img.image?.filePath 
          ? (img.image.filePath.startsWith('/') ? img.image.filePath : `/${img.image.filePath}`)
          : img.src || img.imgSrc || firstImage;
          
        return {
          id: index + 1,
          src: imageSrc,
          alt: img.image?.altText || img.alt || "",
          // Artık dinamik boyutlar yerine sabit boyutlar kullanıyoruz
          width: MAIN_IMAGE_WIDTH,
          height: MAIN_IMAGE_HEIGHT,
          originalWidth: img.image?.width || 770,
          originalHeight: img.image?.height || 1075,
          dataValue: (currentColor && typeof currentColor === 'string' ? currentColor.toLowerCase() : "beige"),
        };
      })
    : [];

  // Use processed prop images if available, otherwise use default images
  const images = processedPropImages.length > 0 ? processedPropImages : (firstImage ? [{
    id: 1,
    src: firstImage,
    alt: "",
    width: MAIN_IMAGE_WIDTH,
    height: MAIN_IMAGE_HEIGHT,
    dataValue: (currentColor && typeof currentColor === 'string' ? currentColor.toLowerCase() : "beige"),
  }] : defaultImages.map(img => ({
    ...img,
    width: MAIN_IMAGE_WIDTH,
    height: MAIN_IMAGE_HEIGHT,
    originalWidth: img.width,
    originalHeight: img.height,
  })));

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
        spaceBetween={10}
        slidesPerView={6}
        className="tf-product-media-thumbs other-image-zoom"
        onSwiper={setThumbsSwiper}
        modules={[Thumbs]}
        breakpoints={{
          0: {
            direction: "horizontal",
          },
          1150: {
            direction: "vertical",
          },
        }}
      >
        {images.map((slide, index) => (
          <SwiperSlide key={index} className="stagger-item">
            <div className="item" style={{ 
              width: THUMB_IMAGE_WIDTH, 
              height: THUMB_IMAGE_HEIGHT, 
              overflow: 'hidden', 
              aspectRatio: '4/3',
              backgroundColor: 'white' // Thumbnail container için krem arka plan
            }}>
              <Image
                className="lazyload"
                data-src={slide.src}
                alt={slide.alt || ""}
                src={slide.src}
                width={THUMB_IMAGE_WIDTH}
                height={THUMB_IMAGE_HEIGHT}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain', // Cover yerine contain kullan
                  objectPosition: 'center',
                  backgroundColor: 'white' // Görsel için krem arka plan
                }}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <Gallery>
        <Swiper
          dir="ltr"
          spaceBetween={10}
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
                      width: MAIN_IMAGE_WIDTH, 
                      height: MAIN_IMAGE_HEIGHT, 
                      position: 'relative',
                      overflow: 'hidden',
                      aspectRatio: '4/3', // Açıkça 4:3 oranını belirtelim
                      backgroundColor: '#f8f6f0' // Container için krem arka plan
                    }}>
                      <Image
                        className="tf-image-zoom-magnifier ls-is-cached lazyloaded"
                        data-zoom={slide.src}
                        data-src={slide.src}
                        ref={ref}
                        alt={slide.alt || "image"}
                        src={slide.src}
                        fill={true}
                        style={{ 
                          objectFit: 'contain',
                          objectPosition: 'center',
                          backgroundColor: '#f8f6f0' // Boş alanlar için krem arka plan
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
