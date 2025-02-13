import { View, Text, ScrollView, Image } from "react-native";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { PackageOpen, Trash2 } from "lucide-react-native";
import { useCart } from "./CartContext";

function CartPages() {
  const { cartItems, removeFromCart } = useCart();

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <View className="flex-1 p-4 bg-white">
      {cartItems.length === 0 ? (
        <View className="items-center justify-center flex-1">
          <PackageOpen size={48} color="#374151" />
          <Text className="text-xl font-semibold mt-4">Your cart is empty</Text>
          <Text className="text-gray-500 text-center mt-2">
            Explore special gifts for you and your loved ones.
          </Text>
          <Button
            className="mt-4 px-6 py-2"
            onPress={() => console.log("Keep Shopping pressed")}
          >
            <Text>Keep Shopping</Text>
          </Button>
        </View>
      ) : (
        <ScrollView>
          {cartItems.map((item) => (
            <Card key={item.id} className="flex-row items-center p-4 mb-4">
              <Image
                source={
                  typeof item.image === "string"
                    ? { uri: item.image }
                    : item.image
                }
                className="w-16 h-16 rounded-md"
              />

              <View className="ml-4 flex-1">
                <Text>{item.name}</Text>
                <Text>${item.price.toFixed(2)} USD</Text>
              </View>
              <Button variant="outline" onPress={() => removeFromCart(item.id)}>
                <Trash2 size={16} color={"black"} />
              </Button>
            </Card>
          ))}
          <View className="mt-6 border-t pt-4">
            <Text className="text-lg font-semibold">
              Subtotal: ${subtotal.toFixed(2)} USD
            </Text>
            <Button
              className="mt-4 px-6 py-2"
              onPress={() => console.log("Proceed to Checkout pressed")}
            >
              <Text>Proceed to Checkout</Text>
            </Button>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

export default CartPages;
