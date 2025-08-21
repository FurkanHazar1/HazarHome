"use client";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import {
  oturmaOdasiCategories,
  yemekOdasiCategories,
  yatakOdasiCategories
} from "@/data/menu";
import { usePathname } from "next/navigation";
export default function HomesModal() {
  const pathname = usePathname();
  
  // Tüm kategorileri birleştir
  const allCategories = [
    ...oturmaOdasiCategories,
    ...yemekOdasiCategories,
    ...yatakOdasiCategories
  ];

  return (
    <div className="modal fade modalDemo" id="modalDemo">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="header">
            <h5 className="demo-title">Mobilya Kategorileri</h5>
            <span
              className="icon-close icon-close-popup"
              data-bs-dismiss="modal"
            />
          </div>
          <div className="mega-menu">
            <div className="row-demo">
              {allCategories.map((item, index) => (
                <div key={index} className="demo-item">
                  <Link href={item.href}>
                    <div className="demo-image position-relative">
                      <Image
                        className="lazyload"
                        data-src={item.src}
                        alt={item.alt}
                        src={item.src}
                        width={300}
                        height={329}
                      />
                      {item.labels && (
                        <div className={`demo-label`}>
                          {item.labels.map((label, labelIndex) => (
                            <span
                              key={labelIndex}
                              className={label.className || `demo-${label.text?.toLowerCase()}`}
                            >
                              {label.text || label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span
                      className={`demo-name  ${
                        pathname == item.href ? "activeMenu" : ""
                      }`}
                    >
                      {item.name}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
