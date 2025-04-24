import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ChatHeaderProps } from "../types";
import { useTranslation } from "react-i18next";

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  showUserList,
  selectedUser,
  totalUnreadCount,
  userName,
  onBackPress,
}) => {
  const { t } = useTranslation();

  return (
    <View className="bg-white dark:bg-black p-4 border-b border-gray-200 flex-row items-center justify-between">
      {!showUserList && selectedUser && (
        <TouchableOpacity onPress={onBackPress} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
      )}
      <View className="flex-row items-center">
        <Text className="text-lg font-semibold text-black dark:text-white">
          {showUserList ? t("chat_list") : userName || t("chat")}
        </Text>
        {showUserList && totalUnreadCount > 0 && (
          <View className="ml-2 bg-red-500 rounded-full px-2 py-1">
            <Text className="text-white text-xs font-bold">
              {totalUnreadCount}
            </Text>
          </View>
        )}
      </View>
      {!showUserList && selectedUser && (
        <TouchableOpacity className="p-2">
          <Ionicons name="ellipsis-vertical" size={24} color="#374151" />
        </TouchableOpacity>
      )}
    </View>
  );
};
