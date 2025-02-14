import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useCart } from "../Cart/CartContext"; // Import CartContext để lấy thông tin giỏ hàng
import { useColorScheme } from "~/lib/useColorScheme"; // Giả sử bạn có hook này để lấy chế độ màu
import { router } from "expo-router"; // Import router để điều hướng

const Checkout: React.FC = () => {
  const { cartItems, clearCart } = useCart(); // Lấy thông tin giỏ hàng từ CartContext
  const { isDarkColorScheme } = useColorScheme(); // Lấy chế độ màu hiện tại

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  // Định nghĩa màu sắc cho chế độ sáng và tối
  const bgColor = isDarkColorScheme ? "#1E1E1E" : "#FFFFFF";
  const textColor = isDarkColorScheme ? "#FFFFFF" : "#000000";
  const borderColor = isDarkColorScheme ? "#444444" : "#CCCCCC";
  const buttonColor = "#F97316"; // Màu nút không thay đổi

  const handlePlaceOrder = () => {
    // Xóa giỏ hàng
    clearCart();
    // Điều hướng đến trang OrderStatus
    router.push("/Checkout/OrderStatus" as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView>
        <Text style={[styles.title, { color: textColor }]}>Checkout</Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Shipping Information
          </Text>
          <TextInput
            style={[styles.input, { borderColor: borderColor }]}
            placeholder="Full Name"
            placeholderTextColor="#888"
          />
          <TextInput
            style={[styles.input, { borderColor: borderColor }]}
            placeholder="Address"
            placeholderTextColor="#888"
          />
          <TextInput
            style={[styles.input, { borderColor: borderColor }]}
            placeholder="City"
            placeholderTextColor="#888"
          />
          <TextInput
            style={[styles.input, { borderColor: borderColor }]}
            placeholder="Postal Code"
            placeholderTextColor="#888"
          />
          <TextInput
            style={[styles.input, { borderColor: borderColor }]}
            placeholder="Phone Number"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Order Summary
          </Text>
          {cartItems.map((item) => (
            <View
              key={`${item.id}-${item.color}-${item.size}`}
              style={styles.item}
            >
              <Text style={[styles.itemName, { color: textColor }]}>
                {item.name}
              </Text>
              <Text style={[styles.itemPrice, { color: buttonColor }]}>
                ${item.price.toFixed(2)} x {item.quantity}
              </Text>
            </View>
          ))}
          <View style={styles.subtotalContainer}>
            <Text style={[styles.subtotalText, { color: textColor }]}>
              Subtotal: ${subtotal.toFixed(2)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: buttonColor }]}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.buttonText}>Place Order</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemName: {
    fontSize: 16,
  },
  itemPrice: {
    fontSize: 16,
  },
  subtotalContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  subtotalText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  button: {
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default Checkout;
