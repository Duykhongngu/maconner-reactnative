import { useRouter } from "expo-router";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { ArrowLeft } from "lucide-react-native";
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

function TrendingProducts() {
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const bgColor = isDarkColorScheme ? "#121212" : "#F9FAFB";
  const textColor = isDarkColorScheme ? "#E5E7EB" : "#1E1E1E";
  const cardBgColor = isDarkColorScheme ? "#1E1E1E" : "#FFFFFF";
  const borderColor = isDarkColorScheme ? "#374151" : "#E5E7EB";
  const shadowStyle = !isDarkColorScheme
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
      }
    : {};

  // Hình ảnh dự phòng
  const fallbackImageUri =
    "https://via.placeholder.com/300x300?text=Không+Tìm+Thấy+Hình";

  const handleImageError = (imageUrl: string) => {
    setImageErrors((prev) => ({
      ...prev,
      [imageUrl]: true,
    }));
  };

  // Lấy dữ liệu sản phẩm trending từ service
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const products = await fetchTrendingProducts();
        setTrendingProducts(products);
      } catch (error) {
        console.error("Lỗi tải sản phẩm bán chạy:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderItem = ({ item }: { item: Product }) => {
    // Xác định URL hình ảnh để hiển thị
    const imageUrl = item.images?.[0] || item.link;
    const displayUrl = imageErrors[imageUrl] ? fallbackImageUri : imageUrl;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/user/Products/${item.id}`)}
        style={[
          styles.productCard,
          { backgroundColor: cardBgColor, borderColor },
          shadowStyle,
        ]}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: displayUrl }}
          style={styles.productImage}
          onError={() => handleImageError(imageUrl)}
        />
        <View style={styles.productInfo}>
          <Text
            style={[styles.productName, { color: textColor }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.productDescription,
              { color: isDarkColorScheme ? "#9CA3AF" : "#4B5563" },
            ]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
          <Text style={styles.productPrice}>
            {item.price?.toLocaleString("vi-VN") || "0"} VNĐ
          </Text>
          {item.purchaseCount !== undefined && item.purchaseCount > 0 && (
            <Text style={styles.purchaseCount}>
              Đã bán {item.purchaseCount} lần
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft
            size={24}
            color={isDarkColorScheme ? "#FFFFFF" : "#000000"}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          SẢN PHẨM BÁN CHẠY
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={[styles.loadingText, { color: textColor }]}>
            Đang tải sản phẩm...
          </Text>
        </View>
      ) : trendingProducts.length > 0 ? (
        <FlatList
          data={trendingProducts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: textColor }]}>
            Không có sản phẩm bán chạy
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  listContainer: {
    padding: 12,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  productCard: {
    borderRadius: 12,
    marginBottom: 16,
    width: "48%",
    overflow: "hidden",
    borderWidth: 1,
  },
  productImage: {
    width: "100%",
    height: 160,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  purchaseCount: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default TrendingProducts;
