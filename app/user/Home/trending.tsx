"use client";

import { useRouter } from "expo-router";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Button } from "~/components/ui/button";
import { useColorScheme } from "~/lib/useColorScheme";
import { useState, useEffect } from "react";
import { fetchTrendingProducts } from "~/service/products";

// Định nghĩa interface cho sản phẩm
interface Product {
  id: string;
  category: string;
  inStock: boolean;
  link: string;
  name: string;
  price: number;
  description: string;
  trending?: boolean;
  purchaseCount?: number;
  images?: string[];
}

function Trending() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const isDarkColorScheme = colorScheme === "dark";

  // Lấy dữ liệu sản phẩm trending từ service
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const products = await fetchTrendingProducts();
        setTrendingProducts(products);
      } catch (error) {
        console.error("Error fetching trending products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <SafeAreaView
      className={`flex-1 my-2.5 ${
        isDarkColorScheme ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <View className="flex-1 px-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-orange-500">
            Sản phẩm bán chạy
          </Text>
          <Button
            onPress={() => router.push(`/user/Collections/Trending`)}
            className="bg-orange-500 py-2 px-4 rounded-full"
          >
            <Text className="text-white font-semibold text-sm">Xem tất cả</Text>
          </Button>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#F97316" />
          </View>
        ) : trendingProducts.length > 0 ? (
          <View className="flex-row flex-wrap justify-between">
            {trendingProducts.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/user/Products/${item.id}`)}
                className={`rounded-xl mb-4 overflow-hidden border shadow-sm w-[48%] ${
                  isDarkColorScheme
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <View className="relative">
                  <Image
                    source={{ uri: item.images?.[0] || item.link }}
                    className="w-full h-40 rounded-t-xl"
                    onError={(e) =>
                      console.error("Image loading error:", e.nativeEvent.error)
                    }
                  />

                  <View className="absolute top-2 left-2">
                    <View className="bg-red-500 px-2 py-1 rounded">
                      <Text className="text-white text-xs font-bold">Hot</Text>
                    </View>
                  </View>
                </View>

                <View className="p-3">
                  <Text
                    className={`text-base font-semibold ${
                      isDarkColorScheme ? "text-gray-200" : "text-gray-800"
                    }`}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>

                  <Text
                    className={`text-sm mt-1 ${
                      isDarkColorScheme ? "text-gray-400" : "text-gray-600"
                    }`}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>

                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-lg font-bold text-orange-500">
                      {item.price.toLocaleString()} VNĐ
                    </Text>

                    {item.purchaseCount !== undefined &&
                      item.purchaseCount > 0 && (
                        <View className="bg-orange-500 px-2 py-0.5 rounded-full">
                          <Text className="text-white text-xs font-bold">
                            {item.purchaseCount}
                          </Text>
                        </View>
                      )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text
              className={`text-center italic ${
                isDarkColorScheme ? "text-gray-200" : "text-gray-800"
              }`}
            >
              Không có sản phẩm bán chạy
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

export default Trending;
