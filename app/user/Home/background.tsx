import { Link, useRouter } from "expo-router";
import React, { useMemo, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { useColorScheme } from "~/lib/useColorScheme";
import { fetchCategories, Category } from "~/service/categoryProduct";

// Default fallback image if category has no image
const defaultCategoryImage = require("~/assets/images/NADlogo1.png");

const { width } = Dimensions.get("window");

// Xác định số cột dựa trên kích thước màn hình
const numColumns = width > 1024 ? 6 : width > 768 ? 5 : width > 480 ? 4 : 3;
const iconSize = Math.max(60, Math.min(100, width / (numColumns + 1)));
// Giới hạn iconSize từ 60px đến 100px

// Simple cache for categories
let cachedCategories: Category[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface BackgroundProps {
  categories: Category[];
  error: string | null;
}

const Background: React.FC<BackgroundProps> = ({ categories, error }) => {
  const { isDarkColorScheme } = useColorScheme();
  const backgroundColor = isDarkColorScheme ? "#1E1E1E" : "#FFFFFF";
  const textColor = isDarkColorScheme ? "#E5E7EB" : "#333";
  const itemBackgroundColor = isDarkColorScheme ? "#2D2D2D" : "#FFFFFF";
  const iconBackgroundColor = isDarkColorScheme ? "#3A3A3A" : "#F5F7FA";

  const router = useRouter();

  if (error || categories.length === 0) {
    return (
      <View style={[styles.errorContainer, { backgroundColor }]}>
        <Text style={{ color: textColor }}>
          {error || "No categories found"}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor }]}>
        <ScrollView
          horizontal={true}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
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
              style={[
                styles.item,
                { width: iconSize, backgroundColor: itemBackgroundColor },
              ]}
            >
              <View
                style={[
                  styles.iconWrapper,
                  {
                    width: iconSize,
                    height: iconSize,
                    backgroundColor: iconBackgroundColor,
                  },
                ]}
              >
                <Image
                  source={
                    category.image
                      ? { uri: category.image }
                      : defaultCategoryImage
                  }
                  style={[
                    styles.icon,
                    { width: iconSize * 0.8, height: iconSize * 0.8 },
                  ]}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.text, { color: textColor }]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 15,
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  item: {
    alignItems: "center",
    marginRight: 15,
    borderRadius: 15,
  },
  iconWrapper: {
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: "80%",
    height: "80%",
  },
  text: {
    marginTop: 8,
    fontWeight: "bold",
    lineHeight: 20,
    fontSize: 14,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Background;
