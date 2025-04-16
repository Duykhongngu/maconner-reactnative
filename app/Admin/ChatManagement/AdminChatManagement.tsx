import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  Image,
  Vibration,
  AppState,
  Platform,
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
  getDocs,
  doc,
  getDoc,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "~/firebase.config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNotifications } from "~/hooks/useNotifications";
import { Message, UserData } from "./types";
import { User } from "./types";

// Cập nhật hàm gửi thông báo
const sendPushNotification = async (userId: string, message: string) => {
  try {
    // Lấy token của user từ Firestore
    const tokenDoc = await getDoc(doc(db, "userTokens", userId));
    if (!tokenDoc.exists()) return;

    const { expoPushToken } = tokenDoc.data();
    if (!expoPushToken) return;

    // Gửi thông báo qua Expo Push Service
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: expoPushToken,
        sound: "default",
        title: "Tin nhắn mới từ Admin",
        body: message,
        data: { type: "chat", userId },
        badge: 1,
        priority: "high",
      }),
    });

    // Lưu thông báo vào Firestore để đảm bảo user nhận được ngay cả khi offline
    await addDoc(collection(db, "notifications"), {
      userId,
      type: "chat",
      title: "Tin nhắn mới từ Admin",
      body: message,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};

export default function AdminChatManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showUserList, setShowUserList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isAppActive, setIsAppActive] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const currentUser = auth.currentUser;
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const appStateRef = useRef(AppState.currentState);

  // Sử dụng hook notifications
  useNotifications();

  // Theo dõi trạng thái app
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App vừa trở lại foreground
        setIsAppActive(true);
      } else if (nextAppState.match(/inactive|background/)) {
        // App vừa vào background
        setIsAppActive(false);
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Lưu và đọc số tin nhắn chưa đọc từ AsyncStorage
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const savedCount = await AsyncStorage.getItem("totalUnreadCount");
        if (savedCount) {
          setTotalUnreadCount(parseInt(savedCount, 10));
        }
      } catch (error) {
        console.error("Error loading unread count:", error);
      }
    };
    loadUnreadCount();
  }, []);

  useEffect(() => {
    const saveUnreadCount = async () => {
      try {
        await AsyncStorage.setItem(
          "totalUnreadCount",
          totalUnreadCount.toString()
        );
      } catch (error) {
        console.error("Error saving unread count:", error);
      }
    };
    saveUnreadCount();
  }, [totalUnreadCount]);

  // Lấy danh sách người dùng có tin nhắn
  useEffect(() => {
    const setupUserListener = () => {
      try {
        setError(null);
        const q = query(
          collection(db, "adminChats"),
          orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(
          q,
          async (snapshot: QuerySnapshot<DocumentData>) => {
            try {
              const userMap = new Map<string, User>();
              const userPromises: Promise<void>[] = [];
              const unreadCountMap = new Map<string, number>();
              let totalUnread = 0;
              let hasNewMessage = false;

              // Kiểm tra tin nhắn mới
              snapshot.docChanges().forEach((change) => {
                if (change.type === "added" || change.type === "modified") {
                  const data = change.doc.data();
                  if (!data.isAdmin && !data.isRead) {
                    hasNewMessage = true;
                  }
                }
              });

              snapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                const userId = data.userId;

                if (!data.isAdmin && !data.isRead) {
                  const currentCount = unreadCountMap.get(userId) || 0;
                  unreadCountMap.set(userId, currentCount + 1);
                  totalUnread++;
                }
              });

              // Thông báo khi có tin nhắn mới
              if (hasNewMessage && !isAppActive) {
                Vibration.vibrate();
              }

              // Xử lý dữ liệu người dùng
              snapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                const userId = data.userId;
                const message = {
                  text: data.text,
                  createdAt: data.createdAt?.toDate() || new Date(),
                };

                if (!userMap.has(userId)) {
                  userMap.set(userId, {
                    id: userId,
                    name: "Đang tải...",
                    lastMessage: message.text,
                    lastMessageTime: message.createdAt,
                    unreadCount: unreadCountMap.get(userId) || 0,
                  });

                  const userPromise = getDoc(doc(db, "accounts", userId))
                    .then((userDoc: DocumentSnapshot<DocumentData>) => {
                      if (userDoc.exists()) {
                        const userData = userDoc.data() as UserData;
                        const existingUser = userMap.get(userId);
                        if (existingUser) {
                          userMap.set(userId, {
                            ...existingUser,
                            name: userData.displayName || "Khách",
                            profileImage: userData.profileImage,
                          });
                        }
                      }
                    })
                    .catch((error) => {
                      console.error("Error fetching user data:", error);
                    });

                  userPromises.push(userPromise);
                } else {
                  const user = userMap.get(userId)!;
                  if (
                    message.createdAt > (user.lastMessageTime || new Date(0))
                  ) {
                    userMap.set(userId, {
                      ...user,
                      lastMessage: message.text,
                      lastMessageTime: message.createdAt,
                    });
                  }
                }
              });

              await Promise.all(userPromises);

              setTotalUnreadCount(totalUnread);
              setUsers(
                Array.from(userMap.values()).sort(
                  (a, b) =>
                    (b.lastMessageTime?.getTime() || 0) -
                    (a.lastMessageTime?.getTime() || 0)
                )
              );
            } catch (err) {
              console.error("Error processing user data:", err);
              setError("Có lỗi xảy ra khi xử lý dữ liệu người dùng");
              retryConnection(setupUserListener);
            }
          },
          (error) => {
            console.error("Error listening to users:", error);
            setError("Mất kết nối với máy chủ. Đang thử kết nối lại...");
            retryConnection(setupUserListener);
          }
        );

        return unsubscribe;
      } catch (err) {
        console.error("Error setting up user listener:", err);
        setError("Không thể kết nối với máy chủ");
        retryConnection(setupUserListener);
        return () => {};
      }
    };

    const unsubscribe = setupUserListener();
    return () => unsubscribe();
  }, [isAppActive]);

  // Hàm retry kết nối
  const retryConnection = (operation: () => void, delay: number = 5000) => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    retryTimeoutRef.current = setTimeout(operation, delay);
  };

  // Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Lấy tin nhắn của người dùng được chọn
  useEffect(() => {
    if (!selectedUser) return;

    const q = query(
      collection(db, "adminChats"),
      where("userId", "==", selectedUser),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: Message[] = [];
      let hasUnreadMessages = false;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.isAdmin && !data.isRead) {
          hasUnreadMessages = true;
        }
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

      // Cập nhật trạng thái đã đọc cho tin nhắn của user
      if (hasUnreadMessages) {
        snapshot.forEach(async (doc) => {
          const data = doc.data();
          if (!data.isAdmin && !data.isRead) {
            await updateDoc(doc.ref, {
              isRead: true,
            });
          }
        });

        // Cập nhật lại danh sách users để reset unreadCount
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === selectedUser ? { ...user, unreadCount: 0 } : user
          )
        );
      }

      setMessages(newMessages);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });

    return () => unsubscribe();
  }, [selectedUser]);

  const handleSend = async () => {
    if (!inputMessage.trim() || !selectedUser || !currentUser) return;

    setIsLoading(true);
    try {
      // Gửi tin nhắn
      const messageRef = await addDoc(collection(db, "adminChats"), {
        text: inputMessage.trim(),
        createdAt: serverTimestamp(),
        userId: selectedUser,
        userName: "Admin",
        isAdmin: true,
        isRead: false,
      });

      // Gửi thông báo push
      await sendPushNotification(selectedUser, inputMessage.trim());

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
          {message.text}
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

  if (!currentUser) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <Text className="text-lg text-black dark:text-white">
          Vui lòng đăng nhập để quản lý chat
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <View className="flex-1">
        {/* Header cho mobile */}
        <View className="bg-white dark:bg-black p-4 border-b border-gray-200 flex-row items-center justify-between">
          {!showUserList && selectedUser && (
            <TouchableOpacity
              onPress={() => setShowUserList(true)}
              className="p-2"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
          )}
          <View className="flex-row items-center">
            <Text className="text-lg font-semibold text-black dark:text-white">
              {showUserList
                ? "Danh sách chat"
                : users.find((u) => u.id === selectedUser)?.name || "Chat"}
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

        {/* Danh sách người dùng */}
        {showUserList ? (
          <FlatList
            data={users}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedUser(item.id);
                  setShowUserList(false);
                }}
                className="p-4 border-b border-gray-200 bg-white dark:bg-black"
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
                    {item.profileImage ? (
                      <Image
                        source={{ uri: item.profileImage }}
                        className="w-12 h-12 rounded-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className="text-lg font-semibold text-black dark:text-white">
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-base font-semibold text-black dark:text-white">
                        {item.name}
                      </Text>
                      {item.lastMessageTime && (
                        <Text className="text-xs text-gray-500 dark:text-white">
                          {formatTime(item.lastMessageTime)}
                        </Text>
                      )}
                    </View>
                    {item.lastMessage && (
                      <Text className="text-gray-500 text-sm" numberOfLines={1}>
                        {item.lastMessage}
                      </Text>
                    )}
                  </View>
                  {item.unreadCount > 0 && (
                    <View className="ml-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center">
                      <Text className="text-white text-xs">
                        {item.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
        ) : // Khu vực chat
        selectedUser ? (
          <View className="flex-1 bg-white dark:bg-black">
            <ScrollView
              ref={scrollViewRef}
              className="flex-1 px-4"
              contentContainerStyle={{ paddingVertical: 16 }}
            >
              {messages.map((message) => (
                <View key={message.id}>{renderMessage(message)}</View>
              ))}
            </ScrollView>

            <View className="p-4 border-t border-gray-200 bg-white dark:bg-black">
              <View className="flex-row items-center space-x-2">
                <TextInput
                  className="flex-1 bg-gray-100 dark:bg-gray-600 rounded-full px-4 py-2 text-base"
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
                        inputMessage.trim() === "" || isLoading
                          ? "#9CA3AF"
                          : "#FFFFFF"
                      }
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
            <Text className="mt-4 text-gray-500 dark:text-white">
              Chọn một cuộc trò chuyện để bắt đầu
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
