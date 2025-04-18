import { Alert } from "react-native";
import { auth, db } from "~/firebase.config";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  increment,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  writeBatch,
} from "firebase/firestore";
import { markVoucherAsUsed } from "./vouchers";

// Định nghĩa các interface
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
  image?: any;
  images?: string[];
  description?: string;
}

export interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: "stripe" | "cod";
  voucherCode?: string; // Optional voucher code field
}

export interface OrderData extends FormData {
  userId: string;
  cartItems: CartItem[];
  subtotal: string;
  shippingFee: string;
  discountAmount?: string; // Optional discount amount from voucher
  voucherId?: string; // Optional voucher ID
  total: number;
  date: string;
  status: "pending" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed";
  country: string;
}

export interface Order extends OrderData {
  id: string;
}

// Hằng số cho Stripe
export const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51REneqEDx5zvyNiagws0fpjFbifWh6v2ODyRoIs5RUDjZD72JAEijZSzCTy8PrqouJGYCLBqMvODB1DIxoVwrETw00VMnggwGW";

// Hàm thanh toán qua Stripe (mô phỏng)
export const initializeStripePayment = async (values: FormData): Promise<boolean> => {
  try {
    // Đây là mô phỏng, trong thực tế sẽ kết nối với Stripe API
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        "Payment Simulation",
        "In a real implementation, this would connect to Stripe's servers. For now, we'll simulate a successful payment.",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              resolve(false);
            },
          },
          {
            text: "Simulate Success",
            onPress: () => {
              // Mô phỏng thanh toán thành công
              resolve(true);
            },
          },
        ],
        { cancelable: false }
      );
    });
  } catch (error) {
    console.error("Payment error:", error);
    Alert.alert("Error", "Could not process payment. Please try again.");
    return false;
  }
};

