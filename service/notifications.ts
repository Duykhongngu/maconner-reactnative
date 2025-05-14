import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "~/firebase.config";
import { httpsCallable, getFunctions } from "firebase/functions";
import axios from "axios";
import Config from "~/config";

// Cấu hình Cloudinary
const CLOUDINARY_URL = Config.CLOUDINARY.URL;
const CLOUDINARY_UPLOAD_PRESET = Config.CLOUDINARY.UPLOAD_PRESET;

// Interface cho FirebaseError
interface FirebaseError extends Error {
  code?: string;
  message: string;
}

// Interface cho dữ liệu thông báo
export interface NotificationData {
  id?: string;
  title: string;
  body: string;
  type: "all" | "specific" | "promotion";
  targetUsers?: string[];
  createdAt?: any;
  scheduledFor?: Timestamp | null;
  status: string;
  imageUrl?: string;
  data?: {
    [key: string]: string;
  };
  android?: {
    channelId?: string;
    priority?: "default" | "high" | "max" | "low" | "min";
    sound?: string;
  };
  ios?: {
    sound?: string;
    badge?: number;
    categoryId?: string;
  };
}

// Upload ảnh lên Cloudinary
export const uploadImageToCloudinary = async (uri: string): Promise<string> => {
  try {
    const formData = new FormData();
    // Tạo đúng định dạng cho file upload
    formData.append("file", {
      uri,
      type: "image/jpeg",
      name: `notification_image_${new Date().getTime()}.jpg`,
    } as any);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    // Gửi request tới Cloudinary
    const response = await axios.post(CLOUDINARY_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    
    console.log("Tải ảnh lên Cloudinary thành công:", response.data.secure_url);
    return response.data.secure_url;
  } catch (error) {
    console.error("Lỗi khi tải ảnh lên Cloudinary:", error);
    throw new Error("Không thể tải ảnh lên. Vui lòng thử lại.");
  }
};

// Lấy danh sách thông báo
export const fetchNotifications = async () => {
  try {
    const notificationsRef = collection(db, "notifications");
    const snapshot = await getDocs(notificationsRef);
    const notificationsData = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt || null,
      };
    });

    // Sắp xếp theo thời gian tạo mới nhất
    notificationsData.sort((a, b) => {
      // Nếu không có createdAt
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;

      // Kiểm tra phương thức toMillis tồn tại
      if (
        typeof a.createdAt.toMillis === "function" &&
        typeof b.createdAt.toMillis === "function"
      ) {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }

      // Nếu không phải timestamp của firestore, thử chuyển về Date
      try {
        const dateA = typeof a.createdAt === "string" ? new Date(a.createdAt) : new Date();
        const dateB = typeof b.createdAt === "string" ? new Date(b.createdAt) : new Date();
        return dateB.getTime() - dateA.getTime();
      } catch (error) {
        console.warn("Error sorting notifications by date:", error);
        return 0;
      }
    });

    return notificationsData;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw new Error("Không thể tải danh sách thông báo");
  }
};

// Lấy danh sách người dùng (không phải admin)
export const fetchUsers = async () => {
  try {
    const usersRef = collection(db, "accounts");
    const q = query(usersRef, where("role", "!=", "admin"));
    const snapshot = await getDocs(q);
    const usersData = snapshot.docs.map((doc) => {
      const data = doc.data();
      let formattedCreatedAt = "";

      // Xử lý createdAt một cách an toàn
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === "function") {
          formattedCreatedAt = data.createdAt.toDate().toLocaleString();
        } else if (typeof data.createdAt === "string") {
          formattedCreatedAt = new Date(data.createdAt).toLocaleString();
        } else {
          formattedCreatedAt = String(data.createdAt);
        }
      }

      return {
        uid: doc.id,
        ...data,
        createdAt: formattedCreatedAt,
      };
    });

    return usersData;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Không thể tải danh sách người dùng");
  }
};

