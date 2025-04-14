import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Platform,
  Button,
  Pressable,
  Image,
} from "react-native";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  where,
  updateDoc,
  doc,
  FieldValue,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "~/firebase.config";
import { httpsCallable, getFunctions } from "firebase/functions";
import * as ImagePicker from "expo-image-picker";
import {
  uploadImageToCloudinary,
  fetchUsers,
  fetchNotifications,
  createNotification,
  sendFCMNotification,
  formatFirestoreTimestamp,
  NotificationData as ServiceNotificationData,
} from "~/service/notifications";

interface FirebaseError extends Error {
  code?: string;
  message: string;
}

interface User {
  uid: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  fcmToken?: string;
  role?: string;
  createdAt?: string;
}

interface NotificationData {
  title: string;
  body: string;
  type: "all" | "specific" | "promotion";
  targetUsers?: string[];
  createdAt: FieldValue;
  scheduledFor?: Timestamp;
  status: string;
  imageUrl?: string;
  data?: {
    [key: string]: string;
  };
  android?: {
    channelId?: string;
    smallIcon?: string;
    priority?: "default" | "high" | "max" | "low" | "min";
    sound?: string;
  };
  ios?: {
    sound?: string;
    badge?: number;
    categoryId?: string;
  };
}

interface NotificationType
  extends Partial<Omit<NotificationData, "createdAt">> {
  id: string;
  createdAt: any;
  title?: string;
  body?: string;
  type?: "all" | "specific" | "promotion";
  status?: string;
}

