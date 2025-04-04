"use client";

import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  ScrollView,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "~/firebase.config";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { Button } from "~/components/ui/button";
import { useColorScheme } from "~/lib/useColorScheme";
import {
  fetchAccounts,
  uploadImageToCloudinary,
  deleteAccount,
} from "~/service/accounts";
import type { Account } from "~/service/accounts";
import { Moon, Sun } from "lucide-react-native";

export default function ProfileAdminManage() {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [newAccount, setNewAccount] = useState({
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
      const docRef = doc(db, "accounts", account.id);
      const updatedData = {
        displayName: newAccount.displayName,
        email: newAccount.email,
        profileImage: newAccount.profileImage || null,
        role: newAccount.role,
        phone_number: newAccount.phone_number,
        address: newAccount.address,
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
          phone_number: "",
          address: "",
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
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại sau.");

      // Thử phương pháp thay thế nếu phương pháp chính thất bại
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status === "granted") {
          Alert.alert(
            "Thông báo",
            "Đang thử phương pháp thay thế. Bạn có muốn chụp ảnh thay vì chọn từ thư viện?",
            [
              {
                text: "Hủy",
                style: "cancel",
              },
              {
                text: "Đồng ý",
                onPress: async () => {
                  try {
                    const cameraResult = await ImagePicker.launchCameraAsync({
                      allowsEditing: true,
                      aspect: [1, 1],
                      quality: 0.7,
                    });

                    if (!cameraResult.canceled && cameraResult.assets[0]?.uri) {
                      setIsLoading(true);
                      const imageUrl = await uploadImageToCloudinary(
                        cameraResult.assets[0].uri
                      );
                      setNewAccount((prev) => ({
                        ...prev,
                        profileImage: imageUrl,
                      }));
                      if (editingAccount) {
                        setEditingAccount(
                          (prev) => prev && { ...prev, profileImage: imageUrl }
                        );
                      }
                      setIsLoading(false);
                    }
                  } catch (cameraError) {
                    console.error("Lỗi khi chụp ảnh:", cameraError);
                    Alert.alert(
                      "Lỗi",
                      "Không thể chụp ảnh. Vui lòng thử lại sau."
                    );
                  }
                },
              },
            ]
          );
        }
      } catch (fallbackError) {
        console.error("Lỗi khi thử phương pháp thay thế:", fallbackError);
      }
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

  const renderAccountItem = ({ item }: { item: Account }) => (
    <View
      className={`flex-row items-center p-4 rounded-lg mb-2 ${
        isDarkColorScheme ? "bg-black" : "bg-white"
      }`}
      key={item.id}
    >
      <Image
        source={{ uri: item.profileImage || "https://via.placeholder.com/50" }}
        className="w-12 h-12 rounded-full mr-3"
      />
      <View className="flex-1">
        <Text
          className={`text-lg font-semibold ${
            isDarkColorScheme ? "text-gray-100" : "text-gray-800"
          }`}
        >
          {item.displayName}
        </Text>
        <Text
          className={`text-sm ${
            isDarkColorScheme ? "text-gray-300" : "text-gray-600"
          }`}
        >
          {item.email}
        </Text>
        <Text
          className={`text-sm ${
            isDarkColorScheme ? "text-gray-300" : "text-gray-600"
          }`}
        >
          Role: {item.role === 0 ? "Admin" : "User"}
        </Text>
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => handleEdit(item)}
          className="bg-yellow-400 p-2 rounded"
        >
          <Text
            className={`font-bold ${
              isDarkColorScheme ? "text-gray-800" : "text-gray-800"
            }`}
          >
            Sửa
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteAccount(item.id)}
          className={`${
            isDarkColorScheme ? "bg-red-700" : "bg-red-500"
          } p-2 rounded`}
        >
          <Text className="font-bold text-white">Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        {editingAccount && (
          <View
            className={`mb-5 p-4 rounded-lg ${
              isDarkColorScheme ? "bg-black" : "bg-white"
            }`}
          >
            <TextInput
              className={`border rounded-lg p-2 mb-2 ${
                isDarkColorScheme
                  ? "border-gray-600 bg-gray-700 text-white"
                  : "border-orange-200 text-gray-800"
              }`}
              value={newAccount.displayName}
              onChangeText={(text) =>
                setNewAccount({ ...newAccount, displayName: text })
              }
              placeholder="Tên hiển thị"
              placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
            />
            <TextInput
              className={`border rounded-lg p-2 mb-2 ${
                isDarkColorScheme
                  ? "border-gray-600 bg-gray-700 text-white"
                  : "border-orange-200 text-gray-800"
              }`}
              value={newAccount.email}
              onChangeText={(text) =>
                setNewAccount({ ...newAccount, email: text })
              }
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
            />
            <TextInput
              className={`border rounded-lg p-2 mb-2 ${
                isDarkColorScheme
                  ? "border-gray-600 bg-gray-700 text-white"
                  : "border-orange-200 text-gray-800"
              }`}
              value={newAccount.phone_number}
              onChangeText={(text) =>
                setNewAccount({ ...newAccount, phone_number: text })
              }
              placeholder="Số điện thoại"
              keyboardType="phone-pad"
              placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
            />
            <TextInput
              className={`border rounded-lg p-2 mb-2 ${
                isDarkColorScheme
                  ? "border-gray-600 bg-gray-700 text-white"
                  : "border-orange-200 text-gray-800"
              }`}
              value={newAccount.address}
              onChangeText={(text) =>
                setNewAccount({ ...newAccount, address: text })
              }
              placeholder="Địa chỉ"
              placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
            />
            <View className="flex-row items-center  gap-2 mb-2">
              <Text
                className={`text-lg font-semibold ${
                  isDarkColorScheme ? "text-gray-100" : "text-gray-800"
                }`}
              >
                Vai trò
              </Text>
              <TouchableOpacity
                onPress={() => setNewAccount({ ...newAccount, role: 0 })}
                className={`p-2 rounded-lg mr-2 ${
                  newAccount.role === 0
                    ? "bg-orange-500"
                    : isDarkColorScheme
                    ? "bg-gray-700 border border-gray-600"
                    : "bg-gray-200"
                }`}
              >
                <Text
                  className={`font-bold ${
                    newAccount.role === 0
                      ? "text-white"
                      : isDarkColorScheme
                      ? "text-gray-300"
                      : "text-gray-700"
                  }`}
                >
                  Admin
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNewAccount({ ...newAccount, role: 1 })}
                className={`p-2 rounded-lg ${
                  newAccount.role === 1
                    ? "bg-orange-500"
                    : isDarkColorScheme
                    ? "bg-gray-700 border border-gray-600"
                    : "bg-gray-200"
                }`}
              >
                <Text
                  className={`font-bold ${
                    newAccount.role === 1
                      ? "text-white"
                      : isDarkColorScheme
                      ? "text-gray-300"
                      : "text-gray-700"
                  }`}
                >
                  User
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={pickImage}
              className="p-2 rounded-lg bg-orange-500"
            >
              <Text className="font-bold text-white">
                {newAccount.profileImage ? "Thay đổi ảnh" : "Chọn ảnh"}
              </Text>
            </TouchableOpacity>
            {newAccount.profileImage && (
              <Image
                source={{ uri: newAccount.profileImage }}
                className="w-24 h-24 rounded-lg my-2 self-center"
              />
            )}
            <Button
              onPress={() => handleUpdateAccount(editingAccount)}
              disabled={isLoading}
              className="mt-2 p-3 rounded-lg bg-orange-500"
            >
              <Text className="font-bold text-white">
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
                  phone_number: "",
                  address: "",
                });
              }}
              className="mt-2 p-3 rounded-lg bg-red-500"
            >
              <Text className="font-bold text-center text-white">Hủy</Text>
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
