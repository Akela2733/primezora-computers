import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type ContentLink = {
  label: string;
  href: string;
};

export type PromoBanner = {
  image: string;
  alt: string;
  eyebrow: string;
  titleLines: string[];
  accentLine: number;
  description: string;
  actionLabel: string;
  href: string;
};

export type StorefrontContent = {
  brand: {
    name: string;
    description: string;
    logo: string;
    logoAlt: string;
  };
  navigation: {
    homeLabel: string;
    shopLabel: string;
    dealsLabel: string;
    dealsHref: string;
  };
  home: {
    categories: {
      eyebrow: string;
      titleLines: string[];
      description: string;
      linkLabel: string;
      cardActionLabel: string;
    };
    featured: {
      eyebrow: string;
      title: string;
      actionLabel: string;
      actionHref: string;
      scrollLabel: string;
      emptyText: string;
    };
    brandsLabel: string;
    hero: {
      eyebrow: string;
      titleLines: string[];
      accentLine: number;
      description: string;
      actionLabel: string;
      actionHref: string;
      image: string;
      imageAlt: string;
      benefits: {
        icon: string;
        title: string;
        subtitle: string;
      }[];
    };
    promotions: {
      left: PromoBanner[];
      right: PromoBanner[];
    };
    why: {
      eyebrow: string;
      titleLines: string[];
      description: string;
      actionLabel: string;
      actionHref: string;
      image: string;
      imageAlt: string;
      reasons: {
        icon: string;
        title: string;
        description: string;
      }[];
    };
  };
  about: {
    eyebrow: string;
    title: string;
    description: string;
    features: {
      title: string;
      description: string;
    }[];
    actionLabel: string;
    actionHref: string;
  };
  shop: {
    eyebrow: string;
    titleLines: string[];
    description: string;
    countLabel: string;
    searchPlaceholder: string;
    allCategoriesLabel: string;
    allBrandsLabel: string;
    sortLabels: {
      featured: string;
      newest: string;
      priceLow: string;
      priceHigh: string;
      rating: string;
    };
    showingLabel: string;
    productsLabel: string;
    clearFiltersLabel: string;
    emptyTitle: string;
    emptyDescription: string;
    resetFiltersLabel: string;
  };
  search: {
    eyebrow: string;
    title: string;
    description: string;
    inputPlaceholder: string;
    submitLabel: string;
    popularLabel: string;
    startTitle: string;
    startDescription: string;
    resultsLabel: string;
    singularProductLabel: string;
    pluralProductsLabel: string;
    resultForLabel: string;
    clearLabel: string;
    noProductsTitle: string;
    noProductsDescription: string;
    browseShopLabel: string;
  };
  categoryPage: {
    eyebrow: string;
    backLinkLabel: string;
    emptyTitle: string;
    emptyDescription: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    phone: string;
    email: string;
    address: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    messagePlaceholder: string;
    sendLabel: string;
    browseLabel: string;
    browseHref: string;
  };
  footer: {
    description: string;
    quickLinksTitle: string;
    quickLinks: ContentLink[];
    helpLinksTitle: string;
    helpLinks: ContentLink[];
    contactTitle: string;
    phone: string;
    phoneHref: string;
    email: string;
    emailHref: string;
    address: string;
    addressHref: string;
    socials: {
      label: string;
      href: string;
      icon: string;
    }[];
    updatesTitle: string;
    updatesDescription: string;
    updatesEmailPlaceholder: string;
    subscribeLabel: string;
    copyright: string;
    tagline: string;
  };
};

type RecordValue = Record<string, unknown>;

const BUSINESS_CONTACT = {
  phone: "+94 76 41 32 650",
  phoneHref: "tel:+94764132650",
  email: "primezorasolution@gmail.com",
  emailHref: "mailto:primezorasolution@gmail.com",
  address: "Ehaliyagoda, Sri Lanka",
  addressHref: "https://maps.google.com/?q=Ehaliyagoda,+Sri+Lanka",
  facebookHref:
    "https://www.facebook.com/profile.php?id=61592915424823&mibextid=ZbWKwL",
  whatsappHref: "https://wa.me/94764132650",
} as const;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isContentLink(value: unknown): value is ContentLink {
  return isRecord(value) && isString(value.label) && isString(value.href);
}

