"use client";

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import {
  fetchCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  createTrendingCategory,
  updateTrendingProducts,
} from "~/service/categoryProduct";
import { useColorScheme } from "~/lib/useColorScheme";
import * as ImagePicker from "expo-image-picker";
import { uploadImage } from "~/service/products";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "~/firebase.config";
import { Category } from "./components/types";
import CategoryForm from "./components/CategoryForm";
import CategoryList from "./components/CategoryList";
import TrendingManager from "./components/TrendingManager";

const CategoryProductScreen = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState<Category>({
    id: "",
    name: "",
    description: "",
    image: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [imageUploading, setImageUploading] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [trendingCategory, setTrendingCategory] = useState<Category | null>(
    null
  );
  const [isAutoUpdateTrending, setIsAutoUpdateTrending] = useState(false);

  // Use NativeWind color scheme
  const { isDarkColorScheme } = useColorScheme();

  useEffect(() => {
    fetchCategoriesData();
    checkTrendingCategory();
  }, []);

  const fetchCategoriesData = async () => {
    setLoading(true);
    try {
      const allCategories = await fetchCategories();
      setCategories(
        allCategories.map((category) => ({
          ...category,
          id: category.id || "",
        }))
      );
    } catch (error) {
      console.error("Error fetching categories:", error);
      Alert.alert("Error", "Failed to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkTrendingCategory = async () => {
    try {
      const allCategories = await fetchCategories();
      const trending = allCategories.find((cat) => cat.name === "Trending");

      if (trending) {
        setTrendingCategory(trending);
        setIsAutoUpdateTrending(trending.autoUpdate || false);
      }
    } catch (error) {
      console.error("Error checking trending category:", error);
    }
  };

  const handleCreateTrendingCategory = async () => {
    try {
      setLoading(true);

      const trendingCat = {
        name: "Trending",
        description: "Products that are currently trending and most popular",
        image: "https://example.com/trending.jpg", // Thay bằng ảnh thực tế
        autoUpdate: true,
      };

      const id = await createTrendingCategory(trendingCat);

      if (id) {
        setTrendingCategory({
          id,
          ...trendingCat,
        });
        setIsAutoUpdateTrending(true);
        await fetchCategoriesData();
        Alert.alert("Success", "Trending category created successfully!");
      }
    } catch (error) {
      console.error("Error creating trending category:", error);
      Alert.alert("Error", "Failed to create trending category");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTrendingProducts = async () => {
    if (!trendingCategory) {
      Alert.alert("Error", "Trending category not found");
      return;
    }

    try {
      setLoading(true);
      await updateTrendingProductsList();
      Alert.alert("Success", "Trending products updated successfully!");
    } catch (error) {
      console.error("Error updating trending products:", error);
      Alert.alert("Error", "Failed to update trending products");
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoUpdateTrending = async () => {
    if (!trendingCategory || !trendingCategory.id) return;

    try {
      setLoading(true);
      const newValue = !isAutoUpdateTrending;
      setIsAutoUpdateTrending(newValue);

      await updateCategory(trendingCategory.id, {
        ...trendingCategory,
        autoUpdate: newValue,
      } as any);

      if (newValue) {
        await updateTrendingProductsList();
      }

      Alert.alert(
        "Success",
        `Auto-update trending products ${
          newValue ? "enabled" : "disabled"
        } successfully!`
      );
    } catch (error) {
      console.error("Error toggling auto-update:", error);
      setIsAutoUpdateTrending(!isAutoUpdateTrending);
      Alert.alert("Error", "Failed to update setting");
    } finally {
      setLoading(false);
    }
  };

  const updateTrendingProductsList = async () => {
    if (!trendingCategory || !trendingCategory.id) return;

    try {
      const productsRef = collection(db, "products");
      const q = query(productsRef, orderBy("purchaseCount", "desc"), limit(20));
      const snapshot = await getDocs(q);

      const topProductIds = snapshot.docs.map((doc) => doc.id);

      await updateTrendingProducts(trendingCategory.id, topProductIds);

      return true;
    } catch (error) {
      console.error("Error updating trending products list:", error);
      throw error;
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) {
      Alert.alert("Missing Information", "Please fill in the category name.");
      return;
    }

    setLoading(true);
    try {
      await addCategory(newCategory);
      await fetchCategoriesData();
      resetForm();
      Alert.alert("Success", "Category added successfully!");
    } catch (error) {
      console.error("Error adding category:", error);
      Alert.alert("Error", "Failed to add category. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({ ...category });
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.id) return;

    if (!newCategory.name) {
      Alert.alert("Missing Information", "Please fill in the category name.");
      return;
    }

    setLoading(true);
    try {
      await updateCategory(editingCategory.id, newCategory);
      await fetchCategoriesData();
      resetForm();
      Alert.alert("Success", "Category updated successfully!");
    } catch (error) {
      console.error("Error updating category:", error);
      Alert.alert("Error", "Failed to update category. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string | undefined) => {
    if (!categoryId) {
      Alert.alert("Error", "Invalid category ID");
      return;
    }

    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this category?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteCategory(categoryId);
              await fetchCategoriesData();
              Alert.alert("Success", "Category deleted successfully!");
            } catch (error) {
              console.error("Error deleting category:", error);
              Alert.alert(
                "Error",
                "Failed to delete category. Please try again."
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
    setNewCategory({ id: "", name: "", description: "", image: "" });
    setEditingCategory(null);
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need camera roll permission to upload images"
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUploading(true);
        try {
          // Upload the image and get the URL
          const downloadURL = await uploadImage(result.assets[0].uri);
          setNewCategory({ ...newCategory, image: downloadURL });
        } catch (error) {
          console.error("Error uploading image:", error);
          Alert.alert(
            "Upload Error",
            "Failed to upload image. Please try again."
          );
        } finally {
          setImageUploading(false);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkColorScheme ? "bg-black" : "bg-orange-50"}`}
    >
      <View
        className={`${
          isDarkColorScheme ? "bg-b" : "bg-orange-500"
        } py-4 px-5 shadow`}
      >
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-white mb-0">
            Category Management
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          <CategoryForm
            newCategory={newCategory}
            setNewCategory={setNewCategory}
            editingCategory={editingCategory}
            loading={loading}
            imageUploading={imageUploading}
            isDarkColorScheme={isDarkColorScheme}
            handleAddCategory={handleAddCategory}
            handleUpdateCategory={handleUpdateCategory}
            resetForm={resetForm}
            pickImage={pickImage}
          />

          <TrendingManager
            trendingCategory={trendingCategory}
            isAutoUpdateTrending={isAutoUpdateTrending}
            loading={loading}
            isDarkColorScheme={isDarkColorScheme}
            handleCreateTrendingCategory={handleCreateTrendingCategory}
            handleUpdateTrendingProducts={handleUpdateTrendingProducts}
            toggleAutoUpdateTrending={toggleAutoUpdateTrending}
          />

          {loading && (
            <View className="items-center py-4">
              <ActivityIndicator size="large" color="#FF8C00" />
            </View>
          )}

          <CategoryList
            categories={categories}
            isDarkColorScheme={isDarkColorScheme}
            handleEditCategory={handleEditCategory}
            handleDeleteCategory={handleDeleteCategory}
            loading={loading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CategoryProductScreen;
