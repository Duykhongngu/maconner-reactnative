import React, { useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Button } from "~/components/ui/button";
import { useColorScheme } from "~/lib/useColorScheme";
import { auth, db } from "~/firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import Toast from "react-native-toast-message"; // Import Toast

// Định nghĩa interface cho đơn hàng từ Firebase
interface FirebaseOrder {
  id: string;
  date: string;
  total: number;
  status: "pending" | "completed" | "cancelled";
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  paymentMethod?: "credit" | "cod";
  userId?: string;
  cartItems: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    color: string;
    size: string;
    image: string;
  }[];
  subtotal?: string;
  shippingFee?: string;
}

const OrderStatus: React.FC = () => {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const [orders, setOrders] = useState<FirebaseOrder[]>([]);

  // Lấy dữ liệu đơn hàng từ Firestore theo userId
  useEffect(() => {
    let unsubscribe: () => void;

    const fetchOrders = () => {
      if (auth.currentUser) {
        const q = query(
          collection(db, "orderManager"),
          where("userId", "==", auth.currentUser.uid)
        );
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const ordersData: FirebaseOrder[] = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as FirebaseOrder[];
            setOrders(ordersData);
          },
          (error) => {
            console.error("Lỗi khi lấy đơn hàng từ Firestore:", error);
            Toast.show({
              type: "error",
              text1: "Lỗi",
              text2: "Không thể tải danh sách đơn hàng.",
            });
          }
        );
      } else {
        setOrders([]);
        Toast.show({
          type: "info",
          text1: "Thông báo",
          text2: "Vui lòng đăng nhập để xem đơn hàng của bạn.",
        });
        router.replace("/" as any);
      }
    };

    const authUnsubscribe = onAuthStateChanged(auth, () => {
      fetchOrders();
    });

    // Gọi lần đầu khi component mount
    fetchOrders();

    return () => {
      if (unsubscribe) unsubscribe();
      authUnsubscribe();
    };
  }, [router]);

  return (
    <View
      style={[
        styles.container,
        isDarkMode ? styles.darkBackground : styles.lightBackground,
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContainer}
      >
        <Text
          style={[
            styles.title,
            isDarkMode ? styles.darkText : styles.lightText,
          ]}
        >
          Trạng thái đơn hàng
        </Text>
        <Text
          style={[
            styles.orderCount,
            isDarkMode ? styles.darkText : styles.lightText,
          ]}
        >
          Tổng số đơn hàng: {orders.length}
        </Text>

        {orders.length === 0 ? (
          <Text
            style={[
              styles.message,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            Chưa có đơn hàng nào được đặt.
          </Text>
        ) : (
          orders.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.orderItem,
                isDarkMode ? styles.darkCard : styles.lightCard,
              ]}
              onPress={() =>
                router.push(`/user/Checkout/OrderDetails?id=${item.id}` as any)
              }
            >
              <Text
                style={[
                  styles.orderTitle,
                  isDarkMode ? styles.darkText : styles.lightText,
                ]}
              >
                Mã đơn hàng: {item.id}
              </Text>
              {item.name && (
                <Text
                  style={[
                    styles.orderInfo,
                    isDarkMode ? styles.darkText : styles.lightText,
                  ]}
                >
                  Tên: {item.name}
                </Text>
              )}
              <Text
                style={[
                  styles.orderInfo,
                  isDarkMode ? styles.darkText : styles.lightText,
                ]}
              >
                Ngày đặt: {new Date(item.date).toLocaleDateString()}
              </Text>
              <Text
                style={[
                  styles.orderPrice,
                  isDarkMode ? styles.darkText : styles.lightText,
                ]}
              >
                Tổng cộng: ${item.total.toFixed(2)}
              </Text>
              <Text
                style={[
                  styles.orderInfo,
                  isDarkMode ? styles.darkText : styles.lightText,
                ]}
              >
                Trạng thái: {item.status}
              </Text>
            </TouchableOpacity>
          ))
        )}

        <Button style={styles.button} onPress={() => router.push("/user/home")}>
          <Text
            style={isDarkMode ? styles.darkButtonText : styles.lightButtonText}
          >
            Tiếp tục mua sắm
          </Text>
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  darkBackground: {
    backgroundColor: "#121212",
  },
  lightBackground: {
    backgroundColor: "#f8f9fa",
  },
  darkText: {
    color: "#ffffff",
  },
  lightText: {
    color: "#000000",
  },
  darkCard: {
    backgroundColor: "#1E1E1E",
  },
  lightCard: {
    backgroundColor: "white",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#f97316",
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: "500",
    color: "#f97316",
  },
  message: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  scrollViewContainer: {
    paddingBottom: 20,
  },
  orderItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  orderInfo: {
    fontSize: 14,
    marginBottom: 4,
  },
  button: {
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: "#f97316",
    borderRadius: 8,
    alignItems: "center",
  },
  darkButtonText: {
    color: "#ffffff",
  },
  lightButtonText: {
    color: "#000000",
  },
  orderCount: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#f97316",
  },
  footerContainer: {
    marginTop: 20,
  },
});

export default OrderStatus;
