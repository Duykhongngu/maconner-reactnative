"use client";

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Switch,
  Image,
} from "react-native";
import {
  fetchCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  createTrendingCategory,
  updateTrendingProducts,
  Category as ServiceCategory,
} from "~/service/categoryProduct";
import { Moon, Sun } from "lucide-react-native";
import { useColorScheme } from "~/lib/useColorScheme";
import * as ImagePicker from "expo-image-picker";
import { uploadImage } from "~/service/products";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "~/firebase.config";

interface Category extends ServiceCategory {
  isTrending?: boolean;
  autoUpdate?: boolean;
}

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
  const { isDarkColorScheme, toggleColorScheme } = useColorScheme();

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

  const renderCategory = ({ item }: { item: Category }) => (
    <View
      className={`p-3 border-b ${
        isDarkColorScheme ? "border-amber-800" : "border-orange-200"
      } flex-row justify-between items-center`}
    >
      <View className="flex-row flex-1 pr-2 items-center">
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            className="w-14 h-14 rounded-lg mr-3"
            resizeMode="cover"
          />
        ) : (
          <View className="w-14 h-14 bg-gray-300 rounded-lg mr-3 justify-center items-center">
            <Text className="text-gray-500 font-bold">No IMG</Text>
          </View>
        )}
        <View className="flex-1">
          <Text
            className={`text-lg font-medium ${
              isDarkColorScheme ? "text-gray-100" : "text-gray-800"
            }`}
          >
            {item.name}
          </Text>
          <Text
            className={`${
              isDarkColorScheme ? "text-gray-300" : "text-gray-600"
            } numberOfLines={2}`}
          >
            {item.description}
          </Text>
        </View>
      </View>
      <View className="flex flex-row">
        <TouchableOpacity
          onPress={() => handleEditCategory(item)}
          className="bg-orange-500 py-1.5 px-3 rounded mr-2"
        >
          <Text className="text-white font-medium">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteCategory(item.id)}
          className={`${
            isDarkColorScheme ? "bg-red-700" : "bg-red-500"
          } py-1.5 px-3 rounded`}
        >
          <Text className="text-white font-medium">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
          <View
            className={`${
              isDarkColorScheme ? "bg-black" : "bg-white"
            } rounded-lg p-4 mb-5 shadow`}
          >
            <Text
              className={`text-lg font-medium mb-1 ${
                isDarkColorScheme ? "text-gray-100" : "text-gray-800"
              }`}
            >
              Category Name:
            </Text>
            <TextInput
              placeholder="Enter category name"
              placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
              value={newCategory.name}
              onChangeText={(text) =>
                setNewCategory({ ...newCategory, name: text })
              }
              className={`border ${
                isDarkColorScheme
                  ? "border-gray-600 bg-gray-700 text-white"
                  : "border-orange-200 text-gray-800"
              } p-3 rounded-md mb-4 text-base`}
            />

            <Text
              className={`text-lg font-medium mb-1 ${
                isDarkColorScheme ? "text-gray-100" : "text-gray-800"
              }`}
            >
              Category Description:
            </Text>
            <TextInput
              placeholder="Enter category description"
              placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
              value={newCategory.description}
              onChangeText={(text) =>
                setNewCategory({ ...newCategory, description: text })
              }
              className={`border ${
                isDarkColorScheme
                  ? "border-gray-600 bg-gray-700 text-white"
                  : "border-orange-200 text-gray-800"
              } p-3 rounded-md mb-4 text-base min-h-[80px]`}
              multiline={true}
              numberOfLines={3}
            />

            <Text
              className={`text-lg font-medium mb-1 ${
                isDarkColorScheme ? "text-gray-100" : "text-gray-800"
              }`}
            >
              Category Image:
            </Text>
            <View className="flex-row items-center mb-4">
              <TouchableOpacity
                onPress={pickImage}
                disabled={imageUploading}
                className={`${
                  imageUploading ? "bg-gray-400" : "bg-blue-500"
                } py-2 px-4 rounded mr-3`}
              >
                <Text className="text-white font-medium">
                  {imageUploading ? "Uploading..." : "Choose Image"}
                </Text>
              </TouchableOpacity>
              {newCategory.image ? (
                <Text
                  className={`${
                    isDarkColorScheme ? "text-gray-300" : "text-gray-600"
                  } flex-1`}
                  numberOfLines={1}
                >
                  Image selected
                </Text>
              ) : (
                <Text
                  className={`${
                    isDarkColorScheme ? "text-gray-400" : "text-gray-500"
                  } flex-1`}
                >
                  No image selected
                </Text>
              )}
            </View>

            {newCategory.image ? (
              <View className="mb-4 items-center">
                <Image
                  source={{ uri: newCategory.image }}
                  className="w-40 h-40 rounded-lg"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setNewCategory({ ...newCategory, image: "" })}
                  className="mt-2 bg-red-500 py-1 px-3 rounded"
                >
                  <Text className="text-white">Remove Image</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={
                editingCategory ? handleUpdateCategory : handleAddCategory
              }
              disabled={loading || imageUploading}
              className={`py-3 px-4 rounded-md mb-2 ${
                loading || imageUploading
                  ? "bg-gray-400"
                  : editingCategory
                  ? "bg-orange-400"
                  : "bg-orange-500"
              }`}
            >
              <Text className="text-white text-center font-bold text-lg">
                {loading
                  ? "Loading..."
                  : imageUploading
                  ? "Uploading Image..."
                  : editingCategory
                  ? "Update Category"
                  : "Add Category"}
              </Text>
            </TouchableOpacity>

            {editingCategory && (
              <TouchableOpacity
                onPress={resetForm}
                className={`py-3 px-4 rounded-md ${
                  isDarkColorScheme ? "bg-gray-600" : "bg-gray-200"
                }`}
              >
                <Text
                  className={`${
                    isDarkColorScheme ? "text-gray-200" : "text-gray-700"
                  } text-center font-medium text-lg`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Trending Products Management Section */}
          <View
            className={`${
              isDarkColorScheme ? "bg-black" : "bg-white"
            } rounded-lg p-4 mb-5 shadow`}
          >
            <Text
              className={`text-xl font-bold mb-3 ${
                isDarkColorScheme ? "text-gray-100" : "text-gray-800"
              }`}
            >
              Trending Products Management:
            </Text>

            {!trendingCategory ? (
              <View>
                <Text
                  className={`${
                    isDarkColorScheme ? "text-gray-300" : "text-gray-600"
                  } mb-4`}
                >
                  No trending category found. Create one to automatically
                  display best-selling products.
                </Text>
                <TouchableOpacity
                  onPress={handleCreateTrendingCategory}
                  disabled={loading}
                  className={`py-3 px-4 rounded-md ${
                    loading ? "bg-gray-400" : "bg-blue-500"
                  }`}
                >
                  <Text className="text-white text-center font-bold">
                    {loading ? "Creating..." : "Create Trending Category"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View className="flex-row items-center justify-between mb-4">
                  <Text
                    className={`text-lg font-medium ${
                      isDarkColorScheme ? "text-gray-100" : "text-gray-800"
                    }`}
                  >
                    Auto-update trending products:
                  </Text>
                  <Switch
                    value={isAutoUpdateTrending}
                    onValueChange={toggleAutoUpdateTrending}
                    trackColor={{ false: "#767577", true: "#ff8c00" }}
                    thumbColor={isAutoUpdateTrending ? "#f4f3f4" : "#f4f3f4"}
                  />
                </View>

                <Text
                  className={`${
                    isDarkColorScheme ? "text-gray-300" : "text-gray-600"
                  } mb-4`}
                >
                  {isAutoUpdateTrending
                    ? "Trending products are automatically updated based on purchase frequency."
                    : "Auto-update is disabled. Update trending products manually."}
                </Text>

                <TouchableOpacity
                  onPress={handleUpdateTrendingProducts}
                  disabled={loading}
                  className={`py-3 px-4 rounded-md ${
                    loading ? "bg-gray-400" : "bg-orange-500"
                  }`}
                >
                  <Text className="text-white text-center font-bold">
                    {loading ? "Updating..." : "Update Trending Products Now"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {loading && (
            <View className="items-center py-4">
              <ActivityIndicator size="large" color="#FF8C00" />
            </View>
          )}

          <View
            className={`${
              isDarkColorScheme ? "bg-black" : "bg-white"
            } rounded-lg p-4 mb-5 shadow`}
          >
            <Text
              className={`text-xl font-bold mb-3 ${
                isDarkColorScheme ? "text-gray-100" : "text-gray-800"
              }`}
            >
              All Categories:
            </Text>

            {categories.length === 0 && !loading ? (
              <Text
                className={`text-center py-5 ${
                  isDarkColorScheme ? "text-gray-400" : "text-gray-500"
                } italic`}
              >
                No categories found. Add one to get started.
              </Text>
            ) : (
              <FlatList
                data={categories}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id || Math.random().toString()}
                scrollEnabled={false}
                className="mb-2"
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CategoryProductScreen;
