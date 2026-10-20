import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { connection } from "next/server";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { getCatalogCategories } from "@/lib/categories";
import { getStorefrontContent } from "@/lib/storefront-content";


import "./globals.css";

import { Header } from "@/components/layout/Header";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/customer-session";

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
  const [categories, content, cookieStore] = await Promise.all([
    getCatalogCategories(),
    getStorefrontContent(),
    cookies(),
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
              hasCustomerSession={cookieStore.has(CUSTOMER_SESSION_COOKIE)}
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