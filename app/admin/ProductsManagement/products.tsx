"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";

import { useColorScheme } from "~/lib/useColorScheme";
import ProductForm from "./components/ProductForm";
import ProductList from "./components/ProductList";
import { Product, CategoryOption, NewProduct } from "./components/types";

import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "~/service/products";
import { fetchCategories } from "~/service/categoryProduct";

const ProductManagementScreen = () => {
  const [products, setProducts] = useState<Product[]>([]);
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

  // Use NativeWind color scheme
  const { isDarkColorScheme } = useColorScheme();

  useEffect(() => {
    fetchProductsData();
    fetchCategoriesData();
  }, []);

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
        .filter((category) => category.value !== "");
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
    setSelectedColors(product.color || []);
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

        {loading && (
          <ActivityIndicator
            size="large"
            color={isDarkColorScheme ? "#f0883e" : "#d96716"}
            className="py-4"
          />
        )}

        <ProductList
          products={products}
          categories={categories}
          isDarkColorScheme={isDarkColorScheme}
          handleEditProduct={handleEditProduct}
          handleDeleteProduct={handleDeleteProduct}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProductManagementScreen;
