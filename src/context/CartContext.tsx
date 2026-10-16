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
  reconcileCartItems,
  type CartAvailability,
} from "@/lib/cart-availability";

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  lastAddedProductId: string | null;

  addToCart: (
    product: Product,
    quantity?: number
  ) => Promise<"added" | "unavailable" | "error">;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
};

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

const CART_STORAGE_KEY = "primezora-cart";

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const fetchAvailability = useCallback(
    async (productIds: string[]): Promise<CartAvailability[] | null> => {
      if (productIds.length === 0) return [];

      try {
        const availability: CartAvailability[] = [];
        for (let index = 0; index < productIds.length; index += 100) {
          const response = await fetch("/api/products/availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ productIds: productIds.slice(index, index + 100) }),
          });
          if (!response.ok) {
            throw new Error(
              `Availability check failed with status ${response.status}.`
            );
          }

          const data = (await response.json()) as {
            success?: boolean;
            products?: CartAvailability[];
          };
          if (!data.success || !Array.isArray(data.products)) {
            throw new Error("Availability check returned an invalid response.");
          }
          availability.push(...data.products);
        }
        return availability;
      } catch (error) {
        console.error("Failed to refresh Primezora cart availability:", error);
        return null;
      }
    },
    []
  );

  const refreshCartAvailability = useCallback(async () => {
    const currentItems = itemsRef.current;
    if (currentItems.length === 0) return;

    const checkedIds = new Set(
      currentItems.map((item) => item.product.id)
    );
    const availability = await fetchAvailability(
      currentItems.map((item) => item.product.id)
    );
    if (!availability) return;

    setItems((current) => {
      const checkedItems = current.filter((item) =>
        checkedIds.has(item.product.id)
      );
      const reconciled = reconcileCartItems(checkedItems, availability);
      const reconciledById = new Map(
        reconciled.map((item) => [item.product.id, item])
      );
      return current.flatMap((item) => {
        if (!checkedIds.has(item.product.id)) return [item];
        const updated = reconciledById.get(item.product.id);
        return updated ? [updated] : [];
      });
    });
  }, [fetchAvailability]);

  useEffect(() => {
    if (!lastAddedProductId) return;

    const timeoutId = window.setTimeout(() => {
      setLastAddedProductId(null);
    }, 1600);

    return () => window.clearTimeout(timeoutId);
  }, [lastAddedProductId]);

  /*
  |--------------------------------------------------------------------------
  | Load cart from localStorage
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      try {
        const storedCart =
          window.localStorage.getItem(
            CART_STORAGE_KEY
          );

        if (storedCart) {
          const parsedCart = JSON.parse(
            storedCart
          ) as CartItem[];

          if (Array.isArray(parsedCart)) {
            const availability = await fetchAvailability(
              parsedCart
                .map((item) => item?.product?.id)
                .filter((id): id is string => typeof id === "string")
            );
            setItems(
              availability
                ? reconcileCartItems(parsedCart, availability)
                : parsedCart
            );
          }
        }
      } catch (error) {
        console.error(
          "Failed to load Primezora cart:",
          error
        );
      } finally {
        setIsLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchAvailability]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshCartAvailability();
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
  }, [refreshCartAvailability]);

  /*
  |--------------------------------------------------------------------------
  | Save cart to localStorage
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!isLoaded) return;

    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch (error) {
      console.error(
        "Failed to save Primezora cart:",
        error
      );
    }
  }, [items, isLoaded]);

  /*
  |--------------------------------------------------------------------------
  | Add product
  |--------------------------------------------------------------------------
  */

  const addToCart = async (
    product: Product,
    quantity = 1
  ): Promise<"added" | "unavailable" | "error"> => {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return "unavailable";
    }

    const availability = await fetchAvailability([product.id]);
    if (!availability) return "error";
    const currentProduct = availability.find(
      (item) => item.id === product.id
    );
    if (
      !currentProduct ||
      !currentProduct.inStock ||
      currentProduct.stockQuantity <= 0
    ) {
      setItems((currentItems) =>
        currentItems.filter((item) => item.product.id !== product.id)
      );
      return "unavailable";
    }

    const currentStock = currentProduct.stockQuantity;
    const currentProductDetails = currentProduct.product ?? product;
    setLastAddedProductId(product.id);

    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) =>
          item.product.id === product.id
      );

      if (existingItem) {
        const newQuantity = Math.min(
          existingItem.quantity + quantity,
          currentStock
        );

        return currentItems.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                product: {
                  ...currentProductDetails,
                  inStock: true,
                  stockQuantity: currentStock,
                  stock: currentStock,
                },
                quantity: newQuantity,
              }
            : item
        );
      }

      return [
        ...currentItems,
        {
          product: {
            ...currentProductDetails,
            inStock: true,
            stockQuantity: currentStock,
            stock: currentStock,
          },
          quantity: Math.min(
            quantity,
            currentStock
          ),
        },
      ];
    });
    return "added";
  };

  /*
  |--------------------------------------------------------------------------
  | Remove product
  |--------------------------------------------------------------------------
  */

  const removeFromCart = (
    productId: string
  ) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) =>
          item.product.id !== productId
      )
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Update quantity
  |--------------------------------------------------------------------------
  */

  const updateQuantity = (
    productId: string,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((currentItems) =>
      currentItems.flatMap((item) => {
        if (item.product.id !== productId) {
          return [item];
        }

        const maximum =
          item.product.stockQuantity ??
          item.product.stock ??
          0;

        if (maximum <= 0) {
          return [];
        }

        return {
          ...item,
          quantity: Math.min(quantity, maximum),
        };
      })
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Clear cart
  |--------------------------------------------------------------------------
  */

  const clearCart = () => {
    setItems([]);
  };

  /*
  |--------------------------------------------------------------------------
  | Check whether product is in cart
  |--------------------------------------------------------------------------
  */

  const isInCart = (
    productId: string
  ) => {
    return items.some(
      (item) =>
        item.product.id === productId
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Total number of products
  |--------------------------------------------------------------------------
  */

  const itemCount = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );
  }, [items]);

  /*
  |--------------------------------------------------------------------------
  | Cart subtotal
  |--------------------------------------------------------------------------
  */

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total +
        item.product.price *
          item.quantity,
      0
    );
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        lastAddedProductId,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/*
|--------------------------------------------------------------------------
| useCart hook
|--------------------------------------------------------------------------
*/

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}