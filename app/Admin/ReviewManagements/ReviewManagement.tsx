"use client";

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
} from "react-native";
import {
  collection,
  query,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "~/firebase.config";
import { AntDesign } from "@expo/vector-icons";

interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: any;
  productName: string;
  productImage: string;
  userName?: string;
  userAvatar?: string;
  replies?: ReviewReply[];
}

interface ReviewReply {
  id: string;
  reviewId: string;
  reply: string;
  createdAt: any;
}

export default function ReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const reviewsQuery = query(collection(db, "reviews"));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData: Review[] = [];

      for (const docSnapshot of reviewsSnapshot.docs) {
        const reviewData = docSnapshot.data();
        const review: Review = {
          id: docSnapshot.id,
          userId: reviewData.userId,
          productId: reviewData.productId,
          rating: reviewData.rating,
          comment: reviewData.comment,
          createdAt: reviewData.createdAt,
          productName: reviewData.productName,
          productImage: reviewData.productImage,
          userName: "Đang tải...",
          replies: [],
        };

        // Lấy thông tin người dùng
        try {
          const userSnap = await getDoc(doc(db, "accounts", reviewData.userId));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            review.userName = userData.displayName || "Người dùng ẩn danh";
            review.userAvatar = userData.photoURL || undefined;
          }
        } catch (error) {
          console.error("Lỗi khi lấy thông tin người dùng:", error);
          review.userName = "Người dùng ẩn danh";
        }

        // Lấy các câu trả lời cho đánh giá này
        const repliesQuery = query(
          collection(db, "reviewReplies"),
          where("reviewId", "==", docSnapshot.id),
          orderBy("createdAt", "asc")
        );
        const repliesSnapshot = await getDocs(repliesQuery);
        review.replies = repliesSnapshot.docs.map((replyDoc) => ({
          id: replyDoc.id,
          ...replyDoc.data(),
        })) as ReviewReply[];

        reviewsData.push(review);
      }

      // Sắp xếp theo thời gian mới nhất
      reviewsData.sort(
        (a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()
      );
      setReviews(reviewsData);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đánh giá:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn xóa đánh giá này?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "reviews", reviewId));
            Alert.alert("Thành công", "Đã xóa đánh giá");
            fetchReviews();
          } catch (error) {
            console.error("Lỗi khi xóa đánh giá:", error);
            Alert.alert("Lỗi", "Không thể xóa đánh giá");
          }
        },
      },
    ]);
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung trả lời");
      return;
    }

    try {
      await addDoc(collection(db, "reviewReplies"), {
        reviewId: reviewId,
        reply: replyText.trim(),
        createdAt: serverTimestamp(),
      });

      setReplyText("");
      setSelectedReviewId(null);
      Alert.alert("Thành công", "Đã thêm câu trả lời");
      fetchReviews();
    } catch (error) {
      console.error("Lỗi khi thêm câu trả lời:", error);
      Alert.alert("Lỗi", "Không thể thêm câu trả lời");
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn xóa câu trả lời này?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "reviewReplies", replyId));
            Alert.alert("Thành công", "Đã xóa câu trả lời");
            fetchReviews();
          } catch (error) {
            console.error("Lỗi khi xóa câu trả lời:", error);
            Alert.alert("Lỗi", "Không thể xóa câu trả lời");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="mt-2">Đang tải danh sách đánh giá...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-4">Quản lý đánh giá</Text>
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="mb-4 p-4 border border-gray-200 rounded-lg">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-row items-center">
                  {item.userAvatar ? (
                    <Image
                      source={{ uri: item.userAvatar }}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <View className="w-10 h-10 rounded-full bg-gray-200 justify-center items-center">
                      <Text className="text-lg font-bold text-gray-600">
                        {item.userName?.[0]?.toUpperCase() || "?"}
                      </Text>
                    </View>
                  )}
                  <View className="ml-3">
                    <Text className="font-semibold">{item.userName}</Text>
                    <Text className="text-gray-500 text-sm">
                      {new Date(item.createdAt?.toDate()).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteReview(item.id)}
                  className="p-2"
                >
                  <AntDesign name="delete" size={20} color="#FF0000" />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center mb-2">
                <View className="flex-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <AntDesign
                      key={star}
                      name={star <= item.rating ? "star" : "staro"}
                      size={16}
                      color="#FFB800"
                    />
                  ))}
                </View>
              </View>

              <View className="flex-row mb-2">
                <Image
                  source={{ uri: item.productImage }}
                  className="w-16 h-16 rounded-md"
                />
                <View className="ml-3">
                  <Text className="font-medium">{item.productName}</Text>
                </View>
              </View>

              <Text className="text-gray-700">{item.comment}</Text>

              {/* Phần hiển thị câu trả lời */}
              {item.replies && item.replies.length > 0 && (
                <View className="mt-3 pl-4 border-l-2 border-gray-200">
                  {item.replies.map((reply) => (
                    <View
                      key={reply.id}
                      className="mb-2 flex-row justify-between items-start"
                    >
                      <View className="flex-1">
                        <Text className="text-gray-600 text-sm">
                          <Text className="font-semibold">Phản hồi: </Text>
                          {reply.reply}
                        </Text>
                        <Text className="text-gray-400 text-xs">
                          {new Date(
                            reply.createdAt?.toDate()
                          ).toLocaleDateString()}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteReply(reply.id)}
                        className="p-2"
                      >
                        <AntDesign name="close" size={16} color="#FF0000" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Form trả lời */}
              {selectedReviewId === item.id ? (
                <View className="mt-3">
                  <TextInput
                    className="border border-gray-300 rounded-lg p-2 mb-2"
                    placeholder="Nhập câu trả lời..."
                    value={replyText}
                    onChangeText={setReplyText}
                    multiline
                  />
                  <View className="flex-row justify-end">
                    <TouchableOpacity
                      onPress={() => setSelectedReviewId(null)}
                      className="bg-gray-200 rounded-lg px-4 py-2 mr-2"
                    >
                      <Text>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleReply(item.id)}
                      className="bg-blue-500 rounded-lg px-4 py-2"
                    >
                      <Text className="text-white">Gửi</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setSelectedReviewId(item.id)}
                  className="mt-3"
                >
                  <Text className="text-blue-500">Trả lời</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={() => (
            <Text className="text-center text-gray-500">
              Chưa có đánh giá nào
            </Text>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
