import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop | Primezora Technologies",
  description:
    "Shop PC components, gaming accessories, peripherals and technology products from Primezora Technologies.",
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}