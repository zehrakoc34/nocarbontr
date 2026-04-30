import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Nocarbontr — CBAM Compliance Platform",
  description: "AB Sınırda Karbon Düzenleme Mekanizması uyumlu emisyon yönetim platformu",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col" style={{ backgroundColor: "var(--color-bg-base)", color: "var(--color-text-primary)" }}>
        {children}
      </body>
    </html>
  );
}
