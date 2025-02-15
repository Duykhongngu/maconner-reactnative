import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Định nghĩa kiểu dữ liệu cho sản phẩm trong giỏ hàng
type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  color: string;
  size: string;
  image: string | number;
};

// Định nghĩa kiểu dữ liệu cho CartContext
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

// Tạo context cho giỏ hàng
const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = "cartItems"; // Key lưu dữ liệu vào AsyncStorage

// Provider cho CartContext
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
      console.log("Cart saved to storage:", items); // Log để kiểm tra
    } catch (error) {
      console.error("Failed to save cart", error);
    }
  };

  // Thêm sản phẩm vào giỏ hàng
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

  // Xóa sản phẩm khỏi giỏ hàng
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

  // Cập nhật số lượng sản phẩm trong giỏ hàng
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

  // Xóa tất cả sản phẩm trong giỏ hàng
  const clearCart = () => {
    console.log("Clearing cart..."); // Log để kiểm tra
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

// Hook để sử dụng CartContext
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export default CartProvider;
