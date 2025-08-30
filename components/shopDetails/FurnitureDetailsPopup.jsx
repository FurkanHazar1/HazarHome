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

                  {/* Özellikler */}
                  {((product.properties && product.properties.length > 0) || 
                    (product.propertiesByType && Object.keys(product.propertiesByType).length > 0)) && (
                    <div className="tf-product-info-properties mb-3">
                      <h6 className="fw-6 mb-2">Ürün Özellikleri</h6>
                      <div className="properties-list">
                        {/* Eğer properties array varsa onu kullan */}
                        {product.properties && product.properties.length > 0 ? (
                          <div className="row">
                            {product.properties.map((property, index) => (
                              <div key={`property-${property.name || property.propertyName}-${index}`} className="col-6 col-md-4 mb-2">
                                <div className="property-item">
                                  <span className="property-name small text-muted">{property.name || property.propertyName}</span>
                                  <div className="property-value fw-6 text-dark">{property.value || property.propertyValue}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* Eğer propertiesByType varsa onu kullan */
                          <div className="row">
                            {product.propertiesByType && Object.entries(product.propertiesByType).map(([type, properties]) => 
                              properties.map((property, index) => (
                                <div key={`${type}-${property.propertyName}-${index}`} className="col-6 col-md-4 mb-2">
                                  <div className="property-item">
                                    <span className="property-name small text-muted">{property.propertyName}</span>
                                    <div className="property-value fw-6 text-dark">{property.propertyValue}</div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
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
