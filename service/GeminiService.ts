
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

const GEMINI_API_KEY = 'AIzaSyCG4jzv6Y4cuMBIFHRJPwxkSa9Unw3Lt3w';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SHOP_INFO = {
  name: 'Maconner Shop',
  phone: '0389693329',
  email: 'duyngdev@gmail.com',
  facebook: 'https://www.facebook.com/duydangngu15',
  address: 'Số 15 ngõ 48 Phố Văn Trì, Minh Khai, Bắc Từ Liêm, Hà Nội',
};

const createPrompt = (userMessage: string) => {
  return `Bạn là trợ lý ảo của ${SHOP_INFO.name}, một cửa hàng bán đồ thể thao và phụ kiện tập luyện.

THÔNG TIN LIÊN HỆ CỦA SHOP:
- Số điện thoại: ${SHOP_INFO.phone}
- Email: ${SHOP_INFO.email}
- Fanpage Facebook: ${SHOP_INFO.facebook}
- Địa chỉ: ${SHOP_INFO.address}

CÁCH TRẢ LỜI:
1. Nếu khách hỏi về sản phẩm:
   - Hỏi rõ nhu cầu sử dụng
   - Tư vấn size, chất liệu phù hợp
   - Giới thiệu các mẫu phổ biến
   - Cung cấp thông tin giá cả nếu có

2. Nếu khách cần hỗ trợ đơn hàng:
   - Yêu cầu mã đơn hàng
   - Hướng dẫn cách kiểm tra
   - Giải thích chính sách đổi trả, bảo hành

3. Nếu khách hỏi về thanh toán:
   - Giới thiệu các phương thức thanh toán
   - Hướng dẫn quy trình đặt hàng
   - Thông tin về phí vận chuyển

4. Với mọi câu hỏi:
   - Trả lời ngắn gọn, rõ ràng
   - Luôn thân thiện, lịch sự
   - Nếu không chắc chắn, đề nghị khách liên hệ trực tiếp qua:
     + Số điện thoại: ${SHOP_INFO.phone}
     + Email: ${SHOP_INFO.email}
     + Facebook: ${SHOP_INFO.facebook}
     + Tại cửa hàng: ${SHOP_INFO.address}

Câu hỏi của khách hàng là: ${userMessage}

Hãy trả lời một cách chuyên nghiệp và đầy đủ thông tin.`;
};

export const sendMessageToChatGPT = async (userMessage: string): Promise<string> => {
  if (!userMessage.trim()) {
    return "Vui lòng nhập tin nhắn";
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: createPrompt(userMessage)
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    console.log('API Response:', data);

    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid API Response:', data);
      throw new Error('Invalid response format from Gemini API');
    }

    const reply = data.candidates[0].content.parts[0].text.trim();
    return reply || 'Xin lỗi, tôi không thể xử lý yêu cầu này. Vui lòng thử lại.';

  } catch (error) {
    console.error('Chat API Error:', error);
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        return 'Xin lỗi, hệ thống đang quá tải. Vui lòng thử lại sau ít phút.';
      }
      if (errorMessage.includes('unauthorized') || errorMessage.includes('api key') || errorMessage.includes('invalid')) {
        return 'Xin lỗi, đang có vấn đề với hệ thống chat. Vui lòng liên hệ admin.';
      }
      console.error('Detailed error:', error.message);
    }

    return 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau hoặc liên hệ trực tiếp với shop qua số điện thoại hoặc email.';
  }
}; 

