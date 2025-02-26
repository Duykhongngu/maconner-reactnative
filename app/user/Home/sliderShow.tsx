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
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native";

interface SlideItem {
  id: number;
  title: string;
  subtitle: string;
  image: any;
  buttonText: string;
}

const slider1 = require("~/assets/images/slideShow.png");
const slider = require("~/assets/images/sliderShow.png");

const slides: SlideItem[] = [
  {
    id: 1,
    title: "Mother's Day",
    subtitle: "Make Her Heart Sing with a Gift of Pure Gratitude",
    image: slider,
    buttonText: "SHOP NOW",
  },
  {
    id: 2,
    title: "Special Gifts",
    subtitle: "Unique Presents to Show Your Love",
    image: slider1,
    buttonText: "EXPLORE",
  },
];

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const MothersSlider: React.FC = () => {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const renderItem = ({ item }: { item: SlideItem }) => (
    <View style={styles.slide}>
      {/* Hình ảnh */}
      <Image source={item.image} style={styles.image} />
      {/* Nội dung */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
        <TouchableOpacity
          onPress={() => router.push(`/user/Collections/NightLight` as any)}
          style={styles.button}
        >
          <Text style={styles.buttonText}>{item.buttonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setActiveIndex(index);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
        {/* Phân trang */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === activeIndex ? styles.paginationDotActive : null,
              ]}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    flexDirection: "column",
  },
  slide: {
    flex: 1,
    width: screenWidth,
    height: screenHeight * 0.5,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
  },
  image: {
    width: "100%",
    height: "60%",
    resizeMode: "cover",
  },
  textContainer: {
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
    paddingTop: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  paginationDotActive: {
    backgroundColor: "#FF9B3E",
    width: 24,
  },
});

export default MothersSlider;
