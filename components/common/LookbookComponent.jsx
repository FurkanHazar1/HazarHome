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
            fill
            sizes="(max-width: 768px) 60px, 100px"
            style={{ objectFit: 'cover', borderRadius: '4px' }}
          />
        </Link>
        <div className="content-wrap">
          <div className="product-title">
            <Link href={product.href}>{product.title}</Link>
          </div>
          <div className="price">{product.price} TL</div>
        </div>
        <Link href={product.href} className="">
           <i className="icon-arrow1-top-left" />
        </Link>
      </div>
    </li>
  );
}
