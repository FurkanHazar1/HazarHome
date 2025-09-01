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
              <div className="tf-product-info-wrap position-relative" style={{ 
                maxHeight: '540px', // Ana görselin yüksekliği ile eşleştir (4:3 oranı)
                overflowY: 'auto',
                paddingRight: '15px'
              }}>
                <div className="tf-zoom-main" />
                <div className="tf-product-info-list other-image-zoom" style={{
                  padding: '15px 0', // Üst-alt padding küçült
                  fontSize: '14px' // Genel font boyutunu küçült
                }}>
                  <div className="tf-product-info-title">
                    <h5 style={{ fontSize: '20px', marginBottom: '10px' }}>{product.title}</h5>
                  </div>
                  
                
                  
                  <div className="tf-product-info-price" style={{ marginBottom: '15px' }}>
                    <div className="price-on-sale" style={{ fontSize: '22px' }}>
                      ${product.price?.toFixed(2)}
                    </div>
                    {currentColor.oldPrice && (
                      <>
                        <div className="compare-at-price" style={{ fontSize: '16px' }}>
                          ${currentColor.oldPrice.toFixed(2)}
                        </div>
                        <div className="badges-on-sale" style={{ fontSize: '12px', padding: '2px 6px' }}>
                          <span>{Math.round(((currentColor.oldPrice - product.price) / currentColor.oldPrice) * 100)}</span>% OFF
                        </div>
                      </>
                    )}
                  </div>

                  {/* Ürün Açıklaması */}
                  {product.description && (
                    <div className="tf-product-info-description" style={{ marginBottom: '15px' }}>
                      <p className="fw-6 text_black-2" style={{ 
                        fontSize: '13px', 
                        lineHeight: '1.4',
                        maxHeight: '60px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>{product.description}</p>
                    </div>
                  )}

              
                  {/* Boyut Seçimi */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div className="tf-product-info-variant-picker" style={{ marginBottom: '12px' }}>
                      <div className="variant-picker-item">
                        <div className="variant-picker-label" style={{ fontSize: '13px', marginBottom: '8px' }}>
                          Boyut: <span className="fw-6 variant-picker-label-value">{currentSize}</span>
                        </div>
                        <div className="variant-picker-values" style={{ gap: '6px' }}>
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
                              <label 
                                className="style-text" 
                                htmlFor={`values-${size.value || size}`}
                                style={{ 
                                  fontSize: '12px', 
                                  padding: '4px 8px',
                                  minWidth: 'auto'
                                }}
                              >
                                {size.value || size}
                              </label>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Özellikler */}
                  {((product.properties && product.properties.length > 0) || 
                    (product.propertiesByType && Object.keys(product.propertiesByType).length > 0)) && (
                    <div className="tf-product-info-properties mb-2" style={{ marginBottom: '12px' }}>
                      <h6 className="fw-6 mb-1" style={{ fontSize: '14px', marginBottom: '8px' }}>Ürün Özellikleri</h6>
                      <div className="properties-list" style={{ maxHeight: '120px', overflow: 'hidden' }}>
                        {/* Eğer properties array varsa onu kullan */}
                        {product.properties && product.properties.length > 0 ? (
                          <div className="row">
                            {product.properties.slice(0, 6).map((property, index) => ( // İlk 6 özelliği göster
                              <div key={`property-${property.name || property.propertyName}-${index}`} className="col-6" style={{ marginBottom: '4px' }}>
                                <div className="property-item" style={{ marginBottom: '2px' }}>
                                  <span className="property-name small text-muted" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                                    {property.name || property.propertyName}
                                  </span>
                                  <div className="property-value fw-6 text-dark" style={{ fontSize: '12px', lineHeight: '1.2', marginTop: '1px' }}>
                                    {property.value || property.propertyValue}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* Eğer propertiesByType varsa onu kullan */
                          <div className="row">
                            {product.propertiesByType && Object.entries(product.propertiesByType).slice(0, 3).map(([type, properties]) => 
                              properties.slice(0, 2).map((property, index) => ( // Her tipten max 2 özellik
                                <div key={`${type}-${property.propertyName}-${index}`} className="col-6" style={{ marginBottom: '4px' }}>
                                  <div className="property-item" style={{ marginBottom: '2px' }}>
                                    <span className="property-name small text-muted" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                                      {property.propertyName}
                                    </span>
                                    <div className="property-value fw-6 text-dark" style={{ fontSize: '12px', lineHeight: '1.2', marginTop: '1px' }}>
                                      {property.propertyValue}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                   {/* Renk Seçimi */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="tf-product-info-variant-picker" style={{ marginBottom: '12px' }}>
                      <div className="variant-picker-item">
                        <div className="variant-picker-label" style={{ fontSize: '13px', marginBottom: '8px' }}>
                          Renk: <span className="fw-6 variant-picker-label-value">{currentColor.name}</span>
                        </div>
                        <div className="variant-picker-values" style={{ gap: '6px' }}>
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
                              htmlFor={`values-${color.value}`}
                              style={{ 
                                width: '24px', 
                                height: '24px',
                                display: 'inline-block',
                                cursor: 'pointer',
                                borderRadius: '30%',
                                overflow: 'hidden',
                                border: '1px solid transparent',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 1px 1px rgba(0, 0, 0, 0.15)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.1)';
                                e.target.style.border = '2px solid #ddd';
                                e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.25)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.border = '2px solid transparent';
                                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
                              }}
                            >
                              <span 
                                className="btn-checkbox" 
                                style={{ 
                                  backgroundColor: getColorHex(color),
                                  width: '100%',
                                  height: '100%',
                                  display: 'block',
                                  borderRadius: '50%'
                                }}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}


                  {/* Miktar ve Satın Al */}
                  <div className="tf-product-info-quantity" style={{ marginBottom: '12px' }}>
                    <div className="quantity-title fw-6" style={{ fontSize: '13px', marginBottom: '6px' }}>Miktar</div>
                    <Quantity setQuantity={setQuantity} />
                  </div>

                  <div className="tf-product-info-buy-button">
                    <form onSubmit={(e) => e.preventDefault()} className="">
                      <a
                        onClick={() => addProductToCart(product.id, quantity)}
                        className="tf-btn btn-fill justify-content-center fw-6 flex-grow-1 animate-hover-btn"
                        style={{ 
                          fontSize: '14px',
                          padding: '10px 16px',
                          marginBottom: '8px'
                        }}
                      >
                        <span>Sepete Ekle - ${(product.price * quantity).toFixed(2)}</span>
                      </a>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <div className="tf-product-btn-wishlist btn-icon-action" style={{ transform: 'scale(0.9)' }}>
                          <i
                            className={`icon-heart ${
                              isAddedtoWishlist(product.id) ? "added" : ""
                            }`}
                            onClick={() => addToWishlist(product.id)}
                          />
                          <span className="tooltip" style={{ fontSize: '11px' }}>
                            {isAddedtoWishlist(product.id)
                              ? "Already Wishlisted"
                              : "Add to Wishlist"}
                          </span>
                        </div>
                        <div className="tf-product-btn-wishlist btn-icon-action" style={{ transform: 'scale(0.9)' }}>
                          <i
                            className={`icon-compare ${
                              isAddedtoCompareItem(product.id) ? "added" : ""
                            }`}
                            onClick={() => addToCompareItem(product.id)}
                          />
                          <span className="tooltip" style={{ fontSize: '11px' }}>
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
                          style={{ transform: 'scale(0.9)' }}
                        >
                          <span className="icon icon-bag" />
                          <span className="tooltip" style={{ fontSize: '11px' }}>Add to cart</span>
                        </a>
                      </div>
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
