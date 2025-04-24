import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { UserListItemProps } from "../types";
import { useTranslation } from "react-i18next";

export const UserListItem: React.FC<UserListItemProps> = ({
  user,
  onSelect,
  formatTime,
}) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={() => onSelect(user.id)}
      className="p-4 border-b border-gray-200 bg-white dark:bg-black"
    >
      <View className="flex-row items-center">
        <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
          {user.profileImage ? (
            <Image
              source={{ uri: user.profileImage }}
              className="w-12 h-12 rounded-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-lg font-semibold text-black dark:text-white">
              {user.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View className="flex-1">
          <View className="flex-row justify-between items-center">
            <Text className="text-base font-semibold text-black dark:text-white">
              {user.name || t("unnamed_user")}
            </Text>
            {user.lastMessageTime && (
              <Text className="text-xs text-gray-500 dark:text-white">
                {formatTime(user.lastMessageTime)}
              </Text>
            )}
          </View>
          {user.lastMessage && (
            <Text className="text-gray-500 text-sm" numberOfLines={1}>
              {user.lastMessage.startsWith("chat_")
                ? t(user.lastMessage)
                : user.lastMessage}
            </Text>
          )}
        </View>
        {user.unreadCount > 0 && (
          <View className="ml-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center">
            <Text className="text-white text-xs">{user.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
