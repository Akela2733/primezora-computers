CREATE TABLE "StorefrontContent" (
    "key" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StorefrontContent_pkey" PRIMARY KEY ("key")
);

INSERT INTO "StorefrontContent" ("key", "content", "updatedAt")
VALUES (
    'storefront',
    $content$
    {
      "brand": {
        "name": "Primezora Technologies",
        "description": "Primezora Technologies — PC components, gaming accessories and technology products delivered islandwide in Sri Lanka.",
        "logo": "/primezora%20new%20logo.png",
        "logoAlt": "PrimeZora Computer Solutions"
      },
      "navigation": {
        "homeLabel": "HOME",
        "shopLabel": "SHOP",
        "dealsLabel": "DEALS",
        "dealsHref": "/shop?sort=deals"
      },
      "home": {
        "categories": {
          "eyebrow": "Shop by category",
          "titleLines": ["Find What", "You Need"],
          "description": "From gaming gear to PC components, find what powers your setup.",
          "linkLabel": "Explore all",
          "cardActionLabel": "Shop now"
        },
        "featured": {
          "eyebrow": "Featured Products",
          "title": "Top Picks",
          "actionLabel": "View all products",
          "actionHref": "/shop",
          "scrollLabel": "Show more featured products",
          "emptyText": "No featured products are currently available."
        },
        "brandsLabel": "Trusted Brands",
        "hero": {
          "eyebrow": "Build / Game / Upgrade",
          "titleLines": ["Your One Stop", "Tech & Gaming", "Store"],
          "accentLine": 1,
          "description": "Premium computer accessories, gaming gear, PC parts and more, built for performance and delivered islandwide.",
          "actionLabel": "Shop Now",
          "actionHref": "/shop",
          "image": "/banners/hero-background.png",
          "imageAlt": "Amber-lit gaming PC setup with monitor, keyboard, and headset",
          "benefits": [
            { "icon": "Truck", "title": "Islandwide Delivery", "subtitle": "Across Sri Lanka" },
            { "icon": "ShieldCheck", "title": "Genuine Products", "subtitle": "Trusted brands" },
            { "icon": "CreditCard", "title": "Secure Checkout", "subtitle": "COD / Bank / Online" }
          ]
        },
        "promotions": {
          "left": [
            {
              "image": "/banners/banner1.jfif",
              "alt": "Gaming controller and accessories",
              "eyebrow": "Gaming Accessories",
              "titleLines": ["Level Up", "Your Game"],
              "accentLine": 1,
              "description": "Controllers, headsets, chairs and more. Built for every gamer.",
              "actionLabel": "Shop Gaming",
              "href": "/shop"
            },
            {
              "image": "/banners/banner1.2.jfif",
              "alt": "Gaming gear for a custom setup",
              "eyebrow": "Find Your Edge",
              "titleLines": ["Own Every", "Gaming Moment"],
              "accentLine": 1,
              "description": "Choose the accessories that make every session your own.",
              "actionLabel": "Explore Gear",
              "href": "/shop"
            },
            {
              "image": "/banners/banner%201.3.jfif",
              "alt": "A complete gaming setup ready to upgrade",
              "eyebrow": "Built for Play",
              "titleLines": ["Play Beyond", "Your Limits"],
              "accentLine": 1,
              "description": "Performance gear for longer sessions and bigger wins.",
              "actionLabel": "Discover Gaming",
              "href": "/shop"
            }
          ],
          "right": [
            {
              "image": "/banners/banner2.jfif",
              "alt": "Amber-lit custom gaming PC build",
              "eyebrow": "PC Builds & Components",
              "titleLines": ["Build Your", "Dream PC"],
              "accentLine": 1,
              "description": "Top brands. Best performance. Your custom build, our expertise.",
              "actionLabel": "Shop PC Parts",
              "href": "/shop"
            },
            {
              "image": "/banners/banner%202.2.jfif",
              "alt": "Performance PC components for a custom build",
              "eyebrow": "Performance Components",
              "titleLines": ["Power Your", "Setup"],
              "accentLine": 1,
              "description": "Find the components that bring your next build to life.",
              "actionLabel": "Explore Components",
              "href": "/shop"
            },
            {
              "image": "/banners/banner%202.3.jfif",
              "alt": "Custom PC hardware for gaming and creative work",
              "eyebrow": "Made for Your Build",
              "titleLines": ["Build Without", "Limits"],
              "accentLine": 1,
              "description": "Reliable hardware for gaming, creating, and everything between.",
              "actionLabel": "Build Your PC",
              "href": "/shop"
            }
          ]
        },
        "why": {
          "eyebrow": "Why Primezora",
          "titleLines": ["More Than", "Just a Store"],
          "description": "We're tech enthusiasts, just like you. That's why we bring you the best products, expert support and islandwide delivery.",
          "actionLabel": "Learn More",
          "actionHref": "/about",
          "image": "/banners/why%20primezora.jfif",
          "imageAlt": "Gamer enjoying a PC setup",
          "reasons": [
            { "icon": "BadgeCheck", "title": "100% Original Products", "description": "Buy with confidence" },
            { "icon": "Headphones", "title": "Expert Support & Advice", "description": "Real people. Real help." },
            { "icon": "Truck", "title": "Islandwide Delivery", "description": "Fast. Safe. Reliable." },
            { "icon": "RefreshCw", "title": "Easy Returns", "description": "Hassle-free process" }
          ]
        }
      },
      "shop": {
        "eyebrow": "Primezora Store",
        "titleLines": ["Technology", "built for you."],
        "description": "Explore PC components, gaming accessories and technology products from trusted brands.",
        "countLabel": "Products available",
        "searchPlaceholder": "Search products...",
        "allCategoriesLabel": "All Categories",
        "allBrandsLabel": "All Brands",
        "sortLabels": {
          "featured": "Featured",
          "newest": "Newest",
          "priceLow": "Price: Low to High",
          "priceHigh": "Price: High to Low",
          "rating": "Highest Rated"
        },
        "showingLabel": "Showing",
        "productsLabel": "products",
        "clearFiltersLabel": "Clear filters",
        "emptyTitle": "No products found.",
        "emptyDescription": "Try changing your search or filters.",
        "resetFiltersLabel": "Reset Filters"
      },
      "search": {
        "eyebrow": "PRIMEZORA / SEARCH",
        "title": "Find Your Gear",
        "description": "Search PC components, gaming accessories and technology products available at Primezora Technologies.",
        "inputPlaceholder": "Search products, brands or categories...",
        "submitLabel": "Search",
        "popularLabel": "Popular:",
        "startTitle": "Start Searching",
        "startDescription": "Search for a product, brand or category to explore the Primezora catalog.",
        "resultsLabel": "Search results",
        "singularProductLabel": "Product",
        "pluralProductsLabel": "Products",
        "resultForLabel": "Results for",
        "clearLabel": "Clear Search",
        "noProductsTitle": "No Products Found",
        "noProductsDescription": "We couldn't find anything matching \"{query}\". Try another product name, brand or category.",
        "browseShopLabel": "Browse Shop"
      },
      "categoryPage": {
        "eyebrow": "Shop by category",
        "backLinkLabel": "Back to all products",
        "emptyTitle": "No products in this category yet",
        "emptyDescription": "Browse the shop to see all products currently in the catalog."
      },
      "about": {
        "eyebrow": "About Primezora",
        "title": "Built for performance-driven setups.",
        "description": "Primezora Technologies helps gamers, creators, and businesses find the right hardware for reliable speed, precision, and everyday performance. From PC components to peripherals and accessories, we curate products that deliver real value.",
        "features": [
          { "title": "Expert curation", "description": "Every product is selected for quality, compatibility, and customer value." },
          { "title": "Fast local support", "description": "We help customers choose the right setup for their workflows and goals." },
          { "title": "Trusted delivery", "description": "We keep your order process simple from browsing to checkout." }
        ],
        "actionLabel": "Explore the store",
        "actionHref": "/shop"
      },
      "contact": {
        "eyebrow": "Contact us",
        "title": "Let’s help you find the right setup.",
        "phone": "+94 76 41 32 650",
        "email": "primezorasolution@gmail.com",
        "address": "Ehaliyagoda, Sri Lanka",
        "namePlaceholder": "Your name",
        "emailPlaceholder": "Email address",
        "messagePlaceholder": "Your message",
        "sendLabel": "Send message",
        "browseLabel": "Browse products →",
        "browseHref": "/shop"
      },
      "footer": {
        "description": "Your trusted online store for computer and gaming gear. Quality products, competitive prices, delivered islandwide.",
        "quickLinksTitle": "Quick Links",
        "quickLinks": [
          { "label": "Home", "href": "/" },
          { "label": "Shop", "href": "/shop" },
          { "label": "Categories", "href": "/shop" },
          { "label": "About Us", "href": "/about" },
          { "label": "Contact", "href": "/contact" }
        ],
        "helpLinksTitle": "Help",
        "helpLinks": [
          { "label": "Shipping & Delivery", "href": "/shipping" },
          { "label": "Returns & Refunds", "href": "/returns" },
          { "label": "FAQ", "href": "/faq" },
          { "label": "Terms & Conditions", "href": "/terms" },
          { "label": "Privacy Policy", "href": "/privacy" }
        ],
        "contactTitle": "Contact Us",
        "phone": "+94 76 41 32 650",
        "phoneHref": "tel:+94764132650",
        "email": "primezorasolution@gmail.com",
        "emailHref": "mailto:primezorasolution@gmail.com",
        "address": "Ehaliyagoda, Sri Lanka",
        "addressHref": "https://maps.google.com/?q=Ehaliyagoda,+Sri+Lanka",
        "socials": [
          { "label": "Facebook", "href": "https://www.facebook.com/profile.php?id=61592915424823&mibextid=ZbWKwL", "icon": "Facebook" },
          { "label": "TikTok", "href": "https://www.tiktok.com/", "icon": "TikTok" },
          { "label": "WhatsApp", "href": "https://wa.me/94764132650", "icon": "WhatsApp" },
          { "label": "Email", "href": "mailto:primezorasolution@gmail.com", "icon": "Email" }
        ],
        "updatesTitle": "Get Updates",
        "updatesDescription": "Exclusive deals, new arrivals and gaming news.",
        "updatesEmailPlaceholder": "Your email address",
        "subscribeLabel": "Subscribe to updates",
        "copyright": "© 2026 Primezora Technologies. All rights reserved.",
        "tagline": "Powered by Passion / Built for Gamers"
      }
    }
    $content$::jsonb,
    CURRENT_TIMESTAMP
);
