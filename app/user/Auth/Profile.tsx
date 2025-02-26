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
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "~/firebase.config";
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

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setDisplayName(currentUser.displayName || "");
      setEmail(currentUser.email || "");
      setProfileImage(currentUser.photoURL || null);
      fetchUserDataFromFirestore(currentUser.uid);
    } else {
      router.replace("/index" as any);
    }
  }, [router]);

  const fetchUserDataFromFirestore = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "accounts", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setDisplayName(userData.displayName || "");
        setProfileImage(userData.profileImage || null);
      }
    } catch (error) {
      console.log("Error fetching user data from Firestore:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin người dùng từ Firestore.");
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

      if (!result.canceled && result.assets[0]?.uri && user) {
        setProfileImage(result.assets[0].uri);
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
    }
  };

  const uploadProfileImage = async (uri: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileRef = ref(storage, `images/${user.uid}/${Date.now()}.jpg`);
      const uploadTask = uploadBytesResumable(fileRef, blob);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          null,
          (error) => reject(error),
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            await updateProfile(user, { photoURL: downloadURL });
            setProfileImage(downloadURL);
            await updateDoc(doc(db, "accounts", user.uid), {
              profileImage: downloadURL,
            });
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.log("Error in uploadProfileImage:", error);
      Alert.alert("Lỗi", "Không thể tải ảnh lên.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await updateProfile(user, { displayName });
      // Xóa phần updateEmail để không cho phép sửa email
      await updateDoc(doc(db, "accounts", user.uid), {
        displayName: displayName,
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
