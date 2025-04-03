import { auth, db } from "~/firebase.config";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Đăng nhập và lưu token
export const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const token = await user.getIdToken();

    // Lưu token vào AsyncStorage
    await AsyncStorage.setItem('userToken', token);
    console.log("Token đã lưu:", token);

    // Lấy vai trò từ Firestore
    const userDoc = await getDoc(doc(db, "accounts", user.uid));
    if (!userDoc.exists()) {
      throw new Error("Tài khoản không tồn tại trong hệ thống.");
    }
    const userData = userDoc.data();
    const userRole = userData.role ?? 'default'; // Mặc định là 'default' nếu không có role
    await AsyncStorage.setItem('userRole', String(userRole)); // Chuyển thành chuỗi để lưu
    console.log("Vai trò người dùng đã lưu:", userRole);

    return { user, token, userRole };
  } catch (error) {
    const errorMessage = (error as Error).message || 'Đăng nhập thất bại';
    console.error("Lỗi đăng nhập:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Lấy token và kiểm tra tính hợp lệ
export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) return null;

    // Kiểm tra token còn hợp lệ không
    const user = auth.currentUser;
    if (!user) return null;

    const decodedToken = await user.getIdTokenResult();
    const currentTime = Math.floor(Date.now() / 1000);

    // Chuyển expirationTime từ chuỗi ISO thành Unix timestamp (giây)
    const expirationTime = Math.floor(new Date(decodedToken.expirationTime).getTime() / 1000);

    if (expirationTime < currentTime) {
      const newToken = await user.getIdToken(true); // Làm mới token
      await AsyncStorage.setItem('userToken', newToken);
      return newToken;
    }
    return token;
  } catch (error) {
    console.error("Error retrieving token:", error);
    return null;
  }
};

// Lấy vai trò người dùng
export const getUserRole = async () => {
  try {
    const role = await AsyncStorage.getItem('userRole');
    return role ?? 'default'; // Trả về 'default' nếu không có role
  } catch (error) {
    console.error("Error retrieving user role:", error);
    return null;
  }
};

// Đăng xuất
export const logout = async () => {
  try {
    await auth.signOut();
    await AsyncStorage.multiRemove(['userToken', 'userRole']);
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

// Gửi email đặt lại mật khẩu
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Email đặt lại mật khẩu đã được gửi đến:", email);
  } catch (error) {
    console.error("Lỗi khi gửi email đặt lại mật khẩu:", error);
    throw new Error("Gửi email đặt lại mật khẩu thất bại.");
  }
};