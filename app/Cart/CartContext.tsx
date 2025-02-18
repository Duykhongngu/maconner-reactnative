"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  color: string;
  size: string;
  image: string | any;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, color: string, size: string) => void;
  updateCartQuantity: (
    id: string,
    color: string,
    size: string,
    quantity: number
  ) => void; // Add this method
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = async () => {
    try {
      const savedCartItems = await AsyncStorage.getItem("cartItems");
      if (savedCartItems) {
        setCartItems(JSON.parse(savedCartItems));
      }
    } catch (error) {
      console.error("Error loading cart items:", error);
    }
  };

  const saveCartItems = async (updatedCartItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem("cartItems", JSON.stringify(updatedCartItems));
      setCartItems(updatedCartItems);
    } catch (error) {
      console.error("Error saving cart items:", error);
      throw new Error("Failed to save cart items");
    }
  };

  const addToCart = (item: CartItem) => {
    const existingItem = cartItems.find(
      (i) => i.id === item.id && i.color === item.color && i.size === item.size
    );
    if (existingItem) {
      const updatedCartItems = cartItems.map((i) =>
        i.id === item.id && i.color === item.color && i.size === item.size
          ? { ...i, quantity: i.quantity + item.quantity } // Cập nhật số lượng
          : i
      );
      saveCartItems(updatedCartItems);
    } else {
      saveCartItems([...cartItems, item]); // Thêm sản phẩm mới
    }
  };

  const removeFromCart = (id: string, color: string, size: string) => {
    const updatedCartItems = cartItems.filter(
      (item) => !(item.id === id && item.color === color && item.size === size)
    );
    saveCartItems(updatedCartItems);
  };

  const updateCartQuantity = (
    id: string,
    color: string,
    size: string,
    quantity: number
  ) => {
    const updatedCartItems = cartItems.map((item) =>
      item.id === id && item.color === color && item.size === size
        ? { ...item, quantity }
        : item
    );
    saveCartItems(updatedCartItems);
  };

  const clearCart = () => {
    saveCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateCartQuantity, // Add this to the context provider
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export default CartContext;
