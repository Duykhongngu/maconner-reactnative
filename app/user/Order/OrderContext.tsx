"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Order, OrderContextType } from "./components/types";

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const savedOrders = await AsyncStorage.getItem("orders");
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng:", error);
    }
  };

  const saveOrders = async (updatedOrders: Order[]) => {
    try {
      await AsyncStorage.setItem("orders", JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
    } catch (error) {
      console.error("Lỗi khi lưu đơn hàng:", error);
      throw new Error("Không thể lưu đơn hàng");
    }
  };

  const addOrder = async (
    orderData: Omit<Order, "id" | "date" | "status">
  ): Promise<Order> => {
    try {
      const newOrder: Order = {
        ...orderData,
        id: `ORDER-${Date.now()}`,
        date: new Date().toISOString(),
        status: "pending",
      };

      const updatedOrders = [...orders, newOrder];
      await saveOrders(updatedOrders);
      setCurrentOrder(newOrder);
      return newOrder;
    } catch (error) {
      console.error("Lỗi khi thêm đơn hàng:", error);
      throw new Error("Không thể thêm đơn hàng");
    }
  };

  const removeOrder = async (orderId: string) => {
    try {
      const updatedOrders = orders.filter((order) => order.id !== orderId);
      await saveOrders(updatedOrders);
      setOrders(updatedOrders);
      if (currentOrder?.id === orderId) {
        setCurrentOrder(null);
      }
    } catch (error) {
      console.error("Lỗi khi xóa đơn hàng:", error);
      throw new Error("Không thể xóa đơn hàng");
    }
  };

  const getOrder = (id: string) => {
    return orders.find((order) => order.id === id);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        currentOrder,
        setCurrentOrder,
        addOrder,
        getOrder,
        removeOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder phải được sử dụng bên trong OrderProvider");
  }
  return context;
};

export default OrderProvider;
