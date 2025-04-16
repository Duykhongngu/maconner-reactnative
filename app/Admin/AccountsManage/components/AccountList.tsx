import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Account } from "./types";

interface AccountListProps {
  accounts: Account[];
  isDarkColorScheme: boolean;
  handleEdit: (account: Account) => void;
  handleDeleteAccount: (accountId: string) => void;
}

const AccountList = ({
  accounts,
  isDarkColorScheme,
  handleEdit,
  handleDeleteAccount,
}: AccountListProps) => {
  const renderAccountItem = (item: Account) => (
    <View
      className={`flex-row items-center p-4 rounded-lg mb-2 ${
        isDarkColorScheme ? "bg-black" : "bg-white"
      }`}
      key={item.id}
    >
      <Image
        source={{ uri: item.profileImage || "https://via.placeholder.com/50" }}
        className="w-12 h-12 rounded-full mr-3"
      />
      <View className="flex-1">
        <Text
          className={`text-lg font-semibold ${
            isDarkColorScheme ? "text-gray-100" : "text-gray-800"
          }`}
        >
          {item.displayName}
        </Text>
        <Text
          className={`text-sm ${
            isDarkColorScheme ? "text-gray-300" : "text-gray-600"
          }`}
        >
          {item.email}
        </Text>
        <Text
          className={`text-sm ${
            isDarkColorScheme ? "text-gray-300" : "text-gray-600"
          }`}
        >
          Role: {item.role === 0 ? "Admin" : "User"}
        </Text>
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => handleEdit(item)}
          className="bg-yellow-400 p-2 rounded"
        >
          <Text
            className={`font-bold ${
              isDarkColorScheme ? "text-gray-800" : "text-gray-800"
            }`}
          >
            Sửa
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteAccount(item.id)}
          className={`${
            isDarkColorScheme ? "bg-red-700" : "bg-red-500"
          } p-2 rounded`}
        >
          <Text className="font-bold text-white">Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="mb-5">
      {accounts.length > 0 ? (
        accounts.map((item) => renderAccountItem(item))
      ) : (
        <Text
          className={`text-center py-5 italic ${
            isDarkColorScheme ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Không tìm thấy tài khoản nào
        </Text>
      )}
    </View>
  );
};

export default AccountList;
