import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
} from "react-native";
import Background from "./background";
import Trending from "./trending";
import { fetchCategories, Category } from "~/service/categoryProduct";
import { useColorScheme } from "~/lib/useColorScheme";

// import ByProducts from "./byProducts";
// import HappyCustomers from "./HappyCustomer";

// Simple cache for categories
let cachedCategories: Category[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Thời gian tối thiểu hiển thị loading để đảm bảo các component tải đúng cách
const MIN_LOADING_TIME = 1500; // 1.5 seconds

function HomePage() {
  const { isDarkColorScheme } = useColorScheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        // Ghi lại thời điểm bắt đầu tải
        const startTime = Date.now();

        // Check if we have cached categories and if they're still valid
        const now = Date.now();
        let categoriesData: Category[] = [];

        if (cachedCategories && now - lastFetchTime < CACHE_DURATION) {
          categoriesData = cachedCategories;
        } else {
          // Set a timeout to prevent infinite loading
          const timeoutId = setTimeout(() => {
            if (loading) {
              setError("Loading timed out. Please try again.");
              setLoading(false);
            }
          }, 15000); // Increased timeout to 15 seconds

          categoriesData = await fetchCategories();

          // Clear the timeout
          clearTimeout(timeoutId);

          // Sort categories alphabetically by name
          categoriesData.sort((a, b) => a.name.localeCompare(b.name));

          // Update the cache
          cachedCategories = categoriesData;
          lastFetchTime = now;
        }

        setCategories(categoriesData);

        // Tính toán thời gian đã trôi qua
        const elapsedTime = Date.now() - startTime;

        // Nếu thời gian tải nhanh hơn MIN_LOADING_TIME, chờ thêm
        if (elapsedTime < MIN_LOADING_TIME) {
          await new Promise((resolve) =>
            setTimeout(resolve, MIN_LOADING_TIME - elapsedTime)
          );
        }

        // Chờ thêm 500ms sau khi categories đã tải để đảm bảo các component khác có thời gian
        setTimeout(() => {
          setLoading(false);
        }, 500);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError("Failed to load categories");
        setLoading(false);
      }
    };

    loadCategories();

    // Cleanup function
    return () => {
      // Cleanup code if needed
    };
  }, []);

  // Hiển thị màn hình loading
  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          isDarkColorScheme ? styles.darkBackground : styles.lightBackground,
        ]}
      >
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text
          style={[
            styles.loadingText,
            isDarkColorScheme ? styles.darkText : styles.lightText,
          ]}
        >
          Đang tải dữ liệu...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <View>
          <Background categories={categories} error={error} />
        </View>

        <View>
          <Trending />
        </View>
        {/* <View>
          <ShopAll />
        </View>
        <View>
          <CarVisor />
        </View>
        <View>
          <BottleLamp />
        </View>
        <View>
          <Recipient />
        </View>
        <View>
          <ByProducts />
        </View>
      </View>
      <View>
        <HappyCustomers /> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: "center",
  },
  darkBackground: {
    backgroundColor: "#121212",
  },
  lightBackground: {
    backgroundColor: "#f8f9fa",
  },
  darkText: {
    color: "#ffffff",
  },
  lightText: {
    color: "#000000",
  },
});
export default HomePage;
