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
  RefreshControl,
} from "react-native";
import { useColorScheme } from "~/lib/useColorScheme";
import { useState, useEffect, useCallback } from "react";
import { fetchProducts } from "~/service/products";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = async (showToast = true) => {
    try {
      setLoading(true);
      const allProducts = await fetchProducts();
      setProducts(allProducts);

      if (showToast) {
        Toast.show({
          type: "success",
          text1: t("load_success"),
          text2: t("load_products_success", { count: allProducts.length }),
          position: "bottom",
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      Toast.show({
        type: "error",
        text1: t("load_error"),
        text2: t("load_products_error"),
        position: "bottom",
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts(false).finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    loadProducts();
  }, []);

  const handleProductPress = (productId: string) => {
    router.push(`/user/Products/${productId}`);
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkColorScheme ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <View className="flex-1 px-4">
        <Text className="text-2xl font-bold text-orange-500 my-4">
          {t("all_products")} ({products.length})
        </Text>

        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View className="flex-row flex-wrap justify-between">
            {products.length === 0 ? (
              <Text
                className={`text-center italic my-5 w-full ${
                  isDarkColorScheme ? "text-gray-200" : "text-gray-800"
                }`}
              >
                {loading ? t("loading_products") : t("no_products")}
              </Text>
            ) : (
              products.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleProductPress(item.id)}
                  className={`w-[48%] rounded-xl mb-4 overflow-hidden border shadow-sm ${
                    isDarkColorScheme
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <View className="relative">
                    <Image
                      source={{ uri: item.images?.[0] || item.link }}
                      className="w-full h-40 rounded-t-xl"
                      onError={() => {
                        Toast.show({
                          type: "error",
                          text1: t("image_error"),
                          text2: t("image_load_error"),
                          position: "bottom",
                          visibilityTime: 2000,
                        });
                      }}
                    />
                    {!item.inStock && (
                      <View className="absolute top-2 right-2 bg-red-500/90 px-2 py-1 rounded">
                        <Text className="text-white text-xs font-bold">
                          {t("out_of_stock")}
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
                            {t("sold_count", { count: item.purchaseCount })}
                          </Text>
                        </View>
                      )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      {loading && (
        <View className="absolute inset-0  flex items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      )}
    </SafeAreaView>
  );
}

export default AllProducts;
