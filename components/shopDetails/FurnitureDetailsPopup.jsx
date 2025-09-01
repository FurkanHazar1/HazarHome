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
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <a
                          onClick={() => {
                            // Tekil furniture için normal ID kullan
                            const productToAdd = {
                              id: product.id,
                              title: product.title,
                              price: product.price,
                              imgSrc: product.imgSrc || (product.images && product.images[0]) || '/images/default-product.jpg',
                              type: 'furniture', // Tip bilgisi ekle
                              category: product.category || product.categoryName || 'Mobilya'
                            };
                            
                            // Seçilen özellikler
                            const options = {
                              color: currentColor?.name || null,
                              size: currentSize || null
                            };
                            
                            addProductToCart(productToAdd, quantity, options);
                          }}
                          className="tf-btn animate-hover-btn justify-content-center fw-6 flex-grow-1 custom-cream-btn"
                          style={{ 
                            fontSize: '14px',
                            padding: '10px 16px',
                            flex: '1',
                            backgroundColor: '#F5F5DC',
                            border: '2px solid #F5F5DC',
                            color: '#8B4513',
                            transition: 'all 0.3s ease',
                            textDecoration: 'none',
                            outline: 'none'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.setProperty('background-color', '#E6E6C8', 'important');
                            e.target.style.setProperty('border-color', '#E6E6C8', 'important');
                            e.target.style.setProperty('color', '#654321', 'important');
                            e.target.style.transform = 'scale(1.02)';
                            // Span elementine de aynı stilleri uygula
                            const spanElement = e.target.querySelector('span');
                            if (spanElement) {
                              spanElement.style.setProperty('color', '#654321', 'important');
                              spanElement.style.setProperty('background-color', 'transparent', 'important');
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.setProperty('background-color', '#F5F5DC', 'important');
                            e.target.style.setProperty('border-color', '#F5F5DC', 'important');
                            e.target.style.setProperty('color', '#8B4513', 'important');
                            e.target.style.transform = 'scale(1)';
                            // Span elementinin rengini geri al
                            const spanElement = e.target.querySelector('span');
                            if (spanElement) {
                              spanElement.style.setProperty('color', '#8B4513', 'important');
                              spanElement.style.setProperty('background-color', 'transparent', 'important');
                            }
                          }}
                        >
                          <span style={{ 
                            backgroundColor: 'transparent', 
                            color: 'inherit',
                            border: 'none',
                            padding: '0',
                            margin: '0'
                          }}>Sepete Ekle - ${(product.price * quantity).toFixed(2)}</span>
                        </a>
                        
                        <a
                          href={`https://wa.me/905335191329?text=${encodeURIComponent(`Merhaba! ${product.title} ürünü hakkında daha fazla bilgi almak istiyorum. Ürün linki: ${window.location.href}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tf-btn btn-outline animate-hover-btn justify-content-center fw-6"
                          style={{ 
                            fontSize: '14px',
                            padding: '10px 16px',
                            flex: '1',
                            backgroundColor: 'transparent',
                            border: '2px solid #25D366',
                            color: '#25D366',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#25D366';
                            e.target.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#25D366';
                          }}
                        >
                          <span>Daha Fazla Bilgi Al</span>
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
