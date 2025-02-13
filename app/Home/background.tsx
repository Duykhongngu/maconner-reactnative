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
  SectionList,
} from "react-native";

const imgCozy = require("~/assets/images/CozyGlow.png");
const imgDrinkware = require("~/assets/images/Drinkware.png");
const Glassware = require("~/assets/images/Glassware.png");
const imgCar = require("~/assets/images/CarCharm.png");
const imgNest = require("~/assets/images/CozyNest.png");
const imgSoft = require("~/assets/images/SnugWear.png");

const { width } = Dimensions.get("window");

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
        {items.map((item) => (
          <TouchableOpacity key={item.id} style={styles.item}>
            <View style={styles.iconWrapper}>
              <Image
                source={item.img}
                style={styles.icon}
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
  },
  item: {
    alignItems: "center",
    marginRight: 20,
  },
  iconWrapper: {
    width: 80,
    height: 80,
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
