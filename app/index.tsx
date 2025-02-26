"use client";

import { useState } from "react";
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
import { auth } from "~/firebase.config";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { useColorScheme } from "~/lib/useColorScheme";
import { db } from "~/firebase.config";
import { doc, setDoc, getDoc } from "firebase/firestore";

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
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();

  const theme = isDarkColorScheme ? themes.dark : themes.light;

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "accounts", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role;

        if (userRole === 0) {
          router.replace("/admin/home" as any);
        } else if (userRole === 1) {
          router.replace("/user/home" as any);
        } else {
          Alert.alert("Lỗi", "Role không hợp lệ.");
        }
      } else {
        Alert.alert(
          "Lỗi",
          "Không tìm thấy thông tin người dùng trong Firestore."
        );
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

      await setDoc(doc(db, "accounts", user.uid), {
        email: email,
        displayName: name,
        role: 1,
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Thành công", "Tài khoản user đã được tạo!");
      setIsRegistering(false);
      setEmail("");
      setPassword("");
      setName("");
    } catch (error: any) {
      Alert.alert("Đăng ký thất bại", error.message);
      console.log("Error details:", error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          {isRegistering ? "Đăng Ký" : "Đăng Nhập"}
        </Text>

        {isRegistering && (
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text },
            ]}
            placeholder="Tên hiển thị (Display Name)"
            placeholderTextColor={theme.placeholder}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}

        <TextInput
          style={[
            styles.input,
            { borderColor: theme.border, color: theme.text },
          ]}
          placeholder="Email"
          placeholderTextColor={theme.placeholder}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[
            styles.input,
            { borderColor: theme.border, color: theme.text },
          ]}
          placeholder="Mật khẩu"
          placeholderTextColor={theme.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.button }]}
          onPress={isRegistering ? handleRegister : handleLogin}
        >
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>
            {isRegistering ? "Đăng Ký" : "Đăng Nhập"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsRegistering(!isRegistering)}
          style={styles.switchButton}
        >
          <Text style={[styles.switchText, { color: theme.link }]}>
            {isRegistering
              ? "Đã có tài khoản? Đăng nhập"
              : "Chưa có tài khoản? Đăng ký"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  switchButton: {
    marginTop: 20,
  },
  switchText: {
    fontSize: 14,
  },
});
