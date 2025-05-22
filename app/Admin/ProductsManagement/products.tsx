"use client";

import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
} from "react-native";

import { useColorScheme } from "~/lib/useColorScheme";
import ProductForm from "./components/ProductForm";
import ProductList from "./components/ProductList";
import { Product, CategoryOption, NewProduct } from "./components/types";
import Feather from "react-native-vector-icons/Feather";
import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "~/service/products";
import { fetchCategories } from "~/service/categoryProduct";

const ProductManagementScreen = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState<NewProduct>({
    category: "",
    inStock: true,
    link: "",
    images: [],
    name: "",
    price: 0,
    purchasePrice: 0,
    description: "",
    color: [],
    purchaseCount: 0,
    trending: false,
    stockQuantity: 0,
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [multipleImages, setMultipleImages] = useState<string[]>([]);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [priceRange, setPriceRange] = useState<{
    min: number | null;
    max: number | null;
  }>({ min: null, max: null });
  const [tempPriceRange, setTempPriceRange] = useState<{
    min: string;
    max: string;
  }>({ min: "", max: "" });
  const [stockFilter, setStockFilter] = useState<string>("all");

  // Scroll reference
  const scrollViewRef = useRef<ScrollView>(null);

  // Use NativeWind color scheme
  const { isDarkColorScheme } = useColorScheme();

  useEffect(() => {
    fetchProductsData();
    fetchCategoriesData();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...products];

    // Search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter) {
      result = result.filter((item) => item.category === categoryFilter);
    }

    // Price range filter
    if (priceRange.min !== null) {
      result = result.filter(
        (item) => (item.price || 0) >= (priceRange.min || 0)
      );
    }

    if (priceRange.max !== null) {
      result = result.filter(
        (item) => (item.price || 0) <= (priceRange.max || 0)
      );
    }

    // Stock filter
    if (stockFilter === "inStock") {
      result = result.filter((item) => item.inStock);
    } else if (stockFilter === "outOfStock") {
      result = result.filter((item) => !item.inStock);
    }

    setFilteredProducts(result);
  }, [products, searchQuery, categoryFilter, priceRange, stockFilter]);

  const fetchProductsData = async () => {
    setLoading(true);
    try {
      const allProducts = await fetchProducts();
      setProducts(allProducts);
      setFilteredProducts(allProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách sản phẩm. Vui lòng thử lại.");
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
        .filter((category) => category.value !== "");
      setCategories(categoryOptions);
    } catch (error) {
      console.error("Error fetching categories:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách danh mục. Vui lòng thử lại.");
    }
  };

  const handleAddProduct = async () => {
    if (
      !newProduct.name ||
      !newProduct.category ||
      selectedColors.length === 0
    ) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng điền tên sản phẩm, chọn danh mục và ít nhất một màu sắc"
      );
      return;
    }

    setLoading(true);
    const productData = {
      ...newProduct,
      color: selectedColors,
      price: isNaN(Number(newProduct.price)) ? 0 : Number(newProduct.price),
      purchasePrice: isNaN(Number(newProduct.purchasePrice))
        ? 0
        : Number(newProduct.purchasePrice),
      images: multipleImages.length > 0 ? multipleImages : [newProduct.link],
      purchaseCount: newProduct.purchaseCount || 0,
      Trending: newProduct.trending || false,
    };

    try {
      await addProduct(productData);
      await fetchProductsData();
      resetForm();
      Alert.alert("Thành công", "Đã thêm sản phẩm mới!");
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert("Lỗi", "Không thể thêm sản phẩm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({ ...product });
    setSelectedColors(product.color || []);
    setMultipleImages(product.images || []);

    // Scroll to form
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    if (!newProduct.name || !newProduct.category) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng điền tên sản phẩm và chọn danh mục"
      );
      return;
    }

    setLoading(true);
    const productData = {
      ...newProduct,
      color: selectedColors,
      price: isNaN(Number(newProduct.price)) ? 0 : Number(newProduct.price),
      purchasePrice: isNaN(Number(newProduct.purchasePrice))
        ? 0
        : Number(newProduct.purchasePrice),
      images: multipleImages.length > 0 ? multipleImages : [newProduct.link],
      purchaseCount: newProduct.purchaseCount || 0,
      Trending: newProduct.trending || false,
    };

    try {
      await updateProduct(editingProduct.id, productData);
      await fetchProductsData();
      resetForm();
      Alert.alert("Thành công", "Đã cập nhật sản phẩm!");
    } catch (error) {
      console.error("Error updating product:", error);
      Alert.alert("Lỗi", "Không thể cập nhật sản phẩm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    Alert.alert("Xác nhận xóa", "Bạn có chắc chắn muốn xóa sản phẩm này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await deleteProduct(productId);
            await fetchProductsData();
            Alert.alert("Thành công", "Đã xóa sản phẩm!");
          } catch (error) {
            console.error("Error deleting product:", error);
            Alert.alert("Lỗi", "Không thể xóa sản phẩm. Vui lòng thử lại.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setNewProduct({
      category: "",
      inStock: true,
      link: "",
      images: [],
      name: "",
      price: 0,
      purchasePrice: 0,
      description: "",
      color: [],
      purchaseCount: 0,
      trending: false,
      stockQuantity: 0,
    });
    setMultipleImages([]);
    setEditingProduct(null);
    setSelectedColors([]);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setPriceRange({ min: null, max: null });
    setTempPriceRange({ min: "", max: "" });
    setStockFilter("all");
    setShowFilterModal(false);
  };

  const applyPriceFilter = () => {
    const min =
      tempPriceRange.min === "" ? null : parseFloat(tempPriceRange.min);
    const max =
      tempPriceRange.max === "" ? null : parseFloat(tempPriceRange.max);
    setPriceRange({ min, max });
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View
          className={`${
            isDarkColorScheme ? "bg-black" : "bg-white"
          } rounded-t-3xl p-5`}
          style={{ minHeight: 300 }}
        >
          <View className="flex-row justify-between items-center mb-5">
            <Text
              className={`text-lg font-bold ${
                isDarkColorScheme ? "text-white" : "text-gray-800"
              }`}
            >
              Bộ lọc sản phẩm
            </Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Feather
                name="x"
                size={24}
                color={isDarkColorScheme ? "white" : "black"}
              />
            </TouchableOpacity>
          </View>

          {/* Category Filter */}
          <Text
            className={`text-base mb-2 ${
              isDarkColorScheme ? "text-gray-300" : "text-gray-800"
            }`}
          >
            Danh mục
          </Text>
          <View className="mb-4">
            <TouchableOpacity
              className={`p-2 rounded mb-1 ${
                categoryFilter === ""
                  ? isDarkColorScheme
                    ? "bg-orange-800"
                    : "bg-orange-200"
                  : isDarkColorScheme
                  ? "bg-gray-800"
                  : "bg-gray-200"
              }`}
              onPress={() => setCategoryFilter("")}
            >
              <Text className={isDarkColorScheme ? "text-white" : "text-black"}>
                Tất cả danh mục
              </Text>
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 120 }} className="mb-2">
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  className={`p-2 rounded mb-1 ${
                    categoryFilter === category.value
                      ? isDarkColorScheme
                        ? "bg-orange-800"
                        : "bg-orange-200"
                      : isDarkColorScheme
                      ? "bg-gray-800"
                      : "bg-gray-200"
                  }`}
                  onPress={() => setCategoryFilter(category.value)}
                >
                  <Text
                    className={isDarkColorScheme ? "text-white" : "text-black"}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Price Range */}
          <Text
            className={`text-base mb-2 ${
              isDarkColorScheme ? "text-gray-300" : "text-gray-800"
            }`}
          >
            Khoảng giá
          </Text>
          <View className="flex-row mb-4">
            <TextInput
              className={`flex-1 border rounded-lg p-3 mr-2 ${
                isDarkColorScheme
                  ? "border-gray-700 bg-gray-800 text-white"
                  : "border-gray-300 bg-white text-black"
              }`}
              placeholder="Giá tối thiểu"
              placeholderTextColor={isDarkColorScheme ? "#9CA3AF" : "#6B7280"}
              keyboardType="numeric"
              value={tempPriceRange.min}
              onChangeText={(text) =>
                setTempPriceRange({ ...tempPriceRange, min: text })
              }
            />
            <TextInput
              className={`flex-1 border rounded-lg p-3 ${
                isDarkColorScheme
                  ? "border-gray-700 bg-gray-800 text-white"
                  : "border-gray-300 bg-white text-black"
              }`}
              placeholder="Giá tối đa"
              placeholderTextColor={isDarkColorScheme ? "#9CA3AF" : "#6B7280"}
              keyboardType="numeric"
              value={tempPriceRange.max}
              onChangeText={(text) =>
                setTempPriceRange({ ...tempPriceRange, max: text })
              }
            />
          </View>

          {/* Stock Filter */}
          <Text
            className={`text-base mb-2 ${
              isDarkColorScheme ? "text-gray-300" : "text-gray-800"
            }`}
          >
            Tình trạng hàng
          </Text>
          <View className="flex-row mb-5 flex-wrap">
            <TouchableOpacity
              className={`p-2 rounded mr-2 mb-2 ${
                stockFilter === "all"
                  ? isDarkColorScheme
                    ? "bg-orange-800"
                    : "bg-orange-200"
                  : isDarkColorScheme
                  ? "bg-gray-800"
                  : "bg-gray-200"
              }`}
              onPress={() => setStockFilter("all")}
            >
              <Text className={isDarkColorScheme ? "text-white" : "text-black"}>
                Tất cả
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`p-2 rounded mr-2 mb-2 ${
                stockFilter === "inStock"
                  ? isDarkColorScheme
                    ? "bg-orange-800"
                    : "bg-orange-200"
                  : isDarkColorScheme
                  ? "bg-gray-800"
                  : "bg-gray-200"
              }`}
              onPress={() => setStockFilter("inStock")}
            >
              <Text className={isDarkColorScheme ? "text-white" : "text-black"}>
                Còn hàng
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`p-2 rounded mr-2 mb-2 ${
                stockFilter === "outOfStock"
                  ? isDarkColorScheme
                    ? "bg-orange-800"
                    : "bg-orange-200"
                  : isDarkColorScheme
                  ? "bg-gray-800"
                  : "bg-gray-200"
              }`}
              onPress={() => setStockFilter("outOfStock")}
            >
              <Text className={isDarkColorScheme ? "text-white" : "text-black"}>
                Hết hàng
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View className="flex-row">
            <TouchableOpacity
              className={`flex-1 p-3 rounded-lg mr-2 ${
                isDarkColorScheme ? "bg-gray-700" : "bg-gray-200"
              }`}
              onPress={resetFilters}
            >
              <Text
                className={`text-center font-semibold ${
                  isDarkColorScheme ? "text-white" : "text-black"
                }`}
              >
                Đặt lại
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 p-3 rounded-lg bg-orange-500"
              onPress={() => {
                applyPriceFilter();
                setShowFilterModal(false);
              }}
            >
              <Text className="text-center font-semibold text-white">
                Áp dụng
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkColorScheme ? "bg-black" : "bg-white"}`}
    >
      <View
        className={`${isDarkColorScheme ? "bg-black" : "bg-orange-500"} p-5`}
      >
        <View className="flex-row items-center">
          <Text className="text-2xl font-bold text-white mb-0">
            Quản lý sản phẩm
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        className="flex-1 p-5"
        keyboardShouldPersistTaps="handled"
      >
        {loading && (
          <ActivityIndicator
            size="large"
            color={isDarkColorScheme ? "#f0883e" : "#d96716"}
            className="py-4"
          />
        )}

        <ProductForm
          newProduct={newProduct}
          setNewProduct={setNewProduct}
          multipleImages={multipleImages}
          setMultipleImages={setMultipleImages}
          categories={categories}
          isDarkColorScheme={isDarkColorScheme}
          selectedColors={selectedColors}
          setSelectedColors={setSelectedColors}
          loading={loading}
          handleAddProduct={handleAddProduct}
          handleUpdateProduct={handleUpdateProduct}
          resetForm={resetForm}
          editingProduct={editingProduct}
        />

        {/* Search and Filter Bar */}
        <View className="mb-4 mt-2">
          <View className="flex-row items-center mb-2">
            <View
              className={`flex-1 flex-row items-center border rounded-lg p-2 mr-2 ${
                isDarkColorScheme
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-300 bg-gray-100"
              }`}
            >
              <Feather
                name="search"
                size={20}
                color={isDarkColorScheme ? "#9CA3AF" : "#6B7280"}
              />
              <TextInput
                className={`flex-1 ml-2 ${
                  isDarkColorScheme ? "text-white" : "text-black"
                }`}
                placeholder="Tìm kiếm sản phẩm..."
                placeholderTextColor={isDarkColorScheme ? "#9CA3AF" : "#6B7280"}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Feather
                    name="x"
                    size={18}
                    color={isDarkColorScheme ? "#9CA3AF" : "#6B7280"}
                  />
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              className={`p-3 rounded-lg ${
                isDarkColorScheme
                  ? categoryFilter ||
                    priceRange.min !== null ||
                    priceRange.max !== null ||
                    stockFilter !== "all"
                    ? "bg-orange-600"
                    : "bg-gray-700"
                  : categoryFilter ||
                    priceRange.min !== null ||
                    priceRange.max !== null ||
                    stockFilter !== "all"
                  ? "bg-orange-500"
                  : "bg-gray-200"
              }`}
              onPress={() => setShowFilterModal(true)}
            >
              <Feather
                name="filter"
                size={20}
                color={
                  isDarkColorScheme
                    ? categoryFilter ||
                      priceRange.min !== null ||
                      priceRange.max !== null ||
                      stockFilter !== "all"
                      ? "white"
                      : "#9CA3AF"
                    : categoryFilter ||
                      priceRange.min !== null ||
                      priceRange.max !== null ||
                      stockFilter !== "all"
                    ? "white"
                    : "#6B7280"
                }
              />
            </TouchableOpacity>
          </View>

          {/* Active Filters Display */}
          {(categoryFilter ||
            priceRange.min !== null ||
            priceRange.max !== null ||
            stockFilter !== "all") && (
            <View className="flex-row flex-wrap mb-2">
              {categoryFilter && (
                <View
                  className={`flex-row items-center rounded-full px-3 py-1 mr-2 mb-1 ${
                    isDarkColorScheme ? "bg-orange-800" : "bg-orange-200"
                  }`}
                >
                  <Text
                    className={isDarkColorScheme ? "text-white" : "text-black"}
                  >
                    {categories.find((c) => c.value === categoryFilter)?.label}
                  </Text>
                  <TouchableOpacity
                    className="ml-1"
                    onPress={() => setCategoryFilter("")}
                  >
                    <Feather
                      name="x"
                      size={14}
                      color={isDarkColorScheme ? "white" : "black"}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {priceRange.min !== null && (
                <View
                  className={`flex-row items-center rounded-full px-3 py-1 mr-2 mb-1 ${
                    isDarkColorScheme ? "bg-orange-800" : "bg-orange-200"
                  }`}
                >
                  <Text
                    className={isDarkColorScheme ? "text-white" : "text-black"}
                  >
                    Từ {priceRange.min} đ
                  </Text>
                  <TouchableOpacity
                    className="ml-1"
                    onPress={() => setPriceRange({ ...priceRange, min: null })}
                  >
                    <Feather
                      name="x"
                      size={14}
                      color={isDarkColorScheme ? "white" : "black"}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {priceRange.max !== null && (
                <View
                  className={`flex-row items-center rounded-full px-3 py-1 mr-2 mb-1 ${
                    isDarkColorScheme ? "bg-orange-800" : "bg-orange-200"
                  }`}
                >
                  <Text
                    className={isDarkColorScheme ? "text-white" : "text-black"}
                  >
                    Đến {priceRange.max} đ
                  </Text>
                  <TouchableOpacity
                    className="ml-1"
                    onPress={() => setPriceRange({ ...priceRange, max: null })}
                  >
                    <Feather
                      name="x"
                      size={14}
                      color={isDarkColorScheme ? "white" : "black"}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {stockFilter !== "all" && (
                <View
                  className={`flex-row items-center rounded-full px-3 py-1 mr-2 mb-1 ${
                    isDarkColorScheme ? "bg-orange-800" : "bg-orange-200"
                  }`}
                >
                  <Text
                    className={isDarkColorScheme ? "text-white" : "text-black"}
                  >
                    {stockFilter === "inStock" ? "Còn hàng" : "Hết hàng"}
                  </Text>
                  <TouchableOpacity
                    className="ml-1"
                    onPress={() => setStockFilter("all")}
                  >
                    <Feather
                      name="x"
                      size={14}
                      color={isDarkColorScheme ? "white" : "black"}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {(categoryFilter ||
                priceRange.min !== null ||
                priceRange.max !== null ||
                stockFilter !== "all") && (
                <TouchableOpacity
                  className={`rounded-full px-3 py-1 mr-2 mb-1 ${
                    isDarkColorScheme ? "bg-gray-700" : "bg-gray-200"
                  }`}
                  onPress={resetFilters}
                >
                  <Text
                    className={isDarkColorScheme ? "text-white" : "text-black"}
                  >
                    Xóa tất cả
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <ProductList
          products={filteredProducts}
          categories={categories}
          isDarkColorScheme={isDarkColorScheme}
          handleEditProduct={handleEditProduct}
          handleDeleteProduct={handleDeleteProduct}
        />
      </ScrollView>

      {renderFilterModal()}
    </SafeAreaView>
  );
};

export default ProductManagementScreen;
