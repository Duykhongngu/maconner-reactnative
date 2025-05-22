import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, logEvent, isSupported } from "firebase/analytics";
import Config from "./config";

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: Config.FIREBASE.API_KEY,
  authDomain: Config.FIREBASE.AUTH_DOMAIN,
  projectId: Config.FIREBASE.PROJECT_ID,
  storageBucket: Config.FIREBASE.STORAGE_BUCKET,
  messagingSenderId: Config.FIREBASE.MESSAGING_SENDER_ID,
  appId: Config.FIREBASE.APP_ID,
  measurementId: Config.FIREBASE.MEASUREMENT_ID,
};

// Chỉ initialize nếu chưa có app nào
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ✅ Khởi tạo auth đơn giản cho Web (không cần persistence tùy biến)
const auth = getAuth(app);

// ✅ Firestore cho Web
export const db = getFirestore(app);

// ✅ Storage cho Web
export const storage = getStorage(app);

// ✅ Analytics (chỉ có tác dụng nếu chạy trong trình duyệt)
let analytics: any = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

// Hàm log sự kiện custom
const logCustomEvent = async () => {
  try {
    if (analytics) {
      logEvent(analytics, "custom_event", {
        item: "WebApp",
        description: "Gửi sự kiện từ Firebase Web SDK",
      });
      console.log("Sự kiện đã được ghi nhận!");
    } else {
      console.log("Analytics không được hỗ trợ trong môi trường này.");
    }
  } catch (error) {
    console.error("Lỗi khi log sự kiện:", error);
  }
};

export { auth, analytics, logCustomEvent };
