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
  useColorScheme,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { type Product, products } from "~/app/Data/product";
import { useCart } from "~/app/Cart/CartContext";
import { Star } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Footer from "../Footer/Footer";

const { width, height } = Dimensions.get("window");

interface CustomerReview {
  id: number;
  name: string;
  rating: number;
  comment: string;
}

const STORAGE_KEY = "productReviews";

const reviewsStorage = {
  async getAll() {
    const reviews = await AsyncStorage.getItem(STORAGE_KEY);
    return reviews ? JSON.parse(reviews) : {};
  },
  async getForProduct(productId: string) {
    const allReviews = await this.getAll();
    return allReviews[productId] || [];
  },
  async saveForProduct(productId: string, reviews: CustomerReview[]) {
    const allReviews = await this.getAll();
    allReviews[productId] = reviews;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allReviews));
  },
};

export default function ProductDetail(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { addToCart } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const colorScheme = useColorScheme();

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: "",
  });
  const [customerReviews, setCustomerReviews] = useState<CustomerReview[]>([]);

  const productImages = product ? [product.img, product.img, product.img] : [];

  useEffect(() => {
    // Search for the product in all categories
    let foundProduct: Product | undefined;
    const categories = Object.keys(products);

    for (const category of categories) {
      foundProduct = products[category].find((p) => p.id === Number(id));
      if (foundProduct) break;
    }

    if (foundProduct) {
      setProduct(foundProduct);
      setSelectedColor(foundProduct.colors[0]);
      setSelectedSize(foundProduct.sizes ? foundProduct.sizes[0] : null);
    }
  }, [id]);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const productReviews = await reviewsStorage.getForProduct(id);
        setCustomerReviews(productReviews);
      } catch (error) {
        console.error("Failed to load reviews:", error);
      }
    };

    loadReviews();
  }, [id]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [product]);

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const handleAddToCart = () => {
    if (product && selectedColor && selectedSize) {
      addToCart({
        id: product.id.toString(),
        name: product.name,
        price: product.price,
        quantity: quantity,
        color: selectedColor,
        size: selectedSize,
        image: product.img as any,
      });

      setQuantity(1);
    }
  };

  const handleSubmitReview = async () => {
    if (newReview.name && newReview.rating > 0 && newReview.comment) {
      const newReviewData = {
        id: Date.now(),
        ...newReview,
      };

      try {
        const updatedReviews = [...customerReviews, newReviewData];
        await reviewsStorage.saveForProduct(id, updatedReviews);
        setCustomerReviews(updatedReviews);
        setNewReview({ name: "", rating: 0, comment: "" });
      } catch (error) {
        console.error("Failed to save review:", error);
        alert("Failed to save review. Please try again.");
      }
    } else {
      alert("Please fill in all fields.");
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
    </View>
  );

  const renderSuggestedProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.suggestedProductItem}
      onPress={() => router.push(`/Products/${item.id}`)}
    >
      <Image source={item.img} style={styles.suggestedProductImage} />
      <Text style={styles.suggestedProductName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.suggestedProductPrice}>${item.price.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  const isDarkMode = colorScheme === "dark";

  // Update the suggested products section to show products from the same category
  const getSuggestedProducts = () => {
    if (!product) return [];

    // Find which category the current product belongs to
    let productCategory = "";
    Object.entries(products).forEach(([category, productList]) => {
      if (productList.find((p) => p.id === product.id)) {
        productCategory = category;
      }
    });

    // Get other products from the same category
    return products[productCategory]
      .filter((p) => p.id !== product.id)
      .slice(0, 6);
  };

  // Update the suggested products rendering
  const renderSuggestedProducts = () => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
        You May Also Like
      </Text>
      <FlatList
        data={getSuggestedProducts()}
        renderItem={renderSuggestedProduct}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[
          styles.suggestedProductList,
          isDarkMode && styles.darkSuggestedProductList,
        ]}
      />
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, isDarkMode && styles.darkContainer]}
    >
      <ScrollView
        ref={scrollViewRef}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery */}
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
                source={image}
                style={styles.productImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          {/* Pagination Dots */}
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
          {/* Product Info */}
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
              {product.description}
            </Text>
          </View>

          {/* Color Selection */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              Color
            </Text>
            <View style={styles.colorContainer}>
              {product.colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Size Selection */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              Size
            </Text>
            <View style={styles.sizeContainer}>
              {product.sizes?.map((size) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => setSelectedSize(size)}
                  style={[
                    styles.sizeOption,
                    selectedSize === size && styles.sizeOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.sizeText,
                      selectedSize === size && styles.sizeTextSelected,
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quantity */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              Quantity
            </Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}
                style={styles.quantityButton}
              >
                <Text style={[styles.quantityButtonText]}>-</Text>
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
                <Text style={[styles.quantityButtonText]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Customer Reviews */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              Customer Reviews
            </Text>
            <FlatList
              data={customerReviews}
              renderItem={renderReviewItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>

          {/* Review Submission Form */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              Leave a Review
            </Text>
            <TextInput
              placeholder="Your Name"
              value={newReview.name}
              onChangeText={(text) =>
                setNewReview({ ...newReview, name: text })
              }
              style={styles.input}
            />
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
              style={styles.input}
              multiline
            />
            <TouchableOpacity
              onPress={handleSubmitReview}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>Submit Review</Text>
            </TouchableOpacity>
          </View>

          {renderSuggestedProducts()}
        </View>
      </ScrollView>

      {/* Fixed Bottom Buttons */}
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
    height: height * 0.5, // 50% of screen height
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
  colorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: "#FF6B00",
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
    paddingBottom: 34, // Extra padding for iPhone bottom area
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
    marginBottom: 4,
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
  darkSuggestedProductName: {
    color: "#fff",
  },
  darkSuggestedProductPrice: {
    color: "#FF6B00",
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
});
