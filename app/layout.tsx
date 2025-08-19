import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata = {
  title: "Hazar Home",
  description: "Hazar Home furniture store",
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
