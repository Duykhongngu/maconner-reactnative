import axios from "axios";
import Config from "~/config";
import * as Linking from "expo-linking";
import { Alert } from "react-native";
import * as CryptoJS from "crypto-js";

/**
 * Gửi yêu cầu thanh toán đến MoMo và mở app/web thanh toán
 * @param amount Tổng tiền thanh toán
 * @param orderInfo Thông tin đơn hàng
 */
export const handleMoMoPayment = async (amount: number, orderInfo: string): Promise<boolean> => {
  try {
    // Validate configuration
    const { PARTNER_CODE: partnerCode, ACCESS_KEY: accessKey, SECRET_KEY: secretKey, ENDPOINT: endpoint, REDIRECT_URL: redirectUrl } = Config.MOMO;
    
    if (!partnerCode || !accessKey || !secretKey || !endpoint || !redirectUrl) {
      console.error("MoMo configuration missing. Check your environment variables.");
      Alert.alert("Lỗi", "Cấu hình thanh toán MoMo chưa được thiết lập.");
      return false;
    }

    // Ensure amount is valid
    if (!amount || amount <= 0) {
      Alert.alert("Lỗi", "Số tiền thanh toán không hợp lệ.");
      return false;
    }

    const requestId = `${partnerCode}-${Date.now()}`;
    const orderId = requestId;
    const requestType = "captureWallet";
    const extraData = "";
    const ipnUrl = redirectUrl; // Use redirectUrl as ipnUrl if not specified

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

    // Gửi yêu cầu
    const res = await axios.post(endpoint, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const payUrl = res.data.payUrl;

    if (payUrl) {
      await Linking.openURL(payUrl);
      return true;
    } else {
      console.error("MoMo response without payUrl:", res.data);
      Alert.alert("Lỗi", "Không lấy được link thanh toán từ MoMo.");
      return false;
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
    return false;
  }
};
