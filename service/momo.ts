import axios from "axios";
import Config from "~/config";
import * as Linking from "expo-linking";
import { Alert, Platform } from "react-native";
import * as CryptoJS from "crypto-js";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "~/firebase.config";

// Đối tượng chứa trạng thái của các giao dịch thanh toán
export type PaymentStatus = "pending" | "success" | "failed" | "cancelled";

interface MomoPaymentResult {
  status: PaymentStatus;
  orderId?: string;
  transactionId?: string;
  message?: string;
}

// Lưu trữ trạng thái thanh toán theo orderId
const paymentStatuses: Record<string, PaymentStatus> = {};
const paymentCallbacks: Record<string, ((result: MomoPaymentResult) => void)[]> = {};

// Các deeplink schema cho URL callback
const APP_SCHEME = "myapp"; // Cần đảm bảo trùng với schema trong app.json

/**
 * Đăng ký lắng nghe URL mở từ MoMo
 */
export const setupMoMoDeepLinking = () => {
  console.log("Setting up MoMo deep linking...");
  
  // Đăng ký xử lý URL mở từ bên ngoài
  try {
    Linking.addEventListener("url", handleDeepLink);
    
    // Kiểm tra nếu app được mở từ URL bên ngoài
    Linking.getInitialURL().then((url) => {
      console.log("Initial URL:", url);
      if (url) {
        handleDeepLink({ url });
      }
    });
  } catch (error) {
    console.error("Error setting up deep linking:", error);
  }
};

/**
 * Kiểm tra xem app có thể mở URL không
 */
export const checkCanOpenUrl = async (url: string): Promise<boolean> => {
  try {
    const canOpen = await Linking.canOpenURL(url);
    console.log(`Can open URL ${url}: ${canOpen}`);
    return canOpen;
  } catch (error) {
    console.error("Error checking URL:", error);
    return false;
  }
};

/**
 * Xử lý deeplink khi quay lại từ MoMo
 */
