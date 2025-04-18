import * as React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  ScrollView,
  Image,
} from "react-native";
import { Search, ShoppingBag } from "lucide-react-native";
import { useColorScheme } from "~/lib/useColorScheme";
import { fetchProducts, fetchTrendingProducts } from "~/service/products";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

// Định nghĩa kiểu cho sản phẩm
interface Product {
  id: string;
  category: string;
  inStock: boolean;
  link: string;
  name: string;
  price: number;
  description: string;
  images?: string[]; // Thêm trường images
}

export default function SearchBar() {
  const router = useRouter();
  const [value, setValue] = React.useState<string>("");
  const [results, setResults] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const inputRef = React.useRef<TextInput>(null);
  const { isDarkColorScheme } = useColorScheme();
  const [trendingProducts, setTrendingProducts] = React.useState<Product[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  // Simulated search function
  const handleSearch = React.useCallback(
    async (query: string) => {
      setLoading(true);
      try {
        const products = await fetchProducts();
        const filtered = products.filter((product) =>
          product.name.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);

        // Animate results appearance
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } catch (error) {
        console.error("Error fetching products:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [fadeAnim, slideAnim]
  );

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

  // Reset animations when search query changes
  useEffect(() => {
    if (value.length === 0) {
      fadeAnim.setValue(0);
      slideAnim.setValue(-20);
    }
  }, [value, fadeAnim, slideAnim]);

  // Hàm xử lý khi người dùng nhấn vào sản phẩm
  const handleProductPress = (productId: string) => {
    router.push(`/user/Products/${productId}`);
  };

  // Hàm xử lý khi người dùng muốn xem tất cả sản phẩm trending
  const handleViewAllTrending = () => {
    // Chuyển đến trang Trending mới tạo
    router.push(`/user/Collections/Trending` as any);
  };

  React.useEffect(() => {
    if (value.length > 0) {
      handleSearch(value);
    } else {
      setResults([]);
    }
  }, [value, handleSearch]);

  // Component hiển thị sản phẩm bán chạy
  const TrendingProductsSection = () => (
    <View
      className={`p-4 mt-4 rounded-xl ${
        isDarkColorScheme ? "bg-gray-800" : "bg-white"
      }`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-bold text-orange-500 tracking-wide">
          SẢN PHẨM BÁN CHẠY
        </Text>
      </View>

      {trendingProducts.map((product, index) => (
        <TouchableOpacity
          key={index}
          className={`flex-row items-center py-2.5 px-3 mb-2 rounded-xl ${
            isDarkColorScheme ? "bg-white/5" : "bg-orange-500/5"
          }`}
          onPress={() => {
            handleProductPress(product.id);
          }}
          activeOpacity={0.7}
          style={{
            borderLeftWidth: 3,
            borderLeftColor: "#FF6B00",
          }}
        >
          {/* Sử dụng hình ảnh sản phẩm nếu có, ngược lại vẫn sử dụng ShoppingBag */}
          {product.images && product.images.length > 0 ? (
            <Image
              source={{ uri: product.images[0] }}
              className="h-12 w-12 rounded-md"
              style={{
                borderWidth: 1,
                borderColor: isDarkColorScheme
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.1)",
              }}
            />
          ) : (
            <View className="bg-orange-100 h-12 w-12 rounded-md justify-center items-center">
              <ShoppingBag size={20} color="#FF6B00" />
            </View>
          )}
          <View className="ml-3 flex-1">
            <Text
              className={`text-sm font-medium ${
                isDarkColorScheme ? "text-white" : "text-black"
              }`}
              numberOfLines={1}
            >
              {product.name}
            </Text>
            <Text className="text-xs text-orange-500 font-medium mt-1">
              {product.price?.toLocaleString("vi-VN") || "0"} VNĐ
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Nút xem tất cả sản phẩm trending */}
      <TouchableOpacity
        className={`mt-2 flex-row justify-center items-center py-3 rounded-lg ${
          isDarkColorScheme ? "bg-white/10" : "bg-orange-500/10"
        }`}
        onPress={handleViewAllTrending}
        activeOpacity={0.7}
        style={{
          borderWidth: 1,
          borderColor: "#FF6B00",
          marginTop: 12,
        }}
      >
        <Text
          className={`font-medium ${
            isDarkColorScheme ? "text-white" : "text-black"
          }`}
        >
          Xem tất cả
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkColorScheme ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <ScrollView className="flex-1 px-4 pt-3">
        <View className="relative mb-2">
          <TextInput
            ref={inputRef}
            placeholder="Tìm kiếm sản phẩm..."
            className={`h-[50px] rounded-full px-5 pr-12 text-base border-[1.5px] ${
              isDarkColorScheme
                ? "border-white/20 bg-gray-800 text-white placeholder:text-white/40"
                : "border-black/10 bg-white text-black placeholder:text-black/40"
            }`}
            value={value}
            onChangeText={setValue}
            onFocus={() => value.length > 0 && handleSearch(value)}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 2,
            }}
          />

          <TouchableOpacity
            className="absolute right-[6px] top-[6px] bg-orange-500 rounded-full w-[38px] h-[38px] justify-center items-center"
            onPress={() => value && handleSearch(value)}
            activeOpacity={0.8}
            style={{
              shadowColor: "#FF6B00",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <Search size={20} color="white" />
          </TouchableOpacity>
        </View>

        {value.length > 0 && (
          <Animated.View
            className={`rounded-xl ${
              isDarkColorScheme ? "bg-gray-800" : "bg-white"
            } max-h-[500px] mb-4`}
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            {loading ? (
              <View className="p-5 items-center">
                <ActivityIndicator size="small" color="#FF6B00" />
                <Text
                  className={`mt-2 ${
                    isDarkColorScheme ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Đang tìm kiếm...
                </Text>
              </View>
            ) : results.length > 0 ? (
              <FlatList
                data={results}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className={`py-3 px-4 border-b ${
                      isDarkColorScheme ? "border-white/10" : "border-black/5"
                    }`}
                    onPress={() => handleProductPress(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-base font-semibold mb-1 ${
                        isDarkColorScheme ? "text-white" : "text-black"
                      }`}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text
                      className={`text-sm mb-1.5 ${
                        isDarkColorScheme ? "text-white/70" : "text-black/60"
                      }`}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {item.description || "Không có mô tả"}
                    </Text>
                    <Text className="text-sm font-bold text-orange-500">
                      {item.price?.toLocaleString("vi-VN") || "0"} VNĐ
                    </Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 8 }}
                scrollEnabled={false}
                nestedScrollEnabled={true}
              />
            ) : (
              <Text
                className={`p-5 text-center ${
                  isDarkColorScheme ? "text-white/60" : "text-black/50"
                } text-sm`}
              >
                Không tìm thấy kết quả phù hợp
              </Text>
            )}
          </Animated.View>
        )}

        {/* Hiển thị sản phẩm bán chạy luôn hiển thị bất kể có tìm kiếm hay không */}
        {!loading && <TrendingProductsSection />}
      </ScrollView>
    </SafeAreaView>
  );
}
