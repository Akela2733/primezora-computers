"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "@/types/product";
import {
  reconcileWishlistProducts,
  type AvailableWishlistProduct,
} from "@/lib/wishlist-availability";

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
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const fetchCurrentProducts = useCallback(
    async (productIds: string[]): Promise<AvailableWishlistProduct[] | null> => {
      if (productIds.length === 0) return [];

      try {
        const currentProducts: AvailableWishlistProduct[] = [];
        for (let index = 0; index < productIds.length; index += 100) {
          const response = await fetch("/api/products/availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              productIds: productIds.slice(index, index + 100),
            }),
          });
          if (!response.ok) {
            throw new Error(
              `Wishlist product refresh failed with status ${response.status}.`
            );
          }

          const data = (await response.json()) as {
            success?: boolean;
            products?: AvailableWishlistProduct[];
          };
          if (!data.success || !Array.isArray(data.products)) {
            throw new Error("Wishlist product refresh returned an invalid response.");
          }
          currentProducts.push(...data.products);
        }
        return currentProducts;
      } catch (error) {
        console.error("Failed to refresh Primezora wishlist:", error);
        return null;
      }
    },
    []
  );

  const refreshWishlist = useCallback(async () => {
    const currentItems = itemsRef.current;
    if (currentItems.length === 0) return;

    const checkedIds = new Set(currentItems.map((item) => item.id));
    const availableProducts = await fetchCurrentProducts([...checkedIds]);
    if (!availableProducts) return;

    setItems((current) => {
      const currentById = new Map(current.map((item) => [item.id, item]));
      const checkedItems = [...checkedIds]
        .map((id) => currentById.get(id))
        .filter((item): item is Product => item !== undefined);
      const refreshed = new Map(
        reconcileWishlistProducts(checkedItems, availableProducts).map(
          (product) => [product.id, product]
        )
      );

      return current.flatMap((item) => {
        if (!checkedIds.has(item.id)) return [item];
        const updated = refreshed.get(item.id);
        return updated ? [updated] : [];
      });
    });
  }, [fetchCurrentProducts]);

  // Load wishlist from localStorage
  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      try {
        const storedWishlist =
          window.localStorage.getItem(
            WISHLIST_STORAGE_KEY
          );

        if (storedWishlist) {
          const parsedWishlist =
            JSON.parse(storedWishlist) as Product[];

          if (Array.isArray(parsedWishlist)) {
            const productIds = parsedWishlist
              .map((product) => product?.id)
              .filter((id): id is string => typeof id === "string");
            const availableProducts =
              await fetchCurrentProducts(productIds);
            setItems(
              availableProducts
                ? reconcileWishlistProducts(
                    parsedWishlist,
                    availableProducts
                  )
                : parsedWishlist
            );
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
  }, [fetchCurrentProducts]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshWishlist();
      }
    };
    const intervalId = window.setInterval(refreshWhenVisible, 60_000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshWishlist]);

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