import React from "react";
import { View, Text, TouchableOpacity, Image, FlatList } from "react-native";
import { Category } from "./types";

interface CategoryListProps {
  categories: Category[];
  isDarkColorScheme: boolean;
  handleEditCategory: (category: Category) => void;
  handleDeleteCategory: (categoryId: string | undefined) => void;
  loading: boolean;
}

const CategoryList = ({
  categories,
  isDarkColorScheme,
  handleEditCategory,
  handleDeleteCategory,
  loading,
}: CategoryListProps) => {
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
  );
};

export default CategoryList;
