// OrderContext.tsx
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Cập nhật kiểu Order để bao gồm thông tin bổ sung
type Order = {
  cartItems: any[]; // Thay thế `any` bằng kiểu dữ liệu cụ thể của sản phẩm trong giỏ hàng
  total: number;
  name: string; // Tên gui đặt hàng
  email: string; // Email người đặt hàng
  phone: string; // Số điện thoại người đặt hàng
  address: string; // Địa chỉ giao hàng
  country: string; // Quốc gia
};

type OrderContextType = {
  order: Order | null;
  setOrder: (order: Order) => void;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [order, setOrder] = useState<Order | null>(null);

  // Khôi phục đơn hàng từ AsyncStorage khi ứng dụng khởi động
  useEffect(() => {
    const loadOrder = async () => {
      try {
        const existingOrder = await AsyncStorage.getItem("currentOrder");
        if (existingOrder) {
          setOrder(JSON.parse(existingOrder));
        }
      } catch (error) {
        console.error("Error loading order from AsyncStorage:", error);
      }
    };

    loadOrder();
  }, []);

  // Cập nhật đơn hàng vào AsyncStorage khi nó thay đổi
  useEffect(() => {
    const saveOrder = async () => {
      if (order) {
        try {
          await AsyncStorage.setItem("currentOrder", JSON.stringify(order));
        } catch (error) {
          console.error("Error saving order to AsyncStorage:", error);
        }
      } else {
        // Nếu không có đơn hàng, xóa khỏi AsyncStorage
        await AsyncStorage.removeItem("currentOrder");
      }
    };

    saveOrder();
  }, [order]);

  return (
    <OrderContext.Provider value={{ order, setOrder }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
};

export default OrderContext;
