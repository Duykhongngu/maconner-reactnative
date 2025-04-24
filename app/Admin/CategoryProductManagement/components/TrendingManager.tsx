import React from "react";
import { View, Text, TouchableOpacity, Switch } from "react-native";
import { Category } from "./types";

interface TrendingManagerProps {
  trendingCategory: Category | null;
  isAutoUpdateTrending: boolean;
  loading: boolean;
  isDarkColorScheme: boolean;
  handleCreateTrendingCategory: () => Promise<void>;
  handleUpdateTrendingProducts: () => Promise<void>;
  toggleAutoUpdateTrending: () => Promise<void>;
}

const TrendingManager = ({
  trendingCategory,
  isAutoUpdateTrending,
  loading,
  isDarkColorScheme,
  handleCreateTrendingCategory,
  handleUpdateTrendingProducts,
  toggleAutoUpdateTrending,
}: TrendingManagerProps) => {
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
        Trending Products Management:
      </Text>

      {!trendingCategory ? (
        <View>
          <Text
            className={`${
              isDarkColorScheme ? "text-gray-300" : "text-gray-600"
            } mb-4`}
          >
            Không có danh mục nào được chỉ định là danh mục sản phẩm thịnh hành.
            {"\n"}Vui lòng tạo một danh mục mới để sử dụng làm danh mục sản phẩm
            thịnh hành.
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
              Tự động cập nhật danh mục thịnh hành:
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
  );
};

export default TrendingManager;
