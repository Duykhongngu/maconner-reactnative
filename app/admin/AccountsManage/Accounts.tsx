"use client";

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "~/firebase.config";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { Button } from "~/components/ui/button";
import { useColorScheme } from "~/lib/useColorScheme";
import {
  fetchAccounts,
  uploadImageToCloudinary,
  updateAccount,
  deleteAccount,
} from "~/service/accounts";
import type { Account } from "~/service/accounts";

// Định nghĩa các theme
const themes = {
  light: {
    background: "#fff",
    text: "#000",
    border: "#ccc",
    placeholder: "#666",
    button: "#FF6B00",
    buttonText: "#fff",
    listItem: "#f9f9f9",
  },
  dark: {
    background: "#1c1c1c",
    text: "#fff",
    border: "#333",
    placeholder: "#888",
    button: "#FF6B00",
    buttonText: "#fff",
    listItem: "#2d2d2d",
  },
};

export default function ProfileAdminManage() {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [newAccount, setNewAccount] = useState({
    displayName: "",
    email: "",
    password: "",
    role: 0,
    profileImage: "",
  });
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();

  const theme = isDarkColorScheme ? themes.dark : themes.light;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, "accounts", currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === 0) {
          fetchAccountsData(currentUser.uid);
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

  const fetchAccountsData = async (adminUid: string) => {
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

    if (!newAccount.displayName || !newAccount.email) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ tên hiển thị và email.");
      return;
    }

    setIsLoading(true);
    try {
      const docRef = doc(db, "accounts", account.id);
      const updatedData = {
        displayName: newAccount.displayName,
        email: newAccount.email,
        profileImage: newAccount.profileImage || null,
        role: newAccount.role,
      };
      console.log("Dữ liệu gửi đến Firestore:", updatedData);
      await updateDoc(docRef, updatedData);

      const updatedDoc = await getDoc(docRef);
      console.log("Dữ liệu từ Firestore sau cập nhật:", updatedDoc.data());

      if (updatedDoc.exists()) {
        setEditingAccount(null);
        setNewAccount({
          displayName: "",
          email: "",
          password: "",
          role: 0,
          profileImage: "",
        });
        Alert.alert(
          "Thành công",
          "Tài khoản đã được cập nhật trong Firestore!"
        );
      } else {
        throw new Error("Tài liệu không tồn tại sau khi cập nhật");
      }
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Quyền bị từ chối", "Cần quyền truy cập thư viện ảnh.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setIsLoading(true);
        try {
          const imageUrl = await uploadImageToCloudinary(result.assets[0].uri);
          setNewAccount((prev) => ({ ...prev, profileImage: imageUrl }));
          if (editingAccount) {
            setEditingAccount(
              (prev) => prev && { ...prev, profileImage: imageUrl }
            );
          }
        } catch (error) {
          console.error("Lỗi khi upload ảnh:", error);
          Alert.alert("Lỗi", "Không thể upload ảnh. Vui lòng thử lại.");
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Lỗi khi chọn ảnh:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
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
    });
  };

  const renderAccountItem = ({ item }: { item: Account }) => (
    <View
      className={`flex-row items-center p-4 rounded-lg mb-2 ${theme.listItem}`}
      key={item.id}
    >
      <Image
        source={{ uri: item.profileImage || "https://via.placeholder.com/50" }}
        className="w-12 h-12 rounded-full mr-3"
      />
      <View className="flex-1">
        <Text className={`text-lg font-semibold ${theme.text}`}>
          {item.displayName}
        </Text>
        <Text className={`text-sm ${theme.text}`}>{item.email}</Text>
        <Text className={`text-sm ${theme.text}`}>
          Role: {item.role === 0 ? "Admin" : "User"}
        </Text>
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => handleEdit(item)}
          className="bg-yellow-400 p-2 rounded"
        >
          <Text className={`font-bold ${theme.text}`}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteAccount(item.id)}
          className="bg-red-500 p-2 rounded"
        >
          <Text className={`font-bold ${theme.buttonText}`}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className={`${theme.text}`}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView className={`flex-1 ${theme.background}`}>
      <View className="p-5">
        <Text className={`text-2xl font-bold mb-5 ${theme.text}`}>
          Quản Lý Tài Khoản
        </Text>

        {editingAccount && (
          <View className={`mb-5 p-4 rounded-lg ${theme.listItem}`}>
            <TextInput
              className={`border rounded-lg p-2 mb-2 ${theme.border} ${theme.text}`}
              value={newAccount.displayName}
              onChangeText={(text) =>
                setNewAccount({ ...newAccount, displayName: text })
              }
              placeholder="Tên hiển thị"
              placeholderTextColor={theme.placeholder}
            />
            <TextInput
              className={`border rounded-lg p-2 mb-2 ${theme.border} ${theme.text}`}
              value={newAccount.email}
              onChangeText={(text) =>
                setNewAccount({ ...newAccount, email: text })
              }
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={theme.placeholder}
            />
            <View className="flex-row items-center mb-2">
              <Text className={`text-lg font-semibold ${theme.text}`}>
                Vai trò
              </Text>
              <TouchableOpacity
                onPress={() => setNewAccount({ ...newAccount, role: 0 })}
                className={`p-2 rounded-lg mr-2 ${
                  newAccount.role === 0 ? theme.button : theme.border
                }`}
              >
                <Text
                  className={`font-bold ${
                    newAccount.role === 0 ? theme.buttonText : theme.text
                  }`}
                >
                  Admin
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNewAccount({ ...newAccount, role: 1 })}
                className={`p-2 rounded-lg ${
                  newAccount.role === 1 ? theme.button : theme.border
                }`}
              >
                <Text
                  className={`font-bold ${
                    newAccount.role === 1 ? theme.buttonText : theme.text
                  }`}
                >
                  User
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={pickImage}
              className={`p-2 rounded-lg ${theme.button}`}
            >
              <Text className={`font-bold ${theme.buttonText}`}>
                {newAccount.profileImage ? "Thay đổi ảnh" : "Chọn ảnh"}
              </Text>
            </TouchableOpacity>
            {newAccount.profileImage && (
              <Image
                source={{ uri: newAccount.profileImage }}
                className="w-24 h-24 rounded-lg mb-2"
              />
            )}
            <Button
              onPress={() => handleUpdateAccount(editingAccount)}
              disabled={isLoading}
              className={`mt-2 p-3 rounded-lg ${theme.button}`}
            >
              <Text className={`font-bold ${theme.buttonText}`}>
                {isLoading ? "Đang xử lý..." : "Cập nhật"}
              </Text>
            </Button>
            <TouchableOpacity
              onPress={() => {
                setEditingAccount(null);
                setNewAccount({
                  displayName: "",
                  email: "",
                  password: "",
                  role: 0,
                  profileImage: "",
                });
              }}
              className="mt-2 p-3 rounded-lg bg-red-500"
            >
              <Text className={`font-bold ${theme.buttonText}`}>Hủy</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="mb-5">
          {accounts.map((item) => renderAccountItem({ item }))}
        </View>
      </View>
    </ScrollView>
  );
}
