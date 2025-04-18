import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "~/firebase.config";

export interface Voucher {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscount?: number;
  minPurchase?: number;
  startDate: Timestamp;
  endDate: Timestamp;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  applicableProducts: "all" | string[]; // "all" hoặc mảng ID sản phẩm
  applicableCategories: "all" | string[]; // "all" hoặc mảng ID danh mục
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface VoucherFormData {
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscount?: number;
  minPurchase?: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  usageLimit?: number;
  applicableProducts: "all" | string[];
  applicableCategories: "all" | string[];
}

export const addVoucher = async (voucherData: VoucherFormData): Promise<string> => {
  try {
    // Kiểm tra xem code đã tồn tại chưa
    const existingVoucher = await checkVoucherCodeExists(voucherData.code);
    if (existingVoucher) {
      throw new Error("Mã voucher đã tồn tại");
    }

    const now = Timestamp.now();
    const newVoucher = {
      ...voucherData,
      startDate: Timestamp.fromDate(voucherData.startDate),
      endDate: Timestamp.fromDate(voucherData.endDate),
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, "vouchers"), newVoucher);
    return docRef.id;
  } catch (error) {
    console.error("Error adding voucher:", error);
    throw error;
  }
};

export const updateVoucher = async (voucherId: string, voucherData: Partial<VoucherFormData>): Promise<void> => {
  try {
    const voucherRef = doc(db, "vouchers", voucherId);
    
    // Nếu có cập nhật code, kiểm tra xem code mới đã tồn tại chưa
    if (voucherData.code) {
      const existingVoucher = await checkVoucherCodeExists(voucherData.code);
      if (existingVoucher && existingVoucher.id !== voucherId) {
        throw new Error("Mã voucher đã tồn tại");
      }
    }

    const updateData: any = {
      ...voucherData,
      updatedAt: Timestamp.now(),
    };

    // Chuyển đổi các trường Date thành Timestamp
    if (voucherData.startDate) {
      updateData.startDate = Timestamp.fromDate(voucherData.startDate);
    }
    if (voucherData.endDate) {
      updateData.endDate = Timestamp.fromDate(voucherData.endDate);
    }

    await updateDoc(voucherRef, updateData);
  } catch (error) {
    console.error("Error updating voucher:", error);
    throw error;
  }
};

export const deleteVoucher = async (voucherId: string): Promise<void> => {
  try {
    const voucherRef = doc(db, "vouchers", voucherId);
    await deleteDoc(voucherRef);
  } catch (error) {
    console.error("Error deleting voucher:", error);
    throw error;
  }
};

export const fetchVouchers = async (): Promise<Voucher[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "vouchers"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Voucher));
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    throw error;
  }
};

export const fetchActiveVouchers = async (): Promise<Voucher[]> => {
  try {
    const now = Timestamp.now();
    const q = query(
      collection(db, "vouchers"),
      where("isActive", "==", true),
      where("startDate", "<=", now),
      where("endDate", ">=", now)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Voucher));
  } catch (error) {
    console.error("Error fetching active vouchers:", error);
    throw error;
  }
};

