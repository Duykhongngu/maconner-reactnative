import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useColorScheme } from "~/lib/useColorScheme";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { PackageOpen, Trash2 } from "lucide-react-native";
import { useCart } from "./CartContext";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import SuggestedProducts from "~/app/user/Cart/components/SuggestedProducts";

const CartPages: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkColorScheme } = useColorScheme();
  const iconColor = isDarkColorScheme ? "white" : "black";
  const bgColor = isDarkColorScheme ? "#1E1E1E" : "white";
  const textColor = isDarkColorScheme ? "white" : "black";
  const borderColor = isDarkColorScheme ? "#374151" : "#E5E7EB";

  const { cartItems, removeFromCart, updateCartQuantity } = useCart();

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  if (cartItems.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.emptyCartContainer}>
          <PackageOpen size={48} color={iconColor} />
          <Text style={[styles.emptyCartTitle, { color: textColor }]}>
            {t("cart_empty")}
          </Text>
          <Text style={[styles.emptyCartSubtitle, { color: textColor }]}>
            {t("cart_empty_message")}
          </Text>
          <Button
            variant="normal"
            size="lg"
            style={styles.keepShoppingButton}
            onPress={() => router.push("/user/home")}
          >
            <Text style={styles.keepShoppingButtonText}>
              {t("continue_shopping")}
            </Text>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {cartItems.map((item) => (
          <Card
            key={`${item.id}-${item.color}`}
            style={[
              styles.cartItemCard,
              { backgroundColor: bgColor, borderColor },
            ]}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.cartItemImage}
              onError={(e) =>
                console.error("Cart item image error:", e.nativeEvent.error)
              }
            />

            <View style={styles.cartItemDetails}>
              <Text style={[styles.cartItemName, { color: textColor }]}>
                {item.name}
              </Text>
              <Text style={[styles.cartItemPrice, { color: "#F97316" }]}>
                {item.price} VNĐ
              </Text>
              <Text style={[styles.cartItemInfo, { color: textColor }]}>
                {t("color")}: {item.color || t("default")}
              </Text>
              <Text style={[styles.cartItemInfo, { color: textColor }]}>
                {t("quantity")}: {item.quantity}
              </Text>

              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  onPress={() =>
                    updateCartQuantity(
                      item.id,
                      item.color,

                      Math.max(1, item.quantity - 1)
                    )
                  }
                  style={[
                    styles.quantityButton,
                    { backgroundColor: borderColor },
                  ]}
                >
                  <Text
                    style={[styles.quantityButtonText, { color: textColor }]}
                  >
                    -
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.quantityText, { color: textColor }]}>
                  {item.quantity}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    updateCartQuantity(
                      item.id,
                      item.color,

                      item.quantity + 1
                    )
                  }
                  style={[
                    styles.quantityButton,
                    { backgroundColor: borderColor },
                  ]}
                >
                  <Text
                    style={[styles.quantityButtonText, { color: textColor }]}
                  >
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button
              variant="outline"
              onPress={() => removeFromCart(item.id, item.color)}
            >
              <Trash2 size={16} color={iconColor} />
            </Button>
          </Card>
        ))}
        <View style={styles.subtotalContainer}>
          <Text style={[styles.subtotalText, { color: textColor }]}>
            {t("subtotal")}: {subtotal} VNĐ
          </Text>
        </View>
        <Button
          variant="normal"
          size="lg"
          style={styles.checkoutButton}
          onPress={() => router.push("/user/Checkout/Checkout")}
        >
          <Text style={styles.checkoutButtonText}>
            {t("continue_to_checkout")}
          </Text>
        </Button>
        <View style={{ marginTop: 20 }}>
          <SuggestedProducts />
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
    borderWidth: 1,
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
