"use client";
import React from "react";
import Link from "next/link";
import LanguageSelect from "../common/LanguageSelect";
import CurrencySelect from "../common/CurrencySelect";
import { navItems, oturmaOdasiCategories, yemekOdasiCategories, yatakOdasiCategories } from "@/data/menu";
import { usePathname } from "next/navigation";
export default function MobileMenu() {
  const pathname = usePathname();
  const isMenuActive = (menuItem) => {
    let active = false;
    if (menuItem.href?.includes("/")) {
      if (menuItem.href?.split("/")[1] == pathname.split("/")[1]) {
        active = true;
      }
    }
    if (menuItem.links) {
      menuItem.links?.forEach((elm2) => {
        if (elm2.href?.includes("/")) {
          if (elm2.href?.split("/")[1] == pathname.split("/")[1]) {
            active = true;
          }
        }
        if (elm2.links) {
          elm2.links.forEach((elm3) => {
            if (elm3.href.split("/")[1] == pathname.split("/")[1]) {
              active = true;
            }
          });
        }
      });
    }

    return active;
  };
  return (
    <div className="offcanvas offcanvas-start canvas-mb" id="mobileMenu">
      <span
        className="icon-close icon-close-popup"
        data-bs-dismiss="offcanvas"
        aria-label="Close"
      />
      <div className="mb-canvas-content">
        <div className="mb-body">
          <ul className="nav-ul-mb" id="wrapper-menu-navigation">
            {/* Furniture Categories */}
            <li className="nav-mb-item">
              <a
                href="#oturma-odasi"
                className={`collapsed mb-menu-link current ${
                  isMenuActive({ links: oturmaOdasiCategories }) ? "activeMenu" : ""
                }`}
                data-bs-toggle="collapse"
                aria-expanded="true"
                aria-controls="oturma-odasi"
              >
                <span>Oturma Odası</span>
                <span className="btn-open-sub" />
              </a>
              <div id="oturma-odasi" className="collapse">
                <ul className="sub-nav-menu">
                  {oturmaOdasiCategories.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className={`sub-nav-link ${
                          isMenuActive(item) ? "activeMenu" : ""
                        }`}
                      >
                        {item.name}
                        {item.labels && (
                          <div className="demo-label">
                            {item.labels.map((label, labelIndex) => (
                              <span
                                key={labelIndex}
                                className={label.className || "demo-new"}
                              >
                                {label.text}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
            
            <li className="nav-mb-item">
              <a
                href="#yemek-odasi"
                className={`collapsed mb-menu-link current ${
                  isMenuActive({ links: yemekOdasiCategories }) ? "activeMenu" : ""
                }`}
                data-bs-toggle="collapse"
                aria-expanded="true"
                aria-controls="yemek-odasi"
              >
                <span>Yemek Odası</span>
                <span className="btn-open-sub" />
              </a>
              <div id="yemek-odasi" className="collapse">
                <ul className="sub-nav-menu">
                  {yemekOdasiCategories.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className={`sub-nav-link ${
                          isMenuActive(item) ? "activeMenu" : ""
                        }`}
                      >
                        {item.name}
                        {item.labels && (
                          <div className="demo-label">
                            {item.labels.map((label, labelIndex) => (
                              <span
                                key={labelIndex}
                                className={label.className || "demo-new"}
                              >
                                {label.text}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
            
            <li className="nav-mb-item">
              <a
                href="#yatak-odasi"
                className={`collapsed mb-menu-link current ${
                  isMenuActive({ links: yatakOdasiCategories }) ? "activeMenu" : ""
                }`}
                data-bs-toggle="collapse"
                aria-expanded="true"
                aria-controls="yatak-odasi"
              >
                <span>Yatak Odaları</span>
                <span className="btn-open-sub" />
              </a>
              <div id="yatak-odasi" className="collapse">
                <ul className="sub-nav-menu">
                  {yatakOdasiCategories.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className={`sub-nav-link ${
                          isMenuActive(item) ? "activeMenu" : ""
                        }`}
                      >
                        {item.name}
                        {item.labels && (
                          <div className="demo-label">
                            {item.labels.map((label, labelIndex) => (
                              <span
                                key={labelIndex}
                                className={label.className || "demo-new"}
                              >
                                {label.text}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
            
            <li className="nav-mb-item">
              <a
                href="#"
                className="mb-menu-link"
              >
                Hakkımızda
              </a>
            </li>
          </ul>
          <div className="mb-other-content">
            <div className="d-flex group-icon">
              <Link href={`/wishlist`} className="site-nav-icon">
                <i className="icon icon-heart" />
                İstek Listesi
              </Link>
              <Link href={`/search`} className="site-nav-icon">
                <i className="icon icon-search" />
                Arama
              </Link>
            </div>
            <div className="mb-notice">
              <Link href={`/contact`} className="text-need">
                Yardıma mı ihtiyacınız var?
              </Link>
            </div>
            <ul className="mb-info">
              <li>
                Adres: Mobilya Caddesi No:123, <br />
                İstanbul, Türkiye
              </li>
              <li>
                Email: <b>info@hazarhome.com</b>
              </li>
              <li>
                Telefon: <b>(0212) 555-0123</b>
              </li>
            </ul>
          </div>
        </div>
        <div className="mb-bottom">
          <Link href={`/login`} className="site-nav-icon">
            <i className="icon icon-account" />
            Giriş Yap
          </Link>
          <div className="bottom-bar-language">
            <div className="tf-currencies">
              <CurrencySelect />
            </div>
            <div className="tf-languages">
              <LanguageSelect
                parentClassName={
                  "image-select center style-default type-languages"
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
