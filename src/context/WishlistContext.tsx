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
  removeWishlistProducts,
  reconcileWishlistProducts,
  type AvailableWishlistProduct,
} from "@/lib/wishlist-availability";

type WishlistContextType = {
  items: Product[];
  itemCount: number;
  availabilityStatus: "checking" | "current" | "error";
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
  const [availabilityStatus, setAvailabilityStatus] = useState<
    "checking" | "current" | "error"
  >("checking");
  const itemsRef = useRef(items);
  const customerWishlistSynced = useRef(false);

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
    if (currentItems.length === 0) {
      setAvailabilityStatus("current");
      return;
    }

    const checkedIds = new Set(currentItems.map((item) => item.id));
    const availableProducts = await fetchCurrentProducts([...checkedIds]);
    if (!availableProducts) {
      setAvailabilityStatus("error");
      return;
    }

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
    setAvailabilityStatus("current");
  }, [fetchCurrentProducts]);

  // Merge browser saves with the signed-in customer's saved wishlist.
  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      let parsedWishlist: Product[] = [];
      try {
        const storedWishlist =
          window.localStorage.getItem(
            WISHLIST_STORAGE_KEY
          );

        if (storedWishlist) {
          const parsed: unknown = JSON.parse(storedWishlist);

          if (Array.isArray(parsed)) {
            parsedWishlist = parsed as Product[];
            const productIds = parsedWishlist
              .map((product) => product?.id)
              .filter((id): id is string => typeof id === "string");
            const availableProducts =
              await fetchCurrentProducts(productIds);
            setAvailabilityStatus(
              availableProducts ? "current" : "error"
            );
            if (availableProducts) {
              parsedWishlist = reconcileWishlistProducts(
                parsedWishlist,
                availableProducts
              );
            }
          }
        }

        const response = await fetch("/api/customer/wishlist", {
          cache: "no-store",
        });
        if (response.ok) {
          const data = (await response.json()) as {
            products?: AvailableWishlistProduct[];
          };
          if (!Array.isArray(data.products)) {
            throw new Error("Customer wishlist returned an invalid response.");
          }
          customerWishlistSynced.current = true;
          const savedIds = new Set(data.products.map((item) => item.id));
          const localProducts = parsedWishlist.filter(
            (product) => !savedIds.has(product.id)
          );
          const localAvailability = await fetchCurrentProducts(
            localProducts.map((product) => product.id)
          );
          if (localAvailability) {
            const mergedProducts = new Map<string, AvailableWishlistProduct>();
            for (const item of localAvailability) {
              mergedProducts.set(item.id, item);
            }
            for (const item of data.products) {
              mergedProducts.set(item.id, item);
            }
            setItems(
              reconcileWishlistProducts(
                [...data.products.map((item) => item.product), ...localProducts],
                [...mergedProducts.values()]
              )
            );
            setAvailabilityStatus("current");
          } else {
            setItems([
              ...data.products.map((item) => item.product),
              ...localProducts,
            ]);
            setAvailabilityStatus("error");
          }

          if (localAvailability) {
            await Promise.all(
              localProducts
                .filter((product) =>
                  localAvailability.some((available) => available.id === product.id)
                )
                .map((product) =>
                  fetch("/api/customer/wishlist", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId: product.id }),
                  }).then((saveResponse) => {
                    if (!saveResponse.ok) {
                      throw new Error(
                        `Unable to sync saved product (${saveResponse.status}).`
                      );
                    }
                  })
                )
            );
          }
        } else if (response.status === 401) {
          setItems(parsedWishlist);
          if (!parsedWishlist.length) setAvailabilityStatus("current");
        } else {
          throw new Error(
            `Customer wishlist failed with status ${response.status}.`
          );
        }
      } catch (error) {
        setAvailabilityStatus("error");
        console.error(
          "Failed to load Primezora wishlist:",
          error
        );
        setItems(parsedWishlist);
      } finally {
        setIsLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchCurrentProducts]);

  const persistCustomerWishlist = useCallback(
    async (method: "POST" | "DELETE", productId?: string) => {
      if (!customerWishlistSynced.current) return;

      try {
        const response = await fetch(
          productId
            ? `/api/customer/wishlist?productId=${encodeURIComponent(productId)}`
            : "/api/customer/wishlist",
          {
            method,
            ...(method === "POST"
              ? {
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ productId }),
                }
              : {}),
          }
        );
        if (!response.ok && response.status !== 401) {
          throw new Error(
            `Wishlist update failed with status ${response.status}.`
          );
        }
      } catch (error) {
        console.error("Failed to sync Primezora customer wishlist:", error);
      }
    },
    []
  );

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
    void persistCustomerWishlist("POST", product.id);
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
    void persistCustomerWishlist("DELETE", productId);
    setItems((currentItems) =>
      removeWishlistProducts(currentItems, [productId])
    );
  };

  const toggleWishlist = (product: Product) => {
    const exists = itemsRef.current.some((item) => item.id === product.id);
    void persistCustomerWishlist(exists ? "DELETE" : "POST", product.id);
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
    void persistCustomerWishlist("DELETE");
    setItems([]);
  };

  const visibleItems = useMemo(
    () => (availabilityStatus === "current" ? items : []),
    [availabilityStatus, items]
  );
  const itemCount = useMemo(() => visibleItems.length, [visibleItems]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        itemCount,
        availabilityStatus,
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