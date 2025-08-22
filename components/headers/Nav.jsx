"use client";
import Link from "next/link";
import React from "react";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { products1 } from "@/data/products";
import { ProductCard } from "../shopCards/ProductCard";
import { Navigation } from "swiper/modules";
import {
  blogLinks,
  pages,
  productDetailPages,
  productsPages,
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
          Oturma Odası Takımları
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
                        width="300"
                        height="329"
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
          Yemek Odası Takımları
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
                        width="300"
                        height="329"
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
          Yatak Odası Takımları
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
                        width="300"
                        height="329"
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
          className={`item-link ${Linkfs} ${textColor}  ${
            isMenuActive(pages) ? "activeMenu" : ""
          }`}
        >
          Hakkımızda
          <i className="icon icon-arrow-down" />
        </a>
        <div className="sub-menu submenu-default">
          <ul className="menu-list">
            {pages.map((item, index) => (
              <li key={index} className={item.links ? "menu-item-2 " : ""}>
                {item.href.includes("#") ? (
                  <a
                    href={item.href}
                    className={`${item.className} ${
                      isMenuActive(item.links) ? "activeMenu" : ""
                    }`}
                  >
                    {item.text}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className={`${item.className}  ${
                      isMenuActive(item) ? "activeMenu" : ""
                    }`}
                    style={{ position: "relative" }}
                  >
                    {item.text}{" "}
                    {item.label && (
                      <div className="demo-label">
                        <span className="demo-new">{item.label}</span>
                      </div>
                    )}
                  </Link>
                )}

                {item.links && (
                  <div className="sub-menu submenu-default">
                    <ul className="menu-list">
                      {item.links.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <Link
                            href={subItem.href}
                            className={`${subItem.className} ${
                              isMenuActive(subItem) ? "activeMenu" : ""
                            }`}
                          >
                            {subItem.text}
                            {subItem.label && (
                              <div className="demo-label">
                                <span className="demo-new">
                                  {subItem.label}
                                </span>
                              </div>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </li>
      <li className="menu-item position-relative">
        <a
          href="#"
          className={`item-link ${Linkfs} ${textColor}  ${
            isMenuActive(blogLinks) ? "activeMenu" : ""
          }`}
        >
          Blog
          {isArrow ? <i className="icon icon-arrow-down" /> : ""}
        </a>
        <div className="sub-menu links-default">
          <ul className="menu-list">
            {blogLinks.map((linkItem, index) => (
              <li key={index}>
                <Link
                  href={linkItem.href}
                  className={`menu-link-text link text_black-2  ${
                    isMenuActive(linkItem) ? "activeMenu" : ""
                  }`}
                >
                  {linkItem.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </li>
    </>
  );
}
