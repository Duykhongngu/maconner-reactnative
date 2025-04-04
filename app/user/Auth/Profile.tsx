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
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { auth } from "~/firebase.config";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
  updateProfile,
  User,
} from "firebase/auth";
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
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalVisible, setModalVisible] = useState<boolean>(false);
  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
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
        setPhoneNumber(userData.phone_number || "");
        setAddress(userData.address || "");
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
        phone_number: phoneNumber,
        address: address,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.log("Error saving user to Firestore:", error);
      Alert.alert("Lỗi", "Không thể lưu thông tin người dùng vào Firestore.");
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
          setProfileImage(imageUrl);

          if (user) {
            await updateProfile(user, { photoURL: imageUrl });
            await updateDoc(doc(db, "accounts", user.uid), {
              profileImage: imageUrl,
            });
          } else {
            Alert.alert("Lỗi", "Người dùng không hợp lệ.");
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

  const uploadImageToCloudinary = async (uri: string): Promise<string> => {
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
    }
  };

  const updateUserProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await updateProfile(user, { displayName });
      await updateDoc(doc(db, "accounts", user.uid), {
        displayName: displayName,
        email: user.email,
        profileImage: profileImage || user.photoURL || null,
        phone_number: phoneNumber,
        address: address,
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

  const handleChangePassword = async () => {
    if (!user) return;

    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }

    try {
      // Xác thực mật khẩu cũ
      const credential = EmailAuthProvider.credential(
        user.email || "",
        oldPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Cập nhật mật khẩu mới
      await updatePassword(user, newPassword);
      Alert.alert("Thành công", "Mật khẩu đã được cập nhật!");
      setModalVisible(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.log("Error changing password:", error);
      Alert.alert("Lỗi", `Không thể đổi mật khẩu: ${error.message}`);
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
            editable={false}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Nhập email"
            placeholderTextColor={theme.placeholder}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>
            Số điện thoại
          </Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text },
            ]}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Nhập số điện thoại"
            placeholderTextColor={theme.placeholder}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Địa chỉ</Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text },
            ]}
            value={address}
            onChangeText={setAddress}
            placeholder="Nhập địa chỉ"
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
          onPress={() => setModalVisible(true)}
          style={[styles.button, { backgroundColor: theme.button }]}
        >
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>
            Đổi mật khẩu
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

        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Đổi Mật Khẩu</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Mật khẩu cũ"
                secureTextEntry
                value={oldPassword}
                onChangeText={setOldPassword}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Mật khẩu mới"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Xác nhận mật khẩu mới"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <Button
                onPress={handleChangePassword}
                style={[styles.button, { backgroundColor: theme.button }]}
              >
                <Text style={[styles.buttonText, { color: theme.buttonText }]}>
                  Xác nhận
                </Text>
              </Button>
              <Button
                onPress={() => setModalVisible(false)}
                style={[styles.button, { backgroundColor: "#FF4444" }]}
              >
                <Text style={[styles.buttonText, { color: theme.buttonText }]}>
                  Hủy
                </Text>
              </Button>
            </View>
          </View>
        </Modal>
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    width: "100%",
    marginBottom: 15,
  },
});
