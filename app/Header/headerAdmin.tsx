"use client";

import { useState, useEffect } from "react";
import Logo from "~/assets/logo.svg";
import { useColorScheme } from "~/lib/useColorScheme";
import {
  Modal,
  View,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import Feather from "react-native-vector-icons/Feather";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import SearchBar from "./search";
import { useOrder } from "../user/Order/OrderContext";
import { auth, db } from "../../firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import { useCart } from "../user/Cart/CartContext";
import { doc, getDoc } from "firebase/firestore";
import { logout } from "~/service/api/auth";

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
  const [userProfile, setUserProfile] = useState<{
    photoURL: string;
    displayName: string;
  } | null>(null);

  useEffect(() => {
    const fetchUserProfile = async (uid: string) => {
      try {
        const userDoc = await getDoc(doc(db, "accounts", uid));
        if (userDoc.exists()) {
          setUserProfile({
            photoURL: userDoc.data().profileImage,
            displayName: userDoc.data().displayName || "Admin",
          });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.uid) {
        fetchUserProfile(currentUser.uid);
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      // Đóng menu profile trước
      setProfileMenuVisible(false);

      // Cleanup tất cả state và listeners
      const cleanupTasks = async () => {
        setUser(null);
        setUserProfile(null);
        setMenuVisible(false);
      };

      // Thực hiện logout và cleanup
      await cleanupTasks();
      await logout();

      // Đợi một chút trước khi chuyển hướng
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Chuyển hướng về trang chủ
      router.push("/");
    } catch (error: any) {
      console.error("Lỗi đăng xuất:", error);
      Alert.alert("Lỗi đăng xuất", error.message);
    }
  };

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      setUser(null);
      setUserProfile(null);
      setMenuVisible(false);
      setProfileMenuVisible(false);
    };
  }, []);

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-row items-center justify-between h-14 w-full">
        <View className="items-start -ml-2.5">
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            className="p-2"
          >
            <Feather name="menu" size={26} color={iconColor} />
          </TouchableOpacity>
        </View>

        <View className="flex-1 items-center justify-center flex-row">
          <TouchableOpacity onPress={() => router.push("/Admin/home")}>
            <Logo width={160} height={30} />
          </TouchableOpacity>
        </View>

        <View className="ml-5 flex-row items-center gap-2">
          <TouchableOpacity
            className="p-2"
            onPress={() =>
              router.push("/Admin/ChatManagement/AdminChatManagement")
            }
          >
            <Feather name="send" size={26} color={iconColor} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setProfileMenuVisible(true)}
            className="p-2"
          >
            <Image
              source={{
                uri: userProfile?.photoURL,
              }}
              className="w-9 h-9 rounded-full bg-gray-200"
            />
          </TouchableOpacity>
        </View>

        {/* Profile Menu Modal */}
        <Modal
          visible={profileMenuVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setProfileMenuVisible(false)}
        >
          <TouchableOpacity
            className="flex-1 bg-black/50 justify-start items-end"
            activeOpacity={1}
            onPress={() => setProfileMenuVisible(false)}
          >
            <View
              className={`bg-white dark:bg-[#1c1c1c] rounded-lg p-2 mt-[60px] mr-4 w-[150px] shadow-lg`}
            >
              <TouchableOpacity
                onPress={() => {
                  setProfileMenuVisible(false);
                  router.push("/Admin/AccountsManage/Accounts");
                }}
              >
                <Text className="text-base font-medium py-2 dark:text-white">
                  {userProfile?.displayName || user?.displayName || "Admin"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout}>
                <Text className="text-base font-medium py-2 dark:text-white">
                  Đăng xuất
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Menu Modal */}
        <Modal visible={menuVisible} transparent animationType="slide">
          <View className={`flex-1 bg-white dark:bg-[#1c1c1c] mr-2.5`}>
            <TouchableOpacity
              className="flex-row items-center p-4"
              onPress={() => setMenuVisible(false)}
            >
              <Ionicons name="chevron-back" size={24} color={iconColor} />
              <Text className="text-lg font-semibold ml-2 dark:text-white">
                Back
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

export default AdminHeader;
