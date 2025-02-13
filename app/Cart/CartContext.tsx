import { createContext, useContext, useState, ReactNode } from "react";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  color: string;
  size: string;
  image: string | number;
};

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number, color: string, size: string) => void;
  updateCartQuantity: (
    id: number,
    color: string,
    size: string,
    newQuantity: number
  ) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (p) =>
          p.id === item.id && p.color === item.color && p.size === item.size
      );

      if (existingItem) {
        return prevItems.map((p) =>
          p.id === item.id && p.color === item.color && p.size === item.size
            ? { ...p, quantity: p.quantity + item.quantity } // ✅ Cộng dồn số lượng
            : p
        );
      }

      return [...prevItems, { ...item }];
    });
  };

  const removeFromCart = (id: number, color: string, size: string) => {
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) =>
          !(item.id === id && item.color === color && item.size === size)
      )
    );
  };

  const updateCartQuantity = (
    id: number,
    color: string,
    size: string,
    newQuantity: number
  ) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id && item.color === color && item.size === size
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, updateCartQuantity }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
