import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { useOrder } from "./OrderContext";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Button } from "~/components/ui/button";
import { useColorScheme } from "~/lib/useColorScheme";
import { MaterialIcons } from "@expo/vector-icons";
import Footer from "../Footer/Footer";

const OrderDetailsScreen: React.FC = () => {
  const { getOrder } = useOrder();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { id } = useLocalSearchParams();

  const order = getOrder(id as string);

  if (!order) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Order not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
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
          Đơn hàng của bạn đã đặt thành công!
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
            Tên: {order.name}
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
            Email: {order.email}
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
            Số điện thoại: {order.phone}
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
            Địa chỉ: {order.address}
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
            Quốc gia: {order.country}
          </Text>
        </View>

        {/* Sử dụng ScrollView để render cartItems */}
        {order.cartItems.map((item) => (
          <View
            key={`${item.id}-${item.color}-${item.size}`}
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
                Màu: {item.color} | Size: {item.size}
              </Text>
              <Text style={styles.itemPrice}>
                ${item.price.toFixed(2)} x {item.quantity}
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
            Tổng cộng:{" "}
          </Text>
          <Text style={[styles.totalPrice]}>${order.total.toFixed(2)}</Text>
        </View>
      </View>

      <Button
        style={styles.button}
        onPress={() => router.push("/Checkout/OrderStatus")}
      >
        <Text
          style={isDarkMode ? styles.darkButtonText : styles.lightButtonText}
        >
          Quay lại danh sách đơn hàng
        </Text>
      </Button>
      <Footer />
    </ScrollView>
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
  successMessage: {
    fontSize: 16,
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  orderDetailsContainer: {
    marginBottom: 20,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  itemContainer: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  itemInfo: {
    fontSize: 14,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f97316",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: "#f97316",
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 40,
  },
  darkButtonText: {
    color: "#ffffff",
  },
  lightButtonText: {
    color: "#000000",
  },
  message: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
});

export default OrderDetailsScreen;
