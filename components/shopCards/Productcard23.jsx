"use client";
import { useState } from "react";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useContextElement } from "@/context/Context";
export default function Productcard23({ product }) {
  const [currentImage, setCurrentImage] = useState(product.imgSrc);
  const { setQuickViewItem } = useContextElement();
  const {
    setQuickAddItem,
    addToWishlist,
    isAddedtoWishlist,
    addToCompareItem,
    isAddedtoCompareItem,
  } = useContextElement();
  return (
    <div className="card-product list-layout">
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
            alt="image-product"
            src={currentImage}
            width={720}
            height={1005}
          />
          <Image
            className="lazyload img-hover"
            alt="image-product"
            src={product.imgHoverSrc}
            width={720}
            height={1005}
          />
        </Link>
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
  <span className="price">{product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</span>
  {/* Açıklama ve renk bilgisi kaldırıldı */}
        {product.sizes && (
          <div className="size-list">
            {product.sizes.map((size) => (
              <span key={size}>{size}</span>
            ))}
          </div>
        )}
        <div className="list-product-btn">
          <a
            href="#quick_add"
            onClick={() => setQuickAddItem(product.id)}
            data-bs-toggle="modal"
            className="box-icon quick-add style-3 hover-tooltip"
          >
            <span className="icon icon-bag" />
            <span className="tooltip">Quick add</span>
          </a>
          <a
            onClick={() => addToWishlist(product.id)}
            className="box-icon wishlist style-3 hover-tooltip"
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
          </a>

          <a
            href="#compare"
            data-bs-toggle="offcanvas"
            aria-controls="offcanvasLeft"
            onClick={() => addToCompareItem(product.id)}
            className="box-icon compare style-3 hover-tooltip"
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
          </a>
          <a
            href="#quick_view"
            onClick={() => setQuickViewItem(product)}
            data-bs-toggle="modal"
            className="box-icon quickview style-3 hover-tooltip"
          >
            <span className="icon icon-view" />
            <span className="tooltip">Quick view</span>
          </a>
        </div>
      </div>
    </div>
  );
}
