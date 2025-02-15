// OrderContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";

type Order = {
  cartItems: any[]; // Thay thế `any` bằng kiểu dữ liệu cụ thể của sản phẩm trong giỏ hàng
  total: number;
};

type OrderContextType = {
  order: Order | null;
  setOrder: (order: Order) => void;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [order, setOrder] = useState<Order | null>(null);

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
