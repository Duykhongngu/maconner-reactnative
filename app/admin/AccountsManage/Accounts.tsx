"use client";

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  TextInput,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "~/firebase.config";
import { onAuthStateChanged, User, deleteUser } from "firebase/auth";
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { Button } from "~/components/ui/button";
import { useColorScheme } from "~/lib/useColorScheme";

// Định nghĩa các theme
const themes = {
  light: {
    background: "#fff",
    text: "#FF9E80",
    border: "#ccc",
    placeholder: "#666",
    button: "#FF9E80",
    buttonText: "#fff",
    listItem: "#f9f9f9",
  },
  dark: {
    background: "#1c1c1c",
    text: "#FF9E80",
    border: "#333",
    placeholder: "#888",
    button: "#FF9E80",
    buttonText: "#fff",
    listItem: "#2d2d2d",
  },
};

interface Account {
  id: string;
  displayName: string;
  email: string;
  profileImage?: string;
  role: number;
  createdAt: string;
}

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

  // Cấu hình Cloudinary
  const CLOUDINARY_URL =
    "https://api.cloudinary.com/v1_1/dpyzwrsni/image/upload"; // Thay bằng cloud_name của bạn
  const CLOUDINARY_UPLOAD_PRESET = "unsigned_review_preset"; // Thay bằng upload_preset của bạn

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, "accounts", currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === 0) {
          fetchAccounts(currentUser.uid);
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

  const fetchAccounts = async (adminUid: string) => {
    try {
      const q = query(collection(db, "accounts"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const accountsData: Account[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            displayName: doc.data().displayName || "",
            email: doc.data().email || "",
            profileImage: doc.data().profileImage || "",
            role: doc.data().role || 0,
            createdAt: doc.data().createdAt || "",
          }));
          setAccounts(accountsData);
        },
        (error) => {
          console.error("Error fetching accounts:", error);
          Alert.alert("Lỗi", "Không thể tải danh sách tài khoản.");
        }
      );
      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching accounts:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách tài khoản.");
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền bị từ chối",
        "Cần quyền truy cập thư viện ảnh. Vui lòng cấp quyền trong cài đặt."
      );
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
        const imageUrl = await uploadImageToCloudinary(result.assets[0].uri);
        console.log("Ảnh mới được chọn:", imageUrl);
        setNewAccount((prev) => ({ ...prev, profileImage: imageUrl }));
        if (editingAccount) {
          setEditingAccount(
            (prev) => prev && { ...prev, profileImage: imageUrl }
          );
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
    }
  };

  const uploadImageToCloudinary = async (uri: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", {
      uri,
      type: "image/jpeg",
      name: "profile_image.jpg",
    } as any);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      setIsLoading(true);
      const response = await axios.post(CLOUDINARY_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.secure_url;
    } catch (error) {
      console.error("Upload failed:", error);
      Alert.alert("Lỗi", "Không thể upload ảnh lên Cloudinary.");
      throw new Error("Failed to upload image to Cloudinary");
    } finally {
      setIsLoading(false);
    }
  };

  const updateAccount = async (account: Account) => {
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

  const deleteAccount = async (accountId: string) => {
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, "accounts", accountId));
      if (auth.currentUser && auth.currentUser.uid === accountId) {
        await deleteUser(auth.currentUser);
        Alert.alert(
          "Thành công",
          "Tài khoản đã bị xóa khỏi Firestore và Authentication!"
        );
        router.replace("/" as any);
      } else {
        throw new Error(
          "Không thể xóa người dùng trong Authentication từ client. Vui lòng sử dụng Admin SDK trên backend."
        );
      }
    } catch (error: any) {
      console.error("Lỗi chi tiết khi xóa tài khoản:", error);
      Alert.alert(
        "Lỗi",
        error.message ===
          "Không thể xóa người dùng trong Authentication từ client. Vui lòng sử dụng Admin SDK trên backend."
          ? "Chỉ xóa được trong Firestore. Để xóa Authentication, cần cấu hình backend."
          : `Không thể xóa tài khoản: ${error.message}`
      );
    } finally {
      setIsLoading(false);
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
      style={[styles(theme).accountItem, { backgroundColor: theme.listItem }]}
      key={item.id}
    >
      <Image
        source={{ uri: item.profileImage || "https://via.placeholder.com/50" }}
        style={styles(theme).accountAvatar}
      />
      <View style={styles(theme).accountInfo}>
        <Text style={[styles(theme).accountName, { color: theme.text }]}>
          {item.displayName}
        </Text>
        <Text style={[styles(theme).accountEmail, { color: theme.text }]}>
          {item.email}
        </Text>
        <Text style={[styles(theme).accountRole, { color: theme.text }]}>
          Role: {item.role === 0 ? "Admin" : "User"}
        </Text>
      </View>
      <View style={styles(theme).accountActions}>
        <TouchableOpacity
          onPress={() => handleEdit(item)}
          style={[styles(theme).actionButton, { backgroundColor: "#FFD700" }]}
        >
          <Text style={[styles(theme).actionText, { color: theme.text }]}>
            Sửa
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => deleteAccount(item.id)}
          style={[styles(theme).actionButton, { backgroundColor: "#FF4444" }]}
        >
          <Text style={[styles(theme).actionText, { color: theme.buttonText }]}>
            Xóa
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: theme.text }}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles(theme).container}>
        <Text style={[styles(theme).title, { color: theme.text }]}>
          Quản Lý Tài Khoản
        </Text>

        {editingAccount && (
          <View
            style={[
              styles(theme).formContainer,
              { backgroundColor: theme.listItem },
            ]}
          >
            <TextInput
              style={[
                styles(theme).input,
                { borderColor: theme.border, color: theme.text },
              ]}
              value={newAccount.displayName}
              onChangeText={(text) =>
                setNewAccount({ ...newAccount, displayName: text })
              }
              placeholder="Tên hiển thị"
              placeholderTextColor={theme.placeholder}
            />
            <TextInput
              style={[
                styles(theme).input,
                { borderColor: theme.border, color: theme.text },
              ]}
              value={newAccount.email}
              onChangeText={(text) =>
                setNewAccount({ ...newAccount, email: text })
              }
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={theme.placeholder}
            />
            <View style={styles(theme).roleContainer}>
              <Text style={[styles(theme).label, { color: theme.text }]}>
                Vai trò
              </Text>
              <TouchableOpacity
                onPress={() => setNewAccount({ ...newAccount, role: 0 })}
                style={[
                  styles(theme).roleButton,
                  {
                    backgroundColor:
                      newAccount.role === 0 ? theme.button : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles(theme).roleText,
                    {
                      color:
                        newAccount.role === 0 ? theme.buttonText : theme.text,
                    },
                  ]}
                >
                  Admin
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNewAccount({ ...newAccount, role: 1 })}
                style={[
                  styles(theme).roleButton,
                  {
                    backgroundColor:
                      newAccount.role === 1 ? theme.button : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles(theme).roleText,
                    {
                      color:
                        newAccount.role === 1 ? theme.buttonText : theme.text,
                    },
                  ]}
                >
                  User
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={pickImage}
              style={[
                styles(theme).imageButton,
                { backgroundColor: theme.button },
              ]}
            >
              <Text
                style={[
                  styles(theme).imageButtonText,
                  { color: theme.buttonText },
                ]}
              >
                {newAccount.profileImage ? "Thay đổi ảnh" : "Chọn ảnh"}
              </Text>
            </TouchableOpacity>
            {newAccount.profileImage && (
              <Image
                source={{ uri: newAccount.profileImage }}
                style={styles(theme).previewImage}
              />
            )}
            <Button
              onPress={() => updateAccount(editingAccount)}
              disabled={isLoading}
              style={[styles(theme).button, { backgroundColor: theme.button }]}
            >
              <Text
                style={[styles(theme).buttonText, { color: theme.buttonText }]}
              >
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
              style={[
                styles(theme).cancelButton,
                { backgroundColor: "#FF4444" },
              ]}
            >
              <Text
                style={[styles(theme).buttonText, { color: theme.buttonText }]}
              >
                Hủy
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles(theme).list}>
          <View style={{ height: 10 }} />
          {accounts.map((item) => renderAccountItem({ item }))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = (theme: typeof themes.light) =>
  StyleSheet.create({
    container: {
      padding: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
    },
    formContainer: {
      marginBottom: 20,
      padding: 15,
      borderRadius: 8,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
      marginBottom: 10,
      fontSize: 16,
    },
    roleContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      marginRight: 10,
    },
    roleButton: {
      padding: 8,
      borderRadius: 5,
      marginRight: 10,
    },
    roleText: {
      fontSize: 14,
    },
    imageButton: {
      padding: 10,
      borderRadius: 8,
      marginBottom: 10,
      alignItems: "center",
    },
    imageButtonText: {
      fontSize: 16,
      fontWeight: "bold",
    },
    previewImage: {
      width: 100,
      height: 100,
      borderRadius: 8,
      marginBottom: 10,
    },
    list: {},
    accountItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      borderRadius: 8,
      marginBottom: 10,
    },
    accountAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 10,
    },
    accountInfo: {
      flex: 1,
    },
    accountName: {
      fontSize: 16,
      fontWeight: "600",
    },
    accountEmail: {
      fontSize: 14,
      color: "#666",
    },
    accountRole: {
      fontSize: 14,
    },
    accountActions: {
      flexDirection: "row",
      gap: 5,
    },
    actionButton: {
      padding: 8,
      borderRadius: 5,
    },
    actionText: {
      fontSize: 14,
      fontWeight: "bold",
    },
    button: {
      marginTop: 10,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "bold",
    },
    cancelButton: {
      marginTop: 10,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
    },
  });
