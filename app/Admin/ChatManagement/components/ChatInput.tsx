import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ChatInputProps } from "../types";
import { useTranslation } from "react-i18next";

export const ChatInput: React.FC<ChatInputProps> = ({
  inputMessage,
  setInputMessage,
  handleSend,
  isLoading,
}) => {
  const { t } = useTranslation();

  return (
    <View className="p-4 border-t border-gray-200 bg-white dark:bg-black">
      <View className="flex-row items-center space-x-2">
        <TextInput
          className="flex-1 bg-gray-100 dark:bg-gray-600 rounded-full px-4 py-2 text-base"
          placeholder={t("chat_placeholder")}
          placeholderTextColor="black dark:text-white"
          value={inputMessage}
          onChangeText={setInputMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={inputMessage.trim() === "" || isLoading}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            inputMessage.trim() === "" || isLoading
              ? "bg-gray-300 dark:bg-gray-600"
              : "bg-blue-500 dark:bg-blue-500"
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={
                inputMessage.trim() === "" || isLoading ? "#9CA3AF" : "#FFFFFF"
              }
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
