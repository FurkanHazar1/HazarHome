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
              <div className="tf-product-media-wrap sticky-top">
                <div className="thumbs-slider">
                  <SliderWithGalleryPopup
                    handleColor={handleColor}
                    currentColor={currentColor.value || ""}
                    firstImage={product.imgSrc}
                    images={product.images}
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
                    <div className="tf-product-info-badges mt-2">
                      <div className="badges">Furniture Set</div>
                      <div className="badges bg-secondary">Komple Takım</div>
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

                  {/* Takım İçeriği */}
                  {product.setItems && product.setItems.length > 0 && (
                    <div className="tf-product-info-set-items mb-4">
                      <h6 className="fw-6 mb-3">Takım İçeriği ({product.setItems.length} Parça)</h6>
                      <div className="set-items-list">
                        {product.setItems.map((item, index) => (
                          <div key={item.furnitureId || item.name || index} className="set-item border rounded p-3 mb-3">
                            <div className="row align-items-center">
                              <div className="col-md-2">
                                {item.image && (
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    width={60}
                                    height={60}
                                    className="rounded"
                                    style={{objectFit: 'cover'}}
                                  />
                                )}
                              </div>
                              <div className="col-md-6">
                                <div className="item-info">
                                  <h6 className="item-name fw-6 mb-1">{item.name}</h6>
                                  <span className="item-quantity badge bg-primary me-2">x{item.quantity}</span>
                                  {item.price && (
                                    <span className="item-price text-success fw-6">${item.price.toLocaleString()}</span>
                                  )}
                                  {item.description && (
                                    <div className="item-description text-muted small mt-1">{item.description}</div>
                                  )}
                                  {item.properties && item.properties.length > 0 && (
                                    <div className="item-properties mt-2">
                                      {item.properties.slice(0, 2).map((prop, propIndex) => (
                                        <span key={`${item.furnitureId || item.name}-${prop.name}-${propIndex}`} className="badge bg-light text-dark me-1 small">
                                          {prop.name}: {prop.value}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="col-md-4 text-end">
                                <div className="item-actions">
                                  {item.individualLink && (
                                    <Link href={item.individualLink} className="btn btn-outline-primary btn-sm mb-2 d-block">
                                      <i className="icon-eye me-1"></i>
                                      Detayları Gör
                                    </Link>
                                  )}
                                  <div className="item-status d-flex align-items-center justify-content-end">
                                    <i className="icon-check text-success me-1" />
                                    <span className="small text-success">Takımda Dahil</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Takım Toplamı */}
                        <div className="set-total bg-light p-3 rounded mt-3">
                          <div className="row">
                            <div className="col-md-8">
                              <strong>Takım Toplam Değeri:</strong>
                            </div>
                            <div className="col-md-4 text-end">
                              <span className="text-decoration-line-through text-muted me-2">
                                ${product.setItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
                              </span>
                              <strong className="text-success">
                                ${product.price.toLocaleString()}
                              </strong>
                            </div>
                          </div>
                          <div className="row mt-2">
                            <div className="col-12 text-center">
                              <span className="badge bg-success">
                                Takım Alımında %{Math.round((1 - product.price / product.setItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)) * 100)} İndirim
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Özellikler */}
                  {product.properties && product.properties.length > 0 && (
                    <div className="tf-product-info-properties">
                      <h6 className="fw-6 mb-3">Takım Özellikleri</h6>
                      <div className="properties-list">
                        {product.properties.map((property, index) => (
                          <div key={`property-${property.name}-${index}`} className="property-item d-flex justify-content-between mb-2">
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
                              <span className={`btn-checkbox ${color.colorClass}`} />
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

                  {/* Takım Avantajları */}
                  <div className="tf-product-info-set-advantages bg-light p-3 rounded mt-4">
                    <h6 className="fw-6 mb-3">
                      <i className="icon-star text-warning me-2"></i>
                      Takım Avantajları
                    </h6>
                    <ul className="advantages-list list-unstyled">
                      <li className="mb-2">
                        <i className="icon-check text-success me-2"></i>
                        Tek seferde komple mobilya çözümü
                      </li>
                      <li className="mb-2">
                        <i className="icon-check text-success me-2"></i>
                        Uyumlu renk ve tasarım garantisi
                      </li>
                      <li className="mb-2">
                        <i className="icon-check text-success me-2"></i>
                        Tekli alıma göre %15-20 tasarruf
                      </li>
                      <li className="mb-2">
                        <i className="icon-check text-success me-2"></i>
                        Profesyonel montaj hizmeti dahil
                      </li>
                    </ul>
                  </div>

                  {/* Ödeme Bilgileri */}
                  <div className="tf-product-info-payment">
                    <div className="payment-methods">
                      <div className="payment-item">
                        <i className="icon-truck" />
                        <span>Ücretsiz Kargo & Montaj</span>
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

          {/* İlişkili Mobilyalar Bölümü */}
          {product.setItems && product.setItems.length > 0 && (
            <div className="row mt-5">
              <div className="col-12">
                <div className="tf-related-items">
                  <div className="tf-heading text-center mb-4">
                    <h4 className="fw-7">Takımdaki Mobilyalar</h4>
                    <p className="text_black-2">Bu takımı oluşturan bireysel mobilyaları inceleyin</p>
                  </div>
                  <div className="row">
                    {product.setItems.map((item, index) => (
                      <div key={index} className="col-lg-4 col-md-6 mb-4">
                        <div className="related-item-card h-100 border rounded overflow-hidden shadow-sm">
                          {item.image && (
                            <div className="item-image position-relative">
                              <Image
                                className="lazyload"
                                data-src={item.image}
                                alt={item.name}
                                src={item.image}
                                width={300}
                                height={200}
                                style={{ objectFit: "cover", width: "100%", height: "200px" }}
                              />
                              {item.quantity > 1 && (
                                <div className="quantity-badge position-absolute top-0 end-0 bg-primary text-white px-2 py-1 m-2 rounded">
                                  x{item.quantity}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="item-content p-3">
                            <h6 className="item-title fw-6 mb-2">{item.name}</h6>
                            {item.description && (
                              <p className="item-description text-muted small mb-3">{item.description}</p>
                            )}
                            {item.properties && item.properties.length > 0 && (
                              <div className="item-properties">
                                <ul className="list-unstyled small">
                                  {item.properties.slice(0, 3).map((prop, propIndex) => (
                                    <li key={propIndex} className="mb-1">
                                      <strong>{prop.name}:</strong> {prop.value}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {item.price && (
                              <div className="item-price mt-2">
                                <span className="price fw-6 text-primary">${item.price.toFixed(2)}</span>
                                {item.quantity > 1 && (
                                  <span className="total-price text-muted ms-2">
                                    (Toplam: ${(item.price * item.quantity).toFixed(2)})
                                  </span>
                                )}
                              </div>
                            )}
                            {item.individualLink && (
                              <div className="item-actions mt-3">
                                <Link 
                                  href={item.individualLink}
                                  className="btn btn-outline-primary btn-sm w-100"
                                >
                                  Detayını İncele
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Takım vs Bireysel Karşılaştırma */}
                  <div className="set-comparison mt-4 p-4 bg-light rounded">
                    <h6 className="fw-6 mb-3">
                      <i className="icon-calculator me-2"></i>
                      Fiyat Karşılaştırması
                    </h6>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="comparison-item">
                          <h6 className="text-muted">Bireysel Alım Fiyatı:</h6>
                          <div className="individual-total">
                            {product.setItems.reduce((total, item) => {
                              return total + (item.price ? item.price * item.quantity : 0);
                            }, 0) > 0 && (
                              <span className="price-individual text-decoration-line-through text-muted fs-5">
                                ${product.setItems.reduce((total, item) => {
                                  return total + (item.price ? item.price * item.quantity : 0);
                                }, 0).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="comparison-item">
                          <h6 className="text-primary">Takım Fiyatı:</h6>
                          <div className="set-total">
                            <span className="price-set text-primary fw-6 fs-4">
                              ${product.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {product.setItems.reduce((total, item) => {
                      return total + (item.price ? item.price * item.quantity : 0);
                    }, 0) > 0 && (
                      <div className="savings mt-3 text-center">
                        <div className="savings-amount bg-success text-white px-3 py-2 rounded d-inline-block">
                          <i className="icon-gift me-2"></i>
                          Tasarruf: ${(product.setItems.reduce((total, item) => {
                            return total + (item.price ? item.price * item.quantity : 0);
                          }, 0) - product.price).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <StickyItem product={product} />
    </section>
  );
}
