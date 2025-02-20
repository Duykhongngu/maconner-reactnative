import { useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native";
import products from "../Data/product";
import { Button } from "~/components/ui/button";
import {
  Car,
  Wine,
  Coffee,
  Beer,
  ShoppingBag,
  Shirt,
} from "lucide-react-native";

const slider = require("~/assets/images/Bottle_Lamp_Collection.png");

interface Category {
  id: number;
  title: string;
  icon: React.ReactNode;
}

interface PetLove {
  id: number;
  title: string;
  subtitle: string;
  image: any;
  buttonText: string;
}

export const petLover = [
  {
    id: 1,
    title: "Bottle Lamp",
    subtitle: "The Glow That Tells Your Story",
    image: slider,
    buttonText: "SHOP ALL",
  },
];
export const contents = [
  { id: 1, title: "For couples" },
  { id: 2, title: "For family" },
  { id: 3, title: "For pet lovers" },
  { id: 4, title: "For loss of loved ones" },
];

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const BottleLamp: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDarkColorScheme = colorScheme === "dark";

  const bgColor = isDarkColorScheme ? "#121212" : "#FFFFFF";
  const textColor = isDarkColorScheme ? "#E5E7EB" : "#1E1E1E";
  const cardBgColor = isDarkColorScheme ? "#1E1E1E" : "#FFFFFF";
  const borderColor = isDarkColorScheme ? "#374151" : "#E5E7EB";

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("dog");
  const flatListRef = useRef<FlatList>(null);

  const renderItem = ({ item }: { item: PetLove }) => (
    <View style={styles.slide}>
      <Image source={item.image} style={styles.image} />
      <View style={styles.textContainer}>
        <Text style={styles.bannerTitle}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>{item.buttonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity style={styles.categoryItem}>
      <View style={styles.categoryIcon}>{item.icon}</View>
      <Text style={styles.categoryTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setActiveIndex(index);
  };

  const renderProducts = () => {
    let displayProducts: typeof products.trendingProducts = [];

    switch (activeTab) {
      case "For couples":
        displayProducts = products.visorClip;
        break;
      case "For family":
        displayProducts = products.trendingProducts.slice(4, 8);
        break;
      case "For pet lovers":
        displayProducts = products.visorClip;
        break;
      case "For loss of loved ones":
        displayProducts = products.trendingProducts.slice(0, 4);
        break;

      default:
        displayProducts = products.visorClip;
        break;
    }

    return (
      <View style={styles.productContainer}>
        {displayProducts.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => router.push(`/Products/${item.id}`)}
            style={[
              styles.productCard,
              { backgroundColor: cardBgColor, borderColor },
            ]}
          >
            <Image
              source={
                typeof item.img === "string" ? { uri: item.img } : item.img
              }
              style={styles.productImage}
            />
            <Text
              style={[styles.productName, { color: textColor }]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            <Text
              style={[styles.productDescription, { color: textColor }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
            <Text style={styles.productPrice}>
              $ {item.price.toFixed(2)} USD
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView>
        <View>
          <FlatList
            ref={flatListRef}
            data={petLover}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
        </View>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.tabContainer}>
            {contents.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.tab,
                  activeTab === item.title && styles.activeTab,
                ]}
                onPress={() => setActiveTab(item.title)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === item.title && styles.activeTabText,
                  ]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <View style={styles.content}>
          {renderProducts()}
          <View style={styles.showMoreContainer}>
            <Button variant="secondary" style={styles.showMoreButton}>
              <Text style={styles.showMoreText}>Shop Now</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  slide: {
    flex: 1,
    width: screenWidth,
    height: screenHeight * 0.5,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    paddingVertical: 10,
  },
  image: {
    flex: 1,
    width: "100%",
    height: "50%",
    resizeMode: "cover",
  },
  textContainer: {
    flex: 1,
    width: "100%",
    height: "50%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffeee2",

    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#E31837",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#333333",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#FF9B3E",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
  },

  bannerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#E31837",
    marginBottom: 8,
  },

  categories: {
    marginTop: 20,
    marginBottom: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 20,
  },
  categoryItem: {
    alignItems: "center",
    width: 80,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    backgroundColor: "#F8FAFC",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 12,
    color: "#1E293B",
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,

    gap: 12,
  },
  scrollContent: {
    paddingHorizontal: 15,
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  activeTab: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  tabText: {
    color: "#64748B",
    fontSize: 14,
  },
  activeTabText: {
    color: "#FFFFFF",
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 20,
  },
  productContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    width: "48%",
  },
  productImage: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    resizeMode: "cover",
  },
  productName: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    height: 40,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F97316",
  },
  showMoreContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  showMoreButton: {
    backgroundColor: "#ccc",
    paddingVertical: 12,

    borderRadius: 25,
    minWidth: 120,
  },
  showMoreText: {
    fontSize: 16,
    fontWeight: "400",
    color: "black",
    textAlign: "center",
  },
});

export default BottleLamp;
