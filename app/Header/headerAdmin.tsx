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
  Alert,
  Image,
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
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      setProfileMenuVisible(false);
      await signOut(auth);
      setUser(null);
      setTimeout(() => {
        router.push("/");
      }, 100);
    } catch (error: any) {
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

        {/* Right Section - User Profile */}
        <View style={styles.rightSection}>
          {user && (
            <TouchableOpacity
              onPress={() => setProfileMenuVisible(true)}
              style={styles.profileButton}
            >
              <Image
                source={{
                  uri: user.photoURL || "https://via.placeholder.com/40",
                }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Menu Modal */}
        <Modal
          visible={profileMenuVisible}
          transparent={true}
          animationType="fade"
          style={[styles.modalContainer, isDarkColorScheme && styles.darkModal]}
          onRequestClose={() => setProfileMenuVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setProfileMenuVisible(false)}
          >
            <View
              style={[
                styles.profileMenuModal,
                isDarkColorScheme && styles.darkModal,
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  setProfileMenuVisible(false);
                  router.push("/admin/AccountsManage/Accounts");
                }}
              >
                <Text style={[styles.menuText, { color: iconColor }]}>
                  {user?.displayName || "Tài khoản"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout}>
                <Text style={[styles.menuText, { color: iconColor }]}>
                  Đăng xuất
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

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
  rightSection: {
    marginLeft: 20,
    alignItems: "center",
  },
  profileButton: {
    padding: 8,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Lớp phủ mờ
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  profileMenuModal: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    marginTop: 60, // Đặt ngay dưới header
    marginRight: 16,
    width: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  darkModal: {
    backgroundColor: "#1c1c1c",
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
    paddingVertical: 8,
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
