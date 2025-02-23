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
import { TextInput } from "react-native"; // Sử dụng TextInput từ react-native
import * as ImagePicker from "expo-image-picker";
import { Button } from "~/components/ui/button";
import { useColorScheme } from "~/lib/useColorScheme";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import tĩnh
import { storage } from "~/firebase.config"; // Import tĩnh storage

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
        "Permission Denied",
        "We need camera roll permissions to upload a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.image, // Sử dụng ImagePicker.MediaType.image
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setProfileImage(result.assets[0].uri);
      await uploadProfileImage(result.assets[0].uri);
    }
  };

  const uploadProfileImage = async (uri: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `profileImages/${user.uid}`);
      await uploadBytes(storageRef, blob);
      const photoURL = await getDownloadURL(storageRef);
      await updateProfile(user, { photoURL });
      setProfileImage(photoURL);
      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error: any) {
      Alert.alert(
        "Error",
        `Failed to upload profile picture: ${error.message || error}`
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
          <Text style={[styles.label, { color: textColor }]}>Display Name</Text>
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
          <Text style={[styles.label, { color: textColor }]}>New Password</Text>
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
