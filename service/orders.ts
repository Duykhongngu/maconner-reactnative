import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "~/firebase.config";

export interface Order {
  id: string;
  date: string;
  total: number;
  status: "pending" | "completed" | "cancelled";
  name?: string;
  email?: string;
  phone?: string;
  userId?: string;
}

export const fetchOrders = (
  onSuccess: (orders: Order[]) => void,
  onError: (error: string) => void
) => {
  return onSnapshot(
    collection(db, "orderManager"),
    (snapshot) => {
      try {
        const ordersData: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];

        ordersData.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return isNaN(dateB) || isNaN(dateA) ? 0 : dateB - dateA;
        });

        onSuccess(ordersData);
      } catch (error) {
        onError("Error processing orders data");
        console.error(error);
      }
    },
    (error) => {
      console.error("Error fetching orders:", error);
      onError("Failed to load orders");
    }
  );
};

export const updateOrderStatus = async (orderId: string, newStatus: string) => {
  if (!["pending", "completed", "cancelled"].includes(newStatus)) {
    throw new Error("Invalid status");
  }

  const orderRef = doc(db, "orderManager", orderId);
  await updateDoc(orderRef, {
    status: newStatus,
    updatedAt: new Date().toISOString(),
  });
};

export const formatOrderDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
    return date.toLocaleDateString();
  } catch (error) {
    return "Invalid date";
  }
};
