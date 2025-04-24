import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MessageItemProps } from "../types";
import { useTranslation } from "react-i18next";

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  formatTime,
}) => {
  const { t } = useTranslation();

  return (
    <View
      className={`flex-row ${
        message.isAdmin ? "justify-end" : "justify-start"
      } mb-4`}
    >
      {!message.isAdmin && (
        <View className="w-8 h-8 rounded-full mr-2 bg-black dark:bg-white items-center justify-center">
          <Text className="text-sm font-semibold text-white dark:text-black">
            {message.userName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View
        className={`rounded-2xl px-4 py-3 max-w-[80%] ${
          message.isAdmin
            ? "bg-blue-500 dark:bg-blue-500"
            : "bg-white dark:bg-black border border-gray-200 dark:border-gray-800"
        }`}
      >
        <Text
          className={`text-base ${
            message.isAdmin ? "text-white" : "text-gray-800 dark:text-white"
          }`}
        >
          {message.text.startsWith("chat_") ? t(message.text) : message.text}
        </Text>
        <View className="flex-row items-center justify-between mt-1">
          <Text
            className={`text-xs ${
              message.isAdmin ? "text-blue-100" : "text-gray-500"
            }`}
          >
            {formatTime(message.createdAt)}
          </Text>
          {message.isAdmin && (
            <Ionicons
              name={message.isRead ? "checkmark-done" : "checkmark"}
              size={16}
              color="#FFFFFF"
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </View>
    </View>
  );
};
