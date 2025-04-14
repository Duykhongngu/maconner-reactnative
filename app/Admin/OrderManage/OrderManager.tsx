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

interface Order {
  id: string;
  date: string;
  total: number;
  status: "pending" | "completed" | "cancelled";
  name?: string;
  email?: string;
  phone?: string;
  userId?: string;
  items?: OrderItem[];
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
}

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

  // Improved date formatting
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

  // Improved order fetching with loading state
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

  // Filter and search functionality
  useEffect(() => {
    let result = orders;

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter);
    }

    // Apply search query
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

  // Cập nhật thứ hạng sản phẩm khi đơn hàng được hoàn thành
  const updateProductPurchaseCount = async (orderId: string) => {
    try {
      // Lấy thông tin đơn hàng
      const orderRef = doc(db, "orderManager", orderId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        console.error("Order not found");
        return;
      }

      const orderData = orderSnap.data() as Order;

      // Nếu đơn hàng không có items, thoát
      if (!orderData.items || orderData.items.length === 0) {
        console.log("Order has no items to update purchase count");
        return;
      }

      // Cập nhật purchaseCount cho mỗi sản phẩm trong đơn hàng
      for (const item of orderData.items) {
        const productRef = doc(db, "products", item.id);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data();
          const currentStock = productData.stockQuantity || 0;

          // Cập nhật số lượng mua và số lượng tồn kho
          await updateDoc(productRef, {
            purchaseCount: increment(item.quantity),
            stockQuantity: currentStock - item.quantity,
            // Cập nhật trạng thái inStock dựa trên số lượng còn lại
            inStock: currentStock - item.quantity > 0,
          });

          console.log(
            `Updated product ${item.id}: purchased ${
              item.quantity
            }, remaining stock ${currentStock - item.quantity}`
          );
        }
      }

      // Kiểm tra xem có danh mục Trending được bật auto-update không
      const categoriesRef = collection(db, "categories");
      const q = query(
        categoriesRef,
        where("name", "==", "Trending"),
        where("autoUpdate", "==", true)
      );
      const categorySnap = await getDocs(q);

      if (!categorySnap.empty) {
        // Có danh mục Trending với auto-update bật
        const trendingCategory = categorySnap.docs[0];

        // Lấy top 20 sản phẩm bán chạy nhất
        const productsRef = collection(db, "products");
        const topProductsQuery = query(
          productsRef,
          orderBy("purchaseCount", "desc"),
          limit(20)
        );
        const topProductsSnap = await getDocs(topProductsQuery);

        const topProductIds = topProductsSnap.docs.map((doc) => doc.id);

        // Cập nhật danh sách sản phẩm trending
        await updateDoc(doc(db, "categories", trendingCategory.id), {
          productIds: topProductIds,
          lastUpdated: new Date().toISOString(),
        });

        // Cập nhật trường Trending cho từng sản phẩm
        const batch = writeBatch(db);

        // Đầu tiên, đặt tất cả sản phẩm là không trending
        const allProductsQuery = query(collection(db, "products"));
        const allProductsSnap = await getDocs(allProductsQuery);

        allProductsSnap.forEach((docSnap) => {
          const productRef = doc(db, "products", docSnap.id);
          batch.update(productRef, { Trending: false });
        });

        // Sau đó đánh dấu các sản phẩm top là trending
        for (const productId of topProductIds) {
          const productRef = doc(db, "products", productId);
          batch.update(productRef, { Trending: true });
        }

        // Thực hiện tất cả các cập nhật trong một batch
        await batch.commit();

        console.log("Trending products updated automatically");
      }
    } catch (error) {
      console.error("Error updating product purchase counts:", error);
    }
  };

  // Cập nhật hàm updateOrderStatus để gọi updateProductPurchaseCount khi đơn hàng chuyển sang trạng thái completed
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

        // Nếu trạng thái mới là "completed", cập nhật purchaseCount của sản phẩm
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

  // Improved refresh handling
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Reload data
    setStatusFilter("all");
    setSearchQuery("");

    // End refreshing after 1 second
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Hàm để hiển thị modal
  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  // Loading state
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

  // Error state
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

        {/* Search and Filter Section */}
        <View className="mb-4">
          <View className="flex-row items-center mb-2 border rounded border-gray-300">
            <View className="bg-white dark:bg-black">
              <Search
                size={20}
                color={isDarkMode ? "#ffffff" : "#000000"}
                className="mx-2"
              />
            </View>
            <TextInput
              className={`flex-1 p-2 text-l ${
                isDarkMode ? "bg-black text-white" : "bg-white text-black"
              }`}
              placeholder="Search orders..."
              placeholderTextColor={isDarkMode ? "#888" : "#666"}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View className="mb-4">
            <TouchableOpacity
              onPress={toggleModal}
              className={`h-12 ${
                isDarkMode ? "bg-[#333333] text-white" : "bg-white text-black"
              } border rounded flex-row items-center justify-between p-2`}
            >
              <Text className="text-lg font-bold text-black dark:text-white">
                {statusFilter === "all"
                  ? "All Orders"
                  : statusFilter.charAt(0).toUpperCase() +
                    statusFilter.slice(1)}
              </Text>
            </TouchableOpacity>

            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={toggleModal}
            >
              <View style={styles.modalView}>
                <TouchableOpacity
                  onPress={() => {
                    setStatusFilter("all");
                    toggleModal();
                  }}
                  className="p-2"
                >
                  <Text>All Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setStatusFilter("pending");
                    toggleModal();
                  }}
                  className="p-2"
                >
                  <Text>Pending</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setStatusFilter("completed");
                    toggleModal();
                  }}
                  className="p-2"
                >
                  <Text>Completed</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setStatusFilter("cancelled");
                    toggleModal();
                  }}
                  className="p-2"
                >
                  <Text>Cancelled</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleModal} className="p-2">
                  <Text>Close</Text>
                </TouchableOpacity>
              </View>
            </Modal>
          </View>
        </View>

        {/* Orders List */}
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              className={`p-4 mb-3 rounded border ${
                isDarkMode
                  ? "bg-[#1E1E1E] border-gray-600"
                  : "bg-white border-gray-300"
              }`}
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text
                  className={`text-lg font-bold ${
                    isDarkMode ? "text-white" : "text-black"
                  }`}
                >
                  Order ID: {order.id}
                </Text>
                <Text className={`font-bold ${getStatusColor(order.status)}`}>
                  {order.status.toUpperCase()}
                </Text>
              </View>

              <Text
                className={`text-base ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              >
                Customer: {order.name || "N/A"}
              </Text>
              <Text
                className={`text-base ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              >
                Date: {formatDate(order.date)}
              </Text>
              <Text
                className={`text-lg font-bold ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              >
                Total: ${order.total.toFixed(2)}
              </Text>

              {/* Status Update Buttons */}
              <View className="flex-row justify-between mt-3">
                <Button
                  onPress={() => updateOrderStatus(order.id, "pending")}
                  className="flex-1 mx-1 bg-orange-500 p-2 rounded"
                >
                  <Text className="text-white text-center">Pending</Text>
                </Button>
                <Button
                  onPress={() => updateOrderStatus(order.id, "completed")}
                  className="flex-1 mx-1 bg-green-500 p-2 rounded"
                >
                  <Text className="text-white text-center">Complete</Text>
                </Button>
                <Button
                  onPress={() => updateOrderStatus(order.id, "cancelled")}
                  className="flex-1 mx-1 bg-red-500 p-2 rounded"
                >
                  <Text className="text-white text-center">Cancel</Text>
                </Button>
              </View>
            </TouchableOpacity>
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
