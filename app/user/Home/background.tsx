"use client";

import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { useColorScheme } from "~/lib/useColorScheme";
import type { Category } from "~/service/categoryProduct";

// Default fallback image if category has no image
const defaultCategoryImage = require("~/assets/images/NADlogo1.png");

const { width } = Dimensions.get("window");

// Xác định số cột dựa trên kích thước màn hình
const numColumns = width > 1024 ? 6 : width > 768 ? 5 : width > 480 ? 4 : 3;
const iconSize = Math.max(60, Math.min(100, width / (numColumns + 1)));
// Giới hạn iconSize từ 60px đến 100px

interface BackgroundProps {
  categories: Category[];
  error: string | null;
}

const Background: React.FC<BackgroundProps> = ({ categories, error }) => {
  const { t } = useTranslation();
  const { isDarkColorScheme } = useColorScheme();
  const router = useRouter();

  if (error || categories.length === 0) {
    return (
      <View
        className={`flex-1 justify-center items-center p-5 ${
          isDarkColorScheme ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <Text
          className={`text-base font-medium ${
            isDarkColorScheme ? "text-gray-200" : "text-gray-800"
          }`}
        >
          {error || t("no_categories")}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkColorScheme ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <View className="flex-1 py-4">
        <Text className="text-xl font-bold text-orange-500 mx-4 mb-3">
          {t("product_categories")}
        </Text>
        <ScrollView
          horizontal={true}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 5 }}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() =>
                router.push({
                  pathname: "/user/Collections/CategoryProducts",
                  params: { categoryId: category.id },
                } as any)
              }
              className={`items-center mr-4 rounded-2xl p-3 ${
                isDarkColorScheme
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              } border shadow-sm`}
              style={{ width: iconSize + 20 }}
              accessibilityLabel={t("view_category", { name: category.name })}
            >
              <View
                className={`rounded-full justify-center items-center mb-2 overflow-hidden ${
                  isDarkColorScheme ? "bg-gray-700" : "bg-gray-100"
                }`}
                style={{ width: iconSize, height: iconSize }}
              >
                <Image
                  source={
                    category.image
                      ? { uri: category.image }
                      : defaultCategoryImage
                  }
                  className="w-4/5 h-4/5"
                  resizeMode="contain"
                  accessibilityLabel={t("category_image", {
                    name: category.name,
                  })}
                />
              </View>
              <Text
                className={`text-sm font-semibold text-center mt-1 ${
                  isDarkColorScheme ? "text-gray-200" : "text-gray-800"
                }`}
                numberOfLines={2}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Background;
