"use client";

import { useState } from "react";
import Logo from "~/assets/logo.svg";
import { useColorScheme } from "~/lib/useColorScheme";

import {
  Modal,
  View,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  MenuIcon,
  SearchIcon,
  ShoppingCart,
  Truck,
} from "lucide-react-native";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import SearchBar from "./search";
import { useCart } from "../Cart/CartContext";
import { useOrder } from "../Checkout/OrderContext";

const logo = require("~/assets/images/logo.png");
const inlineMenu = [
  { title: "Valentine's Day", link: "/Products/[id]" },
  { title: "Occasions", link: "/Products/[id]" },
  { title: "Recipients", link: "/Products/[id]" },
  { title: "Interests", link: "/Products/[id]" },
  { title: "Home & Kitchen", link: "/Products/[id]" },
  { title: "Clothing & Jewelry", link: "/Products/[id]" },
  { title: "Drinkware & Barware", link: "/Products/[id]" },
  { title: "Accessories", link: "/Products/[id]" },
  { title: "Happy Customers", link: "/Products/[id]" },
];

function SiteHeader() {
  const { isDarkColorScheme } = useColorScheme();
  const iconColor = isDarkColorScheme ? "white" : "black";
  const { cartItems } = useCart();
  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const { orders } = useOrder();
  const totalOrders = orders.length;

  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            style={styles.iconButton}
          >
            <MenuIcon size={26} color={iconColor} />
          </TouchableOpacity>
        </View>

        {/* Center Section */}
        <View style={styles.centerSection}>
          <TouchableOpacity onPress={() => router.push("/")}>
            <Logo width={160} height={30} />
          </TouchableOpacity>
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          <View style={styles.iconGroup}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setIsSearchOpen(true)}
            >
              <SearchIcon size={26} color={iconColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/Checkout/OrderStatus" as any)}
            >
              <Truck size={26} color={iconColor} />

              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalOrders}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/Cart/CartPages" as any)}
            >
              <ShoppingCart size={26} color={iconColor} />

              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalItems}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Modal */}
        <Modal visible={menuVisible} transparent animationType="slide">
          <View
            style={[
              styles.modalContainer,
              isDarkColorScheme && styles.darkModal,
            ]}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setMenuVisible(false)}
            >
              <ChevronLeft size={24} color={iconColor} />
              <Text style={[styles.backText, { color: iconColor }]}>Back</Text>
            </TouchableOpacity>

            {inlineMenu.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  router.push(item.link as any);
                  setMenuVisible(false);
                }}
              >
                <View style={styles.menuItem}>
                  <Text style={[styles.menuText, { color: iconColor }]}>
                    {item.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Modal>

        {/* Search Modal */}
        <Modal visible={isSearchOpen} transparent={true} animationType="slide">
          <View
            style={[
              styles.modalContainer,
              isDarkColorScheme && styles.darkModal,
            ]}
          >
            <View style={styles.searchHeader}>
              <Button
                variant={"ghost"}
                onPress={() => setIsSearchOpen(false)}
                style={styles.cancelButton}
              >
                <ChevronLeft size={26} color={iconColor} />
                <Text style={{ color: iconColor }}>Cancel</Text>
              </Button>
            </View>
            <View style={styles.searchContent}>
              <SearchBar />
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {},
  container: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 16,
  },
  leftSection: {
    alignItems: "flex-start",
    marginLeft: -10,
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rightSection: {
    width: 80,
    alignItems: "center",
    justifyContent: "flex-end",
    marginLeft: 14,
  },
  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 4,
  },
  iconButton: {
    padding: 8,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 2,
    backgroundColor: "#ff0000",
    borderRadius: 8,
    minWidth: 17,
    height: 17,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  badgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
    marginRight: 10,
  },
  darkModal: {
    backgroundColor: "#1c1c1c",
  },
  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  backText: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  menuText: {
    fontSize: 16,
    fontWeight: "500",
  },
  searchHeader: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  searchContent: {
    flex: 1,
    padding: 16,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default SiteHeader;
