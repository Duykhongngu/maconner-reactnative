import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
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
  const { t } = useTranslation();
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
          console.log(t('order_not_found'));
          setOrder(null);
        }
      } catch (error) {
        console.error(t('loading_order'), error);
        Alert.alert(t('error'), t('load_orders_error'));
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, t]);

  // Format date to localized format
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  // Translate status to localized text
  const translateStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return t('status_pending');
      case "completed":
        return t('status_completed');
      case "cancelled":
        return t('status_cancelled');
      default:
        return status;
    }
  };

  // Loading state
  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center p-4 ${isDarkMode ? "bg-zinc-900" : "bg-gray-100"}`}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text className={`mt-3 text-base text-center ${isDarkMode ? "text-white" : "text-black"}`}>
          {t('loading_order')}
        </Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View className={`flex-1 p-4 ${isDarkMode ? "bg-zinc-900" : "bg-gray-100"}`}>
        <Text className={`text-lg text-center my-5 ${isDarkMode ? "text-white" : "text-black"}`}>
          {t('order_not_found')}
        </Text>
        <Button
          className="bg-orange-500"
          onPress={() => router.push("/user/Order/OrderStatus")}
        >
          <Text className="text-white font-medium">
            {t('back_to_orders')}
          </Text>
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      className={`flex-1 p-4 mb-9 ${isDarkMode ? "bg-zinc-900" : "bg-gray-100"}`}
    >
      <Text className="text-2xl font-bold mb-4 text-center text-orange-500">
        {t('order_details')}
      </Text>
      <View className="mb-5">
        <Text className={`text-lg font-bold mb-4 text-center text-green-500 ${isDarkMode ? "text-white" : "text-black"}`}>
          {t('order_success')}
        </Text>

        <View className="flex-row justify-center items-center mb-4">
          <Text className="text-base mr-2 text-gray-500">{t('order_status')}:</Text>
          <Text
            className={`text-base font-bold ${
              order.status === "completed"
                ? "text-green-500"
                : order.status === "cancelled"
                ? "text-red-500"
                : "text-orange-500"
            }`}
          >
            {translateStatus(order.status)}
          </Text>
        </View>

        <View className="items-center mb-4">
          <Text className={`text-sm mb-1 ${isDarkMode ? "text-white" : "text-black"}`}>
            {t('order_id')}: {order.id}
          </Text>
          <Text className="text-sm text-gray-500">
            {t('order_date')}: {formatDate(order.date)}
          </Text>
        </View>

        <View className={`p-4 rounded-lg mb-4 shadow ${isDarkMode ? "bg-zinc-800" : "bg-white"}`}>
          <Text className="text-lg font-bold mb-3 text-orange-500">
            {t('customer_info')}
          </Text>

          <View className="flex-row items-center mb-2">
            <MaterialIcons
              name="person"
              size={20}
              color={isDarkMode ? "#ffffff" : "#000000"}
            />
            <Text className={`ml-2 text-base ${isDarkMode ? "text-white" : "text-black"}`}>
              {t('name')}: {order.name || t('no_info')}
            </Text>
          </View>

          <View className="flex-row items-center mb-2">
            <MaterialIcons
              name="email"
              size={20}
              color={isDarkMode ? "#ffffff" : "#000000"}
            />
            <Text className={`ml-2 text-base ${isDarkMode ? "text-white" : "text-black"}`}>
              {t('email')}: {order.email || t('no_info')}
            </Text>
          </View>

          <View className="flex-row items-center mb-2">
            <MaterialIcons
              name="phone"
              size={20}
              color={isDarkMode ? "#ffffff" : "#000000"}
            />
            <Text className={`ml-2 text-base ${isDarkMode ? "text-white" : "text-black"}`}>
              {t('phone')}: {order.phone || t('no_info')}
            </Text>
          </View>
        </View>

        <View className={`p-4 rounded-lg mb-4 shadow ${isDarkMode ? "bg-zinc-800" : "bg-white"}`}>
          <Text className="text-lg font-bold mb-3 text-orange-500">
            {t('shipping_info')}
          </Text>

          <View className="flex-row items-center mb-2">
            <MaterialIcons
              name="location-on"
              size={20}
              color={isDarkMode ? "#ffffff" : "#000000"}
            />
            <Text className={`ml-2 text-base ${isDarkMode ? "text-white" : "text-black"}`}>
              {t('address')}: {order.address || t('no_info')}
            </Text>
          </View>

          <View className="flex-row items-center mb-2">
            <MaterialIcons
              name="language"
              size={20}
              color={isDarkMode ? "#ffffff" : "#000000"}
            />
            <Text className={`ml-2 text-base ${isDarkMode ? "text-white" : "text-black"}`}>
              {t('country')}: {order.country || t('no_info')}
            </Text>
          </View>
        </View>

        <Text className={`text-lg font-bold mt-2 mb-3 ${isDarkMode ? "text-white" : "text-black"}`}>
          {t('product_list')}
        </Text>

        {order.cartItems.map((item) => (
          <View
            key={`${item.id}-${item.color}-${item.size || "default"}`}
            className={`flex-row p-3 rounded-lg mb-3 shadow ${isDarkMode ? "bg-zinc-800" : "bg-white"}`}
          >
            <Image
              source={
                typeof item.image === "string"
                  ? { uri: item.image }
                  : item.image
              }
              className="w-20 h-20 rounded mr-3"
            />
            <View className="flex-1 justify-center">
              <Text className={`text-base font-bold mb-1 ${isDarkMode ? "text-white" : "text-black"}`}>
                {item.name}
              </Text>
              <Text className={`text-sm mb-1 ${isDarkMode ? "text-white" : "text-black"}`}>
                {t('color')}: {item.color} | {t('size')}: {item.size || t('default')}
              </Text>
              <Text className="text-sm text-gray-500">
                {item.price.toLocaleString("vi-VN")} VNĐ x {item.quantity}
              </Text>
              <Text className="text-base font-medium text-orange-500 mt-1">
                {t('amount')}: {(item.price * item.quantity).toLocaleString("vi-VN")} VNĐ
              </Text>
            </View>
          </View>
        ))}

        <View className={`flex-row justify-between items-center p-4 rounded-lg mt-4 ${isDarkMode ? "bg-zinc-800" : "bg-white"}`}>
          <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
            {t('order_total')}:
          </Text>
          <Text className="text-lg font-bold text-orange-500">
            {order.total.toLocaleString("vi-VN")} VNĐ
          </Text>
        </View>
      </View>

      <Button
        className="bg-orange-500 mt-4"
        onPress={() => router.push("/user/Order/OrderStatus")}
      >
        <Text className="text-white font-medium">
          {t('back_to_orders')}
        </Text>
      </Button>
    </ScrollView>
  );
};

export default OrderDetailsScreen;
