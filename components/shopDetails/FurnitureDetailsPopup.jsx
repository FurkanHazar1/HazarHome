"use client";
import React, { useState } from "react";
import Image from "next/image";
import { openCartModal } from "@/utlis/openCartModal";
import CountdownComponent from "../common/Countdown";
import StickyItem from "./StickyItem";
import Quantity from "./Quantity";
import SliderWithGalleryPopup from "./sliders/SliderWithGalleryPopup";
import { useContextElement } from "@/context/Context";
import { getColorHex } from "@/utils/colorUtils";

export default function FurnitureDetailsPopup({ product }) {
  const [currentColor, setCurrentColor] = useState(product.colors?.[0] || {});
  const [currentSize, setCurrentSize] = useState(product.sizes?.[0]?.value || product.sizes?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  
  const handleColor = (color) => {
    const updatedColor = product.colors?.find(
      (elm) => elm.value.toLowerCase() === color.toLowerCase()
    );
    if (updatedColor) {
      setCurrentColor(updatedColor);
    }
  };

  const {
    addProductToCart,
    isAddedToCartProducts,
    addToCompareItem,
    isAddedtoCompareItem,
    addToWishlist,
    isAddedtoWishlist,
  } = useContextElement();

  return (
    <section
      className="flat-spacing-4 pt_0"
      style={{ maxWidth: "100vw", overflow: "clip" }}
    >
      <div className="tf-main-product section-image-zoom">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <div className="tf-product-media-wrap sticky-top">
                <div className="thumbs-slider">
                  <SliderWithGalleryPopup
                    handleColor={handleColor}
                    currentColor={currentColor.value || ""}
                    firstImage={product.imgSrc}
                    images={product.imageGallery ? [...(product.imageGallery.main || []), ...(product.imageGallery.gallery || []), ...(product.imageGallery.thumbnails || [])] : product.images}
                  />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="tf-product-info-wrap position-relative">
                <div className="tf-zoom-main" />
                <div className="tf-product-info-list other-image-zoom">
                  <div className="tf-product-info-title">
                    <h5>{product.title}</h5>
                  </div>
                  
                  <div className="tf-product-info-badges">
                    <div className="badges">Best seller</div>
                    <div className="product-status-content">
                      <i className="icon-lightning" />
                      <p className="fw-6">
                        Selling fast! 56 people have this in their carts.
                      </p>
                    </div>
                  </div>
                  
                  <div className="tf-product-info-price">
                    <div className="price-on-sale">
                      ${product.price?.toFixed(2)}
                    </div>
                    {currentColor.oldPrice && (
                      <>
                        <div className="compare-at-price">
                          ${currentColor.oldPrice.toFixed(2)}
                        </div>
                        <div className="badges-on-sale">
                          <span>{Math.round(((currentColor.oldPrice - product.price) / currentColor.oldPrice) * 100)}</span>% OFF
                        </div>
                      </>
                    )}
                  </div>

                  {/* Ürün Açıklaması */}
                  {product.description && (
                    <div className="tf-product-info-description">
                      <p className="fw-6 text_black-2">{product.description}</p>
                    </div>
                  )}

                  {/* Özellikler */}
                  {product.properties && product.properties.length > 0 && (
                    <div className="tf-product-info-properties">
                      <h6 className="fw-6 mb-3">Ürün Özellikleri</h6>
                      <div className="properties-list">
                        {product.properties.map((property, index) => (
                          <div key={index} className="property-item d-flex justify-content-between mb-2">
                            <span className="property-name fw-6">{property.name}:</span>
                            <span className="property-value text_black-2">{property.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Renk Seçimi */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="tf-product-info-variant-picker">
                      <div className="variant-picker-item">
                        <div className="variant-picker-label">
                          Renk: <span className="fw-6 variant-picker-label-value">{currentColor.name}</span>
                        </div>
                        <div className="variant-picker-values">
                          {product.colors.map((color, index) => (
                            <input
                              key={color.id || color.value || index}
                              id={`values-${color.value}`}
                              type="radio"
                              name="color1"
                              value={color.value}
                              checked={currentColor.value === color.value}
                              onChange={() => handleColor(color.value)}
                            />
                          ))}
                          {product.colors.map((color, index) => (
                            <label
                              key={`label-${color.id || color.value || index}`}
                              className="hover-tooltip radius-60"
                              htmlFor={`values-${color.value}`}
                              data-value={color.name}
                            >
                              <span 
                                className="btn-checkbox" 
                                style={{ backgroundColor: getColorHex(color) }}
                              />
                              <span className="tooltip">{color.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Boyut Seçimi */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div className="tf-product-info-variant-picker">
                      <div className="variant-picker-item">
                        <div className="variant-picker-label">
                          Boyut: <span className="fw-6 variant-picker-label-value">{currentSize}</span>
                        </div>
                        <div className="variant-picker-values">
                          {product.sizes.map((size, index) => (
                            <React.Fragment key={index}>
                              <input
                                type="radio"
                                name="size1"
                                id={`values-${size.value || size}`}
                                value={size.value || size}
                                checked={currentSize === (size.value || size)}
                                onChange={(e) => setCurrentSize(e.target.value)}
                              />
                              <label className="style-text" htmlFor={`values-${size.value || size}`}>
                                {size.value || size}
                              </label>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Miktar ve Satın Al */}
                  <div className="tf-product-info-quantity">
                    <div className="quantity-title fw-6">Miktar</div>
                    <Quantity setQuantity={setQuantity} />
                  </div>

                  <div className="tf-product-info-buy-button">
                    <form onSubmit={(e) => e.preventDefault()} className="">
                      <a
                        onClick={() => addProductToCart(product.id, quantity)}
                        className="tf-btn btn-fill justify-content-center fw-6 fs-16 flex-grow-1 animate-hover-btn"
                      >
                        <span>Sepete Ekle - ${(product.price * quantity).toFixed(2)}</span>
                      </a>
                      <div className="tf-product-btn-wishlist btn-icon-action">
                        <i
                          className={`icon-heart ${
                            isAddedtoWishlist(product.id) ? "added" : ""
                          }`}
                          onClick={() => addToWishlist(product.id)}
                        />
                        <span className="tooltip">
                          {isAddedtoWishlist(product.id)
                            ? "Already Wishlisted"
                            : "Add to Wishlist"}
                        </span>
                      </div>
                      <div className="tf-product-btn-wishlist btn-icon-action">
                        <i
                          className={`icon-compare ${
                            isAddedtoCompareItem(product.id) ? "added" : ""
                          }`}
                          onClick={() => addToCompareItem(product.id)}
                        />
                        <span className="tooltip">
                          {isAddedtoCompareItem(product.id)
                            ? "Already Compared"
                            : "Add to Compare"}
                        </span>
                      </div>
                      <a
                        href="#shoppingCart"
                        data-bs-toggle="modal"
                        className="tf-product-btn-wishlist box-icon bg_white compare btn-icon-action"
                        onClick={() => addProductToCart(product.id, quantity)}
                      >
                        <span className="icon icon-bag" />
                        <span className="tooltip">Add to cart</span>
                      </a>
                    </form>
                  </div>

                  {/* Ödeme Bilgileri */}
                  <div className="tf-product-info-payment">
                    <div className="payment-methods">
                      <div className="payment-item">
                        <i className="icon-truck" />
                        <span>Ücretsiz Kargo</span>
                      </div>
                      <div className="payment-item">
                        <i className="icon-return" />
                        <span>30 Gün İade Garantisi</span>
                      </div>
                      <div className="payment-item">
                        <i className="icon-shield" />
                        <span>Güvenli Ödeme</span>
                      </div>
                    </div>
                  </div>

                  {/* Marka */}
                  {product.brand && (
                    <div className="tf-product-info-extra-link">
                      <a href="#" className="tf-product-extra-icon">
                        <div className="icon">
                          <i className="icon-tags" />
                        </div>
                        <div className="text fw-6">Marka: {product.brand}</div>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <StickyItem product={product} />
    </section>
  );
}
