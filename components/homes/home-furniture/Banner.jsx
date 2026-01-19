import React from "react";
import Link from "next/link";
import { toPublicUrl } from "@/lib/image-helpers";

export default function Banner() {
  return (
    <section
      className="banner-hero-collection-wrap banner-parallax"
      style={{
        backgroundImage: `url(${toPublicUrl("images/banner.png")})`,
      }}
    >
      <div className="box-content">
        <div className="container">
          <Link
            href={`/oturma-odasi`}
            className="card-box text-md-start text-center rounded-0"
          >
            <p className="subheading">Hepsi Bir Arada</p>
            <h3 className="heading">Modern Ve Klasik</h3>
            <p className="text">
              Fonksiyonelliği ve şıklığı bir arada sunan mobilyaları keşfedin
            </p>
            <div className="wow fadeInUp" data-wow-delay="0s">
              <button className="tf-btn style-2 btn-fill animate-hover-btn">
                <span>Koleksiyonu İncele</span>
              </button>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
