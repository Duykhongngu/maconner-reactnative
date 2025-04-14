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
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
  updateDoc,
  doc,
  setDoc,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "~/firebase.config";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Cấu hình thông báo
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface Message {
  id: string;
  text: string;
  createdAt: Date;
  userId: string;
  userName: string;
  isAdmin: boolean;
  isRead?: boolean;
}

export default function AdminChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const currentUser = auth.currentUser;
  const [isAppActive, setIsAppActive] = useState(true);

  // Xin quyền thông báo
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("Notification permissions not granted");
      }
    })();
  }, []);

  // Theo dõi trạng thái app
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      () => {
        setIsAppActive(true);
      }
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    setIsInitialLoading(true);
    setError(null);

    const q = query(
      collection(db, "adminChats"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const newMessages: Message[] = [];
        let newUnreadCount = 0;
        let hasNewMessage = false;

        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            const data = change.doc.data();
            if (data.isAdmin && !data.isRead) {
              newUnreadCount++;
              if (change.type === "added" && !isInitialLoading) {
                hasNewMessage = true;
              }
            }
          }
        });

        snapshot.forEach((doc) => {
          const data = doc.data();
          newMessages.push({
            id: doc.id,
            text: data.text,
            createdAt: data.createdAt?.toDate() || new Date(),
            userId: data.userId,
            userName: data.userName,
            isAdmin: data.isAdmin || false,
            isRead: data.isRead || false,
          });
        });

        // Sắp xếp tin nhắn
        newMessages.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
        setMessages(newMessages);
        setUnreadCount(newUnreadCount);

        // Thông báo khi có tin nhắn mới từ admin
        if (hasNewMessage && !isAppActive) {
          const lastMessage = newMessages[newMessages.length - 1];
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Tin nhắn mới từ Admin",
              body: lastMessage.text,
              sound: true,
            },
            trigger: null,
          });
          Vibration.vibrate();
        }

        setIsInitialLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Error fetching messages:", error);
        setIsInitialLoading(false);
        setError(
          error.code === "failed-precondition"
            ? "Hệ thống đang cập nhật. Vui lòng thử lại sau vài phút."
            : "Không thể tải tin nhắn. Vui lòng thử lại sau."
        );
      }
    );

    return () => unsubscribe();
  }, [currentUser, isAppActive]);

  // Đánh dấu tin nhắn đã đọc khi user mở app
  useEffect(() => {
    if (!currentUser || !messages.length || isInitialLoading) return;

    const unreadMessages = messages.filter((msg) => msg.isAdmin && !msg.isRead);

    unreadMessages.forEach(async (message) => {
      const messageRef = doc(db, "adminChats", message.id);
      await updateDoc(messageRef, { isRead: true });
    });
  }, [messages, currentUser, isInitialLoading]);

  // Lưu unreadCount vào AsyncStorage để Header có thể đọc
  useEffect(() => {
    const saveUnreadCount = async () => {
      try {
        await AsyncStorage.setItem("chatUnreadCount", unreadCount.toString());
      } catch (error) {
        console.error("Error saving unread count:", error);
      }
    };
    saveUnreadCount();
  }, [unreadCount]);

  // Xử lý thông báo khi có tin nhắn mới
  useEffect(() => {
    if (!currentUser) return;

    // Lắng nghe thông báo mới
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        // Rung điện thoại khi nhận thông báo
        Vibration.vibrate();
      }
    );

    // Lắng nghe khi người dùng nhấn vào thông báo
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // Đánh dấu thông báo đã đọc
        const notificationId = response.notification.request.identifier;
        markNotificationAsRead(notificationId);
      });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [currentUser]);

  // Đánh dấu thông báo đã đọc
  const markNotificationAsRead = async (notificationId: string) => {
    if (!currentUser) return;

    try {
      const notificationsRef = collection(db, "notifications");
      const q = query(
        notificationsRef,
        where("userId", "==", currentUser.uid),
        where("isRead", "==", false)
      );

      const snapshot = await getDocs(q);
      snapshot.forEach(async (doc) => {
        await updateDoc(doc.ref, { isRead: true });
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Lắng nghe tin nhắn mới
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "adminChats"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      where("isRead", "==", false),
      where("isAdmin", "==", true)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const newMessages = snapshot
        .docChanges()
        .filter(
          (change) => change.type === "added" && !change.doc.data().isRead
        );

      if (newMessages.length > 0 && !isAppActive) {
        const lastMessage = newMessages[0].doc.data();

        // Hiển thị thông báo
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Tin nhắn mới từ Admin",
            body: lastMessage.text,
            sound: true,
            badge: 1,
            data: { type: "chat", messageId: newMessages[0].doc.id },
          },
          trigger: null,
        });

        // Rung điện thoại
        Vibration.vibrate();
      }
    });

    return () => unsubscribe();
  }, [currentUser, isAppActive]);

  const handleSend = async () => {
    if (!inputMessage.trim() || !currentUser) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, "adminChats"), {
        text: inputMessage.trim(),
        createdAt: serverTimestamp(),
        userId: currentUser.uid,
        userName: currentUser.displayName || "Khách",
        isAdmin: false,
      });
      setInputMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = (message: Message) => (
    <View
      className={`flex-row ${
        !message.isAdmin ? "justify-end" : "justify-start"
      } mb-4`}
    >
      {message.isAdmin && (
        <View className="w-8 h-8 rounded-full mr-2 bg-green-100 items-center justify-center">
          <Ionicons name="person" size={16} color="#10B981" />
        </View>
      )}
      <View
        className={`rounded-2xl px-4 py-3 max-w-[80%] ${
          !message.isAdmin ? "bg-blue-500" : "bg-white border border-gray-200"
        }`}
      >
        <Text
          className={`text-base ${
            !message.isAdmin ? "text-white" : "text-gray-800"
          }`}
        >
          {message.text}
        </Text>
        <View className="flex-row items-center justify-between mt-1">
          <Text
            className={`text-xs ${
              !message.isAdmin ? "text-blue-100" : "text-gray-500"
            }`}
          >
            {formatTime(message.createdAt)}
          </Text>
          {!message.isAdmin && (
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

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  if (!currentUser) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg text-gray-600">
          Vui lòng đăng nhập để chat với Admin
        </Text>
      </View>
    );
  }

  if (isInitialLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="mt-4 text-gray-600">Đang tải tin nhắn...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-4">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="mt-4 text-gray-600 text-center">{error}</Text>
        <TouchableOpacity
          onPress={() => setIsInitialLoading(true)}
          className="mt-4 bg-blue-500 px-6 py-3 rounded-full"
        >
          <Text className="text-white">Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <View className="bg-white dark:bg-black p-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
              <Ionicons name="person" size={20} color="#10B981" />
            </View>
            <View>
              <Text className="text-lg font-semibold text-gray-800 dark:text-white">
                Admin Support
              </Text>
            </View>
          </View>
          {unreadCount > 0 && (
            <View className="bg-red-500 rounded-full px-2 py-1">
              <Text className="text-white text-xs font-bold">
                {unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-white dark:bg-black"
      >
        <View className="flex-1">
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4"
            contentContainerStyle={{ paddingVertical: 16 }}
          >
            {messages.length === 0 ? (
              <View className="flex-1 justify-center items-center py-8">
                <View className="w-16 h-16 rounded-full bg-green-100 dark:bg-blue-500 items-center justify-center mb-4">
                  <Ionicons
                    name="chatbubbles-outline"
                    size={32}
                    color="#10B981"
                  />
                </View>
                <Text className="text-gray-600 text-center">
                  Chào mừng bạn đến với hỗ trợ trực tuyến{"\n"}
                  Hãy đặt câu hỏi để được hỗ trợ
                </Text>
              </View>
            ) : (
              messages.map((message) => (
                <View key={message.id}>{renderMessage(message)}</View>
              ))
            )}
            {isLoading && (
              <View className="flex-row justify-start mb-4">
                <View className="w-8 h-8 rounded-full mr-2 bg-green-100 dark:bg-blue-500 items-center justify-center">
                  <ActivityIndicator size="small" color="#10B981" />
                </View>
              </View>
            )}
          </ScrollView>

          <View className="p-4 border-t border-gray-200 bg-white dark:bg-black">
            <View className="flex-row items-center space-x-2">
              <TextInput
                className="flex-1 bg-white dark:bg-gray-600 rounded-full px-4 py-2 text-base"
                placeholder="Nhập tin nhắn..."
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
                    : "bg-green-500 dark:bg-blue-500"
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
