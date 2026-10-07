"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "@/types/product";

type WishlistContextType = {
  items: Product[];
  itemCount: number;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
};

const WishlistContext =
  createContext<WishlistContextType | undefined>(
    undefined
  );

const WISHLIST_STORAGE_KEY = "primezora-wishlist";

export function WishlistProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load wishlist from localStorage
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const storedWishlist =
          window.localStorage.getItem(
            WISHLIST_STORAGE_KEY
          );

        if (storedWishlist) {
          const parsedWishlist =
            JSON.parse(storedWishlist) as Product[];

          if (Array.isArray(parsedWishlist)) {
            setItems(parsedWishlist);
          }
        }
      } catch (error) {
        console.error(
          "Failed to load Primezora wishlist:",
          error
        );
      } finally {
        setIsLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  // Save wishlist to localStorage
  useEffect(() => {
    if (!isLoaded) return;

    try {
      window.localStorage.setItem(
        WISHLIST_STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch (error) {
      console.error(
        "Failed to save Primezora wishlist:",
        error
      );
    }
  }, [items, isLoaded]);

  const addToWishlist = (product: Product) => {
    setItems((currentItems) => {
      const alreadyExists = currentItems.some(
        (item) => item.id === product.id
      );

      if (alreadyExists) {
        return currentItems;
      }

      return [...currentItems, product];
    });
  };

  const removeFromWishlist = (
    productId: string
  ) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.id !== productId
      )
    );
  };

  const toggleWishlist = (product: Product) => {
    setItems((currentItems) => {
      const exists = currentItems.some(
        (item) => item.id === product.id
      );

      if (exists) {
        return currentItems.filter(
          (item) => item.id !== product.id
        );
      }

      return [...currentItems, product];
    });
  };

  const isInWishlist = (productId: string) => {
    return items.some(
      (item) => item.id === productId
    );
  };

  const clearWishlist = () => {
    setItems([]);
  };

  const itemCount = useMemo(
    () => items.length,
    [items]
  );

  return (
    <WishlistContext.Provider
      value={{
        items,
        itemCount,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      "useWishlist must be used inside WishlistProvider"
    );
  }

  return context;
}