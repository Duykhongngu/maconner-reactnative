import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  SafeAreaView,
  Modal,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "~/lib/useColorScheme";
import { Button } from "~/components/ui/button";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  increment,
  getDoc,
  orderBy,
  limit,
  writeBatch,
} from "firebase/firestore";
import { db } from "~/firebase.config";
import { Search } from "lucide-react-native";
import { Order, OrderItem } from "./types";
import SearchFilter from "./components/SearchFilter";
import OrderItemComponent from "./components/OrderItem";

const colors = [
  { name: "Red" },
  { name: "Green" },
  { name: "Blue" },
  { name: "Yellow" },
  { name: "Black" },
  { name: "White" },
  { name: "Pink" },
  { name: "Purple" },
  { name: "Orange" },
  { name: "Brown" },
  { name: "Gray" },
];

const OrderManager: React.FC = () => {
  const router = useRouter();
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
      return date.toLocaleDateString();
    } catch (error) {
      return "Invalid date";
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
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

          setOrders(ordersData);
          setFilteredOrders(ordersData);
        } catch (error) {
          setError("Error processing orders data");
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setError("Failed to load orders");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let result = orders;

    if (statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter);
    }

    if (searchQuery) {
      result = result.filter(
        (order) =>
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredOrders(result);
  }, [statusFilter, searchQuery, orders]);

  const updateProductPurchaseCount = async (orderId: string) => {
    try {
      const orderRef = doc(db, "orderManager", orderId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        console.error("Order not found");
        return;
      }

      const orderData = orderSnap.data() as Order;

      if (!orderData.cartItems || orderData.cartItems.length === 0) {
        console.log("Order has no items to update purchase count");
        return;
      }

      for (const item of orderData.cartItems) {
        const productRef = doc(db, "products", item.id);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data();
          const currentStock = productData.stockQuantity || 0;

          await updateDoc(productRef, {
            purchaseCount: increment(item.quantity),
            stockQuantity: currentStock - item.quantity,
            inStock: currentStock - item.quantity > 0,
          });

          console.log(
            `Updated product ${item.id}: purchased ${
              item.quantity
            }, remaining stock ${currentStock - item.quantity}`
          );
        }
      }

      const categoriesRef = collection(db, "categories");
      const q = query(
        categoriesRef,
        where("name", "==", "Trending"),
        where("autoUpdate", "==", true)
      );
      const categorySnap = await getDocs(q);

      if (!categorySnap.empty) {
        const trendingCategory = categorySnap.docs[0];

        const productsRef = collection(db, "products");
        const topProductsQuery = query(
          productsRef,
          orderBy("purchaseCount", "desc"),
          limit(20)
        );
        const topProductsSnap = await getDocs(topProductsQuery);

        const topProductIds = topProductsSnap.docs.map((doc) => doc.id);

        await updateDoc(doc(db, "categories", trendingCategory.id), {
          productIds: topProductIds,
          lastUpdated: new Date().toISOString(),
        });

        const batch = writeBatch(db);

        const allProductsQuery = query(collection(db, "products"));
        const allProductsSnap = await getDocs(allProductsQuery);

        allProductsSnap.forEach((docSnap) => {
          const productRef = doc(db, "products", docSnap.id);
          batch.update(productRef, { Trending: false });
        });

        for (const productId of topProductIds) {
          const productRef = doc(db, "products", productId);
          batch.update(productRef, { Trending: true });
        }

        await batch.commit();

        console.log("Trending products updated automatically");
      }
    } catch (error) {
      console.error("Error updating product purchase counts:", error);
    }
  };

  const updateOrderStatus = useCallback(
    async (orderId: string, newStatus: string) => {
      if (!["pending", "completed", "cancelled"].includes(newStatus)) {
        Alert.alert("Error", "Invalid status");
        return;
      }

      try {
        const orderRef = doc(db, "orderManager", orderId);
        await updateDoc(orderRef, {
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });

        if (newStatus === "completed") {
          await updateProductPurchaseCount(orderId);
        }

        Alert.alert("Success", "Order status updated successfully");
      } catch (error) {
        console.error("Error updating order status:", error);
        Alert.alert("Error", "Failed to update order status");
      }
    },
    []
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setStatusFilter("all");
    setSearchQuery("");

    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1">
        <View
          className={`flex-1 p-4 ${
            isDarkColorScheme ? "bg-black" : "bg-white"
          }`}
        >
          <Text
            className={`text-2xl font-bold text-center ${
              isDarkColorScheme ? "text-gray-100" : "text-gray-800"
            }`}
          >
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1">
        <View
          className={`flex-1 p-4 ${
            isDarkColorScheme ? "bg-black" : "bg-white"
          }`}
        >
          <Text
            className={`text-2xl font-bold text-center ${
              isDarkColorScheme ? "text-gray-100" : "text-gray-800"
            }`}
          >
            {error}
          </Text>
          <Button onPress={onRefresh} className="mt-4 bg-blue-500 p-2 rounded">
            <Text className="text-white text-center">Retry</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <View
        className={`flex-1 p-4 ${isDarkColorScheme ? "bg-black" : "bg-white"}`}
      >
        <Text
          className={`text-2xl font-bold text-center ${
            isDarkColorScheme ? "text-gray-100" : "text-gray-800"
          }`}
        >
          Order Management
        </Text>

        <SearchFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          modalVisible={modalVisible}
          setModalVisible={setModalVisible}
          isDarkMode={isDarkMode}
        />

        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredOrders.map((order) => (
            <OrderItemComponent
              key={order.id}
              order={order}
              updateOrderStatus={updateOrderStatus}
              isDarkMode={isDarkMode}
              formatDate={formatDate}
            />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "#f97316";
    case "completed":
      return "#10b981";
    case "cancelled":
      return "#ef4444";
    default:
      return "#6b7280";
  }
};

const styles = StyleSheet.create({
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  colorContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  colorBox: {
    width: 50,
    height: 50,
    margin: 5,
    borderRadius: 5,
  },
  selectedColorText: {
    marginTop: 20,
    fontSize: 18,
  },
});

export default React.memo(OrderManager);
