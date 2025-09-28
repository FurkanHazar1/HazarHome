"use client";
import { useContextElement } from "@/context/Context";
import { lookbookProducts } from "@/data/products";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function LookbookComponent({ product = lookbookProducts[0] }) {
  const { setQuickViewItem } = useContextElement();
  return (
    <li>
      <div className="lookbook-product" style={{ maxWidth: 240 }}>
        <Link href={product.href} className="image">
          <Image
            className="lazyload"
            data-src={product.imgSrc}
            alt="lookbook-item"
            src={product.imgSrc}
            width={product.width}
            height={product.height}
          />
        </Link>
        <div className="content-wrap">
          <div className="product-title">
              <a href={product.href}>{product.title}</a>
          </div>
          <div className="price">${product.price.toFixed(2)}</div>
        </div>
      </div>
    </li>
  );
}
