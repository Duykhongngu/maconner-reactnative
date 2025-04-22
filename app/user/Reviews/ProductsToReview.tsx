"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { auth, db } from "~/firebase.config";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  and,
} from "firebase/firestore";
import { useCallback } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  orderId: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
  description?: string;
}

export default function ProductsToReview() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchOrderedProducts();
    }, [])
  );

  const fetchOrderedProducts = async () => {
    try {
      if (!auth.currentUser) {
        Alert.alert(
          "Thông báo",
          "Vui lòng đăng nhập để xem đánh giá"
        );
        return;
      }

      setLoading(true);
      const userId = auth.currentUser.uid;
      const ordersQuery = query(
        collection(db, "orderManager"),
        and(where("userId", "==", userId), where("status", "==", "completed"))
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      const productsToReview: Product[] = [];

      for (const orderDoc of ordersSnapshot.docs) {
        const orderData = orderDoc.data();
        const cartItems: CartItem[] = orderData.cartItems || [];

        // Xử lý từng sản phẩm trong cartItems
        for (const item of cartItems) {
          // Kiểm tra xem sản phẩm đã được đánh giá chưa
          const reviewsQuery = query(
            collection(db, "reviews"),
            and(
              where("productId", "==", item.id),
              where("userId", "==", userId)
            )
          );
          const reviewsSnapshot = await getDocs(reviewsQuery);

          // Nếu sản phẩm chưa được đánh giá, thêm vào danh sách
          if (reviewsSnapshot.empty) {
            productsToReview.push({
              id: item.id,
              name: item.name,
              price: item.price,
              image: item.image,
              orderId: orderDoc.id,
            });
          }
        }
      }

      setProducts(productsToReview);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sản phẩm:", error);
      Alert.alert(
        "Lỗi",
        "Không thể tải danh sách sản phẩm"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReviewProduct = (productId: string, orderId: string) => {
    router.push({
      pathname: "/user/Reviews/AddReview",
      params: { productId, orderId },
    } as any);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="mt-2">Đang tải danh sách sản phẩm...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-4">Sản phẩm cần đánh giá</Text>
        <FlatList
          data={products}
          keyExtractor={(item) => `${item.id}-${item.orderId}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="flex-row items-center p-4 mb-4 border border-gray-200 rounded-lg"
              onPress={() => handleReviewProduct(item.id, item.orderId)}
            >
              <Image
                source={{ uri: item.image }}
                className="w-20 h-20 rounded-md"
              />
              <View className="ml-4 flex-1">
                <Text className="text-lg font-semibold">{item.name}</Text>
                <Text className="text-gray-600">
                  Giá: {item.price.toLocaleString()}đ
                </Text>
                <Text className="text-orange-500 mt-2">Nhấn để đánh giá</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <Text className="text-center text-gray-500">
              Không có sản phẩm nào cần đánh giá
            </Text>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
