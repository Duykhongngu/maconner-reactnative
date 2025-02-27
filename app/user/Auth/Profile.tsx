"use client";

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { auth } from "~/firebase.config";
import { signOut, updateProfile, updatePassword, User } from "firebase/auth";
import { TextInput } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Button } from "~/components/ui/button";
import { useColorScheme } from "~/lib/useColorScheme";
import axios from "axios"; // Thêm để gửi request lên Cloudinary
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "~/firebase.config";

// Định nghĩa các theme
const themes = {
  light: {
    background: "#fff",
    text: "#000",
    border: "#ccc",
    placeholder: "#666",
    button: "#FF6B00",
    buttonText: "#fff",
  },
  dark: {
    background: "#1c1c1c",
    text: "#fff",
    border: "#333",
    placeholder: "#888",
    button: "#FF6B00",
    buttonText: "#fff",
  },
};

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();

  const theme = isDarkColorScheme ? themes.dark : themes.light;

  // Cấu hình Cloudinary
  const CLOUDINARY_URL =
    "https://api.cloudinary.com/v1_1/dpyzwrsni/image/upload"; // Thay dpyzwrsni bằng cloud_name của bạn
  const CLOUDINARY_UPLOAD_PRESET = "unsigned_review_preset"; // Thay bằng upload_preset của bạn, đảm bảo ở chế độ Unsigned

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName || "");
        setEmail(currentUser.email || "");
        setProfileImage(currentUser.photoURL || null);
        fetchUserDataFromFirestore(currentUser.uid);
      } else {
        setUser(null);
        setDisplayName("");
        setEmail("");
        setProfileImage(null);
        router.replace("/" as any);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchUserDataFromFirestore = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "accounts", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setDisplayName(userData.displayName || "");
        setProfileImage(userData.profileImage || null);
      } else {
        // Nếu không có dữ liệu trong Firestore, tạo mới
        await saveUserToFirestore(uid);
      }
    } catch (error) {
      console.log("Error fetching user data from Firestore:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin người dùng từ Firestore.");
    }
  };

  const saveUserToFirestore = async (uid: string) => {
    if (!user) return;

    try {
      await setDoc(doc(db, "accounts", uid), {
        displayName: user.displayName || "",
        email: user.email || "",
        profileImage: user.photoURL || null,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.log("Error saving user to Firestore:", error);
      Alert.alert("Lỗi", "Không thể lưu thông tin người dùng vào Firestore.");
    }
  };

  const pickImage = async () => {
    if (!user) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập để cập nhật ảnh.");
      return;
    }

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
        setProfileImage(result.assets[0].uri);
        await uploadProfileImageToCloudinary(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
    }
  };

  const uploadProfileImageToCloudinary = async (
    uri: string
  ): Promise<string> => {
    if (!user) {
      throw new Error("No user authenticated");
    }

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
      const imageUrl = response.data.secure_url;

      // Cập nhật photoURL trong Firebase Authentication
      await updateProfile(user, { photoURL: imageUrl });

      // Cập nhật profileImage trong Firestore
      await updateDoc(doc(db, "accounts", user.uid), {
        profileImage: imageUrl,
      });

      setProfileImage(imageUrl);
      return imageUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      throw new Error(
        "Failed to upload image to Cloudinary: " +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await updateProfile(user, { displayName });
      await updateDoc(doc(db, "accounts", user.uid), {
        displayName: displayName,
        email: user.email, // Giữ email không đổi
        profileImage: profileImage || user.photoURL || null,
      });

      Alert.alert("Thành công", "Hồ sơ đã được cập nhật!");
      setUser({ ...user, displayName });
    } catch (error: any) {
      console.log("Error updating profile:", error);
      Alert.alert("Lỗi", `Cập nhật hồ sơ thất bại: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserPassword = async () => {
    if (!user || !newPassword) return;

    setIsLoading(true);
    try {
      await updatePassword(user, newPassword);
      Alert.alert("Thành công", "Mật khẩu đã được cập nhật!");
      setNewPassword("");
    } catch (error: any) {
      console.log("Error updating password:", error);
      Alert.alert("Lỗi", `Cập nhật mật khẩu thất bại: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/" as any);
  };

  if (!user) {
    return <Text style={{ color: theme.text }}>Đang tải...</Text>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>Hồ Sơ</Text>

        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          <Image
            source={{
              uri: profileImage || "https://via.placeholder.com/150",
            }}
            style={[styles.avatar, { borderColor: theme.button }]}
          />
          <Text style={[styles.changePhotoText, { color: theme.button }]}>
            Thay đổi ảnh
          </Text>
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>
            Tên hiển thị
          </Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text },
            ]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Nhập tên hiển thị"
            placeholderTextColor={theme.placeholder}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text },
            ]}
            value={email}
            editable={false} // Vô hiệu hóa chỉnh sửa
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Nhập email"
            placeholderTextColor={theme.placeholder}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>
            Mật khẩu mới
          </Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text },
            ]}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="Nhập mật khẩu mới"
            placeholderTextColor={theme.placeholder}
          />
        </View>

        <Button
          onPress={updateUserProfile}
          disabled={isLoading}
          style={[styles.button, { backgroundColor: theme.button }]}
        >
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>
            {isLoading ? "Đang cập nhật..." : "Cập nhật hồ sơ"}
          </Text>
        </Button>

        <Button
          onPress={updateUserPassword}
          disabled={isLoading || !newPassword}
          style={[styles.button, { backgroundColor: theme.button }]}
        >
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>
            {isLoading ? "Đang cập nhật..." : "Đổi mật khẩu"}
          </Text>
        </Button>

        <Button
          onPress={handleLogout}
          style={[styles.button, { backgroundColor: "#FF4444" }]}
        >
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>
            Đăng xuất
          </Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  changePhotoText: {
    marginTop: 10,
    fontSize: 16,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
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
});
