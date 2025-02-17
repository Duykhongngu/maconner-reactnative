import { useEffect, useState } from "react";
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
  useColorScheme,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { type Product, trendingProducts } from "~/app/Data/product";
import { useCart } from "~/app/Cart/CartContext";
import { Star } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

interface CustomerReview {
  id: number;
  name: string;
  rating: number;
  comment: string;
}

// Mock customer reviews
const customerReviews: CustomerReview[] = [
  {
    id: 1,
    name: "John D.",
    rating: 5,
    comment: "Great product, very comfortable!",
  },
  {
    id: 2,
    name: "Sarah M.",
    rating: 4,
    comment: "Good quality, but sizing runs small.",
  },
  {
    id: 3,
    name: "Mike L.",
    rating: 5,
    comment: "Exactly as described. Very satisfied!",
  },
];

export default function ProductDetail(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const { addToCart } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const colorScheme = useColorScheme(); // Get the current color scheme

  // State management
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Mock multiple product images
  const productImages = product ? [product.img, product.img, product.img] : [];

  useEffect(() => {
    const foundProduct = trendingProducts.find((p) => p.id === Number(id));
    if (foundProduct) {
      setProduct(foundProduct);
      setSelectedColor(foundProduct.colors[0]);
      setSelectedSize(foundProduct.sizes ? foundProduct.sizes[0] : null);
    }
  }, [id]);

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

  // Determine styles based on color scheme
  const isDarkMode = colorScheme === "dark";

  return (
    <SafeAreaView
      style={[styles.container, isDarkMode && styles.darkContainer]}
    >
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
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

          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              You May Also Like
            </Text>
            <FlatList
              data={trendingProducts
                .filter((p) => p.id !== product.id)
                .slice(0, 6)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.suggestedProductItem,
                    isDarkMode && styles.darkSuggestedProductList,
                  ]}
                  onPress={() => router.push(`/Products/${item.id}`)}
                >
                  <Image
                    source={item.img}
                    style={styles.suggestedProductImage}
                  />
                  <Text
                    style={[
                      styles.suggestedProductName,
                      isDarkMode && styles.darkSuggestedProductName,
                    ]}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.suggestedProductPrice,
                      isDarkMode && styles.darkSuggestedProductPrice,
                    ]}
                  >
                    ${item.price.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[
                styles.suggestedProductList,
                isDarkMode && styles.darkSuggestedProductList,
              ]}
            />
          </View>
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
    backgroundColor: "#fff",
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
  quantityText: {
    fontSize: 20,
    fontWeight: "600",
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
});
