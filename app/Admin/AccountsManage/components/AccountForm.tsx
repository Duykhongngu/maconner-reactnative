import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Switch,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Button } from "~/components/ui/button";
import { Account, NewAccount } from "./types";

interface AccountFormProps {
  newAccount: NewAccount;
  setNewAccount: (account: NewAccount) => void;
  editingAccount: Account | null;
  isLoading: boolean;
  isDarkColorScheme: boolean;
  handleUpdateAccount: (account: Account) => void;
  pickImage: () => Promise<void>;
  resetForm: () => void;
}

const AccountForm = ({
  newAccount,
  setNewAccount,
  editingAccount,
  isLoading,
  isDarkColorScheme,
  handleUpdateAccount,
  pickImage,
  resetForm,
}: AccountFormProps) => {
  if (!editingAccount) {
    return null;
  }

  return (
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
        onChangeText={(text) => setNewAccount({ ...newAccount, email: text })}
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
        onChangeText={(text) => setNewAccount({ ...newAccount, address: text })}
        placeholder="Địa chỉ"
        placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
      />
      <View className="flex-row items-center gap-2 mb-2">
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
        onPress={resetForm}
        className="mt-2 p-3 rounded-lg bg-red-500"
      >
        <Text className="font-bold text-center text-white">Hủy</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AccountForm;
