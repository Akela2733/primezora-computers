import type { Metadata } from "next";
import localFont from "next/font/local";
import { connection } from "next/server";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { getCatalogCategories } from "@/lib/categories";
import { getStorefrontContent } from "@/lib/storefront-content";


import "./globals.css";

import { Header } from "@/components/layout/Header";

const bodyFont = localFont({
  src: "./fonts/inter-latin.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-body",
});

const displayFont = localFont({
  src: "./fonts/orbitron-latin.woff2",
  weight: "400 900",
  style: "normal",
  display: "swap",
  variable: "--font-display",
});

export async function generateMetadata(): Promise<Metadata> {
  const content = await getStorefrontContent();

  return {
    title: content?.brand.name,
    description: content?.brand.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const [categories, content] = await Promise.all([
    getCatalogCategories(),
    getStorefrontContent(),
  ]);

  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>

      <body>
        <CartProvider>
          <WishlistProvider>
            <Header
              brand={content?.brand ?? null}
              navigation={content?.navigation ?? null}
              searchPlaceholder={content?.search.inputPlaceholder ?? ""}
              categories={categories.map(({ id, name, slug }) => ({
                id,
                name,
                slug,
              }))}
            />
            {children}
            <Footer />
          </WishlistProvider>
        </CartProvider>
      </body>

    </html>
  );
}