const handleDeepLink = (event: { url: string }) => {
  const url = event.url;
  console.log("Received deeplink:", url);
  
  // Kiểm tra nếu là callback từ MoMo
  if (url && url.includes("momo-callback")) {
    try {
      // Parse URL để lấy tham số
      const urlParams = parseUrlParams(url);
      
      // Lấy thông tin từ URL parameters
      const orderId = urlParams.orderId || "";
      const resultCode = urlParams.resultCode;
      const transactionId = urlParams.transactionId || "";
      
      console.log(`MoMo callback with orderId: ${orderId}, resultCode: ${resultCode}, transactionId: ${transactionId}`);
      
      // Cập nhật trạng thái thanh toán
      if (resultCode === "0" || resultCode === "9000") {
        // Thanh toán thành công
        updatePaymentStatus(orderId, "success", transactionId);
      } else if (resultCode === "1006" || resultCode === "1007") {
        // Người dùng hủy thanh toán
        updatePaymentStatus(orderId, "cancelled");
      } else {
        // Các lỗi khác
        updatePaymentStatus(orderId, "failed");
      }
      
      // Cập nhật trạng thái thanh toán vào Firestore để các thiết bị khác cũng nhận được
      updatePaymentStatusFirestore(orderId, {
        status: paymentStatuses[orderId] || "pending",
        transactionId: transactionId || null,
        resultCode: resultCode || null,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Lỗi xử lý deeplink:", error);
    }
  }
};

/**
 * Cập nhật trạng thái thanh toán vào Firestore
 */
const updatePaymentStatusFirestore = async (
  orderId: string, 
  statusData: {
    status: PaymentStatus;
    transactionId?: string | null;
    resultCode?: string | null;
    updatedAt: string;
  }
) => {
  try {
    const paymentStatusRef = doc(db, "momoPayments", orderId);
    const statusDoc = await getDoc(paymentStatusRef);
    
    if (statusDoc.exists()) {
      await updateDoc(paymentStatusRef, statusData);
    } else {
      await setDoc(paymentStatusRef, statusData);
    }
    
    console.log(`Updated payment status in Firestore for ${orderId}: ${statusData.status}`);
  } catch (error) {
    console.error("Error updating payment status in Firestore:", error);
  }
};

/**
 * Parse URL parameters từ chuỗi URL
 */
const parseUrlParams = (url: string): Record<string, string> => {
  try {
    // Trích xuất phần query từ URL
    const queryString = url.split('?')[1];
    if (!queryString) return {};
    
    // Parse các tham số
    const params: Record<string, string> = {};
    const pairs = queryString.split('&');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
    
    return params;
  } catch (e) {
    console.error("Lỗi khi phân tích URL:", e);
    return {};
  }
};

/**
 * Cập nhật trạng thái thanh toán theo orderId và thực thi các callbacks
 */
const updatePaymentStatus = (orderId: string, status: PaymentStatus, transactionId?: string) => {
  paymentStatuses[orderId] = status;
  console.log(`Cập nhật trạng thái đơn hàng ${orderId}: ${status}`);
  
  // Thực thi các callbacks đã đăng ký
  const callbacks = paymentCallbacks[orderId] || [];
  const result: MomoPaymentResult = { 
    status, 
    orderId,
    transactionId
  };
  
  callbacks.forEach(callback => callback(result));
  
  // Xóa callback sau khi đã thực thi
  if (status !== "pending") {
    paymentCallbacks[orderId] = [];
  }
};

/**
 * Đăng ký callback khi trạng thái thanh toán thay đổi
 */
export const onPaymentStatusChange = (
  orderId: string, 
  callback: (result: MomoPaymentResult) => void
): (() => void) => {
  if (!paymentCallbacks[orderId]) {
    paymentCallbacks[orderId] = [];
  }
  
  paymentCallbacks[orderId].push(callback);
  
  // Trả về hàm để hủy đăng ký
  return () => {
    paymentCallbacks[orderId] = paymentCallbacks[orderId].filter(cb => cb !== callback);
  };
};

/**
 * Gửi yêu cầu thanh toán đến MoMo và đợi kết quả
 * @param amount Tổng tiền thanh toán
 * @param orderInfo Thông tin đơn hàng
 * @returns Promise<MomoPaymentResult> Kết quả thanh toán
 */
export const handleMoMoPayment = async (amount: number, orderInfo: string): Promise<MomoPaymentResult> => {
  try {
    // Validate configuration
    const { PARTNER_CODE: partnerCode, ACCESS_KEY: accessKey, SECRET_KEY: secretKey, ENDPOINT: endpoint } = Config.MOMO;
    
    // Sử dụng deeplink scheme của app
    const redirectUrl = `${APP_SCHEME}://momo-callback`;
    
    console.log(`MoMo payment initiated with redirectUrl: ${redirectUrl}`);
    
    if (!partnerCode || !accessKey || !secretKey || !endpoint) {
      console.error("MoMo configuration missing. Check your environment variables.");
      Alert.alert("Lỗi", "Cấu hình thanh toán MoMo chưa được thiết lập.");
      return { status: "failed", message: "Cấu hình MoMo thiếu" };
    }

    // Ensure amount is valid
    if (!amount || amount <= 0) {
      Alert.alert("Lỗi", "Số tiền thanh toán không hợp lệ.");
      return { status: "failed", message: "Số tiền không hợp lệ" };
    }

    const requestId = `${partnerCode}-${Date.now()}`;
    const orderId = requestId;
    const requestType = "captureWallet";
    const extraData = "";
    const ipnUrl = redirectUrl; 

    // Tạo chuỗi raw signature theo yêu cầu MoMo
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    
    // Tạo chữ ký HMAC SHA256
    const signature = CryptoJS.HmacSHA256(rawSignature, secretKey).toString(CryptoJS.enc.Hex);

    // Payload gửi lên MoMo
    const payload = {
      partnerCode,
      accessKey,
      requestId,
      amount: amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl: ipnUrl,
      extraData,
      requestType,
      signature,
      lang: "vi",
    };

    console.log("Sending MoMo request:", JSON.stringify({ 
      endpoint,
      partnerCode,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl
    }));

    // Đặt trạng thái ban đầu là pending và lưu vào Firestore
    updatePaymentStatus(orderId, "pending");
    await updatePaymentStatusFirestore(orderId, {
      status: "pending",
      updatedAt: new Date().toISOString()
    });

    // Gửi yêu cầu
    const res = await axios.post(endpoint, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("MoMo API response:", JSON.stringify(res.data));
    
    const payUrl = res.data.payUrl;

    if (payUrl) {
      // Mở URL thanh toán MoMo
      console.log(`Opening MoMo payment URL: ${payUrl}`);
      const canOpen = await Linking.canOpenURL(payUrl);
      
      if (!canOpen) {
        console.warn(`Cannot open URL: ${payUrl}`);
        Alert.alert("Lỗi", "Không thể mở ứng dụng MoMo. Vui lòng cài đặt MoMo hoặc thử lại sau.");
        return { status: "failed", message: "Không thể mở ứng dụng MoMo" };
      }
      
      await Linking.openURL(payUrl);
      
      // Trả về thông tin orderId để theo dõi trạng thái sau này
      return { status: "pending", orderId: orderId };
    } else {
      console.error("MoMo response without payUrl:", res.data);
      Alert.alert("Lỗi", "Không lấy được link thanh toán từ MoMo.");
      return { status: "failed", message: "Không lấy được link thanh toán" };
    }
  } catch (error: any) {
    console.error("MoMo error:", error);
    
    let errorMessage = "Không thể tạo thanh toán MoMo.";
    
    // Extract more detailed error information if available
    if (error.response) {
      console.error("MoMo API response error:", {
        status: error.response.status,
        data: error.response.data
      });
      
      // If MoMo provides specific error messages
      if (error.response.data && error.response.data.message) {
        errorMessage = `Lỗi MoMo: ${error.response.data.message}`;
      }
    }
    
    Alert.alert("Lỗi", errorMessage);
    return { status: "failed", message: errorMessage };
  }
};

/**
 * Kiểm tra trạng thái thanh toán theo orderId
 * @param orderId ID của đơn hàng
 * @returns Trạng thái thanh toán hiện tại
 */
export const getPaymentStatus = (orderId: string): PaymentStatus => {
  return paymentStatuses[orderId] || "pending";
};

/**
 * Lắng nghe trạng thái thanh toán từ Firestore
 */
export const listenToPaymentStatus = (orderId: string, callback: (status: PaymentStatus) => void) => {
  const paymentStatusRef = doc(db, "momoPayments", orderId);
  
  return onSnapshot(paymentStatusRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      const status = data?.status as PaymentStatus;
      
      if (status && status !== "pending") {
        // Cập nhật trạng thái local
        paymentStatuses[orderId] = status;
        
        // Gọi callback với trạng thái mới
        callback(status);
      }
    }
  });
};

/**
 * Đợi cho đến khi thanh toán hoàn tất (thành công hoặc thất bại)
 * @param orderId ID của đơn hàng
 * @param timeout Thời gian tối đa đợi (ms)
 * @returns Promise<MomoPaymentResult> Kết quả thanh toán cuối cùng
 */
export const waitForPaymentResult = (orderId: string, timeout: number = 300000): Promise<MomoPaymentResult> => {
  const startTime = Date.now();
  console.log(`Waiting for payment result for orderId: ${orderId}`);
  
  return new Promise((resolve) => {
    // Thiết lập timeout
    const timeoutId = setTimeout(() => {
      unsubscribe(); // Hủy lắng nghe khi timeout
      console.log(`Payment timeout for ${orderId}`);
      resolve({ status: "cancelled", message: "Hết thời gian chờ thanh toán" });
    }, timeout);
    
    // Hàm callback khi trạng thái thanh toán thay đổi
    const paymentCallback = (result: MomoPaymentResult) => {
      if (result.status !== "pending") {
        clearTimeout(timeoutId);
        unsubscribe();
        console.log(`Payment completed via callback: ${JSON.stringify(result)}`);
        resolve(result);
      }
    };
    
    // Đăng ký callback
    const unsubscribeCallback = onPaymentStatusChange(orderId, paymentCallback);
    
    // Lắng nghe trạng thái từ Firestore
    const unsubscribeFirestore = listenToPaymentStatus(orderId, (status) => {
      if (status !== "pending") {
        clearTimeout(timeoutId);
        unsubscribeCallback();
        console.log(`Payment completed via Firestore: ${status}`);
        resolve({ status, orderId });
      }
    });
    
    // Hàm để hủy tất cả lắng nghe
    const unsubscribe = () => {
      unsubscribeCallback();
      unsubscribeFirestore();
    };
    
    // Kiểm tra tình trạng hiện tại
    const currentStatus = getPaymentStatus(orderId);
    if (currentStatus !== "pending") {
      clearTimeout(timeoutId);
      unsubscribe();
      console.log(`Payment already completed: ${currentStatus}`);
      resolve({ status: currentStatus, orderId });
    }
  });
};
