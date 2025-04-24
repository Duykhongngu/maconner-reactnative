import React, { useState } from "react";
import { View, Image, Dimensions, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";

interface ProductDetailImageCarouselProps {
  images: string[];
  height?: number;
}

const ProductDetailImageCarousel: React.FC<ProductDetailImageCarouselProps> = ({
  images,
  height = 300,
}) => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const screenWidth = Dimensions.get("window").width;

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const viewSize = event.nativeEvent.layoutMeasurement.width;
    const newIndex = Math.floor(contentOffset / viewSize);
    setActiveIndex(newIndex);
  };

  return (
    <View style={{ height }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {images.map((image, index) => (
          <Image
            key={index}
            source={{ uri: image }}
            style={{
              width: screenWidth,
              height,
              resizeMode: "cover",
            }}
            accessibilityLabel={t("product_image", { index: index + 1 })}
          />
        ))}
      </ScrollView>

      {/* Pagination indicators */}
      <View
        style={{
          flexDirection: "row",
          position: "absolute",
          bottom: 10,
          alignSelf: "center",
        }}
      >
        {images.map((_, index) => (
          <View
            key={index}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: activeIndex === index ? "#F97316" : "#D1D5DB",
              marginHorizontal: 4,
            }}
          />
        ))}
      </View>
    </View>
  );
};
