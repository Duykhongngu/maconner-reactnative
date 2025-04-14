"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Switch,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  ChevronDown,
  ChevronLast,
  ChevronLeft,
  Moon,
  Sun,
} from "lucide-react-native";
import { useColorScheme } from "~/lib/useColorScheme";

import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
} from "~/service/products";
import { router } from "expo-router";
import { fetchCategories } from "~/service/categoryProduct";

interface Product {
  id: string;
  category: string;
  inStock: boolean;
  link: string;
  images?: string[];
  name: string;
  price: number;
  description: string;
  color: string[];
  purchaseCount?: number;
  trending?: boolean;
  stockQuantity?: number;
}

interface CategoryOption {
  label: string;
  value: string;
}

const ProductManagementScreen = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState<Omit<Product, "id">>({
    category: "",
    inStock: true,
    link: "",
    images: [],
    name: "",
    price: 0,
    description: "",
    color: [],
    purchaseCount: 0,
    trending: false,
    stockQuantity: 0,
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceText, setPriceText] = useState<string>("");
  const [multipleImages, setMultipleImages] = useState<string[]>([]);

  // Use NativeWind color scheme
  const { isDarkColorScheme, toggleColorScheme } = useColorScheme();

  useEffect(() => {
    fetchProductsData();
    fetchCategoriesData();
  }, []);

  useEffect(() => {
    if (newProduct.price > 0) {
      setPriceText(newProduct.price.toString());
    } else {
      setPriceText("");
    }
  }, [newProduct.price]);

  const fetchProductsData = async () => {
    setLoading(true);
    try {
      const allProducts = await fetchProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert("Error", "Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesData = async () => {
    try {
      const allCategories = await fetchCategories();
      const categoryOptions = allCategories
        .map((category) => ({
          label: category.name,
          value: category.id || "",
        }))
        .filter((category) => category.value !== ""); // Lọc bỏ các mục không hợp lệ
      setCategories(categoryOptions);
    } catch (error) {
      console.error("Error fetching categories:", error);
      Alert.alert("Error", "Failed to load categories. Please try again.");
    }
  };

  const handleAddProduct = async () => {
    if (
      !newProduct.name ||
      !newProduct.category ||
      selectedColors.length === 0
    ) {
      Alert.alert(
        "Missing Information",
        "Please fill in the name, category, and select at least one color"
      );
      return;
    }

    setLoading(true);
    const productData = {
      ...newProduct,
      color: selectedColors,
      price: isNaN(Number(newProduct.price)) ? 0 : Number(newProduct.price),
      images: multipleImages.length > 0 ? multipleImages : [newProduct.link],
      purchaseCount: newProduct.purchaseCount || 0,
      Trending: newProduct.trending || false,
    };

    console.log("Product Data to be added:", productData);

    try {
      await addProduct(productData);
      await fetchProductsData();
      resetForm();
      Alert.alert("Success", "Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert("Error", "Failed to add product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({ ...product });
    setImageUrl(product.link);
    setMultipleImages(product.images || []);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    if (!newProduct.name || !newProduct.category) {
      Alert.alert(
        "Missing Information",
        "Please fill in the name and category fields"
      );
      return;
    }

    setLoading(true);
    const productData = {
      ...newProduct,
      price: isNaN(Number(newProduct.price)) ? 0 : Number(newProduct.price),
      images: multipleImages.length > 0 ? multipleImages : [newProduct.link],
      purchaseCount: newProduct.purchaseCount || 0,
      Trending: newProduct.trending || false,
    };

    try {
      await updateProduct(editingProduct.id, productData);
      await fetchProductsData();
      resetForm();
      Alert.alert("Success", "Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
      Alert.alert("Error", "Failed to update product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteProduct(productId);
              await fetchProductsData();
              Alert.alert("Success", "Product deleted successfully!");
            } catch (error) {
              console.error("Error deleting product:", error);
              Alert.alert(
                "Error",
                "Failed to delete product. Please try again."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setNewProduct({
      category: "",
      inStock: true,
      link: "",
      images: [],
      name: "",
      price: 0,
      description: "",
      color: [],
      purchaseCount: 0,
      trending: false,
      stockQuantity: 0,
    });
    setImageUrl("");
    setMultipleImages([]);
    setEditingProduct(null);
    setSelectedColors([]);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View
      className={`p-4 border border-${
        isDarkColorScheme ? "gray-700" : "gray-200"
      } rounded-lg my-1 ${isDarkColorScheme ? "bg-black" : "bg-white"}`}
    >
      <Text
        className={`font-bold text-base mb-1 ${
          isDarkColorScheme ? "text-gray-100" : "text-gray-800"
        }`}
      >
        {item.name} - ${(item.price ?? 0).toFixed(2)}
      </Text>

      {/* Display multiple images in a row */}
      {item.images && item.images.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="my-2"
        >
          {item.images.map((imageUrl, index) => (
            <Image
              key={index}
              source={{ uri: imageUrl }}
              className="w-[100px] h-[100px] mr-2 bg-gray-100"
              style={{ resizeMode: "contain" }}
              onError={(e) =>
                console.error("Image loading error:", e.nativeEvent.error)
              }
            />
          ))}
        </ScrollView>
      ) : item.link ? (
        <Image
          source={{ uri: item.link }}
          className="w-[100px] h-[100px] my-2 bg-gray-100"
          style={{ resizeMode: "contain" }}
          onError={(e) =>
            console.error("Image loading error:", e.nativeEvent.error)
          }
        />
      ) : null}

      <Text className={isDarkColorScheme ? "text-gray-300" : "text-gray-700"}>
        Category: {categories.find((cat) => cat.value === item.category)?.label}
      </Text>
      <Text className={isDarkColorScheme ? "text-gray-300" : "text-gray-700"}>
        Description: {item.description}
      </Text>
      <Text className={isDarkColorScheme ? "text-gray-300" : "text-gray-700"}>
        In Stock: {item.inStock ? "Yes" : "No"}
      </Text>
      <Text className={isDarkColorScheme ? "text-gray-300" : "text-gray-700"}>
        Stock Quantity: {item.stockQuantity || 0}
      </Text>
      <Text className={isDarkColorScheme ? "text-gray-300" : "text-gray-700"}>
        Purchase Count: {item.purchaseCount || 0}
      </Text>
      <Text className={isDarkColorScheme ? "text-gray-300" : "text-gray-700"}>
        Colors:{" "}
        {Array.isArray(item.color) ? item.color.join(", ") : "Not specified"}
      </Text>
      <View className="flex-row justify-end mt-2 gap-2">
        <TouchableOpacity
          className="bg-yellow-400 py-2 px-4 rounded"
          onPress={() => handleEditProduct(item)}
        >
          <Text className="text-black font-semibold text-sm">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`${
            isDarkColorScheme ? "bg-red-700" : "bg-red-500"
          } py-2 px-4 rounded`}
          onPress={() => handleDeleteProduct(item.id)}
        >
          <Text className="text-white font-semibold text-sm">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const SizeButton = ({
    size,
    selected,
    onPress,
  }: {
    size: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      className={`py-2 px-4 rounded border ${
        selected
          ? "bg-orange-500 border-blue-700"
          : isDarkColorScheme
          ? "bg-gray-700 border-gray-600"
          : "bg-gray-100 border-gray-300"
      }`}
      onPress={onPress}
    >
      <Text
        className={`text-sm ${
          selected
            ? "text-white font-bold"
            : isDarkColorScheme
            ? "text-gray-300"
            : "text-gray-700"
        }`}
      >
        {size}
      </Text>
    </TouchableOpacity>
  );

  const renderCategorySelector = () => {
    const selectedCategory = categories.find(
      (cat) => cat.value === newProduct.category
    );

    return (
      <View>
        <TouchableOpacity
          className={`border ${
            isDarkColorScheme
              ? "border-gray-600 bg-gray-700"
              : "border-gray-300 bg-white"
          } rounded p-4 my-1`}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text
            className={`text-base ${
              !selectedCategory?.label
                ? isDarkColorScheme
                  ? "text-gray-400"
                  : "text-gray-400"
                : isDarkColorScheme
                ? "text-white"
                : "text-black"
            }`}
          >
            {selectedCategory?.label || "Select Category"}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={showCategoryModal}
          transparent={true}
          animationType="slide"
        >
          <View className="flex-1 justify-end bg-black/50">
            <View
              className={`${
                isDarkColorScheme ? "bg-black" : "bg-white"
              } rounded-t-3xl p-5 max-h-[70%]`}
            >
              <Text
                className={`text-lg font-semibold text-center mb-4 ${
                  isDarkColorScheme ? "text-white" : "text-gray-800"
                }`}
              >
                Select Category
              </Text>

              <ScrollView className="mb-4">
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    className={`p-4 border-b ${
                      isDarkColorScheme ? "border-gray-700" : "border-gray-200"
                    } ${
                      newProduct.category === category.value
                        ? isDarkColorScheme
                          ? "bg-blue-900/30"
                          : "bg-blue-50"
                        : ""
                    }`}
                    onPress={() => {
                      setNewProduct({
                        ...newProduct,
                        category: category.value,
                      });
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text
                      className={`text-base ${
                        newProduct.category === category.label
                          ? isDarkColorScheme
                            ? "text-blue-400 font-semibold"
                            : "text-blue-600 font-semibold"
                          : isDarkColorScheme
                          ? "text-gray-200"
                          : "text-gray-800"
                      }`}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                className={`p-4 ${
                  isDarkColorScheme ? "bg-gray-700" : "bg-gray-200"
                } rounded-lg items-center`}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text
                  className={`text-base font-semibold ${
                    isDarkColorScheme ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const pickImage = async () => {
    try {
      // Yêu cầu quyền truy cập thư viện ảnh
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Lỗi", "Cần cấp quyền truy cập thư viện ảnh để tiếp tục");
        return;
      }

      // Mở thư viện ảnh để chọn
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        setLoading(true);
        try {
          // Upload ảnh và lấy URL
          const uploadedUrl = await uploadImage(result.assets[0].uri);
          setNewProduct({ ...newProduct, link: uploadedUrl });
          // Add to multiple images array
          setMultipleImages([...multipleImages, uploadedUrl]);
        } catch (error) {
          console.error("Lỗi khi tải ảnh lên:", error);
          Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Lỗi khi chọn ảnh:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
    }
  };

  const removeImage = (imageUrl: string) => {
    setMultipleImages(multipleImages.filter((url) => url !== imageUrl));
  };

  const handleBack = () => {
    router.back();
  };

  const renderColorPicker = () => {
    const colors = ["Red", "Green", "Blue", "Yellow", "Black", "White"];

    return (
      <View>
        <Text
          className={`text-base font-medium mb-1 ${
            isDarkColorScheme ? "text-gray-100" : "text-gray-800"
          }`}
        >
          Select Colors:
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {colors.map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => {
                if (selectedColors.includes(color)) {
                  setSelectedColors(selectedColors.filter((c) => c !== color));
                } else {
                  setSelectedColors([...selectedColors, color]);
                }
              }}
              style={{
                backgroundColor: color.toLowerCase(),
                padding: 10,
                borderRadius: 5,
                margin: 5,
                borderWidth: selectedColors.includes(color) ? 2 : 0,
                borderColor: selectedColors.includes(color)
                  ? "black"
                  : "transparent",
              }}
            >
              <Text style={{ color: "white" }}>{color}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkColorScheme ? "bg-black" : "bg-white"}`}
    >
      <View
        className={`${isDarkColorScheme ? "bg-black" : "bg-orange-500"} p-5`}
      >
        <View className="flex-row items-center">
          <Text className="text-2xl font-bold text-white mb-0">
            Product Management
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-5" keyboardShouldPersistTaps="handled">
        <View
          className={`${
            isDarkColorScheme ? "bg-black" : "bg-gray-50"
          } p-4 rounded-lg mb-5 shadow`}
        >
          <Text
            className={`text-base font-medium mb-1 ${
              isDarkColorScheme ? "text-gray-100" : "text-gray-800"
            }`}
          >
            Category:
          </Text>
          {renderCategorySelector()}

          <Text
            className={`text-base font-medium mb-1 mt-3 ${
              isDarkColorScheme ? "text-gray-100" : "text-gray-800"
            }`}
          >
            Product Name:
          </Text>
          <TextInput
            placeholder="Product Name"
            placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
            value={newProduct.name}
            onChangeText={(text: string) =>
              setNewProduct({ ...newProduct, name: text })
            }
            className={`border ${
              isDarkColorScheme
                ? "border-gray-600 bg-gray-700 text-white"
                : "border-gray-300 bg-white text-gray-800"
            } p-4 my-1 rounded text-base`}
          />

          <Text
            className={`text-base font-medium mb-1 mt-3 ${
              isDarkColorScheme ? "text-gray-100" : "text-gray-800"
            }`}
          >
            Price:
          </Text>
          <TextInput
            placeholder="Price (e.g., 12.50)"
            placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
            value={priceText}
            onChangeText={(text: string) => {
              // Thay thế dấu phẩy bằng dấu chấm
              const normalizedText = text.replace(",", ".");

              // Kiểm tra xem chuỗi có đúng định dạng không
              if (
                normalizedText === "" ||
                /^(\d+\.?\d*|\.\d+)$/.test(normalizedText)
              ) {
                setPriceText(normalizedText);
                setNewProduct({
                  ...newProduct,
                  price: normalizedText === "" ? 0 : parseFloat(normalizedText),
                });
              }
            }}
            keyboardType="decimal-pad"
            className={`border ${
              isDarkColorScheme
                ? "border-gray-600 bg-gray-700 text-white"
                : "border-gray-300 bg-white text-gray-800"
            } p-4 my-1 rounded text-base`}
          />

          <Text
            className={`text-base font-medium mb-1 mt-3 ${
              isDarkColorScheme ? "text-gray-100" : "text-gray-800"
            }`}
          >
            Description:
          </Text>
          <TextInput
            placeholder="Enter description"
            placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
            value={newProduct.description}
            onChangeText={(text: string) =>
              setNewProduct({ ...newProduct, description: text })
            }
            className={`border ${
              isDarkColorScheme
                ? "border-gray-600 bg-gray-700 text-white"
                : "border-gray-300 bg-white text-gray-800"
            } p-4 my-1 rounded text-base`}
          />

          <Text
            className={`text-base font-medium mb-1 mt-3 ${
              isDarkColorScheme ? "text-gray-100" : "text-gray-800"
            }`}
          >
            Image Products:
          </Text>
          <View className="flex-row items-center my-1">
            <TextInput
              placeholder="Image URL (or pick images)"
              placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
              value={newProduct.link}
              onChangeText={(text: string) =>
                setNewProduct({ ...newProduct, link: text })
              }
              className={`border ${
                isDarkColorScheme
                  ? "border-gray-600 bg-gray-700 text-white"
                  : "border-gray-300 bg-white text-gray-800"
              } p-4 rounded flex-1 mr-2 text-base`}
            />
            <TouchableOpacity
              className="bg-orange-500 py-4 px-5 rounded justify-center items-center"
              onPress={pickImage}
              disabled={loading}
            >
              <Text className="text-white font-semibold text-base">Pick</Text>
            </TouchableOpacity>
          </View>

          {/* Multiple Images Display */}
          {multipleImages.length > 0 && (
            <View className="mt-2">
              <Text
                className={`text-base font-medium mb-2 ${
                  isDarkColorScheme ? "text-gray-100" : "text-gray-800"
                }`}
              >
                Selected Images ({multipleImages.length}):
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="my-2"
              >
                {multipleImages.map((imgUrl, index) => (
                  <View
                    key={index}
                    className={`mr-3 border rounded overflow-hidden ${
                      isDarkColorScheme
                        ? "border-gray-700 bg-gray-800"
                        : "border-gray-300 bg-gray-100"
                    }`}
                  >
                    <Image
                      source={{ uri: imgUrl }}
                      className="w-[100px] h-[100px]"
                      style={{ resizeMode: "cover" }}
                    />
                    <TouchableOpacity
                      className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                      onPress={() => removeImage(imgUrl)}
                    >
                      <Text className="text-white font-bold text-xs">✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {newProduct.link && !multipleImages.includes(newProduct.link) ? (
            <View
              className={`items-center my-2 rounded overflow-hidden border ${
                isDarkColorScheme
                  ? "border-gray-700 bg-black"
                  : "border-gray-300 bg-gray-100"
              }`}
            >
              <Image
                source={{ uri: newProduct.link }}
                className="w-[200px] h-[200px]"
                style={{ resizeMode: "contain" }}
                onError={() => {
                  Alert.alert("Error", "Failed to load image preview");
                  setNewProduct({ ...newProduct, link: "" });
                }}
              />
              <TouchableOpacity
                className="bg-orange-500 py-2 px-4 rounded mt-2 mb-2"
                onPress={() => {
                  setMultipleImages([...multipleImages, newProduct.link]);
                  setNewProduct({ ...newProduct, link: "" });
                }}
              >
                <Text className="text-white font-semibold">Add to Images</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View className="flex-row items-center my-4">
            <Text
              className={`text-base mr-2 ${
                isDarkColorScheme ? "text-gray-100" : "text-gray-800"
              }`}
            >
              In Stock:
            </Text>
            <Switch
              value={newProduct.inStock}
              onValueChange={(value: boolean) =>
                setNewProduct({ ...newProduct, inStock: value })
              }
              trackColor={{ false: "#767577", true: "#f0883e" }}
              thumbColor={newProduct.inStock ? "#d96716" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
            />
          </View>

          <Text
            className={`text-base font-medium mb-1 mt-3 ${
              isDarkColorScheme ? "text-gray-100" : "text-gray-800"
            }`}
          >
            Color:
          </Text>
          {renderColorPicker()}

          <View className="mb-4">
            <Text
              className={`text-base font-medium mb-1 ${
                isDarkColorScheme ? "text-gray-100" : "text-gray-800"
              }`}
            >
              Stock Quantity:
            </Text>
            <TextInput
              placeholder="Enter stock quantity"
              placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
              value={String(newProduct.stockQuantity || 0)}
              onChangeText={(text) =>
                setNewProduct({
                  ...newProduct,
                  stockQuantity: Number(text) || 0,
                })
              }
              keyboardType="numeric"
              className={`border ${
                isDarkColorScheme
                  ? "border-gray-600 bg-gray-700 text-white"
                  : "border-orange-200 text-gray-800"
              } p-3 rounded-md text-base`}
            />
          </View>

          <View className="mb-4">
            <Text
              className={`text-base font-medium mb-1 ${
                isDarkColorScheme ? "text-gray-100" : "text-gray-800"
              }`}
            >
              Purchase Count:
            </Text>
            <TextInput
              placeholder="Enter purchase count"
              placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
              value={String(newProduct.purchaseCount || 0)}
              onChangeText={(text) =>
                setNewProduct({
                  ...newProduct,
                  purchaseCount: Number(text) || 0,
                })
              }
              keyboardType="numeric"
              className={`border ${
                isDarkColorScheme
                  ? "border-gray-600 bg-gray-700 text-white"
                  : "border-orange-200 text-gray-800"
              } p-3 rounded-md text-base`}
            />
          </View>

          <View className="mb-4 flex-row justify-between items-center">
            <Text
              className={`text-base font-medium ${
                isDarkColorScheme ? "text-gray-100" : "text-gray-800"
              }`}
            >
              Mark as Trending Product:
            </Text>
            <Switch
              value={newProduct.trending || false}
              onValueChange={(value) =>
                setNewProduct({ ...newProduct, trending: value })
              }
              trackColor={{ false: "#767577", true: "#ff8c00" }}
              thumbColor={newProduct.trending ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>

          {editingProduct ? (
            <>
              <TouchableOpacity
                className={`py-4 px-4 rounded-lg mt-4 ${
                  loading || !newProduct.category || !newProduct.name
                    ? "bg-gray-400"
                    : "bg-yellow-400"
                }`}
                onPress={handleUpdateProduct}
                disabled={loading || !newProduct.category || !newProduct.name}
              >
                <Text className="text-black text-center font-bold text-base">
                  {loading ? "Updating..." : "Update Product"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`py-4 px-4 rounded-lg mt-2 ${
                  isDarkColorScheme ? "bg-red-700" : "bg-red-500"
                }`}
                onPress={resetForm}
              >
                <Text className="text-white text-center font-bold text-base">
                  Cancel Edit
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              className={`py-4 px-4 rounded-lg mt-4 ${
                loading || !newProduct.category || !newProduct.name
                  ? "bg-gray-400"
                  : "bg-yellow-400"
              }`}
              onPress={handleAddProduct}
              disabled={loading || !newProduct.category || !newProduct.name}
            >
              <Text className="text-black text-center font-bold text-base">
                {loading ? "Adding..." : "Add Product"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {loading && (
          <ActivityIndicator
            size="large"
            color={isDarkColorScheme ? "#f0883e" : "#d96716"}
            className="py-4"
          />
        )}

        <Text
          className={`text-xl font-bold mt-5 mb-2 ${
            isDarkColorScheme
              ? "text-gray-100 bg-black"
              : "text-gray-800 bg-gray-100"
          } p-2 rounded`}
        >
          All Products:
        </Text>
        <View>
          {products.length > 0 ? (
            products.map((item) => (
              <View key={item.id}>{renderProduct({ item })}</View>
            ))
          ) : (
            <Text
              className={`text-center py-5 italic ${
                isDarkColorScheme ? "text-gray-400" : "text-gray-500"
              }`}
            >
              No products found
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProductManagementScreen;
