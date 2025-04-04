"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "~/firebase.config";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { useColorScheme } from "~/lib/useColorScheme";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  login,
  getToken,
  getUserRole,
  resetPassword,
} from "~/service/api/auth"; // Đảm bảo đường dẫn đúng

const themes = {
  light: {
    background: "#fff",
    text: "#000",
    border: "#ccc",
    placeholder: "#666",
    button: "#FF6B00",
    buttonText: "#fff",
    link: "#FF6B00",
  },
  dark: {
    background: "#1c1c1c",
    text: "#fff",
    border: "#333",
    placeholder: "#888",
    button: "#FF6B00",
    buttonText: "#fff",
    link: "#FF6B00",
  },
};

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [emailForReset, setEmailForReset] = useState<string>("");
  const [isResettingPassword, setIsResettingPassword] =
    useState<boolean>(false);
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();

  const theme = isDarkColorScheme ? themes.dark : themes.light;

  const handleLogin = async () => {
    try {
      const { user, token, userRole } = await login(email, password);
      console.log("Logged In Token:", token);
      console.log("User Role:", userRole);

      // Điều hướng dựa trên vai trò
      const numericRole = userRole !== null ? parseInt(userRole) : -1;
      if (numericRole === 0) {
        router.replace("/admin/home" as any);
      } else if (numericRole === 1) {
        router.replace("/user/home" as any);
      } else {
        Alert.alert("Lỗi", "Vai trò không hợp lệ.");
      }
    } catch (error: any) {
      Alert.alert("Đăng nhập thất bại", error.message);
      console.log("Error details:", error);
    }
  };

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Lưu thông tin người dùng vào Firestore
      await setDoc(doc(db, "accounts", user.uid), {
        email: email,
        displayName: name,
        phone_number: phoneNumber,
        address: address,
        role: 1, // Vai trò mặc định là user
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Thành công", "Tài khoản user đã được tạo!");
      setIsRegistering(false);
      setEmail("");
      setPassword("");
      setName("");
      setPhoneNumber("");
      setAddress("");
    } catch (error: any) {
      Alert.alert("Đăng ký thất bại", error.message);
      console.log("Error details:", error);
    }
  };

  const checkLoginStatus = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Thêm thời gian chờ 2 giây
      const token = await getToken(); // Lấy token từ AsyncStorage
      console.log("Token khi khởi động:", token); // Log token khi khởi động
      const role = await getUserRole(); // Lấy vai trò từ AsyncStorage
      console.log("Vai trò khi khởi động:", role); // Log vai trò khi khởi động

      if (token) {
        console.log("Người dùng đã đăng nhập với token hợp lệ.");
        // Điều hướng dựa trên vai trò
        const numericRole = role !== null ? parseInt(role) : -1;
        if (numericRole === 0) {
          router.replace("/admin/home"); // Điều hướng đến trang admin
        } else if (numericRole === 1) {
          router.replace("/user/home"); // Điều hướng đến trang người dùng
        } else {
          console.log("Vai trò không hợp lệ.");
        }
      } else {
        console.log("Vui lòng đăng nhập.");
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái đăng nhập:", error);
    }
  };

  const handleResetPassword = async () => {
    try {
      await resetPassword(emailForReset);
      Alert.alert("Thành công", "Email đặt lại mật khẩu đã được gửi!");
      setIsResettingPassword(false);
      setEmailForReset("");
    } catch (error: any) {
      Alert.alert("Lỗi", error.message);
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center p-5 bg-white">
        <Text className="text-2xl font-bold mb-5 text-black">
          {isRegistering ? "Đăng Ký" : "Đăng Nhập"}
        </Text>

        {isRegistering && (
          <>
            <TextInput
              className="w-full border-2 rounded-lg p-2 mb-4 border-gray-300 text-black"
              placeholder="Tên hiển thị (Display Name)"
              placeholderTextColor="gray"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <TextInput
              className="w-full border-2 rounded-lg p-2 mb-4 border-gray-300 text-black"
              placeholder="Số điện thoại"
              placeholderTextColor="gray"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            <TextInput
              className="w-full border-2 rounded-lg p-2 mb-4 border-gray-300 text-black"
              placeholder="Địa chỉ"
              placeholderTextColor="gray"
              value={address}
              onChangeText={setAddress}
            />
          </>
        )}

        <TextInput
          className="w-full border-2 rounded-lg p-2 mb-4 border-gray-300 text-black"
          placeholder="Email"
          placeholderTextColor="gray"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          className="w-full border-2 rounded-lg p-2 mb-4 border-gray-300 text-black"
          placeholder="Mật khẩu"
          placeholderTextColor="gray"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity
          className="p-4 rounded-lg w-full bg-orange-500 items-center"
          onPress={isRegistering ? handleRegister : handleLogin}
        >
          <Text className="text-lg font-bold text-white">
            {isRegistering ? "Đăng Ký" : "Đăng Nhập"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsRegistering(!isRegistering)}
          className="mt-5"
        >
          <Text className="text-base text-orange-500">
            {isRegistering
              ? "Đã có tài khoản? Đăng nhập"
              : "Chưa có tài khoản? Đăng ký"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsResettingPassword(true)}
          className="mt-5"
        >
          <Text className="text-base text-orange-500">Quên mật khẩu?</Text>
        </TouchableOpacity>

        {isResettingPassword && (
          <View className="w-full mt-5">
            <TextInput
              className="w-full border-2 rounded-lg p-2 mb-4 border-gray-300 text-black"
              placeholder="Nhập email để đặt lại mật khẩu"
              placeholderTextColor="gray"
              value={emailForReset}
              onChangeText={setEmailForReset}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              className="p-4 rounded-lg w-full bg-orange-500 items-center"
              onPress={handleResetPassword}
            >
              <Text className="text-lg font-bold text-white ">
                Gửi email đặt lại mật khẩu
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
