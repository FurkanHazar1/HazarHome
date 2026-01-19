"use client";
import React, { useState } from "react";
import Link from "next/link";
import LanguageSelect from "../common/LanguageSelect";
import CurrencySelect from "../common/CurrencySelect";
import { navItems, oturmaOdasiCategories, yemekOdasiCategories, yatakOdasiCategories } from "@/data/menu";
import { usePathname } from "next/navigation";
export default function MobileMenu() {
  const pathname = usePathname();
  // Collapse state for each menu
  const [openMenus, setOpenMenus] = useState({});

  const handleToggleMenu = (menuKey) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };
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
                <div className="mb-menu-parent">
                  <button
                    type="button"
                    className={`collapsed mb-menu-link current btn-menu-toggle ${isMenuActive({ links: oturmaOdasiCategories }) ? "activeMenu" : ""}`}
                    aria-expanded={openMenus["oturma-odasi"] ? "true" : "false"}
                    aria-controls="oturma-odasi"
                    onClick={() => handleToggleMenu("oturma-odasi")}
                    style={{ display: "flex", alignItems: "center", width: "100%", background: "none", border: "none", padding: 0 }}
                  >
                    <span>Oturma Odası</span>
                    <span className="btn-open-sub" style={{ marginLeft: "auto" }}>
                      {openMenus["oturma-odasi"] ? "-" : "+"}
                    </span>
                  </button>
                  {openMenus["oturma-odasi"] && (
                    <div id="oturma-odasi">
                      <ul className="sub-nav-menu">
                        {oturmaOdasiCategories.map((item, index) => (
                          <li key={index}>
                            <Link
                              href={item.href}
                              className={`sub-nav-link ${isMenuActive(item) ? "activeMenu" : ""}`}
                              onClick={() => setOpenMenus({})}
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
                  )}
                </div>
            </li>
            
            <li className="nav-mb-item">
                <div className="mb-menu-parent">
                  <button
                    type="button"
                    className={`collapsed mb-menu-link current btn-menu-toggle ${isMenuActive({ links: yemekOdasiCategories }) ? "activeMenu" : ""}`}
                    aria-expanded={openMenus["yemek-odasi"] ? "true" : "false"}
                    aria-controls="yemek-odasi"
                    onClick={() => handleToggleMenu("yemek-odasi")}
                    style={{ display: "flex", alignItems: "center", width: "100%", background: "none", border: "none", padding: 0 }}
                  >
                    <span>Yemek Odası</span>
                    <span className="btn-open-sub" style={{ marginLeft: "auto" }}>
                      {openMenus["yemek-odasi"] ? "-" : "+"}
                    </span>
                  </button>
                  {openMenus["yemek-odasi"] && (
                    <div id="yemek-odasi">
                      <ul className="sub-nav-menu">
                        {yemekOdasiCategories.map((item, index) => (
                          <li key={index}>
                            <Link
                              href={item.href}
                              className={`sub-nav-link ${isMenuActive(item) ? "activeMenu" : ""}`}
                              onClick={() => setOpenMenus({})}
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
                  )}
                </div>
            </li>
            
            <li className="nav-mb-item">
                <div className="mb-menu-parent">
                  <button
                    type="button"
                    className={`collapsed mb-menu-link current btn-menu-toggle ${isMenuActive({ links: yatakOdasiCategories }) ? "activeMenu" : ""}`}
                    aria-expanded={openMenus["yatak-odasi"] ? "true" : "false"}
                    aria-controls="yatak-odasi"
                    onClick={() => handleToggleMenu("yatak-odasi")}
                    style={{ display: "flex", alignItems: "center", width: "100%", background: "none", border: "none", padding: 0 }}
                  >
                    <span>Yatak Odaları</span>
                    <span className="btn-open-sub" style={{ marginLeft: "auto" }}>
                      {openMenus["yatak-odasi"] ? "-" : "+"}
                    </span>
                  </button>
                  {openMenus["yatak-odasi"] && (
                    <div id="yatak-odasi">
                      <ul className="sub-nav-menu">
                        {yatakOdasiCategories.map((item, index) => (
                          <li key={index}>
                            <Link
                              href={item.href}
                              className={`sub-nav-link ${isMenuActive(item) ? "activeMenu" : ""}`}
                              onClick={() => setOpenMenus({})}
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
                  )}
                </div>
            </li>
            
            <li className="nav-mb-item">
              <a
                href="/contact"
                className="mb-menu-link"
              >
                Sosyal Medya
              </a>
            </li>
          </ul>
          <div className="mb-other-content">
            <div className="d-flex group-icon">
              {/* Social Media Icons (copied from Footer1) */}
              <ul className="tf-social-icon d-flex gap-10" style={{marginBottom: 12}}>
                <li>
                  <a
                    href="https://www.facebook.com/people/Hazar-Home/61577648638207/"
                    className="box-icon w_34 round social-facebook social-line"
                    target="_blank" rel="noopener noreferrer"
                  >
                    <i className="icon fs-14 icon-fb" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com/hazarhometr/"
                    className="box-icon w_34 round social-instagram social-line"
                    target="_blank" rel="noopener noreferrer"
                  >
                    <i className="icon fs-14 icon-instagram" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.tiktok.com/@hazarhometr"
                    className="box-icon w_34 round social-tiktok social-line"
                    target="_blank" rel="noopener noreferrer"
                  >
                    <i className="icon fs-14 icon-tiktok" />
                  </a>
                </li>
              </ul>
            </div>
            <div className="mb-notice">
              <Link href={`/contact`} className="text-need">
                Bize Ulaşın
              </Link>
            </div>
            <ul className="mb-info">
              <li>
                Adres: Topkapı Maltepe Yolu, Numara 4, Tek Merkez AVM, Stand No: 100-101-102 <br />
                Bayrampaşa, Istanbul, Turkey
              </li>
              <li>
                Email: <b>info@hazarhome.com</b>
              </li>
              <li>
                Telefon: <b> +90 533 519 13 29</b>
              </li>
            </ul>
          </div>
        </div>
       
     
      </div>
    </div>
  );
}
