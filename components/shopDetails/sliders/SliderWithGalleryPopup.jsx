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
  const defaultImages = [
    {
      id: 1,
      src: firstImage || "/images/shop/products/p-d1.png",
      alt: "",
      width: 770,
      height: 1075,
      dataValue: "beige",
    },
    {
      id: 2,
      src: "/images/shop/products/hmgoepprod.jpg",
      alt: "",
      width: 713,
      height: 1070,
      dataValue: "beige",
    },
    {
      id: 3,
      src: "/images/shop/products/hmgoepprod2.jpg",
      alt: "img-compare",
      width: 713,
      height: 1070,
      dataValue: "beige",
    },
    {
      id: 4,
      src: "/images/shop/products/hmgoepprod3.jpg",
      alt: "img-compare",
      width: 713,
      height: 1070,
      dataValue: "beige",
    },
    {
      id: 5,
      src: "/images/shop/products/hmgoepprod4.jpg",
      alt: "img-compare",
      width: 768,
      height: 1152,
      dataValue: "beige",
    },
    {
      id: 6,
      src: "/images/shop/products/hmgoepprod5.jpg",
      alt: "img-compare",
      width: 713,
      height: 1070,
      dataValue: "beige",
    },
    {
      id: 7,
      src: "/images/shop/products/hmgoepprod6.jpg",
      alt: "",
      width: 768,
      height: 1152,
      dataValue: "black",
    },
    {
      id: 8,
      src: "/images/shop/products/hmgoepprod7.jpg",
      alt: "",
      width: 713,
      height: 1070,
      dataValue: "black",
    },
    {
      id: 9,
      src: "/images/shop/products/hmgoepprod8.jpg",
      alt: "",
      width: 713,
      height: 1070,
      dataValue: "black",
    },
    {
      id: 10,
      src: "/images/shop/products/hmgoepprod9.jpg",
      alt: "",
      width: 768,
      height: 1152,
      dataValue: "black",
    },
    {
      id: 11,
      src: "/images/shop/products/hmgoepprod10.jpg",
      alt: "",
      width: 713,
      height: 1070,
      dataValue: "blue",
    },
    {
      id: 12,
      src: "/images/shop/products/hmgoepprod11.jpg",
      alt: "",
      width: 713,
      height: 1070,
      dataValue: "blue",
    },
    {
      id: 13,
      src: "/images/shop/products/hmgoepprod12.jpg",
      alt: "",
      width: 768,
      height: 1152,
      dataValue: "blue",
    },
    {
      id: 14,
      src: "/images/shop/products/hmgoepprod13.jpg",
      alt: "",
      width: 768,
      height: 1152,
      dataValue: "blue",
    },
    {
      id: 15,
      src: "/images/shop/products/hmgoepprod14.jpg",
      alt: "",
      width: 768,
      height: 1152,
      dataValue: "white",
    },
    {
      id: 16,
      src: "/images/shop/products/hmgoepprod15.jpg",
      alt: "",
      width: 768,
      height: 1152,
      dataValue: "white",
    },
    {
      id: 17,
      src: "/images/shop/products/hmgoepprod16.jpg",
      alt: "",
      width: 768,
      height: 1152,
      dataValue: "white",
    },
    {
      id: 18,
      src: "/images/shop/products/hmgoepprod17.jpg",
      alt: "",
      width: 768,
      height: 1152,
      dataValue: "white",
    },
  ];

  // Sabit görsel boyutları tanımlayalım - 4:3 oranında
  const MAIN_IMAGE_WIDTH = 800;
  const MAIN_IMAGE_HEIGHT = 600; // 4:3 oranı için (800 * 3/4 = 600)
  const THUMB_IMAGE_WIDTH = 120;
  const THUMB_IMAGE_HEIGHT = 90; // 4:3 oranı için (120 * 3/4 = 90)
  
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
            <div className="item" style={{ width: THUMB_IMAGE_WIDTH, height: THUMB_IMAGE_HEIGHT, overflow: 'hidden', aspectRatio: '4/3' }}>
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
                  objectFit: 'cover',
                  objectPosition: 'center'
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
                      aspectRatio: '4/3' // Açıkça 4:3 oranını belirtelim
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
                          objectFit: 'cover',
                          objectPosition: 'center'
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
