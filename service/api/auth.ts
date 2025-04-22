import { auth, db } from "~/firebase.config";
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  createUserWithEmailAndPassword,
  AuthErrorCodes
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number format
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
  return phoneRegex.test(phone);
};

// Format Firebase error messages for user-friendly display
export const formatFirebaseError = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/user-not-found":
      return "Tài khoản không tồn tại";
    case "auth/wrong-password":
      return "Mật khẩu không chính xác";
    case "auth/email-already-in-use":
      return "Email đã được sử dụng, vui lòng chọn email khác";
    case "auth/invalid-email":
      return "Email không hợp lệ";
    case "auth/weak-password":
      return "Mật khẩu quá yếu, vui lòng chọn mật khẩu mạnh hơn";
    case "auth/too-many-requests":
      return "Quá nhiều yêu cầu, vui lòng thử lại sau";
    case "auth/network-request-failed":
      return "Lỗi kết nối mạng, vui lòng kiểm tra kết nối của bạn";
    default:
      return "Đã xảy ra lỗi. Vui lòng thử lại sau.";
  }
};

// Đăng ký tài khoản mới
export const register = async (
  email: string, 
  password: string, 
  name: string, 
  phoneNumber: string, 
  address: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Lưu thông tin người dùng vào Firestore
    await setDoc(doc(db, "accounts", user.uid), {
      email: email,
      displayName: name,
      phone_number: phoneNumber,
      address: address,
      role: 1, // Vai trò user
      photoURL: null,
      createdAt: new Date().toISOString(),
    });

    return user;
  } catch (error: any) {
    console.error("Lỗi đăng ký:", error);
    throw error;
  }
};

// Validate form
export const validateLoginForm = (email: string, password: string) => {
  const errors: { [key: string]: string } = {};
  
  if (!email.trim()) {
    errors.email = "Vui lòng nhập email";
  } else if (!isValidEmail(email)) {
    errors.email = "Email không đúng định dạng";
  }
  
  if (!password) {
    errors.password = "Vui lòng nhập mật khẩu";
  } else if (password.length < 6) {
    errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateRegisterForm = (
  email: string, 
  password: string, 
  name: string, 
  phoneNumber: string, 
  address: string
) => {
  const errors: { [key: string]: string } = {};
  
  if (!email.trim()) {
    errors.email = "Vui lòng nhập email";
  } else if (!isValidEmail(email)) {
    errors.email = "Email không đúng định dạng";
  }
  
  if (!password) {
    errors.password = "Vui lòng nhập mật khẩu";
  } else if (password.length < 6) {
    errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
  }
  
  if (!name.trim()) {
    errors.name = "Vui lòng nhập tên hiển thị";
  }
  
  if (!phoneNumber.trim()) {
    errors.phoneNumber = "Vui lòng nhập số điện thoại";
  } else if (!isValidPhone(phoneNumber)) {
    errors.phoneNumber = "Số điện thoại không đúng định dạng";
  }
  
  if (!address.trim()) {
    errors.address = "Vui lòng nhập địa chỉ";
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

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
    throw error;
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
    throw error;
  }
};