import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Button } from "~/components/ui/button";
import { useColorScheme } from "~/lib/useColorScheme";
import { MaterialIcons } from "@expo/vector-icons";
import { db } from "~/firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { Order } from "./components/types";

// Interface for Firebase order data
interface FirebaseOrder extends Order {}

const OrderDetailsScreen: React.FC = () => {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<FirebaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch order details from Firestore
  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const orderRef = doc(db, "orderManager", id as string);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
          setOrder({ id: orderSnap.id, ...orderSnap.data() } as FirebaseOrder);
        } else {
          console.log("Order not found in Firestore");
          setOrder(null);
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        Alert.alert("Error", "Unable to load order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          isDarkMode ? styles.darkBackground : styles.lightBackground,
        ]}
      >
        <ActivityIndicator size="large" color="#f97316" />
        <Text
          style={[
            styles.loadingText,
            isDarkMode ? styles.darkText : styles.lightText,
          ]}
        >
          Đang tải thông tin đơn hàng...
        </Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View
        style={[
          styles.container,
          isDarkMode ? styles.darkBackground : styles.lightBackground,
        ]}
      >
        <Text
          style={[
            styles.message,
            isDarkMode ? styles.darkText : styles.lightText,
          ]}
        >
          Order not found
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      style={[
        styles.container,
        isDarkMode ? styles.darkBackground : styles.lightBackground,
      ]}
    >
      <Text
        style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}
      >
        Chi tiết đơn hàng
      </Text>
      <View style={styles.orderDetailsContainer}>
        <Text
          style={[
            styles.successMessage,
            isDarkMode ? styles.darkText : styles.lightText,
          ]}
        >
          Đơn hàng của bạn đã được đặt thành công!
        </Text>
        <View style={styles.infoContainer}>
          <MaterialIcons
            name="person"
            size={20}
            color={isDarkMode ? "#ffffff" : "#000000"}
          />
          <Text
            style={[
              styles.itemInfo,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            Tên: {order.name || "Không có thông tin"}
          </Text>
        </View>
        <View style={styles.infoContainer}>
          <MaterialIcons
            name="email"
            size={20}
            color={isDarkMode ? "#ffffff" : "#000000"}
          />
          <Text
            style={[
              styles.itemInfo,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            Email: {order.email || "Không có thông tin"}
          </Text>
        </View>
        <View style={styles.infoContainer}>
          <MaterialIcons
            name="phone"
            size={20}
            color={isDarkMode ? "#ffffff" : "#000000"}
          />
          <Text
            style={[
              styles.itemInfo,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            SĐT: {order.phone || "Không có thông tin"}
          </Text>
        </View>
        <View style={styles.infoContainer}>
          <MaterialIcons
            name="location-on"
            size={20}
            color={isDarkMode ? "#ffffff" : "#000000"}
          />
          <Text
            style={[
              styles.itemInfo,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            Địa chỉ: {order.address || "Không có thông tin"}
          </Text>
        </View>
        <View style={styles.infoContainer}>
          <MaterialIcons
            name="language"
            size={20}
            color={isDarkMode ? "#ffffff" : "#000000"}
          />
          <Text
            style={[
              styles.itemInfo,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            Quốc gia: {order.country || "Không có thông tin"}
          </Text>
        </View>

        {/* Display cart items */}
        {order.cartItems.map((item) => (
          <View
            key={`${item.id}-${item.color}-${item.size || "default"}`}
            style={[
              styles.itemContainer,
              isDarkMode ? styles.darkCard : styles.lightCard,
            ]}
          >
            <Image
              source={
                typeof item.image === "string"
                  ? { uri: item.image }
                  : item.image
              }
              style={styles.itemImage}
            />
            <View style={styles.itemDetails}>
              <Text
                style={[
                  styles.itemName,
                  isDarkMode ? styles.darkText : styles.lightText,
                ]}
              >
                {item.name}
              </Text>
              <Text
                style={[
                  styles.itemInfo,
                  isDarkMode ? styles.darkText : styles.lightText,
                ]}
              >
                Màu: {item.color} | Size: {item.size || "Standard"}
              </Text>
              <Text style={styles.itemPrice}>
                {item.price.toFixed(2)} x {item.quantity}
              </Text>
            </View>
          </View>
        ))}

        <View
          style={[
            styles.totalContainer,
            isDarkMode ? styles.darkCard : styles.lightCard,
          ]}
        >
          <Text
            style={[
              styles.totalText,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            Tổng:{" "}
          </Text>
          <Text style={[styles.totalPrice]}>{order.total.toFixed(2)} VNĐ</Text>
        </View>
      </View>

      <Button
        style={styles.button}
        onPress={() => router.push("/user/Order/OrderStatus")}
      >
        <Text
          style={isDarkMode ? styles.darkButtonText : styles.lightButtonText}
        >
          Back to Orders
        </Text>
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: "center",
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
  message: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  orderDetailsContainer: {
    marginBottom: 20,
  },
  successMessage: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#10b981",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  itemContainer: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  itemInfo: {
    fontSize: 14,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "500",
    color: "#f97316",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f97316",
  },
  button: {
    backgroundColor: "#f97316",
    marginTop: 16,
  },
  darkButtonText: {
    color: "#ffffff",
    fontWeight: "500",
  },
  lightButtonText: {
    color: "#ffffff",
    fontWeight: "500",
  },
});

export default OrderDetailsScreen;