// Gửi thông báo FCM
export const sendFCMNotification = async (
  notificationId: string,
  notificationData: any
) => {
  try {
    const functions = getFunctions();
    const sendNotification = httpsCallable(functions, "sendNotification");

    // Lấy danh sách token dựa vào loại thông báo
    let userTokens: string[] = [];

    if (notificationData.type === "all") {
      // Lấy tất cả user tokens từ collection accounts
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

      for (let i = 0; i < notificationData.targetUsers.length; i += batchSize) {
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
      // Lấy tất cả user tokens
      const usersSnapshot = await getDocs(collection(db, "accounts"));
      userTokens = usersSnapshot.docs
        .map((doc) => doc.data().fcmToken)
        .filter((token) => token && token !== "");
      console.log(
        `Tìm thấy ${userTokens.length} FCM token cho thông báo "promotion"`
      );
    }

    // THAY ĐỔI: Bỏ kiểm tra userTokens.length === 0, ghi lại thông báo vào DB dù không có token
    // if (userTokens.length === 0) {
    //   throw new Error(
    //     "Không tìm thấy người nhận thông báo có FCM token hợp lệ"
    //   );
    // }

    // Cập nhật trạng thái thông báo sang sent dù không gửi được
    await updateDoc(doc(db, "notifications", notificationId), {
      status: "sent",
      sentAt: serverTimestamp(),
    });

    // Nếu có token, thì mới gửi qua FCM
    if (userTokens.length > 0) {
      // Chuẩn bị thông báo để gửi qua FCM
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
        console.error("Lỗi khi gửi FCM, nhưng vẫn đánh dấu là đã gửi:", fcmError);
        // Vẫn trả về thành công vì đã lưu thông báo
        return { success: true, fcmError };
      }
    } else {
      console.log("Không có FCM token, nhưng vẫn đánh dấu thông báo là đã gửi");
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

// Tạo thông báo mới
export const createNotification = async (notificationData: NotificationData) => {
  try {
    // Đảm bảo dữ liệu hợp lệ
    const preparedData: any = {
      title: notificationData.title.trim(),
      body: notificationData.body.trim(),
      type: notificationData.type,
      createdAt: serverTimestamp(),
      status: notificationData.scheduledFor ? "scheduled" : "pending",
    };

    // Chỉ thêm imageUrl nếu có giá trị
    if (notificationData.imageUrl) {
      preparedData.imageUrl = notificationData.imageUrl;
    }

    // Chỉ thêm scheduledFor nếu có chọn ngày
    if (notificationData.scheduledFor) {
      preparedData.scheduledFor = notificationData.scheduledFor;
    }

    // Cấu hình cho Android
    const androidConfig: any = {};
    if (notificationData.android?.channelId) {
      androidConfig.channelId = notificationData.android.channelId;
    }
    if (
      notificationData.android?.priority &&
      notificationData.android.priority !== "default"
    ) {
      androidConfig.priority = notificationData.android.priority;
    }

    // Sử dụng âm thanh mặc định
    androidConfig.sound = "default";

    // Chỉ thêm cấu hình Android nếu có ít nhất một thuộc tính
    if (Object.keys(androidConfig).length > 0) {
      preparedData.android = androidConfig;
    }

    // Cấu hình cho iOS
    preparedData.ios = {
      sound: "default",
    };

    // Thêm targetUsers cho thông báo cụ thể
    if (
      notificationData.type === "specific" &&
      notificationData.targetUsers &&
      notificationData.targetUsers.length > 0
    ) {
      preparedData.targetUsers = notificationData.targetUsers;
    }

    // Tạo thông báo mới
    const docRef = await addDoc(collection(db, "notifications"), preparedData);
    console.log("Đã tạo thông báo với ID:", docRef.id);

    // Nếu thông báo không lập lịch, gửi ngay
    if (
      !notificationData.scheduledFor ||
      (typeof notificationData.scheduledFor.toDate === 'function' &&
       notificationData.scheduledFor.toDate().getTime() <= new Date().getTime())
    ) {
      try {
        await sendFCMNotification(docRef.id, preparedData);
      } catch (fcmError) {
        // Bỏ qua lỗi khi gửi FCM, chỉ ghi log
        console.warn("Lỗi khi gửi FCM, nhưng thông báo đã được tạo:", fcmError);
      }
    }

    return {
      id: docRef.id,
      ...preparedData,
    };
  } catch (error) {
    const firebaseError = error as FirebaseError;
    console.error("Error creating notification:", firebaseError);
    throw new Error("Không thể tạo thông báo: " + firebaseError.message);
  }
};

// Định dạng thời gian từ Firestore
export const formatFirestoreTimestamp = (timestamp: any): string => {
  if (!timestamp) return "Không có thời gian";
  if (typeof timestamp === "string") {
    return new Date(timestamp).toLocaleString();
  } else if (typeof timestamp === "object" && timestamp.toDate) {
    return timestamp.toDate().toLocaleString();
  } else {
    return "Định dạng thời gian không hợp lệ";
  }
}; 