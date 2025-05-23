import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
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
        className={`flex-1 justify-center items-center p-4 ${
          isDarkMode ? "bg-zinc-900" : "bg-gray-100"
        }`}
      >
        <ActivityIndicator size="large" color="#f97316" />
        <Text
          className={`mt-3 text-base text-center ${
            isDarkMode ? "text-white" : "text-black"
          }`}
        >
          {t("loading_orders")}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <View
        className={`flex-1 p-4 ${
          isDarkMode ? "bg-zinc-900" : "bg-gray-100"
        }`}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <Text
            className={`text-2xl font-bold mb-4 text-center text-orange-500`}
          >
            {t("order_status_title")}
          </Text>
          <Text
            className={`text-base mb-4 text-center ${
              isDarkMode ? "text-white" : "text-black"
            }`}
          >
            {t("total_orders")} {orders.length}
          </Text>

          {orders.length === 0 ? (
            <Text
              className={`text-lg text-center mt-5 ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
              {t("no_orders")}
            </Text>
          ) : (
            orders.map((item) => (
              <TouchableOpacity
                key={item.id}
                className={`p-4 rounded-lg mb-4 shadow ${
                  isDarkMode ? "bg-zinc-800" : "bg-white"
                }`}
                onPress={() =>
                  router.push(`/user/Order/OrderDetails?id=${item.id}` as any)
                }
              >
                <Text
                  className={`text-lg font-bold mb-2 ${
                    isDarkMode ? "text-white" : "text-black"
                  }`}
                >
                  {t("order_id")}: {item.id}
                </Text>
                {item.name && (
                  <Text
                    className={`text-base mb-1 ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    {t("order_customer")}: {item.name}
                  </Text>
                )}
                <Text
                  className={`text-base mb-1 ${
                    isDarkMode ? "text-white" : "text-black"
                  }`}
                >
                  {t("order_date")}: {formatDate(item.date)}
                </Text>
                <Text
                  className="text-lg font-medium text-orange-500"
                >
                  {t("order_total")}: {item.total.toLocaleString("vi-VN")} VNĐ
                </Text>
                <Text
                  className={`text-base ${
                    item.status === "completed"
                      ? "text-green-500"
                      : item.status === "cancelled"
                      ? "text-red-500"
                      : "text-orange-500"
                  } font-medium`}
                >
                  {t("order_status")}: {translateStatus(item.status)}
                </Text>
              </TouchableOpacity>
            ))
          )}

          <Button
            className="bg-orange-500 mt-4"
            onPress={() => router.push("/user/home")}
          >
            <Text className="text-white font-medium">
              {t("continue_shopping")}
            </Text>
          </Button>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default OrderStatus;
