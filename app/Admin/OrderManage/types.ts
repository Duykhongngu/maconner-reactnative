export interface Order {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  date: string;
  total: number;
  status: string;
  cartItems: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    color: string;
    size: string;
    image: string;
  }[];
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
  image?: string;
  images?: string[];
  size?: string;
  description?: string;
}

export type OrderStatus = "pending" | "completed" | "cancelled"; 

