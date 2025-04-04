import * as React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from "react-native";
import { Search, TrendingUp } from "lucide-react-native";
import { Button } from "../../components/ui/button";
import { useColorScheme } from "~/lib/useColorScheme"; // Import useColorScheme
import { fetchProducts } from "~/service/products"; // Import fetchProducts
import { useRouter } from "expo-router"; // Import useRouter để điều hướng

// Mock trending searches data
const trendingSearches = [
  "valentines gift for him",
  "a boy and his dog",
  "a girl and her dog",
  "valentines gift",
  "bottle lamp",
];

// Định nghĩa kiểu cho sản phẩm
interface Product {
  id: string;
  category: string;
  inStock: boolean;
  link: string;
  name: string;
  price: number;
  description: string; // Đảm bảo trường này có mặt
}

export default function SearchBar() {
  const router = useRouter(); // Sử dụng hook useRouter
  const [value, setValue] = React.useState<string>("");
  const [results, setResults] = React.useState<Product[]>([]); // Chỉ định kiểu cho results
  const [loading, setLoading] = React.useState<boolean>(false);
  const inputRef = React.useRef<TextInput>(null);
  const { isDarkColorScheme } = useColorScheme(); // Get the current color scheme

  // Simulated search function
  const handleSearch = React.useCallback(async (query: string) => {
    setLoading(true);
    try {
      const products = await fetchProducts(); // Fetch products from API
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } catch (error) {
      console.error("Error fetching products:", error);
      setResults([]); // Reset results on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Hàm xử lý khi người dùng nhấn vào sản phẩm
  const handleProductPress = (productId: string) => {
    router.push(`/user/Products/${productId}`);
  };

  React.useEffect(() => {
    if (value.length > 0) {
      handleSearch(value);
    } else {
      setResults([]);
    }
  }, [value, handleSearch]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="w-full mx-auto">
        <View className="relative">
          <TextInput
            ref={inputRef}
            placeholder="Search"
            className={`w-full px-4 pr-12 h-12 rounded-full border ${
              isDarkColorScheme ? "border-white" : "border-black"
            }`}
            placeholderTextColor={isDarkColorScheme ? "lightgray" : "gray"} // Change placeholder color
            value={value}
            onChangeText={setValue}
            onFocus={() => value.length > 0 && handleSearch(value)}
            style={{
              backgroundColor: isDarkColorScheme ? "#333" : "#fff", // Change background color
              color: isDarkColorScheme ? "#fff" : "#000", // Change text color
            }}
          />

          <TouchableOpacity
            className="absolute right-1 top-[13px] transform -translate-y-3 p-2 rounded-full bg-orange-500"
            onPress={() => value && handleSearch(value)}
          >
            <Search size={24} color="white" />
          </TouchableOpacity>
        </View>
        {value.length > 0 && (
          <View
            className="absolute top-12 left-0 right-0 z-50"
            style={{
              backgroundColor: isDarkColorScheme ? "#444" : "#fff", // Change background color for results
              borderRadius: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            {loading ? (
              <Text className="text-center w-full h-full text-sm text-gray-500 p-4">
                Đang tìm kiếm...
              </Text>
            ) : results.length > 0 ? (
              <FlatList
                className="w-full"
                data={results}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="py-3 px-4 border-b border-gray-200"
                    onPress={() => handleProductPress(item.id)}
                    style={{
                      backgroundColor: isDarkColorScheme ? "#555" : "#fff", // Change background color for each item
                    }}
                  >
                    <Text
                      className="text-base font-medium"
                      style={{ color: isDarkColorScheme ? "#fff" : "#000" }} // Change text color
                    >
                      {item.name}
                    </Text>
                    <Text
                      className="text-xs mt-1"
                      style={{
                        color: isDarkColorScheme ? "lightgray" : "gray",
                      }} // Change category text color
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {item.description || "Không có mô tả"}
                    </Text>
                    <Text className="text-xs mt-1 text-orange-500 font-bold">
                      ${item.price?.toFixed(2) || "0.00"} USD
                    </Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <Text className="w-full h-full text-center text-sm text-gray-500 p-4">
                Không tìm thấy kết quả
              </Text>
            )}
            <View className="p-4">
              <Text
                className="text-sm font-bold mb-2"
                style={{ color: isDarkColorScheme ? "orange" : "orange" }} // Change trending searches title color
              >
                TÌM KIẾM PHỔ BIẾN
              </Text>
              {trendingSearches.map((search, index) => (
                <Button
                  key={index}
                  className="flex-row w-full justify-start overflow-auto py-2"
                  onPress={() => {
                    setValue(search);
                    handleSearch(search);
                    inputRef.current?.focus();
                  }}
                  style={{
                    backgroundColor: isDarkColorScheme ? "#555" : "#fff", // Change background color for trending searches
                  }}
                >
                  <TrendingUp color={"orange"} size={24} />
                  <Text style={{ color: isDarkColorScheme ? "#fff" : "#000" }}>
                    {search}
                  </Text>
                </Button>
              ))}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
