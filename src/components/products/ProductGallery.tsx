"use client";

import Image from "next/image";
import { useState } from "react";

type ProductGalleryProps = {
  image?: string;
  images?: string[];
  productName: string;
};

export default function ProductGallery({
  images = [],
  productName,
}: ProductGalleryProps) {
  const galleryImages =
    images?.filter(Boolean).length > 0
      ? images.filter(Boolean)
      : ["/products/placeholder.jpg"];

  const [activeIndex, setActiveIndex] = useState(0);

  const activeImage =
    galleryImages[activeIndex] ??
    galleryImages[0];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden border border-white/[0.07] bg-[#080d13]">
        <Image
          src={activeImage}
          alt={productName}
          fill
          priority
          className="object-contain p-8"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Thumbnails */}
      {galleryImages.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {galleryImages.map((galleryImage, index) => (
            <button
              key={`${galleryImage}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative aspect-square overflow-hidden border transition ${
                activeIndex === index
                  ? "border-orange-500"
                  : "border-white/[0.07] hover:border-white/20"
              }`}
              aria-label={`View product image ${index + 1}`}
            >
              <Image
                src={galleryImage}
                alt={`${productName} image ${index + 1}`}
                fill
                className="object-contain p-2"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}