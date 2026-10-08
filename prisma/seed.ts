import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { configureSeedDatabaseTarget } from "../scripts/database-target";

const target = configureSeedDatabaseTarget();

const connectionString =
  target === "production"
    ? process.env.DIRECT_DATABASE_URL
    : process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Selected seed database URL is unavailable.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const products = [
  {
    name: "GeForce RTX 4060 8GB Gaming GPU",
    slug: "rtx-4060",
    brand: "ASUS",
    category: "PC Components",
    description:
      "Powerful RTX 4060 8GB gaming graphics card designed for smooth 1080p and 1440p gaming performance.",
    price: 124900,
    oldPrice: 134900,
    rating: 4.9,
    reviews: 18,
    image: "/products/msi.jfif",
    images: ["/products/msi.jfif"],
    badge: "SALE",
    inStock: true,
    stockQuantity: 10,
    featured: true,
    specifications: [
      { label: "GPU", value: "NVIDIA GeForce RTX 4060" },
      { label: "VRAM", value: "8GB GDDR6" },
      { label: "Interface", value: "PCI Express 4.0" },
      { label: "Architecture", value: "Ada Lovelace" },
      { label: "Ray Tracing", value: "Yes" },
    ],
  },

  {
    name: "Ryzen 5 7600 AM5 Processor",
    slug: "ryzen-5-7600-am5-processor",
    brand: "AMD",
    category: "PC Components",
    description:
      "AMD Ryzen 5 7600 desktop processor delivering excellent performance for gaming, development and everyday workloads.",
    price: 58900,
    rating: 4.8,
    reviews: 24,
    image: "/products/ryzen.jfif",
    images: ["/products/ryzen.jfif"],
    badge: "POPULAR",
    inStock: true,
    stockQuantity: 15,
    featured: true,
    specifications: [
      { label: "CPU", value: "AMD Ryzen 5 7600" },
      { label: "Cores", value: "6" },
      { label: "Threads", value: "12" },
      { label: "Socket", value: "AM5" },
      { label: "Architecture", value: "Zen 4" },
    ],
  },

  {
    name: "Mechanical RGB Gaming Keyboard",
    slug: "mechanical-rgb-gaming-keyboard",
    brand: "Redragon",
    category: "Keyboards",
    description:
      "Mechanical RGB gaming keyboard designed for responsive gaming and comfortable everyday use.",
    price: 12900,
    oldPrice: 14900,
    rating: 4.7,
    reviews: 31,
    image: "/products/keyboard.jfif",
    images: ["/products/keyboard.jfif"],
    badge: "SALE",
    inStock: true,
    stockQuantity: 20,
    featured: true,
    specifications: [
      { label: "Switch Type", value: "Mechanical" },
      { label: "Lighting", value: "RGB" },
      { label: "Connection", value: "Wired / Wireless" },
      { label: "Layout", value: "Full Size" },
      { label: "Keycaps", value: "PBT" },
    ],
  },

  {
    name: "Ultra-Light RGB Gaming Mouse",
    slug: "ultra-light-rgb-gaming-mouse",
    brand: "Logitech",
    category: "Mice",
    description:
      "Ultra-light RGB gaming mouse with responsive tracking and a lightweight design for competitive gaming.",
    price: 8900,
    rating: 4.8,
    reviews: 16,
    image: "/products/Ultra-Light%20RGB%20Gaming%20Mouse.jfif",
    images: ["/products/Ultra-Light%20RGB%20Gaming%20Mouse.jfif"],
    badge: null,
    inStock: true,
    stockQuantity: 25,
    featured: false,
    specifications: [
      { label: "Sensor", value: "Optical" },
      { label: "Weight", value: "63g" },
      { label: "Buttons", value: "6" },
      { label: "Polling Rate", value: "1000Hz" },
      { label: "Lighting", value: "RGB" },
    ],
  },

  {
    name: "Corsair Vengeance RGB DDR5 32GB Memory Kit",
    slug: "corsair-vengeance-rgb-ddr5-32gb",
    brand: "Corsair",
    category: "PC Components",
    description:
      "High-performance Corsair Vengeance RGB DDR5 32GB memory kit built for modern gaming and demanding applications.",
    price: 46990,
    rating: 4.9,
    reviews: 49,
    image: "/products/vengeance.jfif",
    images: ["/products/vengeance.jfif"],
    badge: null,
    inStock: true,
    stockQuantity: 12,
    featured: true,
    specifications: [
      { label: "Memory", value: "32GB (2x16GB)" },
      { label: "Type", value: "DDR5" },
      { label: "Speed", value: "6000MHz" },
      { label: "Latency", value: "CL30" },
      { label: "Lighting", value: "RGB" },
    ],
  },

  {
    name: "Wireless Gaming Headset",
    slug: "wireless-gaming-headset",
    brand: "HyperX",
    category: "Gaming",
    description:
      "Wireless gaming headset designed for immersive audio, gaming sessions and everyday entertainment.",
    price: 21900,
    oldPrice: 24900,
    rating: 4.6,
    reviews: 12,
    image: "/products/headset.jfif",
    images: ["/products/headset.jfif"],
    badge: "NEW",
    inStock: true,
    stockQuantity: 18,
    featured: false,
    specifications: [
      { label: "Type", value: "Wireless" },
      { label: "Driver", value: "50mm" },
      { label: "Battery", value: "30 hours" },
      { label: "Connection", value: "Bluetooth / USB" },
      { label: "Microphone", value: "Noise-canceling" },
    ],
  },
];

async function main() {
  console.log("Starting Primezora product seed...\n");

  for (const product of products) {
    const result = await prisma.product.upsert({
      where: {
        slug: product.slug,
      },

      update: {
        name: product.name,
        brand: product.brand,
        category: product.category,
        description: product.description,
        price: product.price,
        oldPrice: product.oldPrice,
        rating: product.rating,
        reviews: product.reviews,
        image: product.image,
        images: product.images,
        badge: product.badge,
        inStock: product.inStock,
        stockQuantity: product.stockQuantity,
        featured: product.featured,
        specifications: product.specifications,
      },

      create: product,
    });

    console.log(`✓ ${result.name}`);
  }

  console.log("\nPrimezora product seed completed.");
  console.log(`Products processed: ${products.length}`);
}

main()
  .catch((error) => {
    console.error("\nSeed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });