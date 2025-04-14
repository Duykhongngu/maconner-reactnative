import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { collection, query, limit, getDocs } from "firebase/firestore";
import { db } from "~/firebase.config";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { useColorScheme } from "~/lib/useColorScheme";

// Interface cho sản phẩm
interface Product {
  id: string;
  name: string;
  price: number;
  link: string;
  images?: string[];
  rating?: number;
}

const SuggestedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();

  useEffect(() => {
    const fetchSuggestedProducts = async () => {
      try {
        const productsRef = collection(db, "products");
        // Lấy các sản phẩm được đánh giá cao
        const q = query(productsRef, limit(10));
        const querySnapshot = await getDocs(q);

        const productsData: Product[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          productsData.push({
            id: doc.id,
            name: data.name || "",
            price: Number(data.price) || 0,
            link: data.link || "",
            images: data.images || [data.link],
            rating: data.rating || 0,
          });
        });

        // Sắp xếp sản phẩm ngẫu nhiên để có sự đa dạng
        const shuffled = productsData.sort(() => 0.5 - Math.random());
        setProducts(shuffled.slice(0, 6));
      } catch (error) {
        console.error("Lỗi khi lấy sản phẩm đề xuất:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestedProducts();
  }, []);

  if (loading) {
    return (
      <View style={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 10,
            color: isDarkColorScheme ? "#fff" : "#000",
          }}
        >
          Có thể bạn sẽ thích
        </Text>
        <ActivityIndicator size="small" color="#FF6B00" />
      </View>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <View style={{ padding: 16 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          marginBottom: 10,
          color: isDarkColorScheme ? "#fff" : "#000",
        }}
      >
        Có thể bạn sẽ thích
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {products.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={{
              width: 140,
              marginRight: 12,
              backgroundColor: isDarkColorScheme ? "#222" : "#fff",
              borderRadius: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
              overflow: "hidden",
            }}
            onPress={() => {
              router.push(`/user/Products/${item.id}`);
            }}
          >
            <Image
              source={{ uri: item.images ? item.images[0] : item.link }}
              style={{ width: "100%", height: 140, resizeMode: "cover" }}
            />
            <View style={{ padding: 8 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  marginBottom: 4,
                  color: isDarkColorScheme ? "#eee" : "#333",
                  height: 36,
                }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.name}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "bold",
                  color: "#FF6B00",
                  marginBottom: 4,
                }}
              >
                ${item.price.toFixed(2)} USD
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <AntDesign
                    key={star}
                    name={
                      star <= Math.floor(item.rating || 0) ? "star" : "staro"
                    }
                    size={12}
                    color="#FFD700"
                    style={{ marginRight: 1 }}
                  />
                ))}
                <Text
                  style={{
                    fontSize: 10,
                    marginLeft: 4,
                    color: isDarkColorScheme ? "#ccc" : "#666",
                  }}
                >
                  {item.rating ? `(${item.rating.toFixed(1)})` : "(0.0)"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default SuggestedProducts;
