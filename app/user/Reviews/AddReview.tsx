"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { auth, db } from "~/firebase.config";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import FontAwesome from "react-native-vector-icons/FontAwesome";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
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

export default function AddReview() {
  const { productId, orderId } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProductDetails();
  }, [productId, orderId]);

  const fetchProductDetails = async () => {
    try {
      // Lấy thông tin đơn hàng
      const orderDoc = await getDoc(doc(db, "orderManager", orderId as string));

      if (!orderDoc.exists()) {
        Alert.alert("Lỗi", "Không tìm thấy đơn hàng");
        setLoading(false);
        return;
      }

      const orderData = orderDoc.data();
      const cartItems: CartItem[] = orderData.cartItems || [];

      // Tìm sản phẩm trong cartItems
      const productItem = cartItems.find((item) => item.id === productId);

      if (productItem) {
        setProduct({
          id: productItem.id,
          name: productItem.name,
          price: productItem.price,
          image: productItem.image,
        });
      } else {
        Alert.alert("Lỗi", "Không tìm thấy sản phẩm trong đơn hàng");
      }

      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin sản phẩm:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin sản phẩm");
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    try {
      if (!auth.currentUser) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập để đánh giá");
        return;
      }

      if (rating === 0) {
        Alert.alert("Lỗi", "Vui lòng chọn số sao đánh giá");
        return;
      }

      if (!comment.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập nội dung đánh giá");
        return;
      }

      setSubmitting(true);

      const reviewData = {
        productId: productId,
        userId: auth.currentUser.uid,
        rating: rating,
        comment: comment,
        createdAt: serverTimestamp(),
        orderId: orderId, // Thêm orderId vào review
        productName: product?.name, // Thêm tên sản phẩm vào review
        productImage: product?.image, // Thêm ảnh sản phẩm vào review
      };

      await addDoc(collection(db, "reviews"), reviewData);

      Alert.alert("Thành công", "Đánh giá của bạn đã được gửi", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", error);
      Alert.alert("Lỗi", "Không thể gửi đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="mt-2">Đang tải thông tin sản phẩm...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Không tìm thấy sản phẩm</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-4">Đánh giá sản phẩm</Text>

        <View className="flex-row items-center mb-6">
          <Image
            source={{ uri: product.image }}
            className="w-24 h-24 rounded-md"
          />
          <View className="ml-4 flex-1">
            <Text className="text-lg font-semibold">{product.name}</Text>
            <Text className="text-gray-600">
              Giá: {product.price.toLocaleString()}đ
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2">Đánh giá của bạn</Text>
          <View className="flex-row justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                className="mx-2"
              >
                <FontAwesome
                  name="star"
                  size={32}
                  color={star <= rating ? "#FFB800" : "#D1D5DB"}
                  style={{
                    backgroundColor: star <= rating ? "transparent" : "transparent",
                  }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2">Nhận xét của bạn</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 min-h-[100px]"
            multiline
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
            value={comment}
            onChangeText={setComment}
          />
        </View>

        <TouchableOpacity
          className={`p-4 rounded-lg items-center ${
            submitting ? "bg-gray-400" : "bg-orange-500"
          }`}
          onPress={handleSubmitReview}
          disabled={submitting}
        >
          <Text className="text-white font-bold text-lg">
            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
