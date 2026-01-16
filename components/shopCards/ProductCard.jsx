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
    addProductToCart,
    addToWishlist,
    isAddedtoWishlist,
    addToCompareItem,
    isAddedtoCompareItem,
  } = useContextElement();
  
  useEffect(() => {
    setCurrentImage(product.imgSrc);
    setCurrentColor(null); // Renk seçimi kaldırıldı
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
            height={540}
          />
          <Image
            className="lazyload img-hover"
            data-src={
              product.imgHoverSrc ? product.imgHoverSrc : product.imgSrc
            }
            src={product.imgHoverSrc ? product.imgHoverSrc : product.imgSrc}
            alt="image-product"
            width={720}
            height={540}
          />
        </Link>
        {product.soldOut ? (
          <div className="sold-out">
            <span>Sold out</span>
          </div>
        ) : (
          <>
            <div className="list-product-btn">
              <button
                type="button"
                onClick={() => addProductToCart(product, 1)}
                className="box-icon bg_white quick-add tf-btn-loading"
              >
                <span className="icon icon-bag" />
                <span className="tooltip">Sepete Ekle</span>
              </button>


              <a
                href="#quick_view"
                onClick={() => setQuickViewItem(product)}
                data-bs-toggle="modal"
                className="box-icon bg_white quickview tf-btn-loading"
              >
                <span className="icon icon-view" />
                <span className="tooltip">İncele</span>
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
  {/* Price removed */}
  {/* Renk bilgisi kaldırıldı */}
      </div>
    </div>
  );
};
