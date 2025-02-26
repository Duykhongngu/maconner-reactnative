import { Link, useRouter } from "expo-router";
import React, { useMemo } from "react";
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

const imgCozy = require("~/assets/images/CozyGlow.png");
const imgDrinkware = require("~/assets/images/Drinkware.webp");
const Glassware = require("~/assets/images/Glassware.webp");
const imgCar = require("~/assets/images/Car_Charm.webp");
const imgNest = require("~/assets/images/Cozy_Nest.webp");
const imgSoft = require("~/assets/images/SnugWear.webp");

const { width } = Dimensions.get("window");

// Xác định số cột dựa trên kích thước màn hình
const numColumns = width > 1024 ? 6 : width > 768 ? 5 : width > 480 ? 4 : 3;
const iconSize = Math.max(60, Math.min(100, width / (numColumns + 1)));
// Giới hạn iconSize từ 60px đến 100px

const items = [
  { id: 1, link: "NightLight", img: imgCozy, title: "Cozy Glow" },
  {
    id: 2,
    link: "DrinkWare",
    img: imgDrinkware,
    title: "DrinkWare",
  },
  { id: 3, link: "NightLight", img: Glassware, title: "Glassware" },
  { id: 4, link: "NightLight", img: imgCar, title: "Car Charm" },
  { id: 5, link: "NightLight", img: imgNest, title: "Cozy Nest" },
  { id: 6, link: "NightLight", img: imgSoft, title: "Soft Ware" },
];

const Background = () => {
  const { isDarkColorScheme } = useColorScheme();
  const backgroundColor = isDarkColorScheme ? "#1E1E1E" : "#FFFFFF";
  const textColor = isDarkColorScheme ? "#E5E7EB" : "#333";
  const itemBackgroundColor = isDarkColorScheme ? "#2D2D2D" : "#FFFFFF";
  const iconBackgroundColor = isDarkColorScheme ? "#3A3A3A" : "#F5F7FA";

  const memoizedItems = useMemo(() => items ?? [], []);

  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor }]}>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {memoizedItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() =>
                router.push(`/user/Collections/${item.link}` as any)
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
                  source={item.img}
                  style={[
                    styles.icon,
                    { width: iconSize * 0.8, height: iconSize * 0.8 },
                  ]}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.text, { color: textColor }]}>
                {item.title}
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
});

export default Background;
