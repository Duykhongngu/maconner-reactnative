import { Link } from "expo-router";
import React, { useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";

const imgCozy = require("~/assets/images/CozyGlow.png");
const imgDrinkware = require("~/assets/images/Drinkware.png");
const Glassware = require("~/assets/images/Glassware.png");
const imgCar = require("~/assets/images/CarCharm.png");
const imgNest = require("~/assets/images/CozyNest.png");
const imgSoft = require("~/assets/images/SnugWear.png");

const { width } = Dimensions.get("window");

// Xác định số cột dựa trên kích thước màn hình
const numColumns = width > 1024 ? 6 : width > 768 ? 5 : width > 480 ? 4 : 3;
const iconSize = Math.max(60, Math.min(100, width / (numColumns + 1)));
// Giới hạn iconSize từ 60px đến 100px

const items = [
  { id: 1, link: "/", img: imgCozy, title: "Cozy Glow" },
  { id: 2, link: "/", img: imgDrinkware, title: "Drinkware" },
  { id: 3, link: "/", img: Glassware, title: "Glassware" },
  { id: 4, link: "/", img: imgCar, title: "Car Charm" },
  { id: 5, link: "/", img: imgNest, title: "Cozy Nest" },
  { id: 6, link: "/", img: imgSoft, title: "Soft Ware" },
];

const Background = () => {
  const memoizedItems = useMemo(() => items, [items]);
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {memoizedItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.item, { width: iconSize }]}
          >
            <View
              style={[
                styles.iconWrapper,
                { width: iconSize, height: iconSize },
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
            <Text style={styles.text}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 15,
    flexDirection: "row",
    justifyContent: "center",
  },
  item: {
    alignItems: "center",
    marginRight: 15,
  },
  iconWrapper: {
    borderRadius: 35,
    backgroundColor: "#F5F7FA",
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
    color: "#333",
  },
});

export default Background;
