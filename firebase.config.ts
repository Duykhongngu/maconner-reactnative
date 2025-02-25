import { getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Nhập Firestore
import { getStorage } from "firebase/storage"; // Nhập Storage (chỉ nhập một lần)
import { getAnalytics, logEvent, isSupported } from "firebase/analytics";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAROIKd7YY1QWlMb-D_nASWFfSAEwrEpO8",
  authDomain: "maconer-c3047.firebaseapp.com",
  projectId: "maconer-c3047",
  storageBucket: "maconer-c3047.firebasestorage.app",
  messagingSenderId: "305889940349",
  appId: "1:305889940349:web:1ab2513ad44f9491b9f214",
  measurementId: "G-ZB9N2NZKY2",
};

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