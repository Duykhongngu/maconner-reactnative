"use client";

import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  limit,
} from "firebase/firestore";
import { db } from "~/firebase.config";
import { useCart } from "../Cart/CartContext";
import ColorSelector from "./components/ColorSelector";
import QuantitySelector from "./components/QuantitySelector";
import AddToCartButton from "./components/AddToCartButton";
import { CartItem } from "../Cart/CartContext";
import { AntDesign } from "@expo/vector-icons";
import { useColorScheme } from "~/lib/useColorScheme";
import { useTranslation } from "react-i18next";

// Khai báo mảng màu cố định
const AVAILABLE_COLORS = [
  { name: "White", value: "#FFFFFF", textColor: "#000000" },
  { name: "Black", value: "#000000", textColor: "#FFFFFF" },
  { name: "Red", value: "#FF0000", textColor: "#FFFFFF" },
  { name: "Blue", value: "#0000FF", textColor: "#FFFFFF" },
  { name: "Green", value: "#008000", textColor: "#FFFFFF" },
  { name: "Yellow", value: "#FFFF00", textColor: "#000000" },
  { name: "Purple", value: "#800080", textColor: "#FFFFFF" },
  { name: "Orange", value: "#FFA500", textColor: "#000000" },
  { name: "Pink", value: "#FFC0CB", textColor: "#000000" },
  { name: "Gray", value: "#808080", textColor: "#FFFFFF" },
  { name: "Brown", value: "#A52A2A", textColor: "#FFFFFF" },
  { name: "Cyan", value: "#00FFFF", textColor: "#000000" },
];

interface Product {
  id: string;
  category: string;
  categoryName?: string;
  inStock: boolean;
  link: string;
  images?: string[];
  name: string;
  price: number;
  size: string;
  color: string[];
  description: string;
  rating?: number;
}

interface Category {
  id: string;
  name: string;
}

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
  reviewImages?: string[]; // Add support for multiple review images
}

interface ReviewReply {
  id: string;
  reviewId: string;
  reply: string;
  createdAt: any;
}

interface FirestoreReview {
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: any;
  productName: string;
  productImage: string;
}

