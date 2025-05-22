"use client";

import { useEffect, useState } from "react";
import { View, Text, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "~/firebase.config";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { useColorScheme } from "~/lib/useColorScheme";
import {
  fetchAccounts,
  uploadImageToCloudinary,
  deleteAccount,
  updateAccount,
} from "~/service/accounts";
import { Account, NewAccount } from "./components/types";
import AccountList from "./components/AccountList";
import AccountForm from "./components/AccountForm";

export default function ProfileAdminManage() {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [newAccount, setNewAccount] = useState<NewAccount>({
    displayName: "",
    email: "",
    password: "",
    role: 0,
    profileImage: "",
    phone_number: "",
    address: "",
  });
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const { isDarkColorScheme } = useColorScheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, "accounts", currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === 0) {
          fetchAccountsData();
        } else {
          Alert.alert("Quyền truy cập bị từ chối", "Bạn không phải admin.");
          router.replace("/" as any);
        }
      } else {
        setUser(null);
        router.replace("/" as any);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchAccountsData = () => {
    return fetchAccounts(
      (accountsData) => setAccounts(accountsData),
      (error) => {
        console.error("Error fetching accounts:", error);
        Alert.alert("Lỗi", "Không thể tải danh sách tài khoản.");
      }
    );
  };

  const handleUpdateAccount = async (account: Account) => {
    if (!editingAccount) return;

    if (
      !newAccount.displayName ||
      !newAccount.email ||
      !newAccount.phone_number ||
      !newAccount.address
    ) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    setIsLoading(true);
    try {
      const updatedData = {
        displayName: newAccount.displayName,
        email: newAccount.email,
        profileImage: newAccount.profileImage || null,
        role: newAccount.role,
        phone_number: newAccount.phone_number,
        address: newAccount.address,
      };

      await updateAccount(account.id, updatedData);

      setEditingAccount(null);
      resetForm();
      Alert.alert("Thành công", "Tài khoản đã được cập nhật trong Firestore!");
    } catch (error: any) {
      console.error("Lỗi chi tiết khi cập nhật tài khoản:", error);
      Alert.alert("Lỗi", `Không thể cập nhật tài khoản: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    setIsLoading(true);
    try {
      await deleteAccount(accountId, auth.currentUser);
      Alert.alert("Thành công", "Tài khoản đã được xóa!");
      if (auth.currentUser?.uid === accountId) {
        router.replace("/" as any);
      }
    } catch (error: any) {
      console.error("Lỗi khi xóa tài khoản:", error);
      Alert.alert("Lỗi", `Không thể xóa tài khoản: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Kiểm tra quyền truy cập
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Quyền bị từ chối", "Cần quyền truy cập thư viện ảnh.");
        return;
      }

      // Sử dụng cấu hình cũ hơn cho máy ảo Android
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        // Thêm các tùy chọn này để tương thích với máy ảo cũ hơn
        exif: false,
        base64: false,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setIsLoading(true);
        try {
          const imageUrl = await uploadImageToCloudinary(result.assets[0].uri);
          setNewAccount((prev) => ({ ...prev, profileImage: imageUrl }));
        } catch (error) {
          console.error("Lỗi khi upload ảnh:", error);
          Alert.alert("Lỗi", "Không thể upload ảnh. Vui lòng thử lại.");
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Lỗi khi chọn ảnh:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại sau.");
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setNewAccount({
      displayName: account.displayName,
      email: account.email,
      password: "",
      role: account.role,
      profileImage: account.profileImage || "",
      phone_number: account.phone_number || "",
      address: account.address || "",
    });
  };

  const resetForm = () => {
    setEditingAccount(null);
    setNewAccount({
      displayName: "",
      email: "",
      password: "",
      role: 0,
      profileImage: "",
      phone_number: "",
      address: "",
    });
  };

  if (!user) {
    return (
      <View
        className={`flex-1 justify-center items-center ${
          isDarkColorScheme ? "bg-black" : "bg-white"
        }`}
      >
        <Text
          className={`${isDarkColorScheme ? "text-gray-100" : "text-gray-800"}`}
        >
          Đang tải...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className={`flex-1 ${isDarkColorScheme ? "bg-black" : "bg-white"}`}
    >
      <View
        className={`${isDarkColorScheme ? "bg-black" : "bg-orange-500"} p-5  `}
      >
        <Text className="text-2xl font-bold text-white mb-0">
          Quản Lý Tài Khoản
        </Text>
      </View>

      <View className="p-5">
        <AccountForm
          newAccount={newAccount}
          setNewAccount={setNewAccount}
          editingAccount={editingAccount}
          isLoading={isLoading}
          isDarkColorScheme={isDarkColorScheme}
          handleUpdateAccount={handleUpdateAccount}
          pickImage={pickImage}
          resetForm={resetForm}
        />

        <AccountList
          accounts={accounts}
          isDarkColorScheme={isDarkColorScheme}
          handleEdit={handleEdit}
          handleDeleteAccount={handleDeleteAccount}
        />
      </View>
    </ScrollView>
  );
}