function isPromoBanner(value: unknown): value is PromoBanner {
  return (
    isRecord(value) &&
    isString(value.image) &&
    isString(value.alt) &&
    isString(value.eyebrow) &&
    isStringArray(value.titleLines) &&
    typeof value.accentLine === "number" &&
    Number.isInteger(value.accentLine) &&
    isString(value.description) &&
    isString(value.actionLabel) &&
    isString(value.href)
  );
}

function isIconText(
  value: unknown,
  descriptionKey: "subtitle" | "description"
): boolean {
  return (
    isRecord(value) &&
    isString(value.icon) &&
    isString(value.title) &&
    isString(value[descriptionKey])
  );
}

function isStorefrontContent(value: unknown): value is StorefrontContent {
  if (!isRecord(value)) return false;
  const {
    brand,
    navigation,
    home,
    about,
    shop,
    search,
    categoryPage,
    contact,
    footer,
  } = value;
  if (
    !isRecord(brand) ||
    !["name", "description", "logo", "logoAlt"].every((key) =>
      isString(brand[key])
    ) ||
    !isRecord(navigation) ||
    !isRecord(home) ||
    !isRecord(home.categories) ||
    !isRecord(home.featured) ||
    !isRecord(home.hero) ||
    !isRecord(home.promotions) ||
    !isRecord(home.why) ||
    !isRecord(about) ||
    !isRecord(shop) ||
    !isRecord(search) ||
    !isRecord(categoryPage) ||
    !isRecord(contact) ||
    !isRecord(footer)
  ) {
    return false;
  }

  const hero = home.hero;
  const promotions = home.promotions;
  const why = home.why;
  const categories = home.categories;
  const featured = home.featured;
  const heroKeys = [
    "eyebrow",
    "description",
    "actionLabel",
    "actionHref",
    "image",
    "imageAlt",
  ];
  const whyKeys = [
    "eyebrow",
    "description",
    "actionLabel",
    "actionHref",
    "image",
    "imageAlt",
  ];
  const aboutKeys = [
    "eyebrow",
    "title",
    "description",
    "actionLabel",
    "actionHref",
  ];
  const contactKeys = [
    "eyebrow",
    "title",
    "phone",
    "email",
    "address",
    "namePlaceholder",
    "emailPlaceholder",
    "messagePlaceholder",
    "sendLabel",
    "browseLabel",
    "browseHref",
  ];
  const shopKeys = [
    "eyebrow",
    "description",
    "countLabel",
    "searchPlaceholder",
    "allCategoriesLabel",
    "allBrandsLabel",
    "showingLabel",
    "productsLabel",
    "clearFiltersLabel",
    "emptyTitle",
    "emptyDescription",
    "resetFiltersLabel",
  ];
  const navigationKeys = ["homeLabel", "shopLabel", "dealsLabel", "dealsHref"];
  const searchKeys = [
    "eyebrow",
    "title",
    "description",
    "inputPlaceholder",
    "submitLabel",
    "popularLabel",
    "startTitle",
    "startDescription",
    "resultsLabel",
    "singularProductLabel",
    "pluralProductsLabel",
    "resultForLabel",
    "clearLabel",
    "noProductsTitle",
    "noProductsDescription",
    "browseShopLabel",
  ];
  const categoryPageKeys = [
    "eyebrow",
    "backLinkLabel",
    "emptyTitle",
    "emptyDescription",
  ];
  const footerStringKeys = [
    "description",
    "quickLinksTitle",
    "helpLinksTitle",
    "contactTitle",
    "phone",
    "phoneHref",
    "email",
    "emailHref",
    "address",
    "addressHref",
    "updatesTitle",
    "updatesDescription",
    "updatesEmailPlaceholder",
    "subscribeLabel",
    "copyright",
    "tagline",
  ];
  const sortLabels = shop.sortLabels;
  if (!isRecord(sortLabels)) return false;

  return (
    navigationKeys.every((key) => isString(navigation[key])) &&
    isString(categories.eyebrow) &&
    isStringArray(categories.titleLines) &&
    isString(categories.description) &&
    isString(categories.linkLabel) &&
    isString(categories.cardActionLabel) &&
    isString(featured.eyebrow) &&
    isString(featured.title) &&
    isString(featured.actionLabel) &&
    isString(featured.actionHref) &&
    isString(featured.scrollLabel) &&
    isString(featured.emptyText) &&
    isString(home.brandsLabel) &&
    heroKeys.every((key) => isString(hero[key])) &&
    isStringArray(hero.titleLines) &&
    typeof hero.accentLine === "number" &&
    Number.isInteger(hero.accentLine) &&
    Array.isArray(hero.benefits) &&
    hero.benefits.every((item) => isIconText(item, "subtitle")) &&
    Array.isArray(promotions.left) &&
    promotions.left.every(isPromoBanner) &&
    Array.isArray(promotions.right) &&
    promotions.right.every(isPromoBanner) &&
    whyKeys.every((key) => isString(why[key])) &&
    isStringArray(why.titleLines) &&
    Array.isArray(why.reasons) &&
    why.reasons.every((item) => isIconText(item, "description")) &&
    aboutKeys.every((key) => isString(about[key])) &&
    Array.isArray(about.features) &&
    about.features.every(
      (item) =>
        isRecord(item) &&
        isString(item.title) &&
        isString(item.description)
    ) &&
    contactKeys.every((key) => isString(contact[key])) &&
    shopKeys.every((key) => isString(shop[key])) &&
    isStringArray(shop.titleLines) &&
    ["featured", "newest", "priceLow", "priceHigh", "rating"].every(
      (key) => isString(sortLabels[key])
    ) &&
    searchKeys.every((key) => isString(search[key])) &&
    categoryPageKeys.every((key) => isString(categoryPage[key])) &&
    footerStringKeys.every((key) => isString(footer[key])) &&
    Array.isArray(footer.quickLinks) &&
    footer.quickLinks.every(isContentLink) &&
    Array.isArray(footer.helpLinks) &&
    footer.helpLinks.every(isContentLink) &&
    Array.isArray(footer.socials) &&
    footer.socials.every(
      (item) =>
        isRecord(item) &&
        isString(item.label) &&
        isString(item.href) &&
        isString(item.icon)
    )
  );
}

