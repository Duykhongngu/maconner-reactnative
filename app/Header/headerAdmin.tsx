"use client";

import { useState, useEffect } from "react";
import Logo from "~/assets/logo.svg";
import { useColorScheme } from "~/lib/useColorScheme";
import {
  Modal,
  View,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert, // Thêm Alert
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

import { useOrder } from "../user/Checkout/OrderContext";
import { auth } from "~/firebase.config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useCart } from "../user/Cart/CartContext";

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

function AdminHeader() {
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
  const [user, setUser] = useState<any>(null);

  // Theo dõi trạng thái đăng nhập
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log(
        "Auth state changed:",
        currentUser ? "Logged in" : "Logged out"
      );
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Hàm xử lý đăng xuất
  const handleLogout = async () => {
    try {
      setMenuVisible(false); // Close menu first
      console.log("Bắt đầu đăng xuất...");
      await signOut(auth);
      console.log("Đăng xuất thành công");
      setUser(null);

      // Add a small delay before navigation
      setTimeout(() => {
        console.log("Chuyển hướng về trang đăng nhập...");
        router.push("/"); // Use push instead of replace
      }, 100);
    } catch (error: any) {
      console.error("Lỗi khi đăng xuất:", error);
      Alert.alert("Lỗi đăng xuất", error.message);
    }
  };

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
          <TouchableOpacity onPress={() => router.push("/admin/home")}>
            <Logo width={160} height={30} />
          </TouchableOpacity>
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

            {/* Hiển thị tên người dùng hoặc "Sign In" */}
            {user ? (
              <>
                <TouchableOpacity
                  onPress={() => {
                    setMenuVisible(false);
                    setTimeout(() => {
                      router.push("/user/Auth/Profile");
                    }, 100);
                  }}
                >
                  <View style={styles.menuItem}>
                    <Text style={[styles.menuText, { color: iconColor }]}>
                      {user.displayName || "Profile"}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogout}>
                  <View style={styles.menuItem}>
                    <Text style={[styles.menuText, { color: iconColor }]}>
                      Sign Out
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  setTimeout(() => {
                    router.push("/");
                  }, 100);
                }}
              >
                <View style={styles.menuItem}>
                  <Text style={[styles.menuText, { color: iconColor }]}>
                    Sign In
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Danh sách menu hiện tại */}
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
  safeContainer: {
    flexShrink: 1,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
    width: "100%",
  },
  leftSection: {
    alignItems: "flex-start",
    marginLeft: -10,
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
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

export default AdminHeader;
