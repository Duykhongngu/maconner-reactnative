import { useEffect, useRef, useState } from "react";
import Logo from "~/assets/logo.svg";
import { useColorScheme } from "~/lib/useColorScheme";

import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import {
  CarIcon,
  Carrot,
  ChevronLeft,
  Heart,
  MenuIcon,
  Search,
  SearchIcon,
  ShoppingCart,
  Truck,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
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
  ); // Tính tổng số lượng sản phẩm
  const { orders } = useOrder();
  const totalOrders = orders.length; // Đếm số lượng đơn hàng

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 12,
    right: 12,
  };

  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <View>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <MenuIcon size={26} color={iconColor} />
          </TouchableOpacity>

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
                <ChevronLeft size={26} color={iconColor} />
                <Text style={[styles.backText, { color: iconColor }]}>
                  Back
                </Text>
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
              <TouchableOpacity
                style={styles.overlay}
                onPress={() => setMenuVisible(false)}
              />
            </View>
          </Modal>
        </View>

        <TouchableOpacity onPress={() => router.push("/")}>
          <Logo width={188} height={40} />
        </TouchableOpacity>
        <View style={styles.iconContainer}>
          <View>
            <Button
              variant="ghost"
              size="icon"
              onPress={() => setIsSearchOpen(true)}
            >
              <SearchIcon size={26} color={iconColor} />
            </Button>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/Checkout/OrderStatus" as any)}
          >
            <View>
              <Truck size={28} color={iconColor} />
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalOrders}</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/Cart/CartPages" as any)}
          >
            <View>
              <ShoppingCart size={28} color={iconColor} />
            </View>

            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Modal cho giao diện tìm kiếm */}
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
                <ChevronLeft size={24} color={iconColor} />
                <Text style={{ color: iconColor }}>Cancel</Text>
              </Button>
            </View>

            {/* Nội dung tìm kiếm */}
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
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, // Thêm padding nếu cần
    gap: 15,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-start",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
    paddingVertical: 20,
  },
  darkModal: {
    backgroundColor: "#1c1c1c", // Màu nền cho modal tối
  },
  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  backText: {
    fontSize: 20,
    fontWeight: "600",
    paddingLeft: 10,
  },
  menuItem: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  menuText: {
    fontSize: 20,
    fontWeight: "600",
    paddingHorizontal: 20,
  },
  iconContainer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  cartBadge: {
    position: "absolute",
    backgroundColor: "red",
    borderRadius: 50,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    right: -10,
    top: -10,
  },
  cartBadgeText: {
    color: "white",
    fontWeight: "bold",
  },
  searchModal: {
    flex: 1,
    backgroundColor: "white",
  },
  searchHeader: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchContent: {
    padding: 16,
    flex: 1,
  },
});

export default SiteHeader;
