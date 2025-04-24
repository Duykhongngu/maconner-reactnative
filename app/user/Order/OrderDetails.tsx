import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
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
          {t('loading_order')}
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
          {t('order_not_found')}
        </Text>
        <Button
          style={styles.button}
          onPress={() => router.push("/user/Order/OrderStatus")}
        >
          <Text
            style={isDarkMode ? styles.darkButtonText : styles.lightButtonText}
          >
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
      style={[
        styles.container,
        isDarkMode ? styles.darkBackground : styles.lightBackground,
      ]}
    >
      <Text
        style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}
      >
        {t('order_details')}
      </Text>
      <View style={styles.orderDetailsContainer}>
        <Text
          style={[
            styles.successMessage,
            isDarkMode ? styles.darkText : styles.lightText,
          ]}
        >
          {t('order_success')}
        </Text>

        <View style={styles.orderStatusContainer}>
          <Text style={styles.orderStatusLabel}>{t('order_status')}:</Text>
          <Text
            style={[
              styles.orderStatusValue,
              order.status === "completed"
                ? styles.statusCompleted
                : order.status === "cancelled"
                ? styles.statusCancelled
                : styles.statusPending,
            ]}
          >
            {translateStatus(order.status)}
          </Text>
        </View>

        <View style={styles.orderIdContainer}>
          <Text
            style={[
              styles.orderIdText,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            {t('order_id')}: {order.id}
          </Text>
          <Text
            style={[
              styles.orderDateText,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            {t('order_date')}: {formatDate(order.date)}
          </Text>
        </View>

        <View
          style={[
            styles.infoGroupContainer,
            isDarkMode ? styles.darkCard : styles.lightCard,
          ]}
        >
          <Text
            style={[
              styles.infoGroupTitle,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            {t('customer_info')}
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
              {t('name')}: {order.name || t('no_info')}
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
              {t('email')}: {order.email || t('no_info')}
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
              {t('phone')}: {order.phone || t('no_info')}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.infoGroupContainer,
            isDarkMode ? styles.darkCard : styles.lightCard,
          ]}
        >
          <Text
            style={[
              styles.infoGroupTitle,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            {t('shipping_info')}
          </Text>

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
              {t('address')}: {order.address || t('no_info')}
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
              {t('country')}: {order.country || t('no_info')}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.sectionTitle,
            isDarkMode ? styles.darkText : styles.lightText,
          ]}
        >
          {t('product_list')}
        </Text>

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
                {t('color')}: {item.color} | {t('size')}: {item.size || t('default')}
              </Text>
              <Text style={styles.itemPrice}>
                {item.price.toLocaleString("vi-VN")} VNĐ x {item.quantity}
              </Text>
              <Text style={styles.itemSubtotal}>
                {t('amount')}: {(item.price * item.quantity).toLocaleString("vi-VN")} VNĐ
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
            {t('order_total')}:
          </Text>
          <Text style={[styles.totalPrice]}>
            {order.total.toLocaleString("vi-VN")} VNĐ
          </Text>
        </View>
      </View>

      <Button
        style={styles.button}
        onPress={() => router.push("/user/Order/OrderStatus")}
      >
        <Text
          style={isDarkMode ? styles.darkButtonText : styles.lightButtonText}
        >
          {t('back_to_orders')}
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
    marginBottom: 20,
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
  orderStatusContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  orderStatusLabel: {
    fontSize: 16,
    marginRight: 8,
    color: "#6b7280",
  },
  orderStatusValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statusCompleted: {
    color: "#10b981",
  },
  statusCancelled: {
    color: "#ef4444",
  },
  statusPending: {
    color: "#f97316",
  },
  orderIdContainer: {
    marginBottom: 16,
    alignItems: "center",
  },
  orderIdText: {
    fontSize: 14,
    marginBottom: 4,
  },
  orderDateText: {
    fontSize: 14,
    color: "#6b7280",
  },
  infoGroupContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoGroupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#f97316",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 12,
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
    fontSize: 14,
    color: "#6b7280",
  },
  itemSubtotal: {
    fontSize: 15,
    fontWeight: "500",
    color: "#f97316",
    marginTop: 4,
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
