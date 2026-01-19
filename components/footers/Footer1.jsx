"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import LanguageSelect from "../common/LanguageSelect";
import CurrencySelect from "../common/CurrencySelect";

import { aboutLinks, footerLinks, furnitureCategories, paymentImages } from "@/data/footerLinks";
export default function Footer1({ bgColor = "" }) {
  useEffect(() => {
    const headings = document.querySelectorAll(".footer-heading-moblie");

    const toggleOpen = (event) => {
      const parent = event.target.closest(".footer-col-block");

      parent.classList.toggle("open");
    };

    headings.forEach((heading) => {
      heading.addEventListener("click", toggleOpen);
    });

    // Clean up event listeners when the component unmounts
    return () => {
      headings.forEach((heading) => {
        heading.removeEventListener("click", toggleOpen);
      });
    };
  }, []); // Empty dependency array means this will run only once on mount

  const formRef = useRef();
  const [success, setSuccess] = useState(true);
  const [showMessage, setShowMessage] = useState(false);

  const handleShowMessage = () => {
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
    }, 2000);
  };

  const sendEmail = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    const email = e.target.email.value;

    try {
      const response = await axios.post(
        "https://express-brevomail.vercel.app/api/contacts",
        {
          email,
        }
      );

      if ([200, 201].includes(response.status)) {
        e.target.reset(); // Reset the form
        setSuccess(true); // Set success state
        handleShowMessage();
      } else {
        setSuccess(false); // Handle unexpected responses
        handleShowMessage();
      }
    } catch (error) {
      console.error("Error:", error.response?.data || "An error occurred");
      setSuccess(false); // Set error state
      handleShowMessage();
      e.target.reset(); // Reset the form
    }
  };

  return (
    <footer id="footer" className={`footer md-pb-70 ${bgColor}`}>
      <div className="footer-wrap">
        <div className="footer-body">
          <div className="container">
            <div className="row">
              <div className="col-xl-3 col-md-6 col-12">
                <div className="footer-infor">
                  <ul>
                    <li>
                      <p>
                        Adres: Topkapı Maltepe Yolu, Numara 4, Tek Merkez AVM, Stand No: 100-101-102  <br />
                        Bayrampaşa, Istanbul, Turkey
                      </p>
                    </li>
                    <li>
                      <p>
                        Email: <a href="#">info@hazarhome.com</a>
                      </p>
                    </li>
                    <li>
                      <p>
                        Telefon: <a href="#">+90 533 519 13 29</a>
                      </p>
                    </li>
                  </ul>
                  
                </div>
              </div>
              
              {/* Mobilya Kategorileri */}
              {furnitureCategories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="col-xl-2 col-md-6 col-12 footer-col-block">
                  <div className="footer-heading footer-heading-desktop">
                    <h6>{category.title}</h6>
                  </div>
                  <div className="footer-heading footer-heading-moblie">
                    <h6>{category.title}</h6>
                  </div>
                  <ul className="footer-menu-list tf-collapse-content">
                    {category.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <Link href={link.href} className="footer-menu_item">
                          {link.text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              
              <div className="col-xl-3 col-md-6 col-12">
                <div className="footer-newsletter footer-col-block">
                  <div className="footer-heading footer-heading-desktop">
                    <h6>Bizi Takip Edin</h6>
                  </div>
                  <div className="footer-heading footer-heading-moblie">
                    <h6>Bizi Takip Edin</h6>
                  </div>
                <ul className="tf-social-icon d-flex gap-10">
                    <li>
                      <a
                        href="https://www.facebook.com/people/Hazar-Home/61577648638207/"
                        className="box-icon w_34 round social-facebook social-line"
                      >
                        <i className="icon fs-14 icon-fb" />
                      </a>
                    </li>
                
                    <li>
                      <a
                        href="https://www.instagram.com/hazarhometr/"
                        className="box-icon w_34 round social-instagram social-line"
                      >
                        <i className="icon fs-14 icon-instagram" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://www.tiktok.com/@hazarhometr"
                        className="box-icon w_34 round social-tiktok social-line"
                      >
                        <i className="icon fs-14 icon-tiktok" />
                      </a>
                    </li>
                    
                  </ul>
                  <div className="footer-logo mt-3">
                    <Link href={`/`}>
                      <Image
                        alt="image"
                        src="/images/logo/logo.svg"
                        width="136"
                        height="21"
                      />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <div className="row">
              <div className="col-12">
                <div className="footer-bottom-wrap d-flex gap-20 flex-wrap justify-content-between align-items-center">
                  <div className="footer-menu_item">
                    © {new Date().getFullYear()} Hazar Home. Tüm Hakları Saklıdır.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
