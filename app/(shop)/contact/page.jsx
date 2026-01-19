import Footer1 from "@/components/footers/Footer1";
import Header4 from "@/components/headers/Header4";
import ContactForm2 from "@/components/othersPages/contact/ContactForm2";
import Map2 from "@/components/othersPages/contact/Map2";
import React from "react";

export const metadata = {
  title: "İletişim || Hazar Home - Ferahlığın Anahtarı",
  description: "Hazar Home ile iletişime geçin. Adres, telefon ve konum bilgileri.",
};

export const revalidate = 86400; // Cache for 24 hours

export default function page() {
  return (
    <>
      <Header4 />
      <div className="tf-page-title style-2">
        <div className="container-full">
          <div className="heading text-center">İletişim</div>
        </div>
      </div>
      <Map2 />

      <Footer1 />
    </>
  );
}
