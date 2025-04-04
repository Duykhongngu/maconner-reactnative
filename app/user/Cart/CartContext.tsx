"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { auth, db } from "~/firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  color: string;
  image: string;
  description: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, color: string) => void;
  updateCartQuantity: (id: string, color: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Lấy giỏ hàng từ Firestore khi người dùng đăng nhập
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const cartRef = doc(db, "carts", currentUser.uid);
          const cartSnap = await getDoc(cartRef);
          if (cartSnap.exists()) {
            setCartItems(cartSnap.data().items || []);
          } else {
            setCartItems([]); // Nếu không có giỏ hàng, khởi tạo rỗng
            await setDoc(cartRef, { items: [] }, { merge: true }); // Tạo tài liệu rỗng nếu chưa tồn tại
          }
        } catch (error) {
          console.error("Lỗi khi lấy giỏ hàng từ Firestore:", error);
          setCartItems([]); // Đặt giỏ hàng rỗng nếu có lỗi
        }
      } else {
        setCartItems([]); // Nếu không đăng nhập, giỏ hàng rỗng
      }
    });

    return () => unsubscribe();
  }, []);

  // Lưu giỏ hàng vào Firestore
  const saveCartToFirestore = async (items: CartItem[]) => {
    if (auth.currentUser) {
      try {
        const cartRef = doc(db, "carts", auth.currentUser.uid);
        // Kiểm tra và loại bỏ các thuộc tính không hợp lệ
        const validItems = items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          color: item.color || "default", // Đảm bảo color không undefined
          image: item.image,
          description: item.description || "", // Đảm bảo description không undefined
        }));
        await setDoc(cartRef, { items: validItems }, { merge: true });
      } catch (error) {
        console.error("Lỗi khi lưu giỏ hàng vào Firestore:", error);
      }
    }
  };

  const addToCart = (item: CartItem) => {
    // Đảm bảo item.color không bị undefined hoặc null
    const safeItem = {
      ...item,
      color: item.color || "Default",
    };

    setCartItems((prevItems) => {
      // Tìm sản phẩm có cùng id và màu sắc
      const existingItem = prevItems.find(
        (i) => i.id === safeItem.id && i.color === safeItem.color
      );

      let updatedItems;
      if (existingItem) {
        // Nếu sản phẩm đã tồn tại, cập nhật số lượng
        updatedItems = prevItems.map((i) =>
          i.id === safeItem.id && i.color === safeItem.color
            ? { ...i, quantity: i.quantity + safeItem.quantity }
            : i
        );
      } else {
        // Nếu sản phẩm chưa tồn tại, thêm mới
        updatedItems = [...prevItems, safeItem];
      }

      // Lưu giỏ hàng vào Firestore
      saveCartToFirestore(updatedItems);
      return updatedItems;
    });
  };

  const removeFromCart = (id: string, color: string) => {
    setCartItems((prevItems) => {
      const updatedItems = prevItems.filter(
        (item) => !(item.id === id && item.color === color)
      );
      saveCartToFirestore(updatedItems);
      return updatedItems;
    });
  };

  const updateCartQuantity = (id: string, color: string, quantity: number) => {
    setCartItems((prevItems) => {
      const updatedItems = prevItems.map((item) =>
        item.id === id && item.color === color
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      );
      saveCartToFirestore(updatedItems);
      return updatedItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    if (auth.currentUser) {
      const cartRef = doc(db, "carts", auth.currentUser.uid);
      setDoc(cartRef, { items: [] }, { merge: true });
    }
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
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export default CartProvider;
