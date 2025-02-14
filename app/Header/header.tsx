import React, { useEffect, useRef } from "react";
import Logo from "~/assets/logo.svg";
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
  Carrot,
  ChevronLeft,
  Heart,
  MenuIcon,
  Search,
  SearchIcon,
  ShoppingCart,
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
  const { cartItems } = useCart();
  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  ); // Tính tổng số lượng sản phẩm

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 12,
    right: 12,
  };

  const [menuVisible, setMenuVisible] = React.useState(false);

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <View>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <MenuIcon size={26} color="black" />
          </TouchableOpacity>

          <Modal visible={menuVisible} transparent animationType="slide">
            <View className="flex-1 bg-white p-4">
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => setMenuVisible(false)}
              >
                <ChevronLeft size={26} color="black" />
                <Text className="text-2xl font-semibold  py-2  p-4  ">
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
                  <View className="shadow-sm shadow-foreground/10 flex-row items-center">
                    <Text className="text-2xl font-semibold  py-2  p-4  ">
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

        <TouchableOpacity className="" onPress={() => router.push("/")}>
          {/* <Image source={logo} /> */}
          <Logo width={188} height={40} />
        </TouchableOpacity>
        <View className="flex-row gap-3 items-center">
          <View>
            <Button
              variant="ghost"
              size="icon"
              onPress={() => setIsSearchOpen(true)}
            >
              <SearchIcon size={26} color="black" />
            </Button>
          </View>
          <View>
            <Heart size={26} color="black" />
          </View>
          <TouchableOpacity
            className=""
            onPress={() => router.push("/Cart/CartPages" as any)}
          >
            <View>
              <ShoppingCart size={28} color="black" />
            </View>

            <View className="absolute bg-red-400 flex rounded-full w-6 h-6 -right-2 -top-2 justify-center items-center text-sm">
              <Text className="text-white font-semibold">{totalItems}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Modal cho giao diện tìm kiếm */}
        <Modal visible={isSearchOpen} transparent={true} animationType="slide">
          <View className="flex-1 bg-white">
            <View className="p-4 flex items-center justify-between ">
              <Button
                variant={"ghost"}
                onPress={() => setIsSearchOpen(false)}
                className="flex w-full flex-row justify-start items-center gap-2 text-black"
              >
                <ChevronLeft size={24} color={"black"} />
                <Text>Cancel</Text>
              </Button>
            </View>

            {/* Nội dung tìm kiếm */}
            <View className="p-4 flex-1">
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
  },
  overlay: {
    flex: 1,

    justifyContent: "flex-start",
  },
  menuContainer: {
    width: 280,
    height: "100%",
    backgroundColor: "white",
    paddingVertical: 20,
    position: "absolute",
    left: 0,
    top: 0,
  },
  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
});
export default SiteHeader;
