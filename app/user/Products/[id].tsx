"use client";

import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { auth, db } from "~/firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import axios from "axios";
import { useCart } from "../Cart/CartContext";
import Footer from "~/app/Footer/Footer";

// Định nghĩa interface cho colorScheme (dựa trên useColorScheme)
interface ColorScheme {
  colorScheme: "light" | "dark";
}

const { width, height } = Dimensions.get("window");

interface Product {
  id: string;
  category: string;
  inStock: boolean;
  link: string;
  name: string;
  price: number;
  size: string;
  color: string; // Thêm trường color
}

interface CustomerReview {
  id: string;
  name: string;
  rating: number;
  comment: string;
  image?: string;
}

const STORAGE_KEY = "productReviews";
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dpyzwrsni/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "unsigned_review_preset";

export default function ProductDetail(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const { addToCart } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [newReview, setNewReview] = useState<{
    name: string;
    rating: number;
    comment: string;
    image: string;
  }>({
    name: "",
    rating: 0,
    comment: "",
    image: "",
  });
  const [customerReviews, setCustomerReviews] = useState<CustomerReview[]>([]);
  const [user, setUser] = useState<any>(null);
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const fetchColorScheme = async () => {
      try {
        const scheme = await AsyncStorage.getItem("colorScheme");
        setColorScheme(scheme === "dark" ? "dark" : "light");
      } catch (error) {
        console.error("Failed to fetch color scheme:", error);
        setColorScheme("light");
      }
    };

    fetchColorScheme();
  }, []);

  // Lấy dữ liệu sản phẩm từ Firestore
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        const productRef = doc(db, "products", id);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const productData = {
            id: productSnap.id,
            category: productSnap.data().category || "",
            inStock: productSnap.data().inStock !== false,
            link: productSnap.data().link || "",
            name: productSnap.data().name || "",
            price: Number(productSnap.data().price) || 0,
            size: productSnap.data().size || "xs",
            color: productSnap.data().color || "default", // Lấy color từ Firestore
          } as Product;

          setProduct(productData);
          setSelectedSize(productData.size);
        } else {
          console.error("Product not found");
          Alert.alert("Error", "Product not found.");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        Alert.alert("Error", "Failed to load product details.");
      }
    };

    fetchProduct();
  }, [id]);

  // Lấy sản phẩm gợi ý cùng danh mục
  useEffect(() => {
    const fetchSuggestedProducts = async () => {
      if (!product) return;

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
          color: doc.data().color || "default",
        })) as Product[];

        // Lọc sản phẩm cùng danh mục nhưng khác ID
        const suggested = allProducts
          .filter(
            (p) =>
              p.category.toLowerCase() === product.category.toLowerCase() &&
              p.id !== product.id
          )
          .slice(0, 6); // Lấy tối đa 6 sản phẩm gợi ý

        setSuggestedProducts(suggested);
      } catch (error) {
        console.error("Error fetching suggested products:", error);
      }
    };

    fetchSuggestedProducts();
  }, [product]);

  // Kiểm tra trạng thái người dùng
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setNewReview((prev) => ({
          ...prev,
          name: currentUser.displayName || currentUser.email || "Anonymous",
        }));
      } else {
        setNewReview((prev) => ({ ...prev, name: "" }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Load reviews từ Firestore
  useEffect(() => {
    if (!id) return;

    const q = query(collection(db, "reviews"), where("productId", "==", id));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reviewsData: CustomerReview[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          rating: doc.data().rating,
          comment: doc.data().comment,
          image: doc.data().image || undefined,
        }));
        setCustomerReviews(reviewsData);

        // Backup vào AsyncStorage (tuỳ chọn)
        const saveToAsyncStorage = async () => {
          try {
            const allReviews = await AsyncStorage.getItem(STORAGE_KEY);
            const parsedReviews = allReviews ? JSON.parse(allReviews) : {};
            parsedReviews[id] = reviewsData;
            await AsyncStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(parsedReviews)
            );
          } catch (error) {
            console.error("Failed to save reviews to AsyncStorage:", error);
          }
        };
        saveToAsyncStorage();
      },
      (error) => {
        console.error("Error fetching reviews:", error);
      }
    );

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [product]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setNewReview({ ...newReview, image: result.assets[0].uri });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Sorry, we need camera permissions to make this work!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setNewReview({ ...newReview, image: result.assets[0].uri });
    }
  };

  const uploadImageToCloudinary = async (uri: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", {
      uri,
      type: "image/jpeg",
      name: "review_image.jpg",
    } as any);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await axios.post(CLOUDINARY_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.secure_url;
    } catch (error) {
      console.error("Upload failed:", error);
      throw new Error("Failed to upload image");
    }
  };

  const handleAddToCart = () => {
    if (product && selectedSize) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        size: selectedSize,
        color: product.color, // Sử dụng color từ Firestore
        image: product.link,
      });
      setQuantity(1);
    }
  };

  const handleSubmitReview = async () => {
    if (newReview.rating > 0 && newReview.comment) {
      try {
        let imageUrl = "";
        if (newReview.image) {
          imageUrl = await uploadImageToCloudinary(newReview.image);
        }

        const reviewData = {
          productId: id,
          name: newReview.name,
          rating: newReview.rating,
          comment: newReview.comment,
          image: imageUrl || null,
          createdAt: new Date().toISOString(),
        };

        await addDoc(collection(db, "reviews"), reviewData);

        setNewReview({
          name: user?.displayName || user?.email || "Anonymous",
          rating: 0,
          comment: "",
          image: "",
        });
      } catch (error) {
        console.error("Failed to save review:", error);
        alert("Failed to save review. Please try again.");
      }
    } else {
      alert("Please provide a rating and comment.");
    }
  };

  const renderReviewItem = ({ item }: { item: CustomerReview }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewerName}>{item.name}</Text>
        <View style={styles.ratingContainer}>
          {[...Array(5)].map((_, index) => (
            <Star
              key={index}
              fill={index < item.rating ? "#FFD700" : "#E0E0E0"}
              stroke={index < item.rating ? "#FFD700" : "#E0E0E0"}
              size={16}
            />
          ))}
        </View>
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
      {item.image && (
        <Image
          source={{ uri: item.image }}
          style={styles.reviewImage}
          resizeMode="cover"
        />
      )}
    </View>
  );

  const renderSuggestedProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.suggestedProductItem}
      onPress={() => router.push(`/user/Products/${item.id}`)}
    >
      <Image
        source={{ uri: item.link }}
        style={styles.suggestedProductImage}
        onError={(e) =>
          console.error("Suggested product image error:", e.nativeEvent.error)
        }
      />
      <Text style={styles.suggestedProductName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.suggestedProductPrice}>${item.price.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  const isDarkMode = colorScheme === "dark";

  const renderSuggestedProducts = () => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
        You May Also Like
      </Text>
      <FlatList
        data={suggestedProducts}
        renderItem={renderSuggestedProduct}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[
          styles.suggestedProductList,
          isDarkMode && styles.darkSuggestedProductList,
        ]}
      />
    </View>
  );

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const productImages = [product.link, product.link, product.link]; // Firestore chỉ có 1 link ảnh, nên lặp lại để tạo hiệu ứng slide

  return (
    <SafeAreaView
      style={[styles.container, isDarkMode && styles.darkContainer]}
    >
      <ScrollView
        ref={scrollViewRef}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const offset = e.nativeEvent.contentOffset.x;
              setCurrentImageIndex(Math.round(offset / width));
            }}
            scrollEventThrottle={16}
          >
            {productImages.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.productImage}
                resizeMode="cover"
                onError={(e) =>
                  console.error("Product image error:", e.nativeEvent.error)
                }
              />
            ))}
          </ScrollView>
          <View style={styles.paginationContainer}>
            {productImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  currentImageIndex === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.productInfoContainer}>
            <Text style={[styles.productName, isDarkMode && styles.darkText]}>
              {product.name}
            </Text>
            <Text style={[styles.productPrice, isDarkMode && styles.darkText]}>
              ${product.price.toFixed(2)} USD
            </Text>
            <Text
              style={[styles.productDescription, isDarkMode && styles.darkText]}
            >
              Category: {product.category}
            </Text>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              Size
            </Text>
            <View style={styles.sizeContainer}>
              <TouchableOpacity
                onPress={() => setSelectedSize(product.size)}
                style={[
                  styles.sizeOption,
                  selectedSize === product.size && styles.sizeOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.sizeText,
                    selectedSize === product.size && styles.sizeTextSelected,
                  ]}
                >
                  {product.size}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              Color
            </Text>
            <Text
              style={[styles.productDescription, isDarkMode && styles.darkText]}
            >
              {product.color}
            </Text>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              Quantity
            </Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}
                style={styles.quantityButton}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.quantityButtonText,
                  isDarkMode && styles.darkText,
                ]}
              >
                {quantity}
              </Text>
              <TouchableOpacity
                onPress={() => setQuantity((prev) => prev + 1)}
                style={styles.quantityButton}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              Customer Reviews
            </Text>
            <FlatList
              data={customerReviews}
              renderItem={renderReviewItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>

          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              Leave a Review
            </Text>
            {user ? (
              <Text
                style={[styles.input, { color: isDarkMode ? "#fff" : "#000" }]}
              >
                {newReview.name}
              </Text>
            ) : (
              <TextInput
                placeholder="Your Name"
                value={newReview.name}
                onChangeText={(text) =>
                  setNewReview({ ...newReview, name: text })
                }
                style={[styles.input, { color: isDarkMode ? "#fff" : "#000" }]}
              />
            )}
            <View style={styles.ratingContainer}>
              {[...Array(5)].map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() =>
                    setNewReview({ ...newReview, rating: index + 1 })
                  }
                >
                  <Star
                    fill={index < newReview.rating ? "#FFD700" : "#E0E0E0"}
                    stroke={index < newReview.rating ? "#FFD700" : "#E0E0E0"}
                    size={24}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              placeholder="Your Comment"
              value={newReview.comment}
              onChangeText={(text) =>
                setNewReview({ ...newReview, comment: text })
              }
              style={[styles.input, { color: isDarkMode ? "#fff" : "#000" }]}
              multiline
            />
            <View style={styles.imagePickerContainer}>
              <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
                <Text style={styles.imageButtonText}>Choose Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={takePhoto} style={styles.imageButton}>
                <Text style={styles.imageButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
            {newReview.image ? (
              <View style={styles.previewContainer}>
                <Image
                  source={{ uri: newReview.image }}
                  style={styles.previewImage}
                />
                <TouchableOpacity
                  onPress={() => setNewReview({ ...newReview, image: "" })}
                  style={styles.removeImageButton}
                >
                  <Text style={styles.removeImageText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <TouchableOpacity
              onPress={handleSubmitReview}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>Submit Review</Text>
            </TouchableOpacity>
          </View>

          {renderSuggestedProducts()}
        </View>
        <Footer />
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          onPress={handleAddToCart}
          style={styles.addToCartButton}
        >
          <Text style={styles.addToCartText}>
            Add to Cart - ${(product.price * quantity).toFixed(2)}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkContainer: {
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    position: "relative",
    height: height * 0.5,
  },
  productImage: {
    width: width,
    height: "100%",
  },
  paginationContainer: {
    position: "absolute",
    bottom: 20,
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#fff",
  },
  contentContainer: {
    padding: 20,
  },
  productInfoContainer: {
    marginBottom: 24,
  },
  productName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FF6B00",
    marginBottom: 12,
  },
  productDescription: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  darkText: {
    color: "#fff",
  },
  sizeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  sizeOption: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  sizeOptionSelected: {
    backgroundColor: "#FF6B00",
  },
  sizeText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  sizeTextSelected: {
    color: "#fff",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonText: {
    fontSize: 24,
    fontWeight: "500",
    color: "#000",
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#fff",
  },
  addToCartButton: {
    backgroundColor: "#FF6B00",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  addToCartText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  reviewItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  ratingContainer: {
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 16,
  },
  reviewComment: {
    fontSize: 14,
    color: "#666",
  },
  reviewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  suggestedProductItem: {
    width: 150,
    marginRight: 16,
  },
  suggestedProductImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  suggestedProductName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  suggestedProductPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B00",
  },
  suggestedProductList: {
    backgroundColor: "#fff",
  },
  darkSuggestedProductList: {
    backgroundColor: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: "#FF6B00",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  imagePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  imageButton: {
    backgroundColor: "#FF6B00",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  imageButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  previewContainer: {
    marginBottom: 10,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 5,
    borderRadius: 4,
  },
  removeImageText: {
    color: "#fff",
    fontSize: 12,
  },
});