export default function NotificationManagement() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<"all" | "specific" | "promotion">("all");
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [uploading, setUploading] = useState(false);

  const [priority, setPriority] = useState<
    "default" | "high" | "max" | "low" | "min"
  >("default");
  const [channelId, setChannelId] = useState("");
  const [sound, setSound] = useState("");
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const typeOptions = [
    { label: "Tất cả người dùng", value: "all" },
    { label: "Người dùng cụ thể", value: "specific" },
    { label: "Thông báo khuyến mãi", value: "promotion" },
  ];

  useEffect(() => {
    fetchNotificationsData();
    fetchUsersData();
  }, []);

  const fetchUsersData = async () => {
    try {
      const usersData = await fetchUsers();
      setUsers(usersData as User[]);
    } catch (error) {
      console.error("Error fetching users:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách người dùng");
    }
  };

  const fetchNotificationsData = async () => {
    try {
      setLoading(true);
      const notificationsData = await fetchNotifications();
      setNotifications(notificationsData as NotificationType[]);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách thông báo");
    } finally {
      setLoading(false);
    }
  };

  const sendFCMNotification = async (
    notificationId: string,
    notificationData: any
  ) => {
    try {
      const functions = getFunctions();
      const sendNotification = httpsCallable(functions, "sendNotification");

      // Lấy danh sách token dựa vào loại thông báo
      let userTokens: string[] = [];

      if (notificationData.type === "all") {
        // Lấy tất cả user tokens từ collection accounts (không phải users)
        const usersSnapshot = await getDocs(collection(db, "accounts"));
        userTokens = usersSnapshot.docs
          .map((doc) => doc.data().fcmToken)
          .filter((token) => token);
        console.log(
          `Tìm thấy ${userTokens.length} FCM token cho thông báo "all"`
        );
      } else if (
        notificationData.type === "specific" &&
        notificationData.targetUsers
      ) {
        // Lấy token của các user được chọn từ collection accounts
        // Nếu quá nhiều user, chia nhỏ truy vấn
        const batchSize = 10;
        const batches = [];

        for (
          let i = 0;
          i < notificationData.targetUsers.length;
          i += batchSize
        ) {
          const batch = notificationData.targetUsers.slice(i, i + batchSize);
          batches.push(batch);
        }

        for (const batch of batches) {
          // Có thể "uid" không phải là trường trong document, mà là document ID
          try {
            // Phương pháp 1: Nếu uid là trường trong document
            const userQuery = query(
              collection(db, "accounts"),
              where("uid", "in", batch)
            );
            const userSnapshot = await getDocs(userQuery);
            let tokens = userSnapshot.docs
              .map((doc) => doc.data().fcmToken)
              .filter((token) => token && token !== "");

            // Nếu không tìm thấy token, thử phương pháp 2
            if (tokens.length === 0) {
              // Phương pháp 2: Nếu uid là document ID
              const promises = batch.map((uid: string) =>
                getDoc(doc(db, "accounts", uid))
              );
              const results = await Promise.all(promises);
              tokens = results
                .filter((docSnap) => docSnap.exists())
                .map((docSnap) => docSnap.data().fcmToken)
                .filter((token) => token && token !== "");
            }

            userTokens = [...userTokens, ...tokens];
          } catch (error) {
            console.error("Error fetching user tokens:", error);
            // Tiếp tục với batch tiếp theo
            continue;
          }
        }

        console.log(
          `Tìm thấy ${userTokens.length} FCM token cho thông báo "specific" với ${notificationData.targetUsers.length} người dùng`
        );
      } else if (notificationData.type === "promotion") {
        // Lấy tất cả user tokens (hoặc có thể lọc theo tiêu chí khác)
        const usersSnapshot = await getDocs(collection(db, "accounts")); // Thay đổi từ users sang accounts
        userTokens = usersSnapshot.docs
          .map((doc) => doc.data().fcmToken)
          .filter((token) => token && token !== "");
        console.log(
          `Tìm thấy ${userTokens.length} FCM token cho thông báo "promotion"`
        );
      }

      // Cập nhật trạng thái thông báo sang sent dù không có token
      await updateDoc(doc(db, "notifications", notificationId), {
        status: "sent",
        sentAt: serverTimestamp(),
      });

      // Chỉ gửi thông báo nếu có token hợp lệ
      if (userTokens.length > 0) {
        // Chuẩn bị thông báo để gửi qua FCM, tránh các giá trị undefined
        const fcmPayload: any = {
          tokens: userTokens,
          notification: {
            title: notificationData.title,
            body: notificationData.body,
          },
          data: {
            type: notificationData.type,
            notificationId: notificationId,
          },
        };

        // Chỉ thêm imageUrl nếu có
        if (notificationData.imageUrl) {
          fcmPayload.notification.imageUrl = notificationData.imageUrl;
        }

        // Thêm các cấu hình Android và iOS
        if (notificationData.android) {
          fcmPayload.android = notificationData.android;
        }

        if (notificationData.ios) {
          fcmPayload.ios = notificationData.ios;
        }

        // Gửi thông báo qua FCM
        try {
          const result = await sendNotification(fcmPayload);
          console.log("Đã gửi thông báo FCM thành công");
          return result;
        } catch (fcmError) {
          console.error(
            "Lỗi khi gửi FCM, nhưng vẫn đánh dấu là đã gửi:",
            fcmError
          );
          return { success: true, fcmError };
        }
      } else {
        console.log(
          "Không có FCM token, nhưng vẫn đánh dấu thông báo là đã gửi"
        );
        return { success: true, noTokens: true };
      }
    } catch (error) {
      const firebaseError = error as FirebaseError;
      console.error("Error sending FCM notification:", firebaseError);
      await updateDoc(doc(db, "notifications", notificationId), {
        status: "failed",
        error: firebaseError.message || "Unknown error",
      });
      throw firebaseError;
    }
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ tiêu đề và nội dung");
      return;
    }

    if (type === "specific" && selectedUsers.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất một người dùng");
      return;
    }

    try {
      setLoading(true);
      console.log("Bắt đầu gửi thông báo:", {
        type,
        targetUsers: selectedUsers.length,
      });

      // Chuẩn bị dữ liệu thông báo
      const notificationData: ServiceNotificationData = {
        title: title.trim(),
        body: body.trim(),
        type,
        status: scheduledDate ? "scheduled" : "pending",
        imageUrl: imageUrl || undefined,
        scheduledFor: scheduledDate
          ? Timestamp.fromDate(scheduledDate)
          : undefined,
        android: {
          channelId: channelId.trim() || undefined,
          priority,
        },
        targetUsers: type === "specific" ? selectedUsers : undefined,
      };

      // Sử dụng API mới để tạo thông báo
      const result = await createNotification(notificationData);

      // Hiển thị thông báo thành công, đồng thời thông báo nếu không có FCM token
      if (result?.noTokens) {
        Alert.alert(
          "Thành công",
          scheduledDate
            ? "Đã lập lịch thông báo, nhưng không tìm thấy FCM token của người nhận"
            : "Đã gửi thông báo, nhưng không tìm thấy FCM token của người nhận. Thông báo có thể không hiển thị trên thiết bị."
        );
      } else {
        Alert.alert(
          "Thành công",
          scheduledDate ? "Đã lập lịch thông báo" : "Đã gửi thông báo"
        );
      }

      resetForm();
      fetchNotificationsData();
    } catch (error) {
      const firebaseError = error as FirebaseError;
      console.error("Error sending notification:", firebaseError);
      Alert.alert("Lỗi", "Không thể gửi thông báo: " + firebaseError.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setBody("");
    setType("all");
    setSelectedUsers([]);
    setImageUrl("");
    setSelectedImage(null);
    setScheduledDate(null);
    setPriority("default");
    setChannelId("");
    setSound("");
  };

  const priorityOptions = [
    { label: "Mặc định", value: "default" },
    { label: "Cao", value: "high" },
    { label: "Tối đa", value: "max" },
    { label: "Thấp", value: "low" },
    { label: "Tối thiểu", value: "min" },
  ];

  const getPriorityLabel = (value: string) => {
    return (
      priorityOptions.find((option) => option.value === value)?.label || value
    );
  };

  // Helper functions for datetime picker
  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const addHours = (date: Date, hours: number): Date => {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  };

  const addMinutes = (date: Date, minutes: number): Date => {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  };

  interface CustomDateTimePickerProps {
    value: Date;
    onChange?: (date: Date) => void;
    onCancel: () => void;
    onConfirm: (date: Date) => void;
  }

  const CustomDateTimePicker = ({
    value,
    onChange,
    onCancel,
    onConfirm,
  }: CustomDateTimePickerProps) => {
    const [tempDate, setTempDate] = useState<Date>(value || new Date());

    return (
      <View className="bg-white p-4 rounded-lg">
        <View className="mb-4">
          <Text className="text-lg font-semibold text-center mb-4">
            Chọn ngày và giờ
          </Text>

          <View className="flex-row justify-around mb-4">
            <Pressable
              onPress={() => setTempDate(new Date())}
              className="bg-blue-100 p-2 rounded-lg"
            >
              <Text>Hôm nay</Text>
            </Pressable>
            <Pressable
              onPress={() => setTempDate(addDays(new Date(), 1))}
              className="bg-blue-100 p-2 rounded-lg"
            >
              <Text>Ngày mai</Text>
            </Pressable>
            <Pressable
              onPress={() => setTempDate(addDays(new Date(), 7))}
              className="bg-blue-100 p-2 rounded-lg"
            >
              <Text>1 tuần sau</Text>
            </Pressable>
          </View>

          <Text className="mb-2">
            Ngày: {tempDate.toLocaleDateString("vi-VN")}
          </Text>

          <View className="flex-row justify-around mb-4">
            <TouchableOpacity
              onPress={() => setTempDate(addDays(tempDate, -1))}
              className="bg-gray-200 p-2 rounded-lg"
            >
              <Text>-1 ngày</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTempDate(addDays(tempDate, 1))}
              className="bg-gray-200 p-2 rounded-lg"
            >
              <Text>+1 ngày</Text>
            </TouchableOpacity>
          </View>

          <Text className="mb-2">
            Giờ: {tempDate.getHours().toString().padStart(2, "0")}:
            {tempDate.getMinutes().toString().padStart(2, "0")}
          </Text>

          <View className="flex-row justify-around mb-2">
            <TouchableOpacity
              onPress={() => setTempDate(addHours(tempDate, -1))}
              className="bg-gray-200 p-2 rounded-lg"
            >
              <Text>-1 giờ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTempDate(addHours(tempDate, 1))}
              className="bg-gray-200 p-2 rounded-lg"
            >
              <Text>+1 giờ</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-around mb-4">
            <TouchableOpacity
              onPress={() => setTempDate(addMinutes(tempDate, -15))}
              className="bg-gray-200 p-2 rounded-lg"
            >
              <Text>-15 phút</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTempDate(addMinutes(tempDate, 15))}
              className="bg-gray-200 p-2 rounded-lg"
            >
              <Text>+15 phút</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-center mb-4">
            Thời gian đã chọn: {tempDate.toLocaleString("vi-VN")}
          </Text>
        </View>

        <View className="flex-row justify-between">
          <TouchableOpacity
            onPress={onCancel}
            className="bg-red-100 p-3 rounded-lg"
          >
            <Text className="text-red-700">Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onConfirm(tempDate)}
            className="bg-blue-500 p-3 rounded-lg"
          >
            <Text className="text-white">Xác nhận</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Hàm chọn hình ảnh từ thiết bị
  const pickImage = async () => {
    try {
      // Yêu cầu quyền truy cập thư viện ảnh
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Cần quyền truy cập",
          "Vui lòng cấp quyền truy cập thư viện ảnh để tiếp tục"
        );
        return;
      }

      // Mở thư viện ảnh
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);

        // Upload ảnh lên Cloudinary thay vì Firebase Storage
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Lỗi khi chọn ảnh:", error);
      Alert.alert("Lỗi", "Không thể chọn hình ảnh, vui lòng thử lại");
    }
  };

  // Hàm upload ảnh sử dụng Cloudinary thay vì Firebase Storage
  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);
      // Sử dụng hàm từ API mới
      const downloadURL = await uploadImageToCloudinary(uri);
      setImageUrl(downloadURL);
      setUploading(false);
      console.log("Upload thành công:", downloadURL);
      return downloadURL;
    } catch (error) {
      console.error("Lỗi khi upload ảnh:", error);
      setUploading(false);
      Alert.alert("Lỗi", "Không thể tải ảnh lên, vui lòng thử lại");
      return null;
    }
  };

  // Hàm cập nhật FCM token cho tài khoản (Phục vụ cho việc thử nghiệm)
  const updateFCMToken = async (accountId: string, fcmToken: string) => {
    try {
      await updateDoc(doc(db, "accounts", accountId), {
        fcmToken: fcmToken,
      });
      Alert.alert(
        "Thành công",
        `Đã cập nhật FCM Token cho tài khoản ${accountId}`
      );
      return true;
    } catch (error) {
      console.error("Lỗi khi cập nhật FCM Token:", error);
      Alert.alert("Lỗi", "Không thể cập nhật FCM Token");
      return false;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView className="flex-1">
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-gray-800">
              Quản lý thông báo
            </Text>
            <TouchableOpacity
              className="bg-blue-500 px-4 py-2 rounded-full"
              onPress={() => {
                resetForm();
                fetchNotificationsData();
              }}
            >
              <Text className="text-white">Làm mới</Text>
            </TouchableOpacity>
          </View>

          {/* Test FCM Token (Phục vụ cho việc thử nghiệm) */}
          {type === "specific" && selectedUsers.length > 0 && (
            <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
              <Text className="text-xl font-semibold text-gray-800 mb-5">
                Cập nhật FCM Token
              </Text>
              <View className="space-y-4">
                <Text className="text-gray-700">
                  Tài khoản người dùng hiện không có FCM token để nhận thông
                  báo. Bạn có thể cập nhật FCM token thử nghiệm cho tài khoản
                  được chọn.
                </Text>
                <View className="flex-row space-x-2">
                  <TouchableOpacity
                    className="flex-1 bg-yellow-500 p-3 rounded-lg"
                    onPress={() => {
                      if (selectedUsers.length > 0) {
                        const testFCMToken = "test_fcm_token_" + Date.now();
                        updateFCMToken(selectedUsers[0], testFCMToken);
                      }
                    }}
                  >
                    <Text className="text-white text-center font-semibold">
                      Cập nhật FCM Token thử nghiệm
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-blue-500 p-3 rounded-lg"
                    onPress={() => setShowGuideModal(true)}
                  >
                    <Text className="text-white text-center font-semibold">
                      Xem hướng dẫn
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Form gửi thông báo */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
            <Text className="text-xl font-semibold text-gray-800 mb-5">
              Tạo thông báo mới
            </Text>

            <View className="space-y-4">
              {/* Loại thông báo */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Loại thông báo
                </Text>
                <TouchableOpacity
                  className="bg-gray-50 p-4 rounded-lg flex-row justify-between items-center"
                  onPress={() => setShowTypeModal(true)}
                >
                  <Text className="text-gray-600">
                    {typeOptions.find((option) => option.value === type)
                      ?.label || type}
                  </Text>
                  <Text className="text-blue-500">Chọn</Text>
                </TouchableOpacity>
              </View>

              {/* Người nhận */}
              {type === "specific" && (
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Người nhận ({selectedUsers.length})
                  </Text>
                  <TouchableOpacity
                    className="bg-gray-50 p-4 rounded-lg flex-row justify-between items-center"
                    onPress={() => setShowUserModal(true)}
                  >
                    <Text
                      className="text-gray-600"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {selectedUsers.length > 0
                        ? users
                            .filter((u) => selectedUsers.includes(u.uid))
                            .map((u) => u.displayName || u.email || u.uid)
                            .join(", ")
                        : "Chọn người nhận"}
                    </Text>
                    <Text className="text-blue-500">Chọn</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Tiêu đề */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề
                </Text>
                <TextInput
                  className="bg-gray-50 p-4 rounded-lg"
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Nhập tiêu đề thông báo"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Nội dung */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Nội dung
                </Text>
                <TextInput
                  className="bg-gray-50 p-4 rounded-lg"
                  value={body}
                  onChangeText={setBody}
                  placeholder="Nhập nội dung thông báo"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* URL Hình ảnh (tùy chọn) */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh thông báo (tùy chọn)
                </Text>
                <TouchableOpacity
                  className="bg-gray-50 p-4 rounded-lg flex-row justify-between items-center"
                  onPress={pickImage}
                  disabled={uploading}
                >
                  <Text className="text-gray-600">
                    {uploading
                      ? "Đang tải ảnh lên..."
                      : selectedImage
                      ? "Ảnh đã chọn"
                      : "Chọn hình ảnh"}
                  </Text>
                  <Text className="text-blue-500">
                    {uploading ? "Đang tải..." : "Chọn"}
                  </Text>
                </TouchableOpacity>
                {selectedImage && (
                  <View className="mt-2 items-center">
                    <Image
                      source={{ uri: selectedImage }}
                      className="w-40 h-40 rounded-lg"
                      resizeMode="contain"
                    />
                    <TouchableOpacity
                      className="mt-2 bg-red-100 px-4 py-2 rounded-lg"
                      onPress={() => {
                        setSelectedImage(null);
                        setImageUrl("");
                      }}
                    >
                      <Text className="text-red-600">Xóa ảnh</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Lập lịch gửi */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Lập lịch gửi (tùy chọn)
                </Text>
                <TouchableOpacity
                  className="bg-gray-50 p-4 rounded-lg flex-row justify-between items-center"
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text className="text-gray-600">
                    {scheduledDate
                      ? scheduledDate.toLocaleString("vi-VN")
                      : "Chọn thời gian gửi"}
                  </Text>
                  <Text className="text-blue-500">Chọn</Text>
                </TouchableOpacity>

                <Modal
                  visible={showDatePicker}
                  transparent={true}
                  animationType="slide"
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View className="flex-1 bg-black bg-opacity-50 justify-center items-center p-5">
                    <CustomDateTimePicker
                      value={scheduledDate || new Date()}
                      onCancel={() => setShowDatePicker(false)}
                      onConfirm={(date) => {
                        setScheduledDate(date);
                        setShowDatePicker(false);
                      }}
                    />
                  </View>
                </Modal>
              </View>

              {/* Độ ưu tiên */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Độ ưu tiên
                </Text>
                <TouchableOpacity
                  className="bg-gray-50 p-4 rounded-lg flex-row justify-between items-center"
                  onPress={() => setShowPriorityModal(true)}
                >
                  <Text className="text-gray-600">
                    {getPriorityLabel(priority)}
                  </Text>
                  <Text className="text-blue-500">Chọn</Text>
                </TouchableOpacity>
              </View>

              {/* Channel ID */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Channel ID (Android)
                </Text>
                <TextInput
                  className="bg-gray-50 p-4 rounded-lg"
                  value={channelId}
                  onChangeText={setChannelId}
                  placeholder="Nhập Channel ID"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Nút gửi */}
              <TouchableOpacity
                className={`py-4 rounded-lg ${
                  loading || uploading ? "bg-gray-400" : "bg-blue-500"
                }`}
                onPress={handleSendNotification}
                disabled={loading || uploading}
              >
                <Text className="text-white text-center font-semibold text-base">
                  {loading
                    ? "Đang xử lý..."
                    : uploading
                    ? "Đang tải ảnh lên..."
                    : scheduledDate
                    ? "Lập lịch thông báo"
                    : "Gửi thông báo"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Danh sách thông báo */}
          <View className="bg-white p-5 rounded-xl shadow-sm">
            <Text className="text-xl font-semibold text-gray-800 mb-5">
              Lịch sử thông báo
            </Text>
            {loading ? (
              <ActivityIndicator size="large" color="#3B82F6" />
            ) : notifications.length > 0 ? (
              <View className="space-y-4">
                {notifications.map((notification) => (
                  <View
                    key={notification.id}
                    className="bg-gray-50 p-4 rounded-lg"
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1 mr-2">
                        <Text className="font-semibold text-gray-800 mb-1">
                          {notification.title || "Không có tiêu đề"}
                        </Text>
                        <Text className="text-gray-600 text-sm mb-2">
                          {notification.body || "Không có nội dung"}
                        </Text>
                      </View>
                      <View
                        className={`px-2 py-1 rounded-full ${
                          notification.status === "sent"
                            ? "bg-green-100"
                            : notification.status === "failed"
                            ? "bg-red-100"
                            : "bg-yellow-100"
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            notification.status === "sent"
                              ? "text-green-800"
                              : notification.status === "failed"
                              ? "text-red-800"
                              : "text-yellow-800"
                          }`}
                        >
                          {notification.status === "sent"
                            ? "Đã gửi"
                            : notification.status === "failed"
                            ? "Thất bại"
                            : "Đang chờ"}
                        </Text>
                      </View>
                    </View>
                    {notification.scheduledFor && (
                      <Text className="text-xs text-blue-600 mb-1">
                        Lập lịch:{" "}
                        {formatFirestoreTimestamp(notification.scheduledFor)}
                      </Text>
                    )}
                    <Text className="text-xs text-gray-500">
                      Tạo lúc:{" "}
                      {formatFirestoreTimestamp(notification.createdAt)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="py-8">
                <Text className="text-center text-gray-500">
                  Chưa có thông báo nào
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal chọn người dùng */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUserModal(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50">
          <View className="flex-1 mt-20 bg-white rounded-t-3xl">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Text className="text-red-500 font-medium">Hủy</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold">
                Chọn người nhận ({selectedUsers.length})
              </Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Text className="text-blue-500 font-medium">Xong</Text>
              </TouchableOpacity>
            </View>
            <ScrollView className="flex-1 p-4">
              {users.map((user) => (
                <TouchableOpacity
                  key={user.uid}
                  className={`p-4 mb-2 rounded-lg ${
                    selectedUsers.includes(user.uid)
                      ? "bg-blue-50"
                      : "bg-gray-50"
                  }`}
                  onPress={() => {
                    setSelectedUsers((prev) =>
                      prev.includes(user.uid)
                        ? prev.filter((id) => id !== user.uid)
                        : [...prev, user.uid]
                    );
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text
                        className={`font-medium ${
                          selectedUsers.includes(user.uid)
                            ? "text-blue-600"
                            : "text-gray-800"
                        }`}
                      >
                        {user.displayName || "Chưa đặt tên"}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {user.email || "Không có email"}
                      </Text>
                      {user.phoneNumber && (
                        <Text className="text-gray-500 text-sm">
                          {user.phoneNumber}
                        </Text>
                      )}
                      <Text className="text-gray-400 text-xs mt-1">
                        Tham gia: {user.createdAt || "Không có dữ liệu"}
                      </Text>
                    </View>
                    {selectedUsers.includes(user.uid) && (
                      <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center">
                        <Text className="text-white text-xs">✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal chọn độ ưu tiên */}
      <Modal
        visible={showPriorityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPriorityModal(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50">
          <View className="flex-1 mt-20 bg-white rounded-t-3xl">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <TouchableOpacity onPress={() => setShowPriorityModal(false)}>
                <Text className="text-red-500 font-medium">Hủy</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold">Chọn độ ưu tiên</Text>
              <TouchableOpacity onPress={() => setShowPriorityModal(false)}>
                <Text className="text-blue-500 font-medium">Xong</Text>
              </TouchableOpacity>
            </View>
            <ScrollView className="p-4">
              {priorityOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  className={`p-4 mb-2 rounded-lg flex-row justify-between items-center ${
                    priority === option.value ? "bg-blue-50" : "bg-gray-50"
                  }`}
                  onPress={() => {
                    setPriority(
                      option.value as "default" | "high" | "max" | "low" | "min"
                    );
                    setShowPriorityModal(false);
                  }}
                >
                  <Text
                    className={`${
                      priority === option.value
                        ? "text-blue-600 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {option.label}
                  </Text>
                  {priority === option.value && (
                    <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center">
                      <Text className="text-white text-xs">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal chọn loại thông báo */}
      <Modal
        visible={showTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50">
          <View className="flex-1 mt-20 bg-white rounded-t-3xl">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                <Text className="text-red-500 font-medium">Hủy</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold">Chọn loại thông báo</Text>
              <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                <Text className="text-blue-500 font-medium">Xong</Text>
              </TouchableOpacity>
            </View>
            <ScrollView className="p-4">
              {typeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  className={`p-4 mb-2 rounded-lg flex-row justify-between items-center ${
                    type === option.value ? "bg-blue-50" : "bg-gray-50"
                  }`}
                  onPress={() => {
                    setType(option.value as "all" | "specific" | "promotion");
                    if (option.value !== "specific") {
                      setSelectedUsers([]);
                    }
                    setShowTypeModal(false);
                  }}
                >
                  <Text
                    className={`${
                      type === option.value
                        ? "text-blue-600 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {option.label}
                  </Text>
                  {type === option.value && (
                    <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center">
                      <Text className="text-white text-xs">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal hướng dẫn tích hợp FCM */}
      <Modal
        visible={showGuideModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGuideModal(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50">
          <View className="flex-1 mt-16 bg-white rounded-t-3xl">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <TouchableOpacity onPress={() => setShowGuideModal(false)}>
                <Text className="text-red-500 font-medium">Đóng</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold">
                Hướng dẫn tích hợp FCM
              </Text>
              <View style={{ width: 50 }}></View> {/* Spacer */}
            </View>
            <ScrollView className="flex-1 p-4">
              <View className="space-y-4">
                <Text className="text-lg font-semibold">
                  Để thông báo hoạt động, bạn cần:
                </Text>

                <View className="bg-blue-50 p-3 rounded-lg">
                  <Text className="font-semibold text-blue-800">
                    1. Tích hợp Firebase Cloud Messaging vào app
                  </Text>
                  <Text className="text-gray-700 mt-1">
                    - Cài đặt các thư viện cần thiết:
                    @react-native-firebase/app, @react-native-firebase/messaging
                    {"\n"}- Cấu hình FCM trong ứng dụng React Native
                  </Text>
                </View>

                <View className="bg-blue-50 p-3 rounded-lg">
                  <Text className="font-semibold text-blue-800">
                    2. Lấy và lưu FCM Token khi người dùng đăng nhập
                  </Text>
                  <Text className="text-gray-700 mt-1">
                    {`// Trong màn hình đăng nhập hoặc khi khởi động app
import messaging from '@react-native-firebase/messaging';

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED 
    || authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    const token = await messaging().getToken();
    // Lưu token vào Firestore trong tài khoản người dùng
    updateUserFCMToken(userId, token);
  }
}`}
                  </Text>
                </View>

                <View className="bg-blue-50 p-3 rounded-lg">
                  <Text className="font-semibold text-blue-800">
                    3. Cập nhật FCM Token trong Firestore
                  </Text>
                  <Text className="text-gray-700 mt-1">
                    {`// Hàm cập nhật FCM token trong Firestore
async function updateUserFCMToken(userId, token) {
  try {
    await firestore()
      .collection('accounts')
      .doc(userId)
      .update({
        fcmToken: token,
      });
    console.log('FCM Token updated');
  } catch (error) {
    console.error('Error updating FCM token:', error);
  }
}`}
                  </Text>
                </View>

                <View className="bg-yellow-50 p-3 rounded-lg">
                  <Text className="font-semibold text-yellow-800">
                    Lưu ý quan trọng:
                  </Text>
                  <Text className="text-gray-700 mt-1">
                    - FCM token có thể thay đổi, nên cần lắng nghe sự kiện thay
                    đổi token{"\n"}- Cập nhật token mới mỗi khi người dùng mở
                    ứng dụng{"\n"}- Xóa token khi người dùng đăng xuất{"\n"}-
                    Cần cấu hình đúng các files như google-services.json
                    (Android) và GoogleService-Info.plist (iOS)
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
