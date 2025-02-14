// OrderStatus.tsx
import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { useCart } from "../Cart/CartContext"; // Import CartContext để lấy thông tin giỏ hàng
import { router } from "expo-router";

const OrderStatus: React.FC = () => {
  const { cartItems } = useCart(); // Lấy thông tin giỏ hàng từ CartContext

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Status</Text>
      {cartItems.length === 0 ? (
        <Text style={styles.message}>No orders placed.</Text>
      ) : (
        <View>
          <Text style={styles.message}>
            Your order has been placed successfully!
          </Text>
          <Text style={styles.subTitle}>Order Summary:</Text>
          {cartItems.map((item) => (
            <Text key={`${item.id}-${item.color}-${item.size}`}>
              {item.name} - ${item.price.toFixed(2)} x {item.quantity}
            </Text>
          ))}
        </View>
      )}
      <Button
        title="Back to Cart"
        onPress={() => router.push("/Cart/CartPages" as any)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
  },
});

export default OrderStatus;
