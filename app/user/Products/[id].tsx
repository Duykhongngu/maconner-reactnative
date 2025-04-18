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
} from "firebase/firestore";
import { db } from "~/firebase.config";
import { useCart } from "../Cart/CartContext";
import ColorSelector from "./components/ColorSelector";
import QuantitySelector from "./components/QuantitySelector";
import AddToCartButton from "./components/AddToCartButton";
import { CartItem } from "../Cart/CartContext";
import { AntDesign } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useColorScheme } from "~/lib/useColorScheme";

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

          // Xử lý dữ liệu hình ảnh
          let productImages: string[] = [];
          const imagesData = productSnap.data().images;
          const linkData = productSnap.data().link;

          if (Array.isArray(imagesData) && imagesData.length > 0) {
            productImages = imagesData;
          } else if (linkData) {
            productImages = [linkData];
          }

          const productData = {
            id: productSnap.id,
            category: productSnap.data().category || "",
            inStock: productSnap.data().inStock !== false,
            link: productSnap.data().link || "",
            images: productImages,
            name: productSnap.data().name || "",
            price: Number(productSnap.data().price) || 0,
            description: productSnap.data().description || "",
            color: productColors,
            size: productSnap.data().size || "",
            rating: productSnap.data().rating || 0,
          } as Product;

          setProduct(productData);

          // Lấy tên danh mục
          if (productData.category) {
            try {
              const categoryRef = doc(db, "categories", productData.category);
              const categorySnap = await getDoc(categoryRef);

              if (categorySnap.exists()) {
                const categoryData = categorySnap.data();
                setCategoryName(categoryData.name || "Unknown Category");
                productData.categoryName =
                  categoryData.name || "Unknown Category";
              } else {
                setCategoryName(productData.category); // Sử dụng ID nếu không tìm thấy danh mục
              }
            } catch (categoryError) {
              console.error("Lỗi khi lấy danh mục:", categoryError);
              setCategoryName(productData.category);
            }
          }

          // Fetch suggested products - Sửa lại logic để lấy sản phẩm cùng category
          if (productData.category) {
            const productsRef = collection(db, "products");
            const q = query(
              productsRef,
              where("category", "==", productData.category)
            );

            const querySnapshot = await getDocs(q);
            const suggestedProductsData: Product[] = [];

            querySnapshot.forEach((doc) => {
              // Lọc sản phẩm có id khác với sản phẩm hiện tại
              if (doc.id !== id) {
                const data = doc.data();
                suggestedProductsData.push({
                  id: doc.id,
                  category: data.category || "",
                  categoryName: categoryName, // Sử dụng tên danh mục đã lấy được
                  inStock: data.inStock !== false,
                  link: data.link || "",
                  name: data.name || "",
                  price: Number(data.price) || 0,
                  description: data.description || "",
                  color: Array.isArray(data.color)
                    ? data.color
                    : [data.color || "White"],
                  size: data.size || "",
                  rating: data.rating || 0,
                });
              }
            });

            setSuggestedProducts(suggestedProductsData);
          }
        } else {
          setError("Không tìm thấy sản phẩm");
        }
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu sản phẩm:", err);
        setError("Đã xảy ra lỗi khi tải dữ liệu sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndCategory();
  }, [id]);

  // Thêm hàm tính và cập nhật rating trung bình
  const updateAverageRating = async (productId: string, reviews: Review[]) => {
    try {
      if (!reviews.length) {
        // Nếu không có đánh giá, cập nhật rating về 0
        await updateDoc(doc(db, "products", productId), {
          rating: 0,
          totalReviews: 0,
        });
        return;
      }

      // Tính rating trung bình
      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating = totalRating / reviews.length;

      // Cập nhật rating trong collection products
      await updateDoc(doc(db, "products", productId), {
        rating: averageRating,
        totalReviews: reviews.length,
      });

      // Cập nhật state averageRating
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
            userName: "Đang tải...",
            userAvatar: undefined,
          };

          // Lấy thông tin người dùng từ accounts collection
          const userRef = doc(db, "accounts", reviewData.userId);
          try {
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              review.userName = userData.displayName || "Người dùng ẩn danh";
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
            review.userName = "Người dùng ẩn danh";
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
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng chọn màu sắc trước khi thêm vào giỏ hàng",
      });
      return;
    }

    // Kiểm tra xem màu đã chọn có hợp lệ không
    if (!product.color.includes(selectedColor)) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Màu sắc đã chọn không hợp lệ",
      });
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
    Toast.show({
      type: "success",
      text1: "Thành công",
      text2: "Đã thêm sản phẩm vào giỏ hàng",
    });
  };

  // Hàm lấy thông tin màu từ tên màu
  const getColorInfo = (colorName: string) => {
    const colorInfo = AVAILABLE_COLORS.find(
      (c) => c.name.toLowerCase() === colorName.toLowerCase()
    );
    return (
      colorInfo || { name: colorName, value: "#CCCCCC", textColor: "#000000" }
    );
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
            Đang tải...
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
            {error || "Không tìm thấy sản phẩm"}
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
            {product.price.toFixed(2)} VNĐ
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
            Màu sắc
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
            Số lượng
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
            Mô tả
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
            Đánh giá sản phẩm
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
              ({reviews.length} đánh giá)
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
                          Phản hồi từ Admin
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
              Chưa có đánh giá nào cho sản phẩm này
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
              Sản phẩm liên quan
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {suggestedProducts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  className="w-40 mr-3 bg-white rounded-lg shadow overflow-hidden"
                  onPress={() => {
                    router.push(`/user/Products/${item.id}`);
                  }}
                >
                  <Image
                    source={{ uri: item.link }}
                    className="w-full h-40"
                    style={{ resizeMode: "cover" }}
                  />
                  <View className="p-2">
                    <Text
                      className={`text-sm font-medium mb-1 h-10 ${
                        isDarkColorScheme ? "text-gray-300" : "text-gray-800"
                      }`}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {item.name}
                    </Text>
                    <Text className="text-base font-bold text-orange-500 mb-1">
                      ${item.price.toFixed(2)} USD
                    </Text>
                    <View className="flex-row items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <AntDesign
                          key={star}
                          name={
                            star <= Math.floor(item.rating || 0)
                              ? "star"
                              : "staro"
                          }
                          size={14}
                          color="#FFD700"
                          style={{ marginRight: 1 }}
                        />
                      ))}
                      <Text className="text-xs ml-1 text-gray-500">
                        {item.rating ? `(${item.rating.toFixed(1)})` : "(0.0)"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
