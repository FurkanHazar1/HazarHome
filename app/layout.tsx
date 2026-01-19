import { Providers } from "@/components/providers";
import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: {
    template: "%s | Hazar Home",
    default: "Hazar Home | Ferahlığın Anahtarı",
  },
  description: "Kaliteli mobilya, modern koltuk takımları ve ev dekorasyonunda estetiğin adresi Hazar Home. Şıklığı ve konforu keşfedin.",
  metadataBase: new URL("https://hazarhome.com"),
  keywords: ["mobilya", "koltuk takımı", "yemek odası", "yatak odası", "dekorasyon", "hazar home"],
  openGraph: {
    title: "Hazar Home | Ferahlığın Anahtarı",
    description: "Modern mobilya ve ev dekorasyonu ürünleri.",
    url: "https://hazarhome.com",
    siteName: "Hazar Home",
    locale: "tr_TR",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  verification: {
    google: "googleab02517afc134290",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
