import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Button } from "~/components/ui/button";
import { useColorScheme } from "~/lib/useColorScheme";
import { auth, db } from "~/firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Order } from "./components/types";

// Interface for Firebase order data
interface FirebaseOrder extends Order {}

const OrderStatus: React.FC = () => {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const [orders, setOrders] = useState<FirebaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  // Fetch orders from Firestore by userId
  useEffect(() => {
    let unsubscribe: () => void;

    const fetchOrders = () => {
      if (auth.currentUser) {
        setLoading(true);
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

            // Sort orders by date (newest first)
            const sortedOrders = ordersData.sort((a, b) => {
              const dateA = new Date(a.date).getTime();
              const dateB = new Date(b.date).getTime();
              return dateB - dateA; // Descending order (newest first)
            });

            setOrders(sortedOrders);
            setLoading(false);
          },
          (error) => {
            console.error("Error loading orders:", error);
            Alert.alert(t("error"), t("load_orders_error"));
            setLoading(false);
          }
        );
      } else {
        setOrders([]);
        setLoading(false);
        Alert.alert(t("notification"), t("please_login"));
        router.replace("/" as any);
      }
    };

    const authUnsubscribe = onAuthStateChanged(auth, () => {
      fetchOrders();
    });

    // Call on component mount
    fetchOrders();

    return () => {
      if (unsubscribe) unsubscribe();
      authUnsubscribe();
    };
  }, [router, t]);

  // Format date to Vietnamese format
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  // Translate status to Vietnamese
  const translateStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return t("status_pending");
      case "completed":
        return t("status_completed");
      case "cancelled":
        return t("status_cancelled");
      default:
        return status;
    }
  };

  // Show loading spinner
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
          {t("loading_orders")}
        </Text>
      </View>
    );
  }

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
          {t("order_status_title")}
        </Text>
        <Text
          style={[
            styles.orderCount,
            isDarkMode ? styles.darkText : styles.lightText,
          ]}
        >
          {t("total_orders", { count: orders.length })}
        </Text>

        {orders.length === 0 ? (
          <Text
            style={[
              styles.message,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            {t("no_orders")}
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
                router.push(`/user/Order/OrderDetails?id=${item.id}` as any)
              }
            >
              <Text
                style={[
                  styles.orderTitle,
                  isDarkMode ? styles.darkText : styles.lightText,
                ]}
              >
                {t("order_id")}: {item.id}
              </Text>
              {item.name && (
                <Text
                  style={[
                    styles.orderInfo,
                    isDarkMode ? styles.darkText : styles.lightText,
                  ]}
                >
                  {t("order_customer")}: {item.name}
                </Text>
              )}
              <Text
                style={[
                  styles.orderInfo,
                  isDarkMode ? styles.darkText : styles.lightText,
                ]}
              >
                {t("order_date")}: {formatDate(item.date)}
              </Text>
              <Text
                style={[
                  styles.orderPrice,
                  isDarkMode ? styles.darkText : styles.lightText,
                ]}
              >
                {t("order_total")}: {item.total.toLocaleString("vi-VN")} VNĐ
              </Text>
              <Text
                style={[
                  styles.orderInfo,
                  item.status === "completed"
                    ? styles.statusCompleted
                    : item.status === "cancelled"
                    ? styles.statusCancelled
                    : styles.statusPending,
                ]}
              >
                {t("order_status")}: {translateStatus(item.status)}
              </Text>
            </TouchableOpacity>
          ))
        )}

        <Button style={styles.button} onPress={() => router.push("/user/home")}>
          <Text
            style={isDarkMode ? styles.darkButtonText : styles.lightButtonText}
          >
            {t("continue_shopping")}
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
  orderCount: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  orderItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  orderInfo: {
    fontSize: 16,
    marginBottom: 4,
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: "500",
    color: "#f97316",
  },
  statusCompleted: {
    color: "#10b981",
    fontWeight: "500",
  },
  statusCancelled: {
    color: "#ef4444",
    fontWeight: "500",
  },
  statusPending: {
    color: "#f97316",
    fontWeight: "500",
  },
  message: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  scrollViewContainer: {
    paddingBottom: 20,
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

export default OrderStatus;
