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

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  lastAddedProductId: string | null;

  addToCart: (product: Product, quantity?: number) => void;
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
    const timeoutId = window.setTimeout(() => {
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
            setItems(parsedCart);
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
  }, []);

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

  const addToCart = (
    product: Product,
    quantity = 1
  ) => {
    const availableQuantity =
      product.stockQuantity ?? product.stock ?? 0;

    if (
      !product.inStock ||
      availableQuantity <= 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return;
    }

    setLastAddedProductId(product.id);

    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) =>
          item.product.id === product.id
      );

      if (existingItem) {
        const newQuantity = Math.min(
          existingItem.quantity + quantity,
          availableQuantity
        );

        return currentItems.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: newQuantity,
              }
            : item
        );
      }

      return [
        ...currentItems,
        {
          product,
          quantity: Math.min(
            quantity,
            availableQuantity
          ),
        },
      ];
    });
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