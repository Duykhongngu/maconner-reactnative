import type React from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { PackageOpen, Trash2 } from "lucide-react-native";
import { useCart } from "./CartContext";
import { router } from "expo-router";

const CartPages: React.FC = () => {
  const { cartItems, removeFromCart, updateCartQuantity } = useCart();

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyCartContainer}>
          <PackageOpen size={48} color="#374151" />
          <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
          <Text style={styles.emptyCartSubtitle}>
            Explore special gifts for you and your loved ones.
          </Text>
          <Button
            variant="normal"
            size="lg"
            style={styles.keepShoppingButton}
            onPress={() => router.push("/")}
          >
            <Text style={styles.keepShoppingButtonText}>Keep Shopping</Text>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {cartItems.map((item) => (
          <Card
            key={`${item.id}-${item.color}-${item.size}`}
            style={styles.cartItemCard}
          >
            <Image
              source={
                typeof item.image === "string"
                  ? { uri: item.image }
                  : item.image
              }
              style={styles.cartItemImage}
            />

            <View style={styles.cartItemDetails}>
              <Text style={styles.cartItemName}>Name: {item.name}</Text>
              <Text style={styles.cartItemPrice}>
                Price: ${item.price.toFixed(2)} USD
              </Text>
              <Text style={styles.cartItemInfo}>Color: {item.color}</Text>
              <Text style={styles.cartItemInfo}>Size: {item.size}</Text>

              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  onPress={() =>
                    updateCartQuantity(
                      item.id,
                      item.color,
                      item.size,
                      Math.max(1, item.quantity - 1)
                    )
                  }
                  style={styles.quantityButton}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() =>
                    updateCartQuantity(
                      item.id,
                      item.color,
                      item.size,
                      item.quantity + 1
                    )
                  }
                  style={styles.quantityButton}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button
              variant="outline"
              onPress={() => removeFromCart(item.id, item.color, item.size)}
            >
              <Trash2 size={16} color="black" />
            </Button>
          </Card>
        ))}
        <View style={styles.subtotalContainer}>
          <Text style={styles.subtotalText}>
            Subtotal: ${subtotal.toFixed(2)} USD
          </Text>
        </View>
        <Button
          variant="normal"
          size="lg"
          style={styles.checkoutButton}
          onPress={() => console.log("Proceed to Checkout pressed")}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "white",
  },
  emptyCartContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyCartSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
  keepShoppingButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: "#F97316",
    borderRadius: 8,
  },
  keepShoppingButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  cartItemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 16,
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  cartItemDetails: {
    marginLeft: 16,
    flex: 1,
  },
  cartItemName: {
    fontSize: 18,
    fontWeight: "600",
  },
  cartItemPrice: {
    fontSize: 16,
    color: "#F97316",
    fontWeight: "600",
  },
  cartItemInfo: {
    fontSize: 14,
    fontWeight: "500",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  quantityButton: {
    padding: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  quantityText: {
    marginHorizontal: 16,
    fontSize: 16,
  },
  subtotalContainer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 16,
  },
  subtotalText: {
    fontSize: 18,
    fontWeight: "600",
  },
  checkoutButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: "#F97316",
    borderRadius: 8,
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default CartPages;
