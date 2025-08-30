"use client";
import { useContextElement } from "@/context/Context";

import Image from "next/image";
import Link from "next/link";

import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import Quantity from "../shopDetails/Quantity";
import React, { useState } from "react";

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
                    
                    // Ana ürün resmi
                    if (quickViewItem.imgSrc) {
                      images.push(quickViewItem.imgSrc);
                    }
                    
                    // Hover resmi (eğer farklıysa)
                    if (quickViewItem.imgHoverSrc && quickViewItem.imgHoverSrc !== quickViewItem.imgSrc) {
                      images.push(quickViewItem.imgHoverSrc);
                    }
                    
                    // Renk resimleri
                    if (quickViewItem.colors && quickViewItem.colors.length > 0) {
                      quickViewItem.colors.forEach(color => {
                        if (color.imgSrc && !images.includes(color.imgSrc)) {
                          images.push(color.imgSrc);
                        }
                      });
                    }
                    
                    // Eğer hiç resim yoksa default
                    if (images.length === 0) {
                      images.push('/images/products/default.jpg');
                    }
                    
                    return images.map((imageSrc, index) => (
                      <SwiperSlide className="swiper-slide" key={index}>
                        <div className="item">
                          <Image
                            alt={quickViewItem.title || "Product Image"}
                            src={imageSrc}
                            width={720}
                            height={1045}
                            style={{ objectFit: "contain" }}
                          />
                        </div>
                      </SwiperSlide>
                    ));
                  })()}

                  <div className="swiper-button-next button-style-arrow single-slide-prev snbqvp" />
                  <div className="swiper-button-prev button-style-arrow single-slide-next snbqvn" />
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
                <div className="tf-product-info-badges">
                  <div className="badges text-uppercase">Best seller</div>
                  <div className="product-status-content">
                    <i className="icon-lightning" />
                    <p className="fw-6">
                      Selling fast! 48 people have this in their carts.
                    </p>
                  </div>
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
                                backgroundColor: color.hexCode || color.value,
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
                <div className="tf-product-info-quantity">
                  <div className="quantity-title fw-6">Quantity</div>
                  <Quantity />
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
                    <div className="w-100">
                      <a href="#" className="btns-full">
                        Buy with
                        <Image
                          alt="image"
                          src="/images/payments/paypal.png"
                          width={64}
                          height={18}
                        />
                      </a>
                      <a href="#" className="payment-more-option">
                        More payment options
                      </a>
                    </div>
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
