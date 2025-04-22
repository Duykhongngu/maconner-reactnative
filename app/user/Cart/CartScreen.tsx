import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { useCart } from "./CartContext";
import { Button } from "~/components/ui/button";
import { auth } from "~/firebase.config";

export default function CartScreen() {
  const [loading, setLoading] = useState(false);
  const { cartItems, removeFromCart } = useCart();
  const router = useRouter();

  const showNotification = (
    message: string,
    duration: "SHORT" | "LONG" = "SHORT"
  ) => {
    Alert.alert("Thông báo", message);
  };

  const handleCheckout = () => {
    if (!auth.currentUser) {
      showNotification("Bạn cần đăng nhập để tiếp tục", "SHORT");
      router.push("/user/Auth/Login" as any);
      return;
    }
    router.push("/user/Checkout/Checkout" as any);
  };

  return (
    <ScrollView>
      {cartItems.map((item) => (
        <View key={item.id}>
          <Image source={{ uri: item.image }} />
          <Text>{item.name}</Text>
          <Text>{item.price}</Text>
          <TouchableOpacity onPress={() => removeFromCart(item.id, item.color)}>
            <Trash2 />
          </TouchableOpacity>
        </View>
      ))}
      <Button onPress={handleCheckout} disabled={loading}>
        {loading ? <ActivityIndicator /> : "Checkout"}
      </Button>
    </ScrollView>
  );
}
