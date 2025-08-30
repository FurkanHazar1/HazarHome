import { socialLinksWithBorder } from "@/data/socials";
import React from "react";

export default function Map2() {
  return (
    <section className="flat-spacing-9">
      <div className="container">
        <div className="tf-grid-layout gap-0 lg-col-2">
          <div className="w-100">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d33935.46709619353!2d28.907184130770048!3d41.02713775491851!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14caba42fbf031f3%3A0x48a0add0b34d2730!2sOrta%2C%20Tima%C5%9F%20Ticaret%20Merkez%2C%2034030%20Bayrampa%C5%9Fa%2F%C4%B0stanbul!5e0!3m2!1str!2str!4v1756571251654!5m2!1str!2str"
              width="100%"
              height={594}
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="tf-content-left has-mt">
            <div className="sticky-top">
              <h5 className="mb_20">Mağazamızı Ziyaret Edin</h5>
              <div className="mb_20">
                <p className="mb_15">
                  <strong>Adres</strong>
                </p>
                <p>Topkapı Maltepe Yolu, Numara 4, Tek Merkez AVM, Stand No: 100-101-102 Bayrampaşa, Istanbul, Turkey</p>
              </div>
              <div className="mb_20">
                <p className="mb_15">
                  <strong>Telefon</strong>
                </p>
                <p>(+90) 533 519 13 29</p>
              </div>
              <div className="mb_20">
                <p className="mb_15">
                  <strong>Email</strong>
                </p>
                <p>info@hazarhome.com</p>
              </div>
              <div className="mb_36">
                <p className="mb_15">
                  <strong>Açılış Zamanı</strong>
                </p>
                <p className="mb_15">Mağazamız her gün açıktır</p>
                <p>10:00 - 20:00 saatleri arasında hizmet vermektedir</p>
              </div>
              <div>
                <ul className="tf-social-icon d-flex gap-20 style-default">
                  {socialLinksWithBorder.map((link, index) => (
                    <li key={index}>
                      <a
                        href={link.href}
                        className={`box-icon link round ${link.className} ${link.borderClass}`}
                      >
                        <i
                          className={`icon ${link.iconSize} ${link.iconClass}`}
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
