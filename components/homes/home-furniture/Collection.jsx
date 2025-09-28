import React from "react";
import Image from "next/image";
import Link from "next/link";
export default function Collection() {
  return (
    <section className="flat-spacing-18">
      <div className="container">
        <div className="masonry-layout-v4 wow fadeInUp" data-wow-delay="0s">
          <div className="item-1 collection-item-v2 hover-img">
            <Link href={`/oturma-odasi`} className="collection-inner">
              <div className="collection-image img-style">
                <Image
                  className="lazyload"
                  data-src="/images/menu/koleksiyonlar/oturma_odasi.jpeg"
                  alt="collection-img"
                  src="/images/menu/koleksiyonlar/oturma_odasi.jpeg"
                  width={500}
                  height={600}
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="collection-content">
                <div className="top wow fadeInUp" data-wow-delay="0s">
                  <h5 className="heading text-white">Oturma Odası</h5>
                  <p className="subheading text-white">
                    Oturma Odası Takımları
                  </p>
                  <button className="tf-btn btn-line btn-line-light collection-other-link fw-6">
                    <span>Oturma Odalarına Göz At</span>
                    <i className="icon icon-arrow1-top-left" />
                  </button>
                </div>
              </div>
            </Link>
          </div>
          <div className="item-2 collection-item-v2 hover-img">
            <Link href={`/yatak-odasi`} className="collection-inner">
              <div className="collection-image img-style">
                <Image
                  className="lazyload"
                  data-src="/images/menu/koleksiyonlar/yatak_odasi.png"
                  alt="collection-img"
                  src="/images/menu/koleksiyonlar/yatak_odasi.png"
                  width={500}
                  height={300}
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="collection-content justify-content-end">
                <div className="bottom wow fadeInUp" data-wow-delay="0s">
                  <h5 className="heading text-white">Yatak Odası Takımları</h5>
                  <button className="tf-btn btn-line btn-line-light collection-other-link fw-6">
                    <span>Yatak Odası Takımlarına Göz At</span>
                    <i className="icon icon-arrow1-top-left" />
                  </button>
                </div>
              </div>
            </Link>
          </div>
          <div className="item-3 collection-item-v2 hover-img">
            <Link href={`/yemek-odasi`} className="collection-inner">
              <div className="collection-image img-style">
                <Image
                  className="lazyload"
                  data-src="/images/menu/koleksiyonlar/yemek_odasi.png"
                  alt="collection-img"
                  src="/images/menu/koleksiyonlar/yemek_odasi.png"
                  width={500}
                  height={300}
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="collection-content justify-content-end">
                <div className="bottom wow fadeInUp" data-wow-delay="0s">
                  <h5 className="heading text-white">Yemek Odası Takımları</h5>
                  <button className="tf-btn btn-line btn-line-light collection-other-link fw-6">
                    <span>Yemek Odalarına Göz At</span>
                    <i className="icon icon-arrow1-top-left" />
                  </button>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
