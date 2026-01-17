"use client";
import { useContextElement } from "@/context/Context";
import { lookbookProducts } from "@/data/products";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function LookbookComponent({ product = lookbookProducts[0], className = "" }) {
  const { setQuickViewItem } = useContextElement();
  return (
    <li>
      <div className={`lookbook-product ${className}`}>
        <Link href={product.href} className="image">
          <Image
            className="lazyload"
            alt="lookbook-item"
            src={product.imgSrc}
            width={product.width || 100}
            height={product.height || 100}
            sizes="(max-width: 768px) 250px, 250px"
            style={{ maxHeight: '100%', width: 'auto', height: 'auto',borderRadius: '4px' }}
            unoptimized={false}
            quality={85}
          />
        </Link>
        <div className="content-wrap">
          <div className="product-title">
            <Link href={product.href}>{product.title}</Link>
          </div>
          <div className="price">{typeof product.price === 'number' ? product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : product.price} TL</div>
        </div>
        <Link href={product.href} className="">
           <i className="icon-arrow1-top-left" />
        </Link>
      </div>
    </li>
  );
}