export function validateStorefrontContent(
  value: unknown
): value is StorefrontContent {
  if (!isStorefrontContent(value)) return false;

  const hrefs = [
    value.navigation.dealsHref,
    value.home.hero.actionHref,
    value.home.why.actionHref,
    value.home.featured.actionHref,
    value.about.actionHref,
    value.contact.browseHref,
    ...value.home.promotions.left.map((item) => item.href),
    ...value.home.promotions.right.map((item) => item.href),
    ...value.footer.quickLinks.map((item) => item.href),
    ...value.footer.helpLinks.map((item) => item.href),
    ...value.footer.socials.map((item) => item.href),
    value.footer.phoneHref,
    value.footer.emailHref,
    value.footer.addressHref,
  ];
  const images = [
    value.brand.logo,
    value.home.hero.image,
    value.home.why.image,
    ...value.home.promotions.left.map((item) => item.image),
    ...value.home.promotions.right.map((item) => item.image),
  ];

  return images.every(isSafeImageUrl) && hrefs.every((href) => {
    if (href.startsWith("/") && !href.startsWith("//")) return true;
    return /^(https:\/\/|mailto:|tel:)/i.test(href);
  });
}

function isSafeImageUrl(value: string): boolean {
  return (
    (value.startsWith("/") && !value.startsWith("//")) ||
    /^https:\/\//i.test(value)
  );
}

export const getStorefrontContent = cache(async () => {
  try {
    const record = await prisma.storefrontContent.findUnique({
      where: { key: "storefront" },
      select: { content: true },
    });

    if (!record) return null;
    if (!isStorefrontContent(record.content)) {
      throw new Error("Storefront content in the database has an invalid shape.");
    }

    return {
      ...record.content,
      contact: {
        ...record.content.contact,
        phone: BUSINESS_CONTACT.phone,
        email: BUSINESS_CONTACT.email,
        address: BUSINESS_CONTACT.address,
      },
      footer: {
        ...record.content.footer,
        phone: BUSINESS_CONTACT.phone,
        phoneHref: BUSINESS_CONTACT.phoneHref,
        email: BUSINESS_CONTACT.email,
        emailHref: BUSINESS_CONTACT.emailHref,
        address: BUSINESS_CONTACT.address,
        addressHref: BUSINESS_CONTACT.addressHref,
        socials: record.content.footer.socials.map((social) => {
          if (social.icon === "Facebook") {
            return { ...social, href: BUSINESS_CONTACT.facebookHref };
          }
          if (social.icon === "WhatsApp") {
            return { ...social, href: BUSINESS_CONTACT.whatsappHref };
          }
          if (social.icon === "Email") {
            return { ...social, href: BUSINESS_CONTACT.emailHref };
          }
          return social;
        }),
      },
    };
  } catch (error) {
    console.error("Storefront content unavailable; using empty fallback.", error);
    return null;
  }
});
