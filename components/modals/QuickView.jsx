"use client";
import { useContextElement } from "@/context/Context";

import Image from "next/image";
import Link from "next/link";

import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import Quantity from "../shopDetails/Quantity";
import React, { useState } from "react";
import { getColorHex } from "@/utils/colorUtils";

export default function QuickView() {
  const {
    quickViewItem,
    addProductToCart,
    isAddedToCartProducts,
    addToWishlist,
    isAddedtoWishlist,
    addToCompareItem,
    isAddedtoCompareItem,
  } = useContextElement();
  const [currentColor, setCurrentColor] = useState(null);
  const [currentSize, setCurrentSize] = useState(null);

  // QuickViewItem değiştiğinde default değerleri ayarla
  React.useEffect(() => {
    if (quickViewItem) {
      if (quickViewItem.colors && quickViewItem.colors.length > 0) {
        setCurrentColor(quickViewItem.colors[0]);
      } else {
        setCurrentColor(null);
      }
      
      if (quickViewItem.sizes && quickViewItem.sizes.length > 0) {
        setCurrentSize(quickViewItem.sizes[0]);
      } else {
        setCurrentSize(null);
      }
    }
  }, [quickViewItem]);

  const openModalSizeChoice = () => {
    const bootstrap = require("bootstrap"); // dynamically import bootstrap
    var myModal = new bootstrap.Modal(document.getElementById("find_size"), {
      keyboard: false,
    });

    myModal.show();
    document
      .getElementById("find_size")
      .addEventListener("hidden.bs.modal", () => {
        myModal.hide();
      });
    const backdrops = document.querySelectorAll(".modal-backdrop");
    if (backdrops.length > 1) {
      // Apply z-index to the last backdrop
      const lastBackdrop = backdrops[backdrops.length - 1];
      lastBackdrop.style.zIndex = "1057";
    }
  };

  return (
    <div className="modal fade modalDemo" id="quick_view">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="header">
            <span
              className="icon-close icon-close-popup"
              data-bs-dismiss="modal"
            />
          </div>
          <div className="wrap">
            <div className="tf-product-media-wrap">
              {quickViewItem && (
                <Swiper
                  dir="ltr"
                  modules={[Navigation]}
                  navigation={{
                    prevEl: ".snbqvp",
                    nextEl: ".snbqvn",
                  }}
                  className="swiper tf-single-slide"
                >
                  {(() => {
                    const images = [];
                    
                    // Debug için QuickViewItem'ı console'a yazdır
                    console.log('QuickView Debug - quickViewItem:', quickViewItem);
                    console.log('QuickView Debug - imageGallery:', quickViewItem?.imageGallery);
                    console.log('QuickView Debug - images:', quickViewItem?.images);
                    
                    // Doğrudan images array'i varsa - VERİTABANINDAN GELEN TÜM RESİMLER
                    if (quickViewItem.images && Array.isArray(quickViewItem.images)) {
                      console.log('Found direct images array:', quickViewItem.images);
                      
                      // Önce main tipindeki resmi bul ve ekle
                      const mainImage = quickViewItem.images.find(img => img.imageType === 'main');
                      if (mainImage) {
                        const imageSrc = mainImage.url || mainImage.filePath || mainImage.src;
                        if (imageSrc) {
                          const finalSrc = imageSrc.startsWith('/uploads/') ? imageSrc : 
                                          imageSrc.startsWith('http') ? imageSrc : `/uploads/${imageSrc}`;
                          images.push({
                            src: finalSrc,
                            alt: mainImage.altText || mainImage.alt || quickViewItem.title || 'Ana Ürün Resmi',
                            type: 'main'
                          });
                        }
                      }
                      
                      // Sonra diğer resimleri ekle (main hariç)
                      quickViewItem.images.forEach((img, index) => {
                        if (img.imageType !== 'main') { // Main resmi zaten ekledik
                          const imageSrc = img.url || img.filePath || img.src;
                          if (imageSrc) {
                            const finalSrc = imageSrc.startsWith('/uploads/') ? imageSrc : 
                                            imageSrc.startsWith('http') ? imageSrc : `/uploads/${imageSrc}`;
                            if (!images.some(existingImg => existingImg.src === finalSrc)) {
                              images.push({
                                src: finalSrc,
                                alt: img.altText || img.alt || quickViewItem.title || 'Ürün Resmi',
                                type: img.imageType || img.type || 'gallery'
                              });
                            }
                          }
                        }
                      });
                    } else {
                      // Fallback: imgSrc ve imgHoverSrc kullan
                      if (quickViewItem.imgSrc) {
                        images.push({
                          src: quickViewItem.imgSrc,
                          alt: quickViewItem.title || 'Ana Ürün Resmi',
                          type: 'main'
                        });
                      }
                      
                      if (quickViewItem.imgHoverSrc && quickViewItem.imgHoverSrc !== quickViewItem.imgSrc) {
                        images.push({
                          src: quickViewItem.imgHoverSrc,
                          alt: quickViewItem.title || 'Ürün Hover Resmi',
                          type: 'hover'
                        });
                      }
                    }
                    
                    // Veritabanından gelen tüm ürün resimleri (alternative structure)
                    if (quickViewItem.imageGallery) {
                      console.log('Processing imageGallery...');
                      
                      // Eğer imageGallery obje olarak geliyorsa (groupImagesByType = true)
                      if (quickViewItem.imageGallery.main && Array.isArray(quickViewItem.imageGallery.main)) {
                        console.log('Found main images:', quickViewItem.imageGallery.main);
                        quickViewItem.imageGallery.main.forEach((img, index) => {
                          const imageSrc = img.image?.url || (img.image?.filePath ? `/uploads/${img.image.filePath}` : null);
                          if (imageSrc && !images.some(existingImg => existingImg.src === imageSrc)) {
                            images.push({
                              src: imageSrc,
                              alt: img.image?.altText || quickViewItem.title || 'Ürün Resmi',
                              type: 'main-db'
                            });
                          }
                        });
                      }
                      
                      if (quickViewItem.imageGallery.gallery && Array.isArray(quickViewItem.imageGallery.gallery)) {
                        console.log('Found gallery images:', quickViewItem.imageGallery.gallery);
                        quickViewItem.imageGallery.gallery.forEach((img, index) => {
                          const imageSrc = img.image?.url || (img.image?.filePath ? `/uploads/${img.image.filePath}` : null);
                          if (imageSrc && !images.some(existingImg => existingImg.src === imageSrc)) {
                            images.push({
                              src: imageSrc,
                              alt: img.image?.altText || quickViewItem.title || 'Galeri Resmi',
                              type: 'gallery'
                            });
                          }
                        });
                      }
                      
                      // Eğer imageGallery.images array olarak geliyorsa (groupImagesByType = false)
                      if (quickViewItem.imageGallery.images && Array.isArray(quickViewItem.imageGallery.images)) {
                        console.log('Found images array:', quickViewItem.imageGallery.images);
                        quickViewItem.imageGallery.images.forEach((img, index) => {
                          const imageSrc = img.image?.url || (img.image?.filePath ? `/uploads/${img.image.filePath}` : null);
                          if (imageSrc && !images.some(existingImg => existingImg.src === imageSrc)) {
                            images.push({
                              src: imageSrc,
                              alt: img.image?.altText || quickViewItem.title || 'Ürün Resmi',
                              type: img.imageType || 'gallery'
                            });
                          }
                        });
                      }
                    }
                    
                    // FurnitureImages array'i varsa (direct database structure)
                    if (quickViewItem.furnitureImages && Array.isArray(quickViewItem.furnitureImages)) {
                      console.log('Found furnitureImages array:', quickViewItem.furnitureImages);
                      quickViewItem.furnitureImages.forEach((img, index) => {
                        const imageSrc = img.image?.filePath ? `/uploads/${img.image.filePath}` : null;
                        if (imageSrc && !images.some(existingImg => existingImg.src === imageSrc)) {
                          images.push({
                            src: imageSrc,
                            alt: img.image?.altText || quickViewItem.title || 'Mobilya Resmi',
                            type: img.imageType || 'furniture'
                          });
                        }
                      });
                    }
                    
                    // FurnitureSetImages array'i varsa (furniture set structure)
                    if (quickViewItem.furnitureSetImages && Array.isArray(quickViewItem.furnitureSetImages)) {
                      console.log('Found furnitureSetImages array:', quickViewItem.furnitureSetImages);
                      quickViewItem.furnitureSetImages.forEach((img, index) => {
                        const imageSrc = img.image?.filePath ? `/uploads/${img.image.filePath}` : null;
                        if (imageSrc && !images.some(existingImg => existingImg.src === imageSrc)) {
                          images.push({
                            src: imageSrc,
                            alt: img.image?.altText || quickViewItem.title || 'Takım Resmi',
                            type: img.imageType || 'furniture-set'
                          });
                        }
                      });
                    }
                    
                    // Renk resimleri - sadece ana resimlerden farklı olanları ekle
                    if (quickViewItem.colors && quickViewItem.colors.length > 0) {
                      console.log('Found colors:', quickViewItem.colors);
                      quickViewItem.colors.forEach(color => {
                        if (color.imgSrc && !images.some(existingImg => existingImg.src === color.imgSrc)) {
                          images.push({
                            src: color.imgSrc,
                            alt: `${quickViewItem.title} - ${color.name} Rengi`,
                            type: 'color',
                            colorName: color.name
                          });
                        }
                      });
                    }
                    
                    console.log('Final images array:', images);
                    
                    // Eğer hiç resim yoksa default
                    if (images.length === 0) {
                      images.push({
                        src: '/images/products/placeholder.jpg',
                        alt: 'Varsayılan Ürün Resmi',
                        type: 'default'
                      });
                    }
                    
                    return images.map((imageData, index) => (
                      <SwiperSlide className="swiper-slide" key={index}>
                        <div className="item" style={{
                          width: '100%',
                          height: '500px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '8px'
                        }}>
                          <Image
                            alt={imageData.alt}
                            src={imageData.src}
                            width={720}
                            height={1045}
                            style={{ 
                              maxWidth: '100%',
                              maxHeight: '100%',
                              width: 'auto',
                              height: 'auto',
                              objectFit: "contain"
                            }}
                            onError={(e) => {
                              console.log('Image load error:', imageData.src);
                              e.target.src = '/images/products/placeholder.jpg';
                            }}
                          />
                          {imageData.type === 'color' && imageData.colorName && (
                            <div 
                              style={{
                                position: 'absolute',
                                bottom: '10px',
                                left: '10px',
                                background: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}
                            >
                              {imageData.colorName}
                            </div>
                          )}
                        </div>
                      </SwiperSlide>
                    ));
                  })()}

                  <div className="swiper-button-prev button-style-arrow single-slide-prev snbqvp" />
                  <div className="swiper-button-next button-style-arrow single-slide-next snbqvn" />
                </Swiper>
              )}
            </div>
            <div className="tf-product-info-wrap position-relative">
              <div className="tf-product-info-list">
                <div className="tf-product-info-title">
                  <h5>
                    <Link
                      className="link"
                      href={
                        quickViewItem.type === "furniture_set" || quickViewItem.furnitureType === "Takım"
                          ? `/product-detail-furniture-set/${quickViewItem.id}` 
                          : `/product-detail-furniture/${quickViewItem.id}`
                      }
                    >
                      {quickViewItem.title}
                    </Link>
                  </h5>
                </div>
          
                <div className="tf-product-info-price">
                  <div className="price">${quickViewItem.price.toFixed(2)}</div>
                </div>
                <div className="tf-product-description">
                  <p>
                    {quickViewItem.description || "Ürün açıklaması mevcut değil."}
                  </p>
                </div>
                <div className="tf-product-info-variant-picker">
                  {/* Renk Seçimi */}
                  {quickViewItem.colors && quickViewItem.colors.length > 0 && (
                    <div className="variant-picker-item">
                      <div className="variant-picker-label">
                        Renk:
                        <span className="fw-6 variant-picker-label-value">
                          {currentColor?.name || currentColor?.value || ''}
                        </span>
                      </div>
                      <form className="variant-picker-values">
                        {quickViewItem.colors.map((color, index) => (
                          <React.Fragment key={color.id || index}>
                            <input
                              id={`qv-color-${color.id || index}`}
                              type="radio"
                              name="color1"
                              readOnly
                              checked={currentColor?.id === color.id || currentColor === color}
                            />
                            <label
                              onClick={() => setCurrentColor(color)}
                              className="hover-tooltip radius-60"
                              htmlFor={`qv-color-${color.id || index}`}
                              data-value={color.name || color.value}
                              style={{
                                backgroundColor: getColorHex(color),
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                border: '2px solid #ddd',
                                display: 'inline-block',
                                margin: '0 5px',
                                cursor: 'pointer'
                              }}
                            >
                              <span className="tooltip">{color.name || color.value}</span>
                            </label>
                          </React.Fragment>
                        ))}
                      </form>
                    </div>
                  )}
                  
                  {/* Boyut Seçimi */}
                  {quickViewItem.sizes && quickViewItem.sizes.length > 0 && (
                    <div className="variant-picker-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="variant-picker-label">
                          Boyut:
                          <span className="fw-6 variant-picker-label-value">
                            {currentSize?.value || currentSize?.name || ''}
                          </span>
                        </div>
                        <div
                          className="find-size btn-choose-size fw-6"
                          onClick={() => openModalSizeChoice()}
                        >
                          Boyut bul
                        </div>
                      </div>
                      <form className="variant-picker-values">
                        {quickViewItem.sizes.map((size, index) => (
                          <React.Fragment key={size.id || index}>
                            <input
                              type="radio"
                              name="size1"
                              id={`qv-size-${size.id || index}`}
                              readOnly
                              checked={currentSize?.id === size.id || currentSize === size}
                            />
                            <label
                              onClick={() => setCurrentSize(size)}
                              className="style-text"
                              htmlFor={`qv-size-${size.id || index}`}
                              data-value={size.value || size.name}
                            >
                              <p>{size.value || size.name}</p>
                            </label>
                          </React.Fragment>
                        ))}
                      </form>
                    </div>
                  )}
                </div>
               
                <div className="tf-product-info-buy-button">
                  <form onSubmit={(e) => e.preventDefault()} className="">
                    <a
                      href="#"
                      className="tf-btn btn-fill justify-content-center fw-6 fs-16 flex-grow-1 animate-hover-btn"
                      onClick={() => addProductToCart(quickViewItem.id)}
                    >
                      <span>
                        {isAddedToCartProducts(quickViewItem.id)
                          ? "Already Added - "
                          : "Add to cart - "}
                      </span>
                      <span className="tf-qty-price">
                        ${quickViewItem.price.toFixed(2)}
                      </span>
                    </a>
                    <a
                      onClick={() => addToWishlist(quickViewItem.id)}
                      className="tf-product-btn-wishlist hover-tooltip box-icon bg_white wishlist btn-icon-action"
                    >
                      <span
                        className={`icon icon-heart ${
                          isAddedtoWishlist(quickViewItem.id) ? "added" : ""
                        }`}
                      />
                      <span className="tooltip">
                        {isAddedtoWishlist(quickViewItem.id)
                          ? "Already Wishlisted"
                          : "Add to Wishlist"}
                      </span>
                      <span className="icon icon-delete" />
                    </a>
                    <a
                      href="#compare"
                      data-bs-toggle="offcanvas"
                      aria-controls="offcanvasLeft"
                      onClick={() => addToCompareItem(quickViewItem.id)}
                      className="tf-product-btn-wishlist hover-tooltip box-icon bg_white compare btn-icon-action"
                    >
                      <span
                        className={`icon icon-compare ${
                          isAddedtoCompareItem(quickViewItem.id) ? "added" : ""
                        }`}
                      />
                      <span className="tooltip">
                        {" "}
                        {isAddedtoCompareItem(quickViewItem.id)
                          ? "Already Compared"
                          : "Add to Compare"}
                      </span>
                      <span className="icon icon-check" />
                    </a>
                
                  </form>
                </div>
                <div>
                  <Link
                    href={
                      quickViewItem.type === "furniture_set" || quickViewItem.furnitureType === "Takım"
                        ? `/product-detail-furniture-set/${quickViewItem.id}` 
                        : `/product-detail-furniture/${quickViewItem.id}`
                    }
                    className="tf-btn fw-6 btn-line"
                  >
                    Tüm detayları görüntüle
                    <i className="icon icon-arrow1-top-left" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
