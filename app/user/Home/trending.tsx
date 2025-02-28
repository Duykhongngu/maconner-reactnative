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
import { collection, getDocs } from "firebase/firestore";
import { db } from "~/firebase.config";

// Định nghĩa interface cho sản phẩm
interface Product {
  id: string;
  category: string;
  inStock: boolean;
  link: string;
  name: string;
  price: number;
  size: string;
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

  // Lấy dữ liệu sản phẩm từ Firestore và lọc theo category "valentine"
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const allProducts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          category: doc.data().category || "",
          inStock: doc.data().inStock !== false,
          link: doc.data().link || "",
          name: doc.data().name || "",
          price: Number(doc.data().price) || 0,
          size: doc.data().size || "xs",
        })) as Product[];

        // Lọc các sản phẩm thuộc danh mục "valentine"
        const valentineProducts = allProducts.filter(
          (product) => product.category.toLowerCase() === "valentine"
        );
        setTrendingProducts(valentineProducts);
      } catch (error) {
        console.error("Error fetching trending products:", error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: "#F97316" }]}>
          Trending Now - Valentine
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
                  source={{ uri: item.link }}
                  style={styles.productImage}
                  onError={(e) =>
                    console.error("Image loading error:", e.nativeEvent.error)
                  }
                />
                <Text style={[styles.productDescription, { color: textColor }]}>
                  {item.name}
                </Text>
                <Text style={styles.productPrice}>$ {item.price} USD</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyMessage, { color: textColor }]}>
            No Valentine products found
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
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    height: 60,
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
});

export default Trending;
