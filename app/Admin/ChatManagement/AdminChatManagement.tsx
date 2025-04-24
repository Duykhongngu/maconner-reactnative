import React, { useState, useRef, useEffect } from "react";
import {
  View,
  ScrollView,
  SafeAreaView,
  FlatList,
  AppState,
  Vibration,
  Text,
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
} from "firebase/firestore";
import { db, auth } from "~/firebase.config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNotifications } from "~/hooks/useNotifications";
import { Message, User, UserData } from "./types";
import { ChatHeader } from "./components/ChatHeader";
import { ChatInput } from "./components/ChatInput";
import { MessageItem } from "./components/MessageItem";
import { UserListItem } from "./components/UserListItem";
import { useTranslation } from "react-i18next";

// Cập nhật hàm gửi thông báo
const sendPushNotification = async (userId: string, message: string) => {
  try {
    const tokenDoc = await getDoc(doc(db, "userTokens", userId));
    if (!tokenDoc.exists()) return;

    const { expoPushToken } = tokenDoc.data();
    if (!expoPushToken) return;

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
  const { t } = useTranslation();
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

  useNotifications();

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        setIsAppActive(true);
      } else if (nextAppState.match(/inactive|background/)) {
        setIsAppActive(false);
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

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

              if (hasNewMessage && !isAppActive) {
                Vibration.vibrate();
              }

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

      if (hasUnreadMessages) {
        snapshot.forEach(async (doc) => {
          const data = doc.data();
          if (!data.isAdmin && !data.isRead) {
            await updateDoc(doc.ref, {
              isRead: true,
            });
          }
        });

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
      await addDoc(collection(db, "adminChats"), {
        text: inputMessage.trim(),
        createdAt: serverTimestamp(),
        userId: selectedUser,
        userName: "Admin",
        isAdmin: true,
        isRead: false,
      });

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

  const retryConnection = (operation: () => void, delay: number = 5000) => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    retryTimeoutRef.current = setTimeout(operation, delay);
  };

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  if (!currentUser) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <Text className="text-lg text-black dark:text-white">
          {t("please_login")}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <Text className="text-lg text-red-500">{t("error")}</Text>
        <Text className="text-base text-gray-600 dark:text-gray-400 mt-2">
          {error}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <View className="flex-1">
        <ChatHeader
          showUserList={showUserList}
          selectedUser={selectedUser}
          totalUnreadCount={totalUnreadCount}
          userName={users.find((u) => u.id === selectedUser)?.name}
          onBackPress={() => setShowUserList(true)}
        />

        {showUserList ? (
          <FlatList
            data={users}
            renderItem={({ item }) => (
              <UserListItem
                user={item}
                onSelect={(userId) => {
                  setSelectedUser(userId);
                  setShowUserList(false);
                }}
                formatTime={formatTime}
              />
            )}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={() => (
              <View className="flex-1 justify-center items-center py-8">
                <Text className="text-gray-500 dark:text-gray-400">
                  {t("chat_empty")}
                </Text>
              </View>
            )}
          />
        ) : selectedUser ? (
          <View className="flex-1 bg-white dark:bg-black">
            <ScrollView
              ref={scrollViewRef}
              className="flex-1 px-4"
              contentContainerStyle={{ paddingVertical: 16 }}
            >
              {messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  formatTime={formatTime}
                />
              ))}
            </ScrollView>

            <ChatInput
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              handleSend={handleSend}
              isLoading={isLoading}
            />
          </View>
        ) : (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
            <Text className="mt-4 text-gray-500 dark:text-white">
              {t("select_chat")}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