// Lấy thông tin người dùng từ Firestore
export const getUserData = async (userId: string) => {
  try {
    const userDocRef = doc(db, "accounts", userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

// Tạo đơn hàng mới
export const createOrder = async (orderData: Omit<OrderData, "userId">): Promise<Order> => {
  if (!auth.currentUser) {
    throw new Error("User not logged in");
  }

  try {
    const fullOrderData = {
      userId: auth.currentUser.uid,
      ...orderData,
    };

    // Lưu đơn hàng vào collection 'orderManager'
    const docRef = await addDoc(collection(db, "orderManager"), fullOrderData);
    
    // Nếu có voucher, tăng số lần sử dụng
    if (orderData.voucherId) {
      // Tăng số lần sử dụng của voucher
      const voucherRef = doc(db, "vouchers", orderData.voucherId);
      await updateDoc(voucherRef, {
        usageCount: increment(1),
        updatedAt: new Date(),
      });
      
      // Tìm và đánh dấu voucher của người dùng là đã sử dụng
      try {
        // Tìm user voucher tương ứng
        const userVouchersQuery = query(
          collection(db, "userVouchers"),
          where("userId", "==", auth.currentUser.uid),
          where("voucherId", "==", orderData.voucherId),
          where("isUsed", "==", false)
        );
        
        const userVouchersSnapshot = await getDocs(userVouchersQuery);
        
        if (!userVouchersSnapshot.empty) {
          // Lấy ID của userVoucher đầu tiên tìm thấy
          const userVoucherId = userVouchersSnapshot.docs[0].id;
          
          // Đánh dấu là đã sử dụng
          await markVoucherAsUsed(userVoucherId);
        }
      } catch (error) {
        console.error("Error marking user voucher as used:", error);
        // Không làm ảnh hưởng đến quá trình đặt hàng nếu đánh dấu voucher thất bại
      }
    }
    
    return {
      id: docRef.id,
      ...fullOrderData,
    };
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

// Cập nhật số lượng sản phẩm đã mua
export const updateProductStock = async (item: CartItem): Promise<boolean> => {
  try {
    const productRef = doc(db, "products", item.id);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      const productData = productSnap.data();
      const currentStock = productData.stockQuantity || 0;

      // Kiểm tra nếu còn đủ hàng
      if (currentStock < item.quantity) {
        Alert.alert(
          "Out of Stock",
          `Sorry, there are only ${currentStock} units of "${item.name}" available.`
        );
        return false;
      }

      // Cập nhật số lượng mua và tồn kho
      await updateDoc(productRef, {
        purchaseCount: increment(item.quantity),
        stockQuantity: currentStock - item.quantity,
        inStock: currentStock - item.quantity > 0,
      });

      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error updating product ${item.id}:`, error);
    return false;
  }
};

// Cập nhật danh sách sản phẩm trending
export const updateTrendingProducts = async (): Promise<void> => {
  try {
    // Kiểm tra xem danh mục Trending có bật tự động cập nhật không
    const categoriesRef = collection(db, "categories");
    const q = query(
      categoriesRef,
      where("name", "==", "Trending"),
      where("autoUpdate", "==", true)
    );
    const categorySnap = await getDocs(q);

    if (!categorySnap.empty) {
      // Tìm thấy danh mục Trending với autoUpdate = true
      const trendingCategory = categorySnap.docs[0];

      // Lấy 20 sản phẩm bán chạy nhất
      const productsRef = collection(db, "products");
      const topProductsQuery = query(
        productsRef,
        orderBy("purchaseCount", "desc"),
        limit(20)
      );
      const topProductsSnap = await getDocs(topProductsQuery);

      const topProductIds = topProductsSnap.docs.map((doc) => doc.id);

      // Cập nhật danh sách sản phẩm trending
      await updateDoc(doc(db, "categories", trendingCategory.id), {
        productIds: topProductIds,
        lastUpdated: new Date().toISOString(),
      });

      // Cập nhật trường isTrending cho từng sản phẩm
      const batch = writeBatch(db);

      // Đầu tiên, đặt tất cả sản phẩm thành không trending
      const allProductsQuery = query(
        productsRef,
        where("isTrending", "==", true)
      );
      const allProductsSnap = await getDocs(allProductsQuery);

      allProductsSnap.docs.forEach((productDoc) => {
        batch.update(productDoc.ref, { isTrending: false });
      });

      // Sau đó, đặt các sản phẩm top thành trending
      for (const productId of topProductIds) {
        const productRef = doc(db, "products", productId);
        batch.update(productRef, { isTrending: true });
      }

      await batch.commit();
    }
  } catch (error) {
    console.error("Error updating trending products:", error);
    // Tiếp tục xử lý đơn hàng ngay cả khi cập nhật trending thất bại
  }
};

// Hàm xử lý toàn bộ quá trình thanh toán
export const processCheckout = async (
  values: FormData & { voucherId?: string, discountAmount?: string }, 
  cartItems: CartItem[], 
  subtotal: number, 
  shippingFee: number
): Promise<Order | null> => {
  // Kiểm tra đăng nhập
  if (!auth.currentUser) {
    Alert.alert("Error", "You need to be logged in to place an order.");
    return null;
  }

  // Kiểm tra giỏ hàng
  if (cartItems.length === 0) {
    Alert.alert("Error", "Your cart is empty!");
    return null;
  }

  // Xử lý thanh toán nếu chọn Stripe
  let paymentStatus: "pending" | "paid" | "failed" = "pending";

  if (values.paymentMethod === "stripe") {
    const paymentSuccess = await initializeStripePayment(values);
    if (!paymentSuccess) {
      return null; // Thoát nếu thanh toán thất bại
    }
    paymentStatus = "paid";
  }

  try {
    // Định dạng lại các mục trong giỏ hàng
    const formattedCartItems = cartItems.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      color: item.color || "Default",
      size: item.size || "Standard",
      image: item.image,
      images: item.images || [item.image],
      description: item.description || "",
    }));

    // Apply discount if there's a voucher
    const discountAmount = values.discountAmount ? parseFloat(values.discountAmount) : 0;
    const total = subtotal + shippingFee - discountAmount;

    // Dữ liệu đơn hàng
    const orderData: Omit<OrderData, "userId"> = {
      ...values,
      cartItems: formattedCartItems,
      subtotal: subtotal.toFixed(2),
      shippingFee: shippingFee.toFixed(2),
      discountAmount: values.discountAmount,
      voucherId: values.voucherId,
      total,
      date: new Date().toISOString(),
      status: "pending",
      paymentStatus,
      country: "Vietnam",
    };

    // Tạo đơn hàng mới
    const newOrder = await createOrder(orderData);

    // Cập nhật số lượng mua cho từng sản phẩm
    for (const item of formattedCartItems) {
      const result = await updateProductStock(item);
      if (!result) {
        return null; // Nếu có lỗi với bất kỳ sản phẩm nào
      }
    }

    // Cập nhật danh sách sản phẩm trending
    await updateTrendingProducts();

    return newOrder;
  } catch (error) {
    console.error("Error placing order:", error);
    Alert.alert("Error", "Failed to place your order. Please try again.");
    return null;
  }
}; 