// Add this new component for image carousel display
const ImageCarousel = ({ images }: { images: string[] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const { isDarkColorScheme } = useColorScheme();

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const imageWidth = event.nativeEvent.layoutMeasurement.width;
    const newIndex = Math.round(contentOffsetX / imageWidth);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  return (
    <View className="w-full h-[300px] relative">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {images.map((uri, index) => (
          <Image
            key={index}
            source={{ uri }}
            className="w-screen h-[300px]"
            style={{ resizeMode: "cover" }}
          />
        ))}
      </ScrollView>

      {/* Indicator dots */}
      <View className="flex-row justify-center items-center absolute bottom-4 w-full">
        {images.map((_, index) => (
          <TouchableOpacity
            key={index}
            className={`mx-1 ${
              index === activeIndex
                ? "bg-orange-500 w-2.5 h-2.5 rounded-[5px]"
                : "bg-white/50 w-2 h-2 rounded-[4px]"
            }`}
            onPress={() => {
              setActiveIndex(index);
              scrollViewRef.current?.scrollTo({
                x: Dimensions.get("window").width * index,
                animated: true,
              });
            }}
          />
        ))}
      </View>
    </View>
  );
};

export default function ProductDetail(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const [product, setProduct] = useState<Product | null>(null);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [categoryName, setCategoryName] = useState<string>("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const { isDarkColorScheme } = useColorScheme();

  // Lấy dữ liệu sản phẩm và danh mục
  useEffect(() => {
    const fetchProductAndCategory = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const productRef = doc(db, "products", id);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          // Xử lý dữ liệu màu sắc từ Firestore
          let productColors: string[] = [];
          const colorData = productSnap.data().color;

          if (Array.isArray(colorData)) {
            productColors = colorData;
          } else if (typeof colorData === "string") {
            productColors = [colorData];
          } else {
            productColors = ["White"]; // Màu mặc định nếu không có dữ liệu
          }

          // Tạo đối tượng sản phẩm từ dữ liệu Firestore
          const productData = {
            ...productSnap.data(),
            id: productSnap.id,
            color: productColors,
          } as Product;

          setProduct(productData);
          setSelectedColor(productData.color[0] || "");

          // Lấy thông tin danh mục
          if (productData.category) {
            const categoryRef = doc(db, "categories", productData.category);
            const categorySnap = await getDoc(categoryRef);
            if (categorySnap.exists()) {
              setCategoryName(categorySnap.data().name || "");
            }
          }

          // Lấy các sản phẩm cùng danh mục
          if (productData.category) {
            const suggestedQuery = query(
              collection(db, "products"),
              where("category", "==", productData.category),
              where("id", "!=", id),
              limit(4)
            );
            const suggestedSnap = await getDocs(suggestedQuery);

            const suggestedData = suggestedSnap.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id,
            })) as Product[];

            setSuggestedProducts(suggestedData);
          }
        } else {
          setError(t("product_not_found"));
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu sản phẩm:", error);
        setError(t("error_loading_product"));
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndCategory();
  }, [id]);

  // Thêm hàm tính và cập nhật rating trung bình
  const updateAverageRating = async (productId: string, reviews: Review[]) => {
    try {
      // Cập nhật totalReviews trước khi xử lý rating
      const totalReviews = reviews.length;

      // Nếu không có đánh giá, cập nhật cả rating và totalReviews về 0
      if (totalReviews === 0) {
        await updateDoc(doc(db, "products", productId), {
          rating: 0,
          totalReviews: 0,
        });
        setAverageRating(0);
        return;
      }

      // Tính rating trung bình
      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating = totalRating / totalReviews;

      // Cập nhật cả rating và totalReviews trong collection products
      await updateDoc(doc(db, "products", productId), {
        rating: averageRating,
        totalReviews: totalReviews,
      });

      // Cập nhật state
      setAverageRating(averageRating);
    } catch (error) {
      console.error("Lỗi khi cập nhật rating trung bình:", error);
    }
  };

  // Cập nhật useEffect fetchReviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;

      try {
        const reviewsQuery = query(
          collection(db, "reviews"),
          where("productId", "==", id)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData: Review[] = [];

        // Lấy tất cả reviews
        for (const docSnapshot of reviewsSnapshot.docs) {
          const reviewData = docSnapshot.data() as FirestoreReview;
          const review: Review = {
            id: docSnapshot.id,
            ...reviewData,
            userName: t("loading"),
            userAvatar: undefined,
          };

          // Lấy thông tin người dùng từ accounts collection
          const userRef = doc(db, "accounts", reviewData.userId);
          try {
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              review.userName = userData.displayName || t("anonymous_user");
              review.userAvatar = userData.photoURL || undefined;
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
          } catch (error) {
            console.error("Lỗi khi lấy thông tin người dùng:", error);
            review.userName = t("anonymous_user");
          }

          reviewsData.push(review);
        }

        // Sắp xếp đánh giá mới nhất lên đầu
        reviewsData.sort(
          (a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()
        );

        setReviews(reviewsData);

        // Cập nhật rating trung bình
        await updateAverageRating(id, reviewsData);
      } catch (error) {
        console.error("Lỗi khi lấy đánh giá:", error);
      }
    };

    fetchReviews();
  }, [id]);

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = () => {
    if (!product) return;

    if (!selectedColor) {
      Alert.alert(t("error"), t("select_color_before_adding"));
      return;
    }

    // Kiểm tra xem màu đã chọn có hợp lệ không
    if (!product.color.includes(selectedColor)) {
      Alert.alert(t("error"), t("invalid_color_selected"));
      return;
    }

    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      color: selectedColor,
      image: product.link,
      images: product.images || [product.link],
      description: product.description || "",
    };

    addToCart(cartItem);
    Alert.alert(t("success"), t("add_to_cart_success"));
  };

  if (loading) {
    return (
      <SafeAreaView
        className={`flex-1 ${isDarkColorScheme ? "bg-black" : "bg-white"}`}
      >
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text
            className={
              isDarkColorScheme ? "text-white mt-2" : "text-gray-800 mt-2"
            }
          >
            {t("loading_product")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView
        className={`flex-1 ${isDarkColorScheme ? "bg-black" : "bg-white"}`}
      >
        <View className="flex-1 justify-center items-center p-5">
          <Text className={isDarkColorScheme ? "text-white" : "text-gray-800"}>
            {error || t("product_not_found")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkColorScheme ? "bg-black" : "bg-white"}`}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {/* Hình ảnh sản phẩm */}
        {product.images && product.images.length > 0 ? (
          <ImageCarousel images={product.images} />
        ) : (
          <Image
            source={{ uri: product.link }}
            className="w-full h-[300px]"
            style={{ resizeMode: "cover" }}
          />
        )}

        {/* Thông tin sản phẩm */}
        <View className="p-4">
          <Text
            className={`text-2xl font-bold mb-2 ${
              isDarkColorScheme ? "text-white" : "text-gray-800"
            }`}
          >
            {product.name}
          </Text>
          <Text className="text-xl font-bold text-orange-500 mb-2">
            {product.price.toLocaleString("vi-VN")} VNĐ
          </Text>
          <Text
            className={`text-base mb-4 ${
              isDarkColorScheme ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {categoryName || product.category}
          </Text>
        </View>

        {/* Phần chọn màu sắc */}
        <View className="p-4 border-t border-gray-200">
          <Text
            className={`text-lg font-bold mb-3 ${
              isDarkColorScheme ? "text-white" : "text-gray-800"
            }`}
          >
            {t("product_color")}
          </Text>
          <ColorSelector
            colors={product.color}
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
            isDarkMode={isDarkColorScheme}
          />
        </View>

        {/* Phần chọn số lượng */}
        <View className="p-4 border-t border-gray-200">
          <Text
            className={`text-lg font-bold mb-3 ${
              isDarkColorScheme ? "text-white" : "text-gray-800"
            }`}
          >
            {t("quantity")}
          </Text>
          <QuantitySelector
            quantity={quantity}
            onChangeQuantity={setQuantity}
            isDarkMode={isDarkColorScheme}
          />
        </View>

        {/* Mô tả sản phẩm */}
        <View className="p-4 border-t border-gray-200">
          <Text
            className={`text-lg font-bold mb-3 ${
              isDarkColorScheme ? "text-white" : "text-gray-800"
            }`}
          >
            {t("product_description")}
          </Text>
          <Text
            className={`text-base leading-6 ${
              isDarkColorScheme ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {product.description}
          </Text>
        </View>

        {/* Nút thêm vào giỏ hàng */}
        <View className="p-4">
          <AddToCartButton
            onPress={handleAddToCart}
            price={product.price}
            disabled={!selectedColor || !product.color.includes(selectedColor)}
          />
        </View>

        {/* Phần đánh giá sản phẩm */}
        <View className="p-4 border-t border-gray-200">
          <Text
            className={`text-lg font-bold mb-3 ${
              isDarkColorScheme ? "text-white" : "text-gray-800"
            }`}
          >
            {t("product_reviews")}
          </Text>

          {/* Hiển thị rating trung bình */}
          <View className="flex-row items-center p-3 mb-4 bg-gray-100 rounded-lg">
            <Text
              className={`text-2xl font-bold mr-3 ${
                isDarkColorScheme ? "text-gray-800" : "text-gray-800"
              }`}
            >
              {averageRating.toFixed(1)}
            </Text>
            <View className="flex-row items-center mr-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <AntDesign
                  key={star}
                  name={star <= Math.round(averageRating) ? "star" : "staro"}
                  size={20}
                  color="#FFB800"
                />
              ))}
            </View>
            <Text className="text-sm text-gray-600">
              ({reviews.length} {t("reviews")})
            </Text>
          </View>

          {/* Danh sách đánh giá */}
          {reviews.map((review) => (
            <View
              key={review.id}
              className="mb-4 p-3 bg-white rounded-lg border border-gray-200"
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    {review.userAvatar ? (
                      <Image
                        source={{ uri: review.userAvatar }}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                    ) : (
                      <View className="w-10 h-10 rounded-full mr-3 bg-gray-300 justify-center items-center">
                        <Text className="text-lg font-bold text-gray-600">
                          {review.userName?.[0]?.toUpperCase() || "?"}
                        </Text>
                      </View>
                    )}
                    <View className="flex-1">
                      <Text
                        className={`font-semibold mb-1 ${
                          isDarkColorScheme ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {review.userName}
                      </Text>
                      <View className="flex-row">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <AntDesign
                            key={star}
                            name={star <= review.rating ? "star" : "staro"}
                            size={16}
                            color="#FFB800"
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
                <Text className="text-xs text-gray-500">
                  {new Date(review.createdAt?.toDate()).toLocaleDateString()}
                </Text>
              </View>
              <Text
                className={`text-sm ${
                  isDarkColorScheme ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {review.comment}
              </Text>

              {/* Hiển thị hình ảnh đánh giá */}
              {review.reviewImages && review.reviewImages.length > 0 && (
                <View className="flex-row flex-wrap mt-2">
                  {review.reviewImages.map((image, index) => (
                    <TouchableOpacity
                      key={index}
                      className="w-[70px] h-[70px] m-1"
                      onPress={() => {
                        // TODO: Add image preview functionality
                      }}
                    >
                      <Image
                        source={{ uri: image }}
                        className="w-full h-full rounded-md"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Hiển thị phần trả lời */}
              {review.replies && review.replies.length > 0 && (
                <View className="mt-3 pl-4 border-l-2 border-orange-500">
                  {review.replies.map((reply) => (
                    <View
                      key={reply.id}
                      className="mt-2 p-2 bg-gray-50 rounded-lg"
                    >
                      <View className="flex-row items-center mb-1">
                        <AntDesign name="message1" size={16} color="#666" />
                        <Text className="ml-1.5 text-xs font-semibold text-gray-600">
                          {t("admin_reply")}
                        </Text>
                        <Text className="ml-2 text-xs text-gray-500">
                          {new Date(
                            reply.createdAt?.toDate()
                          ).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text className="text-sm text-gray-700 ml-6">
                        {reply.reply}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}

          {reviews.length === 0 && (
            <Text className="text-center italic text-gray-500">
              {t("no_reviews")}
            </Text>
          )}
        </View>

        {/* Phần sản phẩm đề xuất */}
        {suggestedProducts.length > 0 && (
          <View className="p-4 border-t border-gray-200">
            <Text
              className={`text-lg font-bold mb-3 ${
                isDarkColorScheme ? "text-white" : "text-gray-800"
              }`}
            >
              {t("related_products")}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {suggestedProducts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  className="mr-4 w-[150px]"
                  onPress={() => {
                    router.push(`/user/Products/${item.id}`);
                  }}
                >
                  <Image
                    source={{
                      uri: item.images?.[0] || item.link,
                    }}
                    className="w-full h-[150px] rounded-lg mb-2"
                    resizeMode="cover"
                  />
                  <Text
                    className={`text-sm font-medium ${
                      isDarkColorScheme ? "text-white" : "text-gray-800"
                    }`}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-sm font-bold text-orange-500">
                    {item.price.toLocaleString("vi-VN")} VNĐ
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
