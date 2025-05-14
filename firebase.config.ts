import { getApps, initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Nhập Firestore
import { getStorage } from "firebase/storage"; // Nhập Storage (chỉ nhập một lần)
import { getAnalytics, logEvent, isSupported } from "firebase/analytics";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import Config from "./config";

// Sử dụng cấu hình từ Config
const firebaseConfig = {
  apiKey: Config.FIREBASE.API_KEY,
  authDomain: Config.FIREBASE.AUTH_DOMAIN,
  projectId: Config.FIREBASE.PROJECT_ID,
  storageBucket: Config.FIREBASE.STORAGE_BUCKET,
  messagingSenderId: Config.FIREBASE.MESSAGING_SENDER_ID,
  appId: Config.FIREBASE.APP_ID,
  measurementId: Config.FIREBASE.MEASUREMENT_ID,
};

// Kiểm tra cấu hình
console.log("Firebase config loaded");

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Sử dụng initializeAuth với AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Khởi tạo Firestore
export const db = getFirestore(app);

// Khởi tạo Storage (chỉ khai báo một lần, không thêm declare module)
export const storage = getStorage(app);

let analytics: any;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

const logCustomEvent = async () => {
  try {
    if (analytics) {
      logEvent(analytics, "custom_event", {
        item: "React Native",
        description: "Sử dụng Firebase Analytics trong React Native",
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