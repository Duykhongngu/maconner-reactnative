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
import {
  signOut,
  updateProfile,
  updateEmail,
  updatePassword,
  User,
} from "firebase/auth";
import { TextInput } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Button } from "~/components/ui/button";
import { useColorScheme } from "~/lib/useColorScheme";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  uploadBytesResumable,
  getStorage,
} from "firebase/storage";
import { storage } from "~/firebase.config";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const bgColor = isDarkColorScheme ? "#1c1c1c" : "#fff";
  const textColor = isDarkColorScheme ? "#fff" : "#000";
  const borderColor = isDarkColorScheme ? "#333" : "#ccc";

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setDisplayName(currentUser.displayName || "");
      setEmail(currentUser.email || "");
      setProfileImage(currentUser.photoURL || null);
    } else {
      router.replace("/Login");
    }
  }, [router]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Quyền bị từ chối",
        "Chúng tôi cần quyền truy cập thư viện ảnh để tải ảnh hồ sơ."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // Sửa từ "image" thành "images"
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri && user) {
      setProfileImage(result.assets[0].uri);
      await uploadProfileImage(result.assets[0].uri);
    }
  };

  const uploadProfileImage = async (uri: string) => {
    if (!user) {
      Alert.alert(
        "Lỗi",
        "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại."
      );
      return;
    }

    try {
      setIsLoading(true);
      console.log("Bắt đầu tải lên với URI:", uri);

      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(
          `Lấy tệp thất bại với mã trạng thái: ${response.status}`
        );
      }
      const blob = await response.blob();
      console.log("Blob được tạo, kích thước:", blob.size);

      const fileRef = ref(storage, `images/${user.uid}/${Date.now()}.jpg`);
      console.log("Tham chiếu tệp:", fileRef.toString());

      const uploadTask = uploadBytesResumable(fileRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Tải lên được ${progress}%`);
          },
          (error) => {
            console.error(
              "Tải lên thất bại:",
              error.code,
              error.message,
              error
            );
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log("Tải ảnh lên thành công:", downloadURL);
              await updateProfile(user, { photoURL: downloadURL });
              setProfileImage(downloadURL);
              resolve(downloadURL);
            } catch (err) {
              reject(err);
            }
          }
        );
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi không xác định";
      console.error("Lỗi tải lên:", errorMessage, error);
      Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };
  const updateUserProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await updateProfile(user, { displayName });
      if (email && email !== user.email) {
        await updateEmail(user, email);
      }
      Alert.alert("Success", "Profile updated successfully!");
      setUser({ ...user, displayName, email });
    } catch (error: any) {
      Alert.alert(
        "Error",
        `Failed to update profile: ${error.message || error}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserPassword = async () => {
    if (!user || !newPassword) return;

    setIsLoading(true);
    try {
      await updatePassword(user, newPassword);
      Alert.alert("Success", "Password updated successfully!");
      setNewPassword("");
    } catch (error: any) {
      Alert.alert(
        "Error",
        `Failed to update password: ${error.message || error}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/Login");
    } catch (error: any) {
      console.error("Lỗi khi đăng xuất:", error.message || error);
    }
  };

  if (!user) {
    return <Text style={{ color: textColor }}>Loading...</Text>;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: textColor }]}>Profile</Text>

          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            <Image
              source={{
                uri: profileImage || "https://via.placeholder.com/150",
              }}
              style={styles.avatar}
            />
            <Text style={[styles.changePhotoText, { color: textColor }]}>
              Change Photo
            </Text>
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>
              Display Name
            </Text>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter display name"
              placeholderTextColor={isDarkColorScheme ? "#888" : "#666"}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Email</Text>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter email"
              placeholderTextColor={isDarkColorScheme ? "#888" : "#666"}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>
              New Password
            </Text>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="Enter new password"
              placeholderTextColor={isDarkColorScheme ? "#888" : "#666"}
            />
          </View>

          <Button
            onPress={updateUserProfile}
            disabled={isLoading}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Updating..." : "Update Profile"}
            </Text>
          </Button>

          <Button
            onPress={updateUserPassword}
            disabled={isLoading || !newPassword}
            style={[styles.button, { backgroundColor: "#4CAF50" }]}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Updating..." : "Change Password"}
            </Text>
          </Button>

          <Button
            onPress={handleLogout}
            style={[styles.button, { backgroundColor: "#FF4444" }]}
          >
            <Text style={styles.buttonText}>Sign Out</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
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
    borderColor: "#FF6B00",
  },
  changePhotoText: {
    marginTop: 10,
    fontSize: 16,
    color: "#FF6B00",
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
