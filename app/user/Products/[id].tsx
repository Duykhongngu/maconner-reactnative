"use client";

import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "~/firebase.config";
import { useCart } from "../Cart/CartContext";
import ColorSelector from "./components/ColorSelector";
import QuantitySelector from "./components/QuantitySelector";
import AddToCartButton from "./components/AddToCartButton";
import { CartItem } from "../Cart/CartContext";
import { AntDesign } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

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
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");
  const [categoryName, setCategoryName] = useState<string>("");
  const isDarkMode = colorScheme === "dark";

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

          const productData = {
            id: productSnap.id,
            category: productSnap.data().category || "",
            inStock: productSnap.data().inStock !== false,
            link: productSnap.data().link || "",
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
            console.log(
              "Đang lấy sản phẩm đề xuất cho category:",
              productData.category
            );

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

            console.log(
              "Số lượng sản phẩm đề xuất tìm thấy:",
              suggestedProductsData.length
            );
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
        style={isDarkMode ? styles.darkContainer : styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={isDarkMode ? styles.darkText : {}}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView
        style={isDarkMode ? styles.darkContainer : styles.container}
      >
        <View style={styles.errorContainer}>
          <Text style={isDarkMode ? styles.darkText : {}}>
            {error || "Không tìm thấy sản phẩm"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={isDarkMode ? styles.darkContainer : styles.container}>
      <ScrollView>
        {/* Hình ảnh sản phẩm */}
        <Image
          source={{ uri: product.link }}
          style={styles.productImage}
          resizeMode="cover"
        />

        {/* Thông tin sản phẩm */}
        <View style={styles.productInfo}>
          <Text style={[styles.productName, isDarkMode && styles.darkText]}>
            {product.name}
          </Text>
          <Text style={styles.productPrice}>
            ${product.price.toFixed(2)} USD
          </Text>
          <Text style={[styles.productCategory, isDarkMode && styles.darkText]}>
            Category: {categoryName || product.category}
          </Text>
        </View>

        {/* Phần chọn màu sắc */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            Color
          </Text>
          <ColorSelector
            colors={product.color}
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
            isDarkMode={isDarkMode}
          />
        </View>

        {/* Phần chọn số lượng */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            Quantity
          </Text>
          <QuantitySelector
            quantity={quantity}
            onChangeQuantity={setQuantity}
            isDarkMode={isDarkMode}
          />
        </View>

        {/* Mô tả sản phẩm */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            Description
          </Text>
          <Text
            style={[styles.productDescription, isDarkMode && styles.darkText]}
          >
            {product.description}
          </Text>
        </View>
        {/* Nút thêm vào giỏ hàng */}
        <AddToCartButton
          onPress={handleAddToCart}
          price={product.price}
          disabled={!selectedColor || !product.color.includes(selectedColor)}
        />
        {/* Phần sản phẩm đề xuất */}
        {suggestedProducts.length > 0 && (
          <View style={styles.suggestedProductsSection}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              Sản phẩm tương tự
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {suggestedProducts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestedProductCard}
                  onPress={() => {
                    // Chuyển hướng đến trang chi tiết sản phẩm
                    router.push(`/user/Products/${item.id}`);
                  }}
                >
                  <Image
                    source={{ uri: item.link }}
                    style={styles.suggestedProductImage}
                    resizeMode="cover"
                  />
                  <View style={styles.suggestedProductInfo}>
                    <Text
                      style={[
                        styles.suggestedProductName,
                        isDarkMode && styles.darkText,
                      ]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {item.name}
                    </Text>
                    <Text style={styles.suggestedProductPrice}>
                      ${item.price.toFixed(2)} USD
                    </Text>
                    {/* Hiển thị rating nếu có */}
                    <View style={styles.ratingContainer}>
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
                          style={styles.starIcon}
                        />
                      ))}
                      <Text style={styles.ratingText}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  darkContainer: {
    flex: 1,
    backgroundColor: "#121212",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  productImage: {
    width: "100%",
    height: 300,
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  darkText: {
    color: "#fff",
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF6B00",
    marginBottom: 8,
  },
  productCategory: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  section: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  productDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  suggestedProductsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  suggestedProductCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestedProductImage: {
    width: "100%",
    height: 160,
  },
  suggestedProductInfo: {
    padding: 8,
  },
  suggestedProductName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    height: 40,
  },
  suggestedProductPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B00",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
    color: "#666",
  },
});
