import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import { useWindowDimensions } from "react-native";
import { useColorScheme } from "~/lib/useColorScheme";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
  SlidersHorizontal,
} from "lucide-react-native";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "~/firebase.config";
import { doc, getDoc } from "firebase/firestore";

interface Product {
  id: string;
  name: string;
  price: number;
  link: string;
  description: string;
  images?: string[];
}

function CategoryProducts() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isDarkColorScheme } = useColorScheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryName, setCategoryName] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<{
    min: number | null;
    max: number | null;
  }>({ min: null, max: null });
  const [tempPriceRange, setTempPriceRange] = useState<{
    min: string;
    max: string;
  }>({ min: "", max: "" });
  const [sortOption, setSortOption] = useState<string>("default"); // default, price-asc, price-desc
  const [showSortModal, setShowSortModal] = useState<boolean>(false);

  const itemsPerPage = 6;
  const iconColor = isDarkColorScheme ? "white" : "black";

  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      if (!categoryId) {
        setError("Category ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Step 1: Fetch the category details to get the name
        const categoryRef = doc(db, "categories", categoryId);
        const categorySnap = await getDoc(categoryRef);

        if (categorySnap.exists()) {
          const categoryData = categorySnap.data();
          setCategoryName(categoryData.name || "Products");

          // Step 2: Fetch products that belong to this category
          const productsQuery = query(
            collection(db, "products"),
            where("category", "==", categoryId)
          );

          const productsSnap = await getDocs(productsQuery);
          const productsList: Product[] = [];

          productsSnap.forEach((doc) => {
            const data = doc.data();
            productsList.push({
              id: doc.id,
              name: data.name || "",
              price: parseFloat(data.price) || 0,
              link: data.link || "",
              description: data.description || "",
              images: data.images || [],
            });
          });

          setProducts(productsList);
          setFilteredProducts(productsList);
        } else {
          setError("Category not found");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndProducts();
  }, [categoryId]);

  // Apply search and filters
  useEffect(() => {
    let result = [...products];

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    // Apply price range filter
    if (priceRange.min !== null) {
      result = result.filter((item) => item.price >= priceRange.min!);
    }

    if (priceRange.max !== null) {
      result = result.filter((item) => item.price <= priceRange.max!);
    }

    // Apply sorting
    if (sortOption === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(result);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [products, searchQuery, priceRange, sortOption]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFilters = () => {
    setSearchQuery("");
    setPriceRange({ min: null, max: null });
    setTempPriceRange({ min: "", max: "" });
    setSortOption("default");
  };

  const applyPriceFilter = () => {
    const min =
      tempPriceRange.min === "" ? null : parseFloat(tempPriceRange.min);
    const max =
      tempPriceRange.max === "" ? null : parseFloat(tempPriceRange.max);
    setPriceRange({ min, max });
    setShowFilterModal(false);
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-end"
        activeOpacity={1}
        onPress={() => setShowFilterModal(false)}
      >
        <View
          className="bg-white dark:bg-[#1A1A1A] rounded-t-3xl p-5"
          style={{ minHeight: 300 }}
        >
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-lg font-bold dark:text-white">Filters</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <X size={24} color={iconColor} />
            </TouchableOpacity>
          </View>

          <Text className="text-base mb-2 dark:text-gray-300">Price Range</Text>
          <View className="flex-row mb-5">
            <TextInput
              className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg p-3 mr-2 dark:bg-[#2D2D2D] dark:text-white"
              placeholder="Min"
              placeholderTextColor={isDarkColorScheme ? "#9CA3AF" : "#6B7280"}
              keyboardType="numeric"
              value={tempPriceRange.min}
              onChangeText={(text) =>
                setTempPriceRange({ ...tempPriceRange, min: text })
              }
            />
            <TextInput
              className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg p-3 dark:bg-[#2D2D2D] dark:text-white"
              placeholder="Max"
              placeholderTextColor={isDarkColorScheme ? "#9CA3AF" : "#6B7280"}
              keyboardType="numeric"
              value={tempPriceRange.max}
              onChangeText={(text) =>
                setTempPriceRange({ ...tempPriceRange, max: text })
              }
            />
          </View>

          <View className="flex-row justify-between mt-5">
            <TouchableOpacity
              className="bg-gray-200 dark:bg-gray-800 rounded-lg p-3 flex-1 mr-2 items-center"
              onPress={() => {
                setTempPriceRange({ min: "", max: "" });
                setPriceRange({ min: null, max: null });
                setShowFilterModal(false);
              }}
            >
              <Text className="font-semibold dark:text-white">Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-orange-500 rounded-lg p-3 flex-1 items-center"
              onPress={applyPriceFilter}
            >
              <Text className="text-white font-semibold">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowSortModal(false)}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-end"
        activeOpacity={1}
        onPress={() => setShowSortModal(false)}
      >
        <View className="bg-white dark:bg-[#1A1A1A] rounded-t-3xl p-5">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-lg font-bold dark:text-white">Sort By</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <X size={24} color={iconColor} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className={`py-4 border-b border-gray-200 dark:border-gray-700 ${
              sortOption === "default" ? "bg-gray-100 dark:bg-gray-800" : ""
            }`}
            onPress={() => {
              setSortOption("default");
              setShowSortModal(false);
            }}
          >
            <Text className="text-base dark:text-white">Default</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`py-4 border-b border-gray-200 dark:border-gray-700 ${
              sortOption === "price-asc" ? "bg-gray-100 dark:bg-gray-800" : ""
            }`}
            onPress={() => {
              setSortOption("price-asc");
              setShowSortModal(false);
            }}
          >
            <Text className="text-base dark:text-white">
              Price: Low to High
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`py-4 ${
              sortOption === "price-desc" ? "bg-gray-100 dark:bg-gray-800" : ""
            }`}
            onPress={() => {
              setSortOption("price-desc");
              setShowSortModal(false);
            }}
          >
            <Text className="text-base dark:text-white">
              Price: High to Low
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black">
        <View className="flex-1 justify-center items-center h-[400px]">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="mt-3 dark:text-white">Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black">
        <View className="flex-1 justify-center items-center h-[400px]">
          <Text className="dark:text-white mb-4">{error}</Text>
          <TouchableOpacity
            className="bg-orange-500 py-2.5 px-5 rounded-lg"
            onPress={() => router.back()}
          >
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <ScrollView>
        <View className="flex-1 px-4">
          <Text className="text-2xl font-bold text-orange-500 text-center mb-4">
            {categoryName}
          </Text>

          {/* Search and filter bar */}
          <View className="flex-row items-center mb-4">
            <View className="flex-1 flex-row items-center border border-gray-300 dark:border-gray-700 rounded-lg p-2 mr-2 bg-gray-100 dark:bg-[#2D2D2D]">
              <Search
                size={20}
                color={isDarkColorScheme ? "#9CA3AF" : "#6B7280"}
              />
              <TextInput
                className="flex-1 ml-2 dark:text-white text-base"
                placeholder="Search products..."
                placeholderTextColor={isDarkColorScheme ? "#9CA3AF" : "#6B7280"}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X
                    size={18}
                    color={isDarkColorScheme ? "#9CA3AF" : "#6B7280"}
                  />
                </TouchableOpacity>
              ) : null}
            </View>

            <View className="flex-row">
              <TouchableOpacity
                className="p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg mr-1.5"
                onPress={() => setShowFilterModal(true)}
              >
                <Filter
                  size={20}
                  color={isDarkColorScheme ? "#E5E7EB" : "#4B5563"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                className="p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg"
                onPress={() => setShowSortModal(true)}
              >
                <SlidersHorizontal
                  size={20}
                  color={isDarkColorScheme ? "#E5E7EB" : "#4B5563"}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Active filters display */}
          {(searchQuery ||
            priceRange.min !== null ||
            priceRange.max !== null ||
            sortOption !== "default") && (
            <View className="flex-row flex-wrap items-center mb-4">
              <Text className="mr-2 text-sm dark:text-gray-300">
                Active filters:
              </Text>

              {searchQuery ? (
                <View className="bg-orange-500 rounded-full px-2 py-1 flex-row items-center mr-2 mb-1.5">
                  <Text className="text-white text-xs mr-1">{`"${searchQuery}"`}</Text>
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <X size={14} color="white" />
                  </TouchableOpacity>
                </View>
              ) : null}

              {priceRange.min !== null ? (
                <View className="bg-orange-500 rounded-full px-2 py-1 flex-row items-center mr-2 mb-1.5">
                  <Text className="text-white text-xs mr-1">{`Min: $${priceRange.min}`}</Text>
                  <TouchableOpacity
                    onPress={() => setPriceRange({ ...priceRange, min: null })}
                  >
                    <X size={14} color="white" />
                  </TouchableOpacity>
                </View>
              ) : null}

              {priceRange.max !== null ? (
                <View className="bg-orange-500 rounded-full px-2 py-1 flex-row items-center mr-2 mb-1.5">
                  <Text className="text-white text-xs mr-1">{`Max: $${priceRange.max}`}</Text>
                  <TouchableOpacity
                    onPress={() => setPriceRange({ ...priceRange, max: null })}
                  >
                    <X size={14} color="white" />
                  </TouchableOpacity>
                </View>
              ) : null}

              {sortOption !== "default" ? (
                <View className="bg-orange-500 rounded-full px-2 py-1 flex-row items-center mr-2 mb-1.5">
                  <Text className="text-white text-xs mr-1">
                    {sortOption === "price-asc" ? "Low to High" : "High to Low"}
                  </Text>
                  <TouchableOpacity onPress={() => setSortOption("default")}>
                    <X size={14} color="white" />
                  </TouchableOpacity>
                </View>
              ) : null}

              <TouchableOpacity onPress={resetFilters}>
                <Text className="text-orange-500 text-sm">Clear all</Text>
              </TouchableOpacity>
            </View>
          )}

          {products.length > 0 ? (
            <>
              {filteredProducts.length > 0 ? (
                <>
                  <View className="flex-row flex-wrap justify-between">
                    {paginatedProducts.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => router.push(`/user/Products/${item.id}`)}
                        className="w-[48%] mb-4 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-[#1E1E1E] shadow-sm"
                      >
                        <Image
                          source={{
                            uri:
                              item.images && item.images.length > 0
                                ? item.images[0]
                                : item.link,
                          }}
                          className="w-full h-[160px]"
                          resizeMode="cover"
                        />
                        <View className="p-3">
                          <Text
                            className="text-base font-semibold mb-1 dark:text-white"
                            numberOfLines={2}
                          >
                            {item.name}
                          </Text>
                          <Text
                            className="text-sm text-gray-600 dark:text-gray-400 mb-2"
                            numberOfLines={2}
                          >
                            {item.description}
                          </Text>
                          <Text className="text-lg font-bold text-orange-500">
                            ${item.price.toFixed(2)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {totalPages > 1 && (
                    <View className="flex-row justify-center items-center my-6">
                      <TouchableOpacity
                        onPress={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className={`p-2.5 rounded-lg bg-orange-500 ${
                          currentPage === 1 ? "opacity-50" : ""
                        }`}
                      >
                        <ChevronLeft size={24} color="white" />
                      </TouchableOpacity>
                      <Text className="mx-4 text-base dark:text-white">
                        {currentPage} / {totalPages}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className={`p-2.5 rounded-lg bg-orange-500 ${
                          currentPage === totalPages ? "opacity-50" : ""
                        }`}
                      >
                        <ChevronRight size={24} color="white" />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <View className="items-center mt-12">
                  <Text className="text-lg text-center dark:text-white mb-5">
                    No products match your search
                  </Text>
                  <TouchableOpacity
                    className="bg-orange-500 py-2.5 px-5 rounded-lg"
                    onPress={resetFilters}
                  >
                    <Text className="text-white font-medium">
                      Clear Filters
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View className="items-center mt-12">
              <Text className="text-lg text-center dark:text-white mb-5">
                No products available in this category
              </Text>
              <TouchableOpacity
                className="bg-orange-500 py-2.5 px-5 rounded-lg"
                onPress={() => router.back()}
              >
                <Text className="text-white font-medium">Go Back</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {renderFilterModal()}
      {renderSortModal()}
    </SafeAreaView>
  );
}

export default CategoryProducts;