export const getVoucherById = async (voucherId: string): Promise<Voucher | null> => {
  try {
    const voucherRef = doc(db, "vouchers", voucherId);
    const voucherSnap = await getDoc(voucherRef);
    
    if (voucherSnap.exists()) {
      return {
        id: voucherSnap.id,
        ...voucherSnap.data(),
      } as Voucher;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting voucher:", error);
    throw error;
  }
};

export const checkVoucherCodeExists = async (code: string): Promise<Voucher | null> => {
  try {
    const q = query(
      collection(db, "vouchers"),
      where("code", "==", code)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Voucher;
    }
    
    return null;
  } catch (error) {
    console.error("Error checking voucher code:", error);
    throw error;
  }
};

export const validateVoucher = async (
  code: string, 
  productIds: string[] = [], 
  categoryIds: string[] = [], 
  totalAmount: number = 0
): Promise<{ valid: boolean; voucher?: Voucher; message?: string }> => {
  try {
    // Tìm voucher theo code
    const voucher = await checkVoucherCodeExists(code);
    
    if (!voucher) {
      return { valid: false, message: "Voucher không tồn tại" };
    }
    
    // Kiểm tra voucher còn hiệu lực không
    const now = Timestamp.now();
    if (!voucher.isActive) {
      return { valid: false, message: "Voucher đã bị vô hiệu hóa" };
    }
    
    if (voucher.startDate.toMillis() > now.toMillis()) {
      return { valid: false, message: "Voucher chưa có hiệu lực" };
    }
    
    if (voucher.endDate.toMillis() < now.toMillis()) {
      return { valid: false, message: "Voucher đã hết hạn" };
    }
    
    // Kiểm tra giới hạn sử dụng
    if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
      return { valid: false, message: "Voucher đã hết lượt sử dụng" };
    }
    
    // Kiểm tra giá trị đơn hàng tối thiểu
    if (voucher.minPurchase && totalAmount < voucher.minPurchase) {
      return { 
        valid: false, 
        message: `Giá trị đơn hàng tối thiểu là ${voucher.minPurchase}VNĐ` 
      };
    }
    
    // Kiểm tra sản phẩm áp dụng
    if (voucher.applicableProducts !== "all" && productIds.length > 0) {
      const hasValidProduct = productIds.some(id => 
        voucher.applicableProducts.includes(id)
      );
      
      if (!hasValidProduct) {
        return { valid: false, message: "Voucher không áp dụng cho sản phẩm này" };
      }
    }
    
    // Kiểm tra danh mục áp dụng
    if (voucher.applicableCategories !== "all" && categoryIds.length > 0) {
      const hasValidCategory = categoryIds.some(id => 
        voucher.applicableCategories.includes(id)
      );
      
      if (!hasValidCategory) {
        return { valid: false, message: "Voucher không áp dụng cho danh mục sản phẩm này" };
      }
    }
    
    // Nếu tất cả kiểm tra đều qua, voucher hợp lệ
    return { valid: true, voucher };
    
  } catch (error) {
    console.error("Error validating voucher:", error);
    return { valid: false, message: "Có lỗi xảy ra khi xác thực voucher" };
  }
};

export const applyVoucher = async (
  voucherId: string,
  totalAmount: number
): Promise<{ discountAmount: number; finalAmount: number }> => {
  try {
    const voucher = await getVoucherById(voucherId);
    
    if (!voucher) {
      throw new Error("Voucher không tồn tại");
    }
    
    let discountAmount = 0;
    
    if (voucher.discountType === "percentage") {
      discountAmount = (totalAmount * voucher.discountValue) / 100;
      
      // Nếu có giới hạn giảm giá tối đa
      if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount;
      }
    } else {
      // Giảm giá cố định
      discountAmount = voucher.discountValue;
      
      // Đảm bảo giảm giá không lớn hơn tổng số tiền
      if (discountAmount > totalAmount) {
        discountAmount = totalAmount;
      }
    }
    
    // Cập nhật số lần sử dụng
    await updateDoc(doc(db, "vouchers", voucherId), {
      usageCount: increment(1),
      updatedAt: Timestamp.now(),
    });
    
    return {
      discountAmount,
      finalAmount: totalAmount - discountAmount,
    };
    
  } catch (error) {
    console.error("Error applying voucher:", error);
    throw error;
  }
};

// Hàm helper để tăng giá trị
import { increment } from "firebase/firestore";

// Thêm voucher vào danh sách voucher của người dùng
export const addVoucherToUser = async (userId: string, voucherId: string): Promise<void> => {
  try {
    // Kiểm tra xem voucher có tồn tại không
    const voucher = await getVoucherById(voucherId);
    if (!voucher) {
      throw new Error("Voucher không tồn tại");
    }
    
    // Thêm vào collection userVouchers
    await addDoc(collection(db, "userVouchers"), {
      userId,
      voucherId,
      isUsed: false,
      claimedAt: Timestamp.now()
    });
    
  } catch (error) {
    console.error("Error adding voucher to user:", error);
    throw error;
  }
};

// Lấy danh sách voucher của người dùng
export const getUserVouchers = async (userId: string): Promise<{id: string, voucher: Voucher, isUsed: boolean}[]> => {
  try {
    const q = query(
      collection(db, "userVouchers"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const userVouchers = [];
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      const voucher = await getVoucherById(data.voucherId);
      
      if (voucher) {
        userVouchers.push({
          id: doc.id,
          voucher,
          isUsed: data.isUsed
        });
      }
    }
    
    return userVouchers;
    
  } catch (error) {
    console.error("Error getting user vouchers:", error);
    throw error;
  }
};

// Đánh dấu voucher đã được sử dụng
export const markVoucherAsUsed = async (userVoucherId: string): Promise<void> => {
  try {
    const userVoucherRef = doc(db, "userVouchers", userVoucherId);
    await updateDoc(userVoucherRef, {
      isUsed: true,
      usedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error marking voucher as used:", error);
    throw error;
  }
}; 