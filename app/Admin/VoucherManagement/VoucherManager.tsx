import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "~/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { fetchVouchers, deleteVoucher } from "~/service/vouchers";

// Updated Voucher interface to include applicableCategories
interface Voucher {
  id: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscount?: number;
  minPurchase?: number;
  startDate: any; // Firestore Timestamp or Date
  endDate: any; // Firestore Timestamp or Date
  isActive: boolean;
  usageCount: number;
  usageLimit?: number;
  applicableProducts: string[] | "all";
  applicableCategories?: string[] | "all"; // Added from logged data
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

export default function VoucherManager() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      const data = await fetchVouchers();
      console.log("Fetched vouchers:", JSON.stringify(data, null, 2)); // Pretty-print data
      setVouchers(data);
    } catch (error) {
      console.error("Error loading vouchers:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách voucher");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVouchers();
  };

  const handleCreateVoucher = () => {
    router.push("/Admin/VoucherManagement/CreateVoucher" as any);
  };

  const handleEditVoucher = (voucher: Voucher) => {
    router.push({
      pathname: "/Admin/VoucherManagement/EditVoucher" as any,
      params: { id: voucher.id },
    });
  };

  const handleDeleteVoucher = (voucher: Voucher) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa voucher ${voucher.code || "N/A"} không?`,
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteVoucher(voucher.id);
              Alert.alert("Thành công", "Đã xóa voucher");
              loadVouchers();
            } catch (error) {
              console.error("Error deleting voucher:", error);
              Alert.alert("Lỗi", "Không thể xóa voucher");
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: any): string => {
    try {
      if (!timestamp) return "N/A";
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("vi-VN");
    } catch (error) {
      console.error("Error formatting date:", timestamp, error);
      return "N/A";
    }
  };

  const getStatusText = (voucher: Voucher) => {
    const now = new Date();
    const startDate = voucher.startDate
      ? voucher.startDate?.toDate
        ? voucher.startDate.toDate()
        : new Date(voucher.startDate)
      : now;
    const endDate = voucher.endDate
      ? voucher.endDate?.toDate
        ? voucher.endDate.toDate()
        : new Date(voucher.endDate)
      : now;

    if (!voucher.isActive) {
      return { text: "Vô hiệu", color: "bg-gray-500" };
    } else if (now < startDate) {
      return { text: "Sắp diễn ra", color: "bg-amber-500" };
    } else if (now > endDate) {
      return { text: "Hết hạn", color: "bg-red-500" };
    } else if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
      return { text: "Hết lượt", color: "bg-red-400" };
    } else {
      return { text: "Hoạt động", color: "bg-green-500" };
    }
  };

  const renderVoucherItem = ({ item }: { item: Voucher }) => {
    console.log("Rendering voucher item:", JSON.stringify(item, null, 2)); // Pretty-print item

    const status = getStatusText(item);

    // Log computed values to ensure they are strings
    const discountText =
      item.discountType === "percentage"
        ? `${String(item.discountValue || 0)}%`
        : `${String(item.discountValue || 0)} VNĐ`;
    const maxDiscountText = item.maxDiscount
      ? `(tối đa ${String(item.maxDiscount)} VNĐ)`
      : "";
    const usageText = `${String(item.usageCount || 0)}${
      item.usageLimit ? `/${String(item.usageLimit)}` : ""
    }`;
    const applicableText =
      item.applicableProducts === "all"
        ? "Tất cả sản phẩm"
        : `${String(
            Array.isArray(item.applicableProducts)
              ? item.applicableProducts.length
              : 0
          )} sản phẩm`;

    console.log("Computed values:", {
      discountText,
      maxDiscountText,
      usageText,
      applicableText,
    });

    return (
      <View
        className={`rounded-lg p-4 mb-4 border ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200 shadow-sm"
        }`}
      >
        <View className="flex-row justify-between items-center mb-2">
          <Text
            className={`text-lg font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {String(item.code || "N/A")}
          </Text>
          <View className={`px-2.5 py-1 rounded-full ${status.color}`}>
            <Text className="text-white font-semibold text-xs">
              {status.text}
            </Text>
          </View>
        </View>

        <Text
          className={`mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
        >
          {String(item.description || "Không có mô tả")}
        </Text>

        <View className="mb-4">
          <Text
            className={`mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            Giảm giá: {discountText}
            {item.maxDiscount && item.discountType === "percentage" ? (
              <Text className="text-gray-300"> {maxDiscountText}</Text> // Wrap in Text
            ) : null}
          </Text>

          <Text
            className={`mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            Hiệu lực: {formatDate(item.startDate)} - {formatDate(item.endDate)}
          </Text>

          {item.minPurchase ? (
            <Text
              className={`mb-1 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Đơn tối thiểu: {String(item.minPurchase)} VNĐ
            </Text>
          ) : null}

          <Text
            className={`mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            Đã sử dụng: {usageText}
          </Text>

          <Text
            className={`mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            Áp dụng cho: {applicableText}
          </Text>
        </View>

        <View className="flex-row justify-end mt-2">
          <TouchableOpacity
            className="flex-row items-center px-4 py-2 rounded-md bg-blue-500 mr-2.5"
            onPress={() => handleEditVoucher(item)}
          >
            <Ionicons name="pencil" size={18} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-1.5">Sửa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center px-4 py-2 rounded-md bg-red-500"
            onPress={() => handleDeleteVoucher(item)}
          >
            <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-1.5">Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View
        className={`flex-1 justify-center items-center p-4 ${
          isDarkMode ? "bg-gray-900" : "bg-white"
        }`}
      >
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <View className={`flex-1 p-4 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
      <View className="flex-row justify-between items-center mb-5">
        <Text
          className={`text-2xl font-bold ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Quản lý Voucher
        </Text>
        <TouchableOpacity
          className="flex-row items-center bg-orange-500 px-3 py-2 rounded-md"
          onPress={handleCreateVoucher}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text className="text-white font-semibold ml-2">Tạo Voucher</Text>
        </TouchableOpacity>
      </View>

      {vouchers.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons
            name="pricetag-outline"
            size={64}
            color={isDarkMode ? "#FF9E80" : "#F97316"}
          />
          <Text
            className={`text-lg my-5 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Chưa có voucher nào
          </Text>
          <TouchableOpacity
            className="flex-row items-center bg-orange-500 px-4 py-2 rounded-md"
            onPress={handleCreateVoucher}
          >
            <Text className="text-white font-semibold">
              Tạo Voucher đầu tiên
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={vouchers}
          renderItem={renderVoucherItem}
          keyExtractor={(item) => item.id.toString()}
          className="pb-5"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#F97316"]}
              tintColor={isDarkMode ? "#FF9E80" : "#F97316"}
            />
          }
        />
      )}
    </View>
  );
}
