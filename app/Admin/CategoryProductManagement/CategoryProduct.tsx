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
} from "react-native";
import {
  fetchCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "~/service/categoryProduct";

interface Category {
  id: string;
  name: string;
  description: string;
}

const CategoryProductScreen = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState<Category>({
    id: "",
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategoriesData();
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
    if (!editingCategory) return;

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

  const handleDeleteCategory = async (categoryId: string) => {
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
    setNewCategory({ id: "", name: "", description: "" });
    setEditingCategory(null);
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <View className="p-3 border-b border-orange-200 flex-row justify-between items-center">
      <View className="flex-1 pr-2">
        <Text className="text-lg font-medium text-gray-800">{item.name}</Text>
        <Text className="text-gray-600">{item.description}</Text>
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
          className="bg-red-500 py-1.5 px-3 rounded"
        >
          <Text className="text-white font-medium">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-orange-50">
      <View className="bg-orange-500 py-4 px-5 shadow">
        <Text className="text-2xl font-bold text-white text-center">
          Category Management
        </Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          <View className="bg-white rounded-lg p-4 mb-5 shadow">
            <Text className="text-lg font-medium mb-1 text-gray-800">
              Category Name:
            </Text>
            <TextInput
              placeholder="Enter category name"
              value={newCategory.name}
              onChangeText={(text) =>
                setNewCategory({ ...newCategory, name: text })
              }
              className="border border-orange-200 p-3 rounded-md mb-4 text-base"
            />

            <Text className="text-lg font-medium mb-1 text-gray-800">
              Category Description:
            </Text>
            <TextInput
              placeholder="Enter category description"
              value={newCategory.description}
              onChangeText={(text) =>
                setNewCategory({ ...newCategory, description: text })
              }
              className="border border-orange-200 p-3 rounded-md mb-4 text-base min-h-[80px]"
              multiline={true}
              numberOfLines={3}
            />

            <TouchableOpacity
              onPress={
                editingCategory ? handleUpdateCategory : handleAddCategory
              }
              className={`py-3 px-4 rounded-md mb-2 ${
                editingCategory ? "bg-orange-400" : "bg-orange-500"
              }`}
            >
              <Text className="text-white text-center font-bold text-lg">
                {editingCategory ? "Update Category" : "Add Category"}
              </Text>
            </TouchableOpacity>

            {editingCategory && (
              <TouchableOpacity
                onPress={resetForm}
                className="py-3 px-4 rounded-md bg-gray-200"
              >
                <Text className="text-gray-700 text-center font-medium text-lg">
                  Cancel
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {loading && (
            <View className="items-center py-4">
              <ActivityIndicator size="large" color="#FF8C00" />
            </View>
          )}

          <View className="bg-white rounded-lg p-4 mb-5 shadow">
            <Text className="text-xl font-bold mb-3 text-gray-800">
              All Categories:
            </Text>

            {categories.length === 0 && !loading ? (
              <Text className="text-center py-5 text-gray-500 italic">
                No categories found. Add one to get started.
              </Text>
            ) : (
              <FlatList
                data={categories}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id}
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
