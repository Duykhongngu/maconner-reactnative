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
      console.error("Error loading orders:", error);
    }
  };

  const saveOrders = async (updatedOrders: Order[]) => {
    try {
      await AsyncStorage.setItem("orders", JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
    } catch (error) {
      console.error("Error saving orders:", error);
      throw new Error("Failed to save orders");
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
      console.error("Error adding order:", error);
      throw new Error("Failed to add order");
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
      console.error("Error removing order:", error);
      throw new Error("Failed to remove order");
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
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
};

export default OrderProvider;
