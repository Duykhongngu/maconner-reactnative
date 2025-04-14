import { useRouter } from "expo-router";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
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
  const { isDarkColorScheme } = useColorScheme();
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);

  const bgColor = isDarkColorScheme ? "#121212" : "#FFFFFF";
  const textColor = isDarkColorScheme ? "#E5E7EB" : "#1E1E1E";
  const cardBgColor = isDarkColorScheme ? "#1E1E1E" : "#FFFFFF";
  const borderColor = isDarkColorScheme ? "#374151" : "#E5E7EB";

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
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: "#F97316" }]}>
          Trending Products
        </Text>
        {trendingProducts.length > 0 ? (
          <View style={styles.productContainer}>
            {trendingProducts.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/user/Products/${item.id}`)}
                style={[
                  styles.productCard,
                  { backgroundColor: cardBgColor, borderColor },
                ]}
              >
                <Image
                  source={{ uri: item.images?.[0] || item.link }}
                  style={styles.productImage}
                  onError={(e) =>
                    console.error("Image loading error:", e.nativeEvent.error)
                  }
                />
                <Text style={[styles.productDescription, { color: textColor }]}>
                  {item.name}
                </Text>
                <Text style={[styles.productDescription, { color: textColor }]}>
                  {item.description}
                </Text>
                <Text style={styles.productPrice}>$ {item.price} USD</Text>
                {item.purchaseCount !== undefined && item.purchaseCount > 0 && (
                  <Text style={styles.purchaseCount}>
                    Purchased {item.purchaseCount} times
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyMessage, { color: textColor }]}>
            No trending products found
          </Text>
        )}
        <View style={styles.showMoreContainer}>
          <Button
            onPress={() => router.push(`/user/Collections/NightLight` as any)}
            variant="secondary"
            style={styles.showMoreButton}
          >
            <Text style={[styles.showMoreText]}>Shop All</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  productContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productCard: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    width: "48%",
  },
  productImage: {
    width: "100%",
    height: 160,
    borderRadius: 10,
  },
  productDescription: {
    fontSize: 16,
    fontWeight: "600",
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F97316",
  },
  showMoreContainer: {
    alignItems: "center",
  },
  showMoreButton: {
    backgroundColor: "#F97316",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 99999,
    width: "40%",
    height: 50,
  },
  showMoreText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyMessage: {
    textAlign: "center",
    fontStyle: "italic",
    marginVertical: 10,
  },
  purchaseCount: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 4,
  },
});

export default Trending;
