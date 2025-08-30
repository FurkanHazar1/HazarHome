"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useContextElement } from "@/context/Context";
import CountdownComponent from "../common/Countdown";
import { getColorHex } from "@/utils/colorUtils";
import React from "react";
export const ProductCard = ({ product }) => {
  const [currentImage, setCurrentImage] = useState(product.imgSrc);
  const [currentColor, setCurrentColor] = useState(null);
  const { setQuickViewItem } = useContextElement();
  const {
    setQuickAddItem,
    addToWishlist,
    isAddedtoWishlist,
    addToCompareItem,
    isAddedtoCompareItem,
  } = useContextElement();
  
  useEffect(() => {
    setCurrentImage(product.imgSrc);
    // Renk seçimi için default rengi ayarla
    if (product.colors && product.colors.length > 0) {
      setCurrentColor(product.colors[0]);
    } else {
      setCurrentColor(null);
    }
  }, [product]);

  return (
    <div className="card-product fl-item" key={product.id}>
      <div className="card-product-wrapper">
        <Link 
          href={
            product.type === "furniture_set" || product.furnitureType === "Takım"
              ? `/product-detail-furniture-set/${product.id}` 
              : `/product-detail-furniture/${product.id}`
          } 
          className="product-img"
        >
          <Image
            className="lazyload img-product"
            data-src={product.imgSrc}
            src={currentImage}
            alt="image-product"
            width={720}
            height={1005}
          />
          <Image
            className="lazyload img-hover"
            data-src={
              product.imgHoverSrc ? product.imgHoverSrc : product.imgSrc
            }
            src={product.imgHoverSrc ? product.imgHoverSrc : product.imgSrc}
            alt="image-product"
            width={720}
            height={1005}
          />
        </Link>
        {product.soldOut ? (
          <div className="sold-out">
            <span>Sold out</span>
          </div>
        ) : (
          <>
            <div className="list-product-btn">
              <a
                href="#quick_add"
                onClick={() => setQuickAddItem(product.id)}
                data-bs-toggle="modal"
                className="box-icon bg_white quick-add tf-btn-loading"
              >
                <span className="icon icon-bag" />
                <span className="tooltip">Quick Add</span>
              </a>
              <a
                onClick={() => addToWishlist(product.id)}
                className="box-icon bg_white wishlist btn-icon-action"
              >
                <span
                  className={`icon icon-heart ${
                    isAddedtoWishlist(product.id) ? "added" : ""
                  }`}
                />
                <span className="tooltip">
                  {isAddedtoWishlist(product.id)
                    ? "Already Wishlisted"
                    : "Add to Wishlist"}
                </span>
                <span className="icon icon-delete" />
              </a>
              <a
                href="#compare"
                data-bs-toggle="offcanvas"
                aria-controls="offcanvasLeft"
                onClick={() => addToCompareItem(product.id)}
                className="box-icon bg_white compare btn-icon-action"
              >
                <span
                  className={`icon icon-compare ${
                    isAddedtoCompareItem(product.id) ? "added" : ""
                  }`}
                />
                <span className="tooltip">
                  {" "}
                  {isAddedtoCompareItem(product.id)
                    ? "Already Compared"
                    : "Add to Compare"}
                </span>
                <span className="icon icon-check" />
              </a>
              <a
                href="#quick_view"
                onClick={() => setQuickViewItem(product)}
                data-bs-toggle="modal"
                className="box-icon bg_white quickview tf-btn-loading"
              >
                <span className="icon icon-view" />
                <span className="tooltip">Quick View</span>
              </a>
            </div>
            {product.countdown && (
              <div className="countdown-box">
                <div className="js-countdown">
                  <CountdownComponent />
                </div>
              </div>
            )}
            {product.sizes && (
              <div className="size-list">
                {product.sizes.map((size, index) => (
                  <span key={size.id || size.value || size || index}>
                    {size.value || size}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <div className="card-product-info">
        <Link 
          href={
            product.type === "furniture_set" || product.furnitureType === "Takım"
              ? `/product-detail-furniture-set/${product.id}` 
              : `/product-detail-furniture/${product.id}`
          } 
          className="title link"
        >
          {product.title}
        </Link>
        <span className="price">${product.price.toFixed(2)}</span>
        {product.colors && (
          <div className="tf-product-info-variant-picker">
            <div className="variant-picker-item">
              <div className="variant-picker-label">
                Renk:
                <span className="fw-6 variant-picker-label-value">
                  {currentColor?.name || currentColor?.value || ''}
                </span>
              </div>
              <form className="variant-picker-values">
                {product.colors.map((color, i) => (
                  <React.Fragment key={color.id || color.value || i}>
                    <input
                      id={`color-${product.id}-${color.id || i}`}
                      type="radio"
                      name={`color-${product.id}`}
                      readOnly
                      checked={currentColor?.id === color.id || currentColor === color}
                    />
                    <label
                      onClick={() => {
                        setCurrentColor(color);
                        setCurrentImage(color.imgSrc);
                      }}
                      className="hover-tooltip radius-60"
                      htmlFor={`color-${product.id}-${color.id || i}`}
                      data-value={color.name || color.value}
                      style={{
                        backgroundColor: getColorHex(color),
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: currentColor?.id === color.id || currentColor === color ? '2px solid #000' : '2px solid #ddd',
                        display: 'inline-block',
                        margin: '0 3px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span className="tooltip">{color.name || color.value}</span>
                    </label>
                  </React.Fragment>
                ))}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
