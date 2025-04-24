import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Dimensions,
  Linking,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { sendMessageToChatGPT } from "~/service/GeminiService";
import { useTranslation } from "react-i18next";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: "text" | "suggestion";
  suggestions?: string[];
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    text: "chat_bot_welcome",
    isUser: false,
    timestamp: new Date(),
    type: "text",
  },
  {
    id: "suggestions",
    text: "chat_help_topics",
    isUser: false,
    timestamp: new Date(),
    type: "suggestion",
    suggestions: [
      "chat_about_shop",
      "chat_return_policy",
      "chat_payment_methods",
      "chat_order_status",
      "chat_new_products",
    ],
  },
];

const CONTACT_BUTTONS = [
  {
    id: "phone",
    icon: "call-outline" as const,
    label: "contact_phone",
    action: () => Linking.openURL("tel:0389693329"),
  },
  {
    id: "email",
    icon: "mail-outline" as const,
    label: "contact_email",
    action: () => Linking.openURL("mailto:duyngdev@gmail.com"),
  },
  {
    id: "facebook",
    icon: "logo-facebook" as const,
    label: "contact_facebook",
    action: () => Linking.openURL("https://www.facebook.com/duydangngu15"),
  },
];

export default function ChatScreen() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async (text: string = inputMessage) => {
    if (text.trim() === "") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
      type: "text",
    };

    // Lưu tin nhắn người dùng và xóa input
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Gửi tin nhắn và nhận phản hồi
      const reply = await sendMessageToChatGPT(text);

      if (reply) {
        // Thêm tin nhắn phản hồi từ bot
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: reply,
          isUser: false,
          timestamp: new Date(),
          type: "text",
        };

        // Thêm gợi ý liên quan
        const suggestionMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: "Bạn có thể quan tâm:",
          isUser: false,
          timestamp: new Date(),
          type: "suggestion",
          suggestions: getRelatedSuggestions(text),
        };

        setMessages((prev) => [...prev, botMessage, suggestionMessage]);
      } else {
        throw new Error("Không nhận được phản hồi từ ChatGPT");
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.",
        isUser: false,
        timestamp: new Date(),
        type: "text",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRelatedSuggestions = (query: string): string[] => {
    const allSuggestions = {
      product: [
        "Xem sản phẩm mới nhất",
        "Tìm sản phẩm theo giá",
        "Sản phẩm đang giảm giá",
        "Đánh giá sản phẩm",
      ],
      order: [
        "Kiểm tra đơn hàng",
        "Hủy đơn hàng",
        "Thời gian giao hàng",
        "Phí vận chuyển",
      ],
      payment: [
        "Phương thức thanh toán",
        "Thanh toán online",
        "Hoàn tiền",
        "Ví điện tử",
      ],
      support: [
        "Chính sách đổi trả",
        "Bảo hành sản phẩm",
        "Liên hệ hỗ trợ",
        "Khiếu nại",
      ],
    };

    const lowercaseQuery = query.toLowerCase();
    if (lowercaseQuery.includes("sản phẩm")) return allSuggestions.product;
    if (lowercaseQuery.includes("đơn hàng")) return allSuggestions.order;
    if (lowercaseQuery.includes("thanh toán")) return allSuggestions.payment;
    return allSuggestions.support;
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = (message: Message) => {
    if (message.type === "suggestion" && message.suggestions) {
      return (
        <View className="mb-4">
          <Text className="text-gray-600 mb-2">{message.text}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-2">
              {message.suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSend(suggestion)}
                  className="bg-blue-100 px-4 py-2 rounded-full"
                >
                  <Text className="text-blue-600">{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      );
    }

    return (
      <View
        className={`flex-row ${
          message.isUser ? "justify-end" : "justify-start"
        } mb-4`}
      >
        {!message.isUser && (
          <View className="w-8 h-8 rounded-full mr-2 bg-blue-100 items-center justify-center">
            <Ionicons name="chatbubble-ellipses" size={16} color="#3B82F6" />
          </View>
        )}
        <View
          className={`rounded-2xl px-4 py-3 max-w-[80%] ${
            message.isUser ? "bg-blue-500" : "bg-white border border-gray-200"
          }`}
        >
          <Text
            className={`text-base ${
              message.isUser ? "text-white" : "text-gray-800"
            }`}
          >
            {message.text.startsWith("chat_") ? t(message.text) : message.text}
          </Text>
          <Text
            className={`text-xs mt-1 ${
              message.isUser ? "text-blue-100" : "text-gray-500"
            }`}
          >
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const renderContactButtons = () => (
    <View className="flex-row justify-around py-2 bg-white border-b border-gray-200">
      {CONTACT_BUTTONS.map((button) => (
        <TouchableOpacity
          key={button.id}
          onPress={button.action}
          className="items-center px-4 py-2"
        >
          <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mb-1">
            <Ionicons name={button.icon} size={20} color="#3B82F6" />
          </View>
          <Text className="text-sm text-gray-600">{t(button.label)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1">
          {renderContactButtons()}
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4"
            contentContainerStyle={{ paddingVertical: 16 }}
          >
            {messages.map((message) => (
              <View key={message.id}>{renderMessage(message)}</View>
            ))}
            {isLoading && (
              <View className="flex-row justify-start mb-4">
                <View className="w-8 h-8 rounded-full mr-2 bg-blue-100 items-center justify-center">
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={16}
                    color="#3B82F6"
                  />
                </View>
                <View className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <ActivityIndicator size="small" color="#4B5563" />
                </View>
              </View>
            )}
          </ScrollView>

          <View className="p-4 border-t border-gray-200 bg-white">
            <View className="flex-row items-center space-x-2">
              <TextInput
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-base"
                placeholder={t("chat_placeholder")}
                value={inputMessage}
                onChangeText={setInputMessage}
                multiline
                maxLength={500}
                onSubmitEditing={() => handleSend()}
              />
              <TouchableOpacity
                onPress={() => handleSend()}
                disabled={inputMessage.trim() === "" || isLoading}
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  inputMessage.trim() === "" || isLoading
                    ? "bg-gray-300"
                    : "bg-blue-500"
                }`}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={
                    inputMessage.trim() === "" || isLoading
                      ? "#9CA3AF"
                      : "#FFFFFF"
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
