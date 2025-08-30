"use client";
import Link from "next/link";
import React from "react";

import Image from "next/image";

import {

  oturmaOdasiCategories,
  yemekOdasiCategories,
  yatakOdasiCategories,
} from "@/data/menu";
import { usePathname } from "next/navigation";

export default function Nav({ isArrow = true, textColor = "", Linkfs = "" }) {
  const pathname = usePathname();
  const isMenuActive = (menuItem) => {
    let active = false;
    if (menuItem.href?.includes("/")) {
      if (menuItem.href?.split("/")[1] == pathname.split("/")[1]) {
        active = true;
      }
    }
    if (menuItem.length) {
      active = menuItem.some(
        (elm) => elm.href?.split("/")[1] == pathname.split("/")[1]
      );
    }
    if (menuItem.length) {
      menuItem.forEach((item) => {
        item.links?.forEach((elm2) => {
          if (elm2.href?.includes("/")) {
            if (elm2.href?.split("/")[1] == pathname.split("/")[1]) {
              active = true;
            }
          }
          if (elm2.length) {
            elm2.forEach((item2) => {
              item2?.links?.forEach((elm3) => {
                if (elm3.href.split("/")[1] == pathname.split("/")[1]) {
                  active = true;
                }
              });
            });
          }
        });
        if (item.href?.includes("/")) {
          if (item.href?.split("/")[1] == pathname.split("/")[1]) {
            active = true;
          }
        }
      });
    }

    return active;
  };
  return (
    <>
      {" "}
      <li className="menu-item">
        <Link
          href="/oturma-odasi"
          className={`item-link ${Linkfs} ${textColor} ${
            isMenuActive(oturmaOdasiCategories) ? "activeMenu" : ""
          } `}
        >
          Oturma Odası
          {isArrow ? <i className="icon icon-arrow-down" /> : ""}
        </Link>
        <div className="sub-menu mega-menu">
          <div className="container">
            <div className="row-demo">
              {oturmaOdasiCategories.map((item, index) => (
                <div
                  className={`demo-item ${
                    isMenuActive(item) ? "activeMenu" : ""
                  } `}
                  key={index}
                >
                  <Link href={item.href}>
                    <div className="demo-image position-relative">
                      <Image
                        className="lazyload"
                        data-src={item.src}
                        alt={item.alt}
                        src={item.src}
                        width={300}
                        height={329}
                        style={{
                          width: '200px',
                          height: '150px',
                          objectFit: 'cover'
                        }}
                      />
                      {item.labels && (
                        <div className="demo-label">
                          {item.labels.map((label, labelIndex) => (
                            <span
                              key={labelIndex}
                              className={label.className || undefined}
                            >
                              {label.text}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="demo-name">{item.name}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </li>
      <li className="menu-item">
        <Link
          href="/yemek-odasi"
          className={`item-link ${Linkfs} ${textColor} ${
            isMenuActive(yemekOdasiCategories) ? "activeMenu" : ""
          } `}
        >
          Yemek Odası
          {isArrow ? <i className="icon icon-arrow-down" /> : ""}
        </Link>
        <div className="sub-menu mega-menu">
          <div className="container">
            <div className="row-demo">
              {yemekOdasiCategories.map((item, index) => (
                <div
                  className={`demo-item ${
                    isMenuActive(item) ? "activeMenu" : ""
                  } `}
                  key={index}
                >
                  <Link href={item.href}>
                    <div className="demo-image position-relative">
                      <Image
                        className="lazyload"
                        data-src={item.src}
                        alt={item.alt}
                        src={item.src}
                        width={300}
                        height={329}
                        style={{
                          width: '200px',
                          height: '150px',
                          objectFit: 'cover'
                        }}
                      />
                      {item.labels && (
                        <div className="demo-label">
                          {item.labels.map((label, labelIndex) => (
                            <span
                              key={labelIndex}
                              className={label.className || undefined}
                            >
                              {label.text}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="demo-name">{item.name}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </li>
      <li className="menu-item">
        <Link
          href="/yatak-odasi"
          className={`item-link ${Linkfs} ${textColor} ${
            isMenuActive(yatakOdasiCategories) ? "activeMenu" : ""
          } `}
        >
          Yatak Odaları
          {isArrow ? <i className="icon icon-arrow-down" /> : ""}
        </Link>
        <div className="sub-menu mega-menu">
          <div className="container">
            <div className="row-demo">
              {yatakOdasiCategories.map((item, index) => (
                <div
                  className={`demo-item ${
                    isMenuActive(item) ? "activeMenu" : ""
                  } `}
                  key={index}
                >
                  <Link href={item.href}>
                    <div className="demo-image position-relative">
                      <Image
                        className="lazyload"
                        data-src={item.src}
                        alt={item.alt}
                        src={item.src}
                        width={300}
                        height={329}
                        style={{
                          width: '200px',
                          height: '150px',
                          objectFit: 'cover'
                        }}
                      />
                      {item.labels && (
                        <div className="demo-label">
                          {item.labels.map((label, labelIndex) => (
                            <span
                              key={labelIndex}
                              className={label.className || undefined}
                            >
                              {label.text}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="demo-name">{item.name}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </li>
      <li className="menu-item position-relative">
        <a
          href="#"
          className="item-link"
        >
          Hakkımızda
          
        </a>
   
      </li>
      
    </>
  );
}
