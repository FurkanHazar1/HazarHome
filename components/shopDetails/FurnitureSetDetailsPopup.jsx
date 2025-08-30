"use client";
import React, { useState } from "react";
import Image from "next/image";
import { openCartModal } from "@/utlis/openCartModal";
import CountdownComponent from "../common/Countdown";
import StickyItem from "./StickyItem";
import Quantity from "./Quantity";
import SliderWithGalleryPopup from "./sliders/SliderWithGalleryPopup";
import { useContextElement } from "@/context/Context";
import Link from "next/link";
import { getColorHex } from "@/utils/colorUtils";

export default function FurnitureSetDetailsPopup({ product }) {
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
              <div className="tf-product-media-wrap">
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

                  {/* Takım İçeriği */}
                  {product.setItems && product.setItems.length > 0 && (
                    <div className="tf-product-info-set-items mb-4">
                      <div className="set-header d-flex align-items-center justify-content-between mb-4">
                        <h6 className="fw-6 mb-0 d-flex align-items-center">
                          <i className="icon-package me-2 text-primary"></i>
                          Takım İçeriği
                          <span className="badge bg-primary ms-2">{product.setItems.length} Parça</span>
                        </h6>
                      </div>
                      
                      <div className="set-items-modern">
                        {product.setItems.map((item, index) => (
                          <div key={item.furnitureId || item.name || index} className="set-item-modern mb-3">
                            <div className="item-card p-3 border-0 rounded-3 shadow-sm bg-white position-relative overflow-hidden">
                              {/* Gradient Background */}
                              <div className="gradient-bg position-absolute top-0 start-0 w-100 h-100 opacity-10"></div>
                              
                              <div className="row align-items-center position-relative">
                                <div className="col-auto">
                                  <div className="item-image-container position-relative">
                                    {item.image && (
                                      <div className="image-wrapper rounded-3 overflow-hidden shadow-sm">
                                        <Image
                                          src={item.image}
                                          alt={item.name}
                                          width={80}
                                          height={80}
                                          className="item-image"
                                          style={{
                                            objectFit: 'cover',
                                            width: '80px',
                                            height: '80px',
                                            aspectRatio: '1'
                                          }}
                                        />
                                        <div className="image-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center opacity-0 transition-opacity">
                                          <i className="icon-eye text-white fs-4"></i>
                                        </div>
                                      </div>
                                    )}
                                    {item.quantity > 1 && (
                                      <div className="quantity-indicator position-absolute top-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center">
                                        <span className="small fw-6">{item.quantity}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="col">
                                  <div className="item-details">
                                    <div className="d-flex align-items-start justify-content-between mb-2">
                                      <h6 className="item-name fw-6 mb-0 text-dark">{item.name}</h6>
                                      {item.price && (
                                        <div className="price-container text-end">
                                          <div className="item-price text-success fw-6">${item.price.toFixed(2)}</div>
                                          {item.quantity > 1 && (
                                            <div className="total-price small text-muted">
                                              Toplam: ${(item.price * item.quantity).toFixed(2)}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {item.description && (
                                      <p className="item-description text-muted small mb-2 lh-sm">{item.description}</p>
                                    )}
                                    
                                    <div className="item-meta d-flex align-items-center justify-content-between">
                                      <div className="item-properties">
                                        {item.properties && item.properties.length > 0 && (
                                          <div className="properties-tags">
                                            {item.properties.slice(0, 2).map((prop, propIndex) => (
                                              <span key={`${item.furnitureId || item.name}-${prop.name}-${propIndex}`} 
                                                    className="property-tag badge bg-light text-dark me-1 small border">
                                                <i className="icon-tag me-1"></i>
                                                {prop.name}: {prop.value}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="item-actions d-flex align-items-center gap-2">
                                        {item.individualLink && (
                                          <Link href={item.individualLink} 
                                                className="btn btn-outline-primary btn-sm d-flex align-items-center">
                                            <i className="icon-eye me-1"></i>
                                            <span className="d-none d-md-inline">Detay</span>
                                          </Link>
                                        )}
                                        <div className="status-indicator d-flex align-items-center">
                                          <div className="status-dot bg-success rounded-circle me-2"></div>
                                          <span className="small text-success fw-5">Dahil</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Özellikler */}
                  {product.properties && product.properties.length > 0 && (
                    <div className="tf-product-info-properties mb-3">
                      <h6 className="fw-6 mb-2">Takım Özellikleri</h6>
                      <div className="properties-list">
                        <div className="row">
                          {product.properties.map((property, index) => (
                            <div key={`property-${property.name}-${index}`} className="col-6 col-md-4 mb-2">
                              <div className="property-item">
                                <span className="property-name small text-muted">{property.name}</span>
                                <div className="property-value fw-6 text-dark">{property.value}</div>
                              </div>
                            </div>
                          ))}
                        </div>
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
                        <span>Takımı Sepete Ekle - ${(product.price * quantity).toFixed(2)}</span>
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
