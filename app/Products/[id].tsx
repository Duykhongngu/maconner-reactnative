import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Product, trendingProducts } from "~/app/Data/product"; // Đảm bảo đường dẫn đúng
import { useEffect, useState } from "react";

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const foundProduct = trendingProducts.find((p) => p.id === Number(id));
    if (foundProduct) {
      setProduct(foundProduct);
    }
  }, [id]);

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Product not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView>
      <ScrollView className="p-4 bg-white">
        {/* Ảnh sản phẩm */}
        <Image source={product.img as any} className="w-full h-64 rounded-lg" />

        {/* Thông tin sản phẩm */}
        <Text className="text-xl font-bold mt-4">{product.name}</Text>
        <Text className="text-gray-500">{product.description}</Text>

        {/* Giá tiền */}
        <Text className="text-lg font-bold text-red-500 mt-2">
          ${product.price}
        </Text>

        {/* Màu sắc */}
        <View className="flex-row mt-2">
          {product.colors.map((color) => (
            <View
              key={color}
              className="w-6 h-6 rounded-full mx-1"
              style={{ backgroundColor: color }}
            />
          ))}
        </View>

        {/* Số lượng */}
        <View className="mt-4">
          <Text className="text-lg font-semibold">Quantity</Text>
          <View className="flex-row items-center mt-2">
            <TouchableOpacity className="p-2 bg-gray-200 rounded-lg">
              <Text>-</Text>
            </TouchableOpacity>
            <Text className="mx-4 text-lg">1</Text>
            <TouchableOpacity className="p-2 bg-gray-200 rounded-lg">
              <Text>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nút thêm vào giỏ hàng */}
        <TouchableOpacity className="bg-orange-500 p-4 rounded-lg mt-4">
          <Text className="text-white text-center text-lg">ADD TO CART</Text>
        </TouchableOpacity>

        {/* Quay lại */}
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-center text-blue-500">Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
