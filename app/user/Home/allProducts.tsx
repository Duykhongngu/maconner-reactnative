"use client";

import { useRouter } from "expo-router";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useColorScheme } from "~/lib/useColorScheme";
import { useState, useEffect } from "react";
import { fetchProducts } from "~/service/products";
import Toast from "react-native-toast-message";

// Product interface
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

function AllProducts() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkColorScheme = colorScheme === "dark";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const productsPerPage = 10;

  // Fetch initial products
  useEffect(() => {
    loadProducts();
  }, []);

  // Load products with pagination
  const loadProducts = async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const allProducts = await fetchProducts();

      // Calculate pagination
      const start = (page - 1) * productsPerPage;
      const end = start + productsPerPage;
      const newProducts = allProducts.slice(start, end);

      if (newProducts.length < productsPerPage) {
        setHasMore(false);
      }

      if (page === 1) {
        setProducts(newProducts);
        Toast.show({
          type: "success",
          text1: "Sản phẩm đã được tải",
          text2: `Đã tải ${newProducts.length} sản phẩm`,
          position: "bottom",
          visibilityTime: 2000,
        });
      } else {
        setProducts((prev) => [...prev, ...newProducts]);
        Toast.show({
          type: "info",
          text1: "Đã tải thêm sản phẩm",
          text2: `Đã tải thêm ${newProducts.length} sản phẩm`,
          position: "bottom",
          visibilityTime: 2000,
        });
      }

      setPage(page + 1);
    } catch (error) {
      console.error("Error fetching products:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải sản phẩm. Vui lòng thử lại sau.",
        position: "bottom",
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (productId: string) => {
    router.push(`/user/Products/${productId}`);
    Toast.show({
      type: "info",
      text1: "Đang xem sản phẩm",
      position: "bottom",
      visibilityTime: 1500,
    });
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkColorScheme ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <View className="flex-1 px-4">
        <Text className="text-2xl font-bold text-orange-500 my-4">
          Tất cả sản phẩm
        </Text>

        <ScrollView
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } =
              nativeEvent;
            const isCloseToBottom =
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - 20;
            if (isCloseToBottom && !loading && hasMore) {
              loadProducts();
            }
          }}
          scrollEventThrottle={400}
        >
          <View className="flex-row flex-wrap justify-between">
            {products.length === 0 ? (
              <Text
                className={`text-center italic my-5 w-full ${
                  isDarkColorScheme ? "text-gray-200" : "text-gray-800"
                }`}
              >
                {loading ? "Đang tải sản phẩm..." : "Không có sản phẩm"}
              </Text>
            ) : (
              products.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleProductPress(item.id)}
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
                      onError={(e) => {
                        console.error(
                          "Image loading error:",
                          e.nativeEvent.error
                        );
                        Toast.show({
                          type: "error",
                          text1: "Lỗi hình ảnh",
                          text2: "Không thể tải hình ảnh sản phẩm",
                          position: "bottom",
                          visibilityTime: 2000,
                        });
                      }}
                    />
                    {!item.inStock && (
                      <View className="absolute top-2 right-2 bg-red-500/90 px-2 py-1 rounded">
                        <Text className="text-white text-xs font-bold">
                          Hết hàng
                        </Text>
                      </View>
                    )}
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

                    <Text className="text-lg font-bold text-orange-500 mt-2">
                      {item.price.toLocaleString()} VNĐ
                    </Text>

                    {item.purchaseCount !== undefined &&
                      item.purchaseCount > 0 && (
                        <View className="flex-row items-center mt-1">
                          <Text className="text-xs text-gray-500 italic">
                            Đã bán {item.purchaseCount} lần
                          </Text>
                        </View>
                      )}
                  </View>
                </TouchableOpacity>
              ))
            )}

            {loading && (
              <View className="w-full py-4 items-center">
                <ActivityIndicator size="large" color="#F97316" />
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export default AllProducts;
