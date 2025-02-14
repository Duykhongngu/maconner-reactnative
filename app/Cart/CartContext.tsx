import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = "cartItems"; // Key lưu dữ liệu vào AsyncStorage

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from AsyncStorage khi ứng dụng khởi động
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
          setCartItems(JSON.parse(storedCart));
        }
      } catch (error) {
        console.error("Failed to load cart", error);
      }
    };

    loadCart();
  }, []);

  // Hàm lưu cart vào AsyncStorage
  const saveCartToStorage = async (items: CartItem[]) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save cart", error);
    }
  };

  const addToCart = (item: CartItem) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (p) =>
          p.id === item.id && p.color === item.color && p.size === item.size
      );

      let updatedCart;
      if (existingItem) {
        updatedCart = prevItems.map((p) =>
          p.id === item.id && p.color === item.color && p.size === item.size
            ? { ...p, quantity: p.quantity + item.quantity }
            : p
        );
      } else {
        updatedCart = [...prevItems, item];
      }

      saveCartToStorage(updatedCart);
      return updatedCart;
    });
  };

  const removeFromCart = (id: number, color: string, size: string) => {
    setCartItems((prevItems) => {
      const updatedCart = prevItems.filter(
        (item) =>
          !(item.id === id && item.color === color && item.size === size)
      );
      saveCartToStorage(updatedCart);
      return updatedCart;
    });
  };

  const updateCartQuantity = (
    id: number,
    color: string,
    size: string,
    newQuantity: number
  ) => {
    setCartItems((prevItems) => {
      const updatedCart = prevItems.map((item) =>
        item.id === id && item.color === color && item.size === size
          ? { ...item, quantity: newQuantity }
          : item
      );
      saveCartToStorage(updatedCart);
      return updatedCart;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    saveCartToStorage([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
      }}
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
export default CartProvider;
