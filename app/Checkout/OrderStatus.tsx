import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
} from "react-native";
import { useOrder } from "./OrderContext";
import { useRouter } from "expo-router";
import { Button } from "~/components/ui/button";
import { useColorScheme } from "~/lib/useColorScheme";
import Footer from "../Footer/Footer";

interface OrderItem {
  id: string;
  date: string;
  total: number;
}

const OrderStatus: React.FC = () => {
  const { orders, removeOrder } = useOrder();

  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const handleDelete = async (orderId: string) => {
    Alert.alert("Xác nhận xoá", "Bạn có chắc chắn muốn xóa đơn hàng này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          await removeOrder(orderId);
          // Quay về trang chính sau khi xóa
        },
      },
    ]);
  };

  return (
    <View
      style={[
        styles.container,
        isDarkMode ? styles.darkBackground : styles.lightBackground,
      ]}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
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
                router.push(`/Checkout/OrderDetails?id=${item.id}` as any)
              }
            >
              <Text
                style={[
                  styles.orderTitle,
                  isDarkMode ? styles.darkText : styles.lightText,
                ]}
              >
                Name: {item.name}
              </Text>
              <Text
                style={[
                  styles.orderInfo,
                  isDarkMode ? styles.darkText : styles.lightText,
                ]}
              >
                Date: {item.date}
              </Text>
              <Text
                style={[
                  styles.orderPrice,
                  isDarkMode ? styles.darkText : styles.lightText,
                ]}
              >
                Total: ${item.total.toFixed(2)}
              </Text>
              <Button
                onPress={() => handleDelete(item.id)}
                style={{ backgroundColor: "red", marginTop: 10 }}
              >
                <Text style={{ color: "white" }}>Xóa đơn hàng</Text>
              </Button>
            </TouchableOpacity>
          ))
        )}

        <Button style={styles.button} onPress={() => router.push("/home")}>
          <Text
            style={isDarkMode ? styles.darkButtonText : styles.lightButtonText}
          >
            Tiếp tục mua sắm
          </Text>
        </Button>
        <View style={styles.footerContainer}>
          <Footer />
        </View>
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
    fontWeight: 500,
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
