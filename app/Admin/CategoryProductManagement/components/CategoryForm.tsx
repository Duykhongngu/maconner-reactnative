import React from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { Category } from "./types";

interface CategoryFormProps {
  newCategory: Category;
  setNewCategory: (category: Category) => void;
  editingCategory: Category | null;
  loading: boolean;
  imageUploading: boolean;
  isDarkColorScheme: boolean;
  handleAddCategory: () => void;
  handleUpdateCategory: () => void;
  resetForm: () => void;
  pickImage: () => Promise<void>;
}

const CategoryForm = ({
  newCategory,
  setNewCategory,
  editingCategory,
  loading,
  imageUploading,
  isDarkColorScheme,
  handleAddCategory,
  handleUpdateCategory,
  resetForm,
  pickImage,
}: CategoryFormProps) => {
  return (
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
        onChangeText={(text) => setNewCategory({ ...newCategory, name: text })}
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
        onPress={editingCategory ? handleUpdateCategory : handleAddCategory}
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
  );
};

export default CategoryForm;
