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
      style={{ 
        maxWidth: "100vw", 
        overflow: "clip",
        paddingBottom: "30px"
      }}
    >
      <div className="tf-main-product section-image-zoom">
        <div className="container">
          <div className="row">
            <div className="col-md-8">
              <div className="tf-product-media-wrap">
                <div className="thumbs-slider">
                  <SliderWithGalleryPopup
                    handleColor={handleColor}
                    currentColor={currentColor.value || ""}
                    firstImage={product.imgSrc}
                    images={
                      product.imageGallery 
                        ? [
                            ...(product.imageGallery.main || []), 
                            ...(product.imageGallery.gallery || []), 
                            ...(product.imageGallery.thumbnails || [])
                          ] 
                        : (product.images || [])
                    }
                  />
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="tf-product-info-wrap position-relative">
                <div className="tf-zoom-main" />
                <div className="tf-product-info-list other-image-zoom">
                  <div className="tf-product-info-title mb-3">
                    <h2 className="fw-6" style={{ fontSize: '24px', marginBottom: '10px' }}>{product.title}</h2>
                  </div>
                  
                  {/* Ürün Açıklaması */}
                  {product.description && (
                    <div className="tf-product-info-description mb-4">
                      <p className="text_black-2" style={{ 
                        fontSize: '14px', 
                        lineHeight: '1.6',
                        display: '-webkit-box',
                        WebkitLineClamp: '10',
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>{product.description}</p>
                    </div>
                  )}

                  {/* Takım İçeriği */}
                  {(product.setItems && product.setItems.length > 0) && (
                    <div className="tf-product-info-set-contents" style={{ marginBottom: '20px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '15px',
                        gap: '8px'
                      }}>
                        <div style={{
                          width: '4px',
                          height: '18px',
                          backgroundColor: '#8B4513',
                          borderRadius: '2px'
                        }}></div>
                        <h6 className="fw-6 mb-0" style={{ 
                          fontSize: '15px', 
                          color: '#8B4513',
                          letterSpacing: '0.5px'
                        }}>
                          Takım İçeriği
                        </h6>
                        <span style={{
                          fontSize: '11px',
                          backgroundColor: '#8B4513',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: '600'
                        }}>
                          {product.setItems.length} Parça
                        </span>
                      </div>
                      
                      <div className="set-items-list" style={{ 
                        backgroundColor: '#FEFEFE', 
                        padding: '16px', 
                        borderRadius: '12px',
                        border: '1px solid #E8E8E8',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                      }}>
                        {product.setItems.map((item, index) => (
                          <div key={index} className="set-item" style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '12px 0',
                            borderBottom: index < product.setItems.length - 1 ? '1px solid #F0F0F0' : 'none',
                            transition: 'all 0.2s ease'
                          }}>
                            <div className="item-info" style={{ flex: '1', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '6px',
                                height: '6px',
                                backgroundColor: '#8B4513',
                                borderRadius: '50%',
                                flexShrink: 0
                              }}></div>
                              <div>
                                <div className="item-name" style={{ 
                                  fontSize: '13px', 
                                  fontWeight: '600',
                                  color: '#2C3E50',
                                  lineHeight: '1.4'
                                }}>
                                  {item.name || item.furnitureName}
                                </div>
                                <div className="item-quantity" style={{ 
                                  fontSize: '11px',
                                  color: '#7F8C8D',
                                  fontWeight: '500',
                                  marginTop: '2px'
                                }}>
                                  {item.quantity || 1} adet
                                </div>
                              </div>
                            </div>
                            {/* Item price removed */}
                          </div>
                        ))}
                        
                        {/* Total value block removed */}
                      </div>
                    </div>
                  )}

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

                  {/* Miktar ve Satın Al */}
                  <div className="tf-product-info-quantity mb-3">
                    <div className="quantity-title fw-6 mb-2" style={{ fontSize: '14px' }}>Miktar</div>
                    <Quantity setQuantity={setQuantity} />
                  </div>

                  <div className="tf-product-info-buy-button">
                    <form onSubmit={(e) => e.preventDefault()}>
                      <div className="d-flex flex-column gap-12">
                        <button
                          type="button"
                          onClick={() => {
                            // Furniture Set için özel ID formatı kullan (fs_ prefix'i)
                            const productToAdd = {
                              id: `fs_${product.id}`, // Furniture Set prefix'i
                              title: product.title,
                              price: product.price,
                              imgSrc: product.imgSrc || (product.images && product.images[0]) || '/images/default-product.jpg',
                              type: 'furniture_set', // Tip bilgisi ekle
                              category: product.category || product.categoryName || 'Mobilya Takımı'
                            };
                            
                            // Seçilen özellikler
                            const options = {
                              color: currentColor?.name || null,
                              size: currentSize || null
                            };
                            
                            addProductToCart(productToAdd, quantity, options);
                          }}
                          className="tf-btn animate-hover-btn justify-content-center fw-6 custom-cream-btn w-100"
                          style={{ 
                            fontSize: '16px',
                            padding: '12px 20px',
                            backgroundColor: '#F5F5DC',
                            border: '2px solid #F5F5DC',
                            color: '#8B4513',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <span>Takımı Sepete Ekle</span>
                        </button>
                        
                        <a
                          href={`https://wa.me/905335191329?text=${encodeURIComponent(`Merhaba! ${product.title} takımı hakkında daha fazla bilgi almak istiyorum. Ürün linki: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tf-btn btn-outline animate-hover-btn justify-content-center fw-6 w-100"
                          style={{ 
                            fontSize: '16px',
                            padding: '12px 20px',
                            backgroundColor: 'transparent',
                            border: '2px solid #25D366',
                            color: '#25D366',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <span>WhatsApp ile Bilgi Al</span>
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
      <StickyItem product={product} style={{ marginTop: '20px' }} />
    </section>
  );
}
