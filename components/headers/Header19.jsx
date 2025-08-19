import Image from "next/image";
import React from "react";
import Nav from "./Nav";
import Link from "next/link";
import CartLength from "../common/CartLength";
import WishlistLength from "../common/WishlistLength";

export default function Header19() {
  return (
    <header
      id="header"
      className="header-default header-style-3 bg_f5f5ec header-plant"
    >
      <div className="container-full px_15 lg-px_40">
        <div className="row wrapper-header align-items-center">
          <div className="col-md-4 col-3 tf-lg-hidden">
            <a
              href="#mobileMenu"
              data-bs-toggle="offcanvas"
              aria-controls="offcanvasLeft"
            >
              <Image
                alt=""
                src="/images/logo/logo-green.png"
                width={136}
                height={21}
              />
            </a>
          </div>
          <div className="col-xl-9 col-md-4 col-6">
            <div className="wrap-header-left">
              <Link href={`/`} className="logo-header">
                <Image
                  alt=""
                  src="/images/logo/logo-green.png"
                  width={136}
                  height={21}
                />
              </Link>
              <nav className="box-navigation text-center">
                <ul className="box-nav-ul d-flex align-items-center justify-content-center gap-30">
                  <Nav />
                  <li className="menu-item">
                    <a
                      href="https://themeforest.net/item/ecomus-ultimate-html5-template/53417990?s_rank=3"
                      className="item-link text_green-1"
                    >
                      Buy now
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
          <div className="col-xl-3 col-md-4 col-3">
            <ul className="nav-icon d-flex justify-content-end align-items-center gap-20">
              <li className="nav-search">
                <a
                  href="#canvasSearch"
                  data-bs-toggle="offcanvas"
                  aria-controls="offcanvasLeft"
                  className="link nav-icon-item text_green-1"
                >
                  <i className="icon icon-search" />
                </a>
              </li>
              <li className="nav-account">
                <a
                  href="#login"
                  data-bs-toggle="modal"
                  className="link nav-icon-item text_green-1"
                >
                  <i className="icon icon-account" />
                </a>
              </li>
              <li className="nav-wishlist">
                <Link
                  href={`/wishlist`}
                  className="link nav-icon-item text_green-1"
                >
                  <i className="icon icon-heart" />
                  <span className="count-box bg_green-9">
                    <WishlistLength />
                  </span>
                </Link>
              </li>
              <li className="nav-cart">
                <a
                  href="#shoppingCart"
                  data-bs-toggle="modal"
                  className="link nav-icon-item text_green-1"
                >
                  <i className="icon icon-bag" />
                  <span className="count-box bg_green-9">
                    <CartLength />
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
