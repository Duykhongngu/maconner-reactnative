import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { PackageOpen, Trash2 } from "lucide-react-native";
import { useCart } from "./CartContext";
import { router } from "expo-router";

function CartPages() {
  const { cartItems, removeFromCart, updateCartQuantity } = useCart();

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
            variant={"normal"}
            size={"lg"}
            className="mt-4 px-6 py-2 bg-orange-500 rounded-md"
            onPress={() => router.push("/")}
          >
            <Text className="w-full text-white font-semibold text-2xl">
              Keep Shopping
            </Text>
          </Button>
        </View>
      ) : (
        <ScrollView>
          {cartItems.map((item) => (
            <Card
              key={`${item.id}-${item.color}-${item.size}`}
              className="flex-row items-center p-4 mb-4"
            >
              <Image
                source={
                  typeof item.image === "string"
                    ? { uri: item.image }
                    : item.image
                }
                className="w-40 h-40 rounded-md"
              />

              <View className="ml-4 flex-1">
                <Text className="text-2xl font-semibold">
                  Name: {item.name}
                </Text>
                <Text className="text-xl text-orange-500 font-semibold">
                  Price:${item.price.toFixed(2)} USD
                </Text>
                <Text className=" text-lg font-semibold">
                  Color: {item.color}
                </Text>
                <Text className="text-lg font-semibold">Size: {item.size}</Text>

                {/* ✅ Hiển thị số lượng & thêm nút tăng/giảm */}
                <View className="flex-row items-center mt-2">
                  <TouchableOpacity
                    onPress={() =>
                      updateCartQuantity(
                        item.id,
                        item.color,
                        item.size,
                        Math.max(1, item.quantity - 1)
                      )
                    }
                    className="p-2 bg-gray-200 rounded-lg"
                  >
                    <Text className="w-5 p-1 text-2xl ">-</Text>
                  </TouchableOpacity>
                  <Text className="mx-4 text-lg">{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      updateCartQuantity(
                        item.id,
                        item.color,
                        item.size,
                        item.quantity + 1
                      )
                    }
                    className="p-2 bg-gray-200 rounded-lg"
                  >
                    <Text className="w-5 p-1 text-xl">+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Button
                variant="outline"
                onPress={() => removeFromCart(item.id, item.color, item.size)}
              >
                <Trash2 size={16} color={"black"} />
              </Button>
            </Card>
          ))}
          <View className="mt-6 border-t pt-4">
            <Text className="text-lg font-semibold">
              Subtotal: ${subtotal.toFixed(2)} USD
            </Text>
          </View>
          <Button
            variant={"normal"}
            size={"lg"}
            className="mt-4 font-semibold px-6 py-2 bg-orange-500 rounded-md"
            onPress={() => console.log("Proceed to Checkout pressed")}
          >
            <Text className="h-full text-white items-center justify-center text-2xl ">
              Proceed to Checkout
            </Text>
          </Button>
        </ScrollView>
      )}
    </View>
  );
}

export default CartPages;
