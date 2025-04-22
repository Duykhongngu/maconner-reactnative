"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "~/lib/useColorScheme";
import {
  login,
  getToken,
  getUserRole,
  resetPassword,
  register,
  validateLoginForm,
  validateRegisterForm,
  formatFirebaseError,
} from "~/service/api/auth";

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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();

  const theme = isDarkColorScheme ? themes.dark : themes.light;

  const handleLogin = async () => {
    // Validate form
    const validation = validateLoginForm(email, password);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      const { user, token, userRole } = await login(email, password);
      console.log("Logged In Token:", token);
      console.log("User Role:", userRole);

      const numericRole = userRole !== null ? parseInt(userRole) : -1;

      // Đợi một chút trước khi chuyển hướng
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (numericRole === 0) {
        await router.replace("/Admin/home");
      } else if (numericRole === 1) {
        await router.replace("/user/home");
      } else {
        Alert.alert("Thông báo", "Tài khoản của bạn không có quyền truy cập.");
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.log("Error details:", error);

      let errorMessage = "Đăng nhập thất bại";
      if (error.code) {
        errorMessage = formatFirebaseError(error.code);
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Đăng nhập không thành công", errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    // Validate form
    const validation = validateRegisterForm(
      email,
      password,
      name,
      phoneNumber,
      address
    );
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      await register(email, password, name, phoneNumber, address);

      Alert.alert(
        "Đăng ký thành công",
        "Tài khoản của bạn đã được tạo. Vui lòng đăng nhập để tiếp tục.",
        [
          {
            text: "Đăng nhập ngay",
            onPress: () => {
              setIsRegistering(false);
              setEmail("");
              setPassword("");
              setName("");
              setPhoneNumber("");
              setAddress("");
            },
          },
        ]
      );
      setIsSubmitting(false);
    } catch (error: any) {
      console.log("Error details:", error);

      let errorMessage = "Đăng ký thất bại";
      if (error.code) {
        errorMessage = formatFirebaseError(error.code);
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Đăng ký không thành công", errorMessage);
      setIsSubmitting(false);
    }
  };

  const checkLoginStatus = async () => {
    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const token = await getToken();
      console.log("Token khi khởi động:", token);
      const role = await getUserRole();
      console.log("Vai trò khi khởi động:", role);

      if (token) {
        console.log("Người dùng đã đăng nhập với token hợp lệ.");
        const numericRole = role !== null ? parseInt(role) : -1;

        // Đợi một chút trước khi chuyển hướng
        await new Promise((resolve) => setTimeout(resolve, 300));

        if (numericRole === 0) {
          await router.replace("/Admin/home");
        } else if (numericRole === 1) {
          await router.replace("/user/home");
        } else {
          console.log("Vai trò không hợp lệ.");
          setIsLoading(false);
        }
      } else {
        console.log("Vui lòng đăng nhập.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái đăng nhập:", error);
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!emailForReset.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập email để đặt lại mật khẩu");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForReset)) {
      Alert.alert("Thông báo", "Email không đúng định dạng");
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword(emailForReset);
      Alert.alert(
        "Yêu cầu đã được gửi",
        "Kiểm tra email của bạn để hoàn tất quá trình đặt lại mật khẩu.",
        [
          {
            text: "Đã hiểu",
            onPress: () => {
              setIsResettingPassword(false);
              setEmailForReset("");
            },
          },
        ]
      );
      setIsSubmitting(false);
    } catch (error: any) {
      let errorMessage = "Không thể gửi email đặt lại mật khẩu";
      if (error.code) {
        errorMessage = formatFirebaseError(error.code);
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Yêu cầu không thành công", errorMessage);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      setIsLoading(false);
      setEmail("");
      setPassword("");
      setName("");
      setPhoneNumber("");
      setAddress("");
      setIsRegistering(false);
      setEmailForReset("");
      setIsResettingPassword(false);
    };
  }, []);

  // Reset errors when form type changes
  useEffect(() => {
    setErrors({});
  }, [isRegistering]);

  // Nếu đang loading, chỉ hiển thị loading indicator
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black">
        <View className="flex-1 justify-center items-center">
          <Image
            source={require("~/assets/images/NADlogo.png")}
            style={{ width: 400, height: 400 }}
            resizeMode="contain"
          />
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 justify-center items-center p-5 bg-white dark:bg-black">
            <Image
              source={require("~/assets/images/NADlogo.png")}
              style={{ width: 150, height: 150 }}
              resizeMode="contain"
            />

            <Text className="text-2xl font-bold mb-5 text-black dark:text-white">
              {isRegistering ? "Đăng Ký" : "Đăng Nhập"}
            </Text>

            {isRegistering && (
              <>
                <TextInput
                  className={`w-full border-2 rounded-lg p-2 mb-1 ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  } text-black dark:text-white`}
                  placeholder="Tên hiển thị"
                  placeholderTextColor="gray"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
                {errors.name && (
                  <Text className="text-red-500 text-xs self-start mb-2">
                    {errors.name}
                  </Text>
                )}

                <TextInput
                  className={`w-full border-2 rounded-lg p-2 mb-1 ${
                    errors.phoneNumber ? "border-red-500" : "border-gray-300"
                  } text-black dark:text-white`}
                  placeholder="Số điện thoại"
                  placeholderTextColor="gray"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
                {errors.phoneNumber && (
                  <Text className="text-red-500 text-xs self-start mb-2">
                    {errors.phoneNumber}
                  </Text>
                )}

                <TextInput
                  className={`w-full border-2 rounded-lg p-2 mb-1 ${
                    errors.address ? "border-red-500" : "border-gray-300"
                  } text-black dark:text-white`}
                  placeholder="Địa chỉ"
                  placeholderTextColor="gray"
                  value={address}
                  onChangeText={setAddress}
                />
                {errors.address && (
                  <Text className="text-red-500 text-xs self-start mb-2">
                    {errors.address}
                  </Text>
                )}
              </>
            )}

            <TextInput
              className={`w-full border-2 rounded-lg p-2 mb-1 ${
                errors.email ? "border-red-500" : "border-gray-300"
              } text-black dark:text-white`}
              placeholder="Email"
              placeholderTextColor="gray"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <Text className="text-red-500 text-xs self-start mb-2">
                {errors.email}
              </Text>
            )}

            <TextInput
              className={`w-full border-2 rounded-lg p-2 mb-1 ${
                errors.password ? "border-red-500" : "border-gray-300"
              } text-black dark:text-white`}
              placeholder="Mật khẩu"
              placeholderTextColor="gray"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {errors.password && (
              <Text className="text-red-500 text-xs self-start mb-4">
                {errors.password}
              </Text>
            )}

            <TouchableOpacity
              className={`p-4 rounded-lg w-full ${
                isSubmitting ? "bg-gray-400" : "bg-orange-500"
              } items-center`}
              onPress={isRegistering ? handleRegister : handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-lg font-bold text-white">
                  {isRegistering ? "Đăng Ký" : "Đăng Nhập"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsRegistering(!isRegistering)}
              className="mt-5"
              disabled={isSubmitting}
            >
              <Text className="text-base text-orange-500">
                {isRegistering
                  ? "Đã có tài khoản? Đăng nhập"
                  : "Chưa có tài khoản? Đăng ký"}
              </Text>
            </TouchableOpacity>

            {!isRegistering && (
              <TouchableOpacity
                onPress={() => setIsResettingPassword(true)}
                className="mt-5"
                disabled={isSubmitting}
              >
                <Text className="text-base text-orange-500">
                  Quên mật khẩu?
                </Text>
              </TouchableOpacity>
            )}

            {isResettingPassword && (
              <View className="w-full mt-5">
                <TextInput
                  className="w-full border-2 rounded-lg p-2 mb-4 border-gray-300 text-black dark:text-white"
                  placeholder="Nhập email để đặt lại mật khẩu"
                  placeholderTextColor="gray"
                  value={emailForReset}
                  onChangeText={setEmailForReset}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  className={`p-4 rounded-lg w-full ${
                    isSubmitting ? "bg-gray-400" : "bg-orange-500"
                  } items-center`}
                  onPress={handleResetPassword}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-lg font-bold text-white">
                      Gửi email đặt lại mật khẩu
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsResettingPassword(false)}
                  className="mt-3 items-center"
                  disabled={isSubmitting}
                >
                  <Text className="text-base text-orange-500">
                    Quay lại đăng nhập
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
