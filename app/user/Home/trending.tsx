import { useRouter } from "expo-router";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useWindowDimensions } from "react-native";
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
  const { width } = useWindowDimensions();
  const { colorScheme } = useColorScheme();
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);

  const isDarkColorScheme = colorScheme === "dark";

  // Lấy dữ liệu sản phẩm trending từ service
  useEffect(() => {
    const fetchData = async () => {
      try {
        const products = await fetchTrendingProducts();
        setTrendingProducts(products);
      } catch (error) {
        console.error("Error fetching trending products:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <SafeAreaView
      className={`flex-1 my-2.5 ${
        isDarkColorScheme ? "bg-[#121212]" : "bg-white"
      }`}
    >
      <View className="flex-1 px-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-[#F97316]">
            Sản phẩm bán chạy
          </Text>
          <Button
            onPress={() => router.push(`/user/Collections/Trending`)}
            variant="secondary"
            className="bg-[#F97316] justify-center items-center py-2 px-4 rounded-full h-10"
          >
            <Text className="text-base font-semibold text-white">
              Xem tất cả
            </Text>
          </Button>
        </View>

        {trendingProducts.length > 0 ? (
          <View className="flex-row flex-wrap justify-between">
            {trendingProducts.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/user/Products/${item.id}`)}
                className={`rounded-lg p-4 mb-4 border ${
                  isDarkColorScheme
                    ? "bg-[#1E1E1E] border-[#374151]"
                    : "bg-white border-[#E5E7EB]"
                } w-[48%]`}
              >
                <Image
                  source={{ uri: item.images?.[0] || item.link }}
                  className="w-full h-40 rounded-lg"
                  onError={(e) =>
                    console.error("Image loading error:", e.nativeEvent.error)
                  }
                />
                <Text
                  className={`text-base font-semibold ${
                    isDarkColorScheme ? "text-[#E5E7EB]" : "text-[#1E1E1E]"
                  }`}
                >
                  {item.name}
                </Text>
                <Text
                  className={`text-base font-semibold ${
                    isDarkColorScheme ? "text-[#E5E7EB]" : "text-[#1E1E1E]"
                  }`}
                >
                  {item.description}
                </Text>
                <Text className="text-lg font-bold text-[#F97316]">
                  {item.price} VNĐ
                </Text>
                {item.purchaseCount !== undefined && item.purchaseCount > 0 && (
                  <Text className="text-sm text-[#6B7280] italic mt-1">
                    Đã bán {item.purchaseCount} lần
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text
            className={`text-center italic my-2.5 ${
              isDarkColorScheme ? "text-[#E5E7EB]" : "text-[#1E1E1E]"
            }`}
          >
            Không có sản phẩm bán chạy
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

export default Trending;
