export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  color: string;
  image: string;
  images?: string[];
  description: string;
  size?: string;
}

export interface Order {
  id: string;
  date: string;
  cartItems: CartItem[];
  total: number;
  userId?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  paymentMethod?: "credit" | "cod" | "stripe";
  paymentStatus?: "pending" | "paid" | "failed";
  subtotal?: string;
  shippingFee?: string;
  discountAmount?: string;
  voucherId?: string;
  status: "pending" | "completed" | "cancelled";
}

export interface OrderContextType {
  orders: Order[];
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  addOrder: (orderData: Omit<Order, "id" | "date" | "status">) => Promise<Order>;
  getOrder: (id: string) => Order | undefined;
  removeOrder: (id: string) => Promise<void>;
} 