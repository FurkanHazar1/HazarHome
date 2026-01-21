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
        <Link href={product.href} className="image" style={{ borderRadius: '8px', overflow: 'hidden' }}>
          <Image
            alt="lookbook-item"
            src={product.imgSrc}
            width={product.width || 100}
            height={product.height || 100}
            sizes="(max-width: 768px) 250px, 250px"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            priority={true}
            unoptimized={true}
          />
        </Link>
        <div className="content-wrap">
          <div className="product-title">
            <Link href={product.href}>{product.title}</Link>
          </div>
        </div>
        <Link href={product.href} className="">
           <i className="icon-arrow1-top-left" />
        </Link>
      </div>
    </li>
  );
}
