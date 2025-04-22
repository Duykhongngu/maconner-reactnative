import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { useColorScheme } from "~/lib/useColorScheme";
import { auth } from "~/firebase.config";
import {
  fetchActiveVouchers,
  getUserVouchers,
  addVoucherToUser,
  Voucher,
} from "~/service/vouchers";
import { Button } from "~/components/ui/button";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Clipboard } from "react-native";

const showNotification = (message: string) => {
  Alert.alert("Thông báo", message);
};

export default function VoucherScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [activeVouchers, setActiveVouchers] = useState<Voucher[]>([]);
  const [userVouchers, setUserVouchers] = useState<
    { id: string; voucher: Voucher; isUsed: boolean }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");

  useEffect(() => {
    if (auth.currentUser) {
      loadVouchers();
    }
  }, []);

  const loadVouchers = async () => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);

      // Fetch active vouchers
      const activeVouchersData = await fetchActiveVouchers();

      setActiveVouchers(activeVouchersData);

      // Fetch user vouchers
      const userVouchersData = await getUserVouchers(auth.currentUser.uid);

      setUserVouchers(userVouchersData);
    } catch (error) {
      console.error("Error loading vouchers:", error);
      showNotification("Không thể tải danh sách voucher");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVouchers();
  };

  const handleAddVoucher = async () => {
    if (!voucherCode.trim()) {
      showNotification("Vui lòng nhập mã voucher");
      return;
    }

    if (!auth.currentUser) {
      showNotification("Bạn cần đăng nhập để thêm voucher");
      return;
    }

    try {
      // Kiểm tra xem mã voucher có tồn tại và hợp lệ không
      const matchedVoucher = activeVouchers.find(
        (voucher) => voucher.code === voucherCode.toUpperCase().trim()
      );

      if (!matchedVoucher) {
        showNotification("Mã voucher không tồn tại hoặc đã hết hạn");
        return;
      }

      // Kiểm tra xem người dùng đã có voucher này chưa
      const alreadyHasVoucher = userVouchers.some(
        (item) => item.voucher.id === matchedVoucher.id
      );

      if (alreadyHasVoucher) {
        showNotification("Bạn đã có voucher này trong ví");
        return;
      }

      // Thêm voucher vào ví của người dùng
      await addVoucherToUser(auth.currentUser.uid, matchedVoucher.id);

      showNotification("Đã thêm voucher vào ví của bạn");

      // Làm mới danh sách
      setVoucherCode("");
      loadVouchers();
    } catch (error) {
      console.error("Error adding voucher:", error);
      showNotification("Không thể thêm voucher");
    }
  };

  const handleCopyCode = async (code: string) => {
    await Clipboard.setString(code);
    showNotification("Đã sao chép mã voucher");
  };

  const availableUserVouchers = userVouchers.filter((item) => !item.isUsed);
  const usedUserVouchers = userVouchers.filter((item) => item.isUsed);

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

  const formatDiscountValue = (voucher: Voucher): string => {
    try {
      if (voucher.discountType === "percentage") {
        const discount = String(voucher.discountValue || 0);
        if (voucher.maxDiscount) {
          return `${discount}% (tối đa ${String(voucher.maxDiscount)} VNĐ)`;
        }
        return `${discount}%`;
      }
      return `${String(voucher.discountValue || 0)} VNĐ`;
    } catch (error) {
      console.error("Error formatting discount value:", voucher, error);
      return "N/A";
    }
  };

  const renderVoucherItem = (
    voucher: Voucher,
    userVoucherId?: string,
    isUsed = false
  ) => {
    console.log("Rendering voucher item:", JSON.stringify(voucher, null, 2)); // Debug log

    const discountText = formatDiscountValue(voucher);
    console.log("Computed discountText:", discountText); // Debug log

    return (
      <View
        className={`rounded-xl p-4 mb-3 border border-dashed ${
          isDarkMode
            ? "bg-[#1E1E1E] border-[#374151]"
            : "bg-white border-gray-200"
        } ${isUsed ? "opacity-60" : ""}`}
        key={userVoucherId || voucher.id}
      >
        <View className="flex-row mb-3">
          <View className="w-10 h-10 rounded-full bg-orange-500 justify-center items-center mr-3">
            <Text className="text-white font-bold text-base">
              {voucher.discountType === "percentage" ? "%" : "VNĐ"}
            </Text>
          </View>
          <View className="flex-1">
            <Text
              className={`text-lg font-bold mb-1 ${
                isDarkMode ? "text-white" : "text-black"
              } ${isUsed ? "text-gray-400" : ""}`}
            >
              {String(voucher.code || "N/A")}
            </Text>
            <Text
              className={`text-base font-medium ${
                isUsed ? "text-gray-400" : "text-orange-500"
              }`}
            >
              Giảm {discountText}
            </Text>
          </View>
        </View>

        <Text
          className={`mb-2 text-sm ${
            isDarkMode ? "text-white" : "text-black"
          } ${isUsed ? "text-gray-400" : ""}`}
        >
          {String(voucher.description || "Không có mô tả")}
        </Text>

        {voucher.minPurchase ? (
          <Text
            className={`text-sm mb-1 ${
              isDarkMode ? "text-white" : "text-black"
            } ${isUsed ? "text-gray-400" : ""}`}
          >
            Đơn tối thiểu: {String(voucher.minPurchase)} VNĐ
          </Text>
        ) : null}

        <Text
          className={`text-xs mb-3 ${
            isDarkMode ? "text-gray-300" : "text-gray-500"
          } ${isUsed ? "text-gray-400" : ""}`}
        >
          Hiệu lực: {formatDate(voucher.startDate)} -{" "}
          {formatDate(voucher.endDate)}
        </Text>

        {userVoucherId ? (
          <View className="flex-row justify-end">
            {isUsed ? (
              <View className="py-1 px-2 bg-gray-500 rounded">
                <Text className="text-white text-xs font-medium">
                  Đã sử dụng
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                className="flex-row items-center bg-blue-500 py-2 px-3 rounded"
                onPress={() => handleCopyCode(voucher.code)}
              >
                <Ionicons name="copy-outline" size={16} color="#FFFFFF" />
                <Text className="text-white font-semibold ml-1">
                  Sao chép mã
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            className="flex-row items-center bg-orange-500 py-2 px-3 rounded"
            onPress={() => {
              if (auth.currentUser) {
                const alreadyHasVoucher = userVouchers.some(
                  (item) => item.voucher.id === voucher.id
                );

                if (alreadyHasVoucher) {
                  showNotification("Bạn đã có voucher này trong ví");
                  return;
                }

                addVoucherToUser(auth.currentUser.uid, voucher.id)
                  .then(() => {
                    showNotification("Đã thêm voucher vào ví của bạn");
                    loadVouchers();
                  })
                  .catch((error) => {
                    console.error("Error adding voucher to wallet:", error);
                    showNotification("Không thể thêm voucher vào ví");
                  });
              } else {
                showNotification("Bạn cần đăng nhập để lưu voucher");
              }
            }}
          >
            <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-1">Lưu vào ví</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View
        className={`flex-1 justify-center items-center ${
          isDarkMode ? "bg-[#121212]" : "bg-white"
        }`}
      >
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <ScrollView
      className={isDarkMode ? "bg-[#121212]" : "bg-[#F9FAFB]"}
      contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#F97316"]}
          tintColor={isDarkMode ? "#FF9E80" : "#F97316"}
        />
      }
    >
      <View className="mb-5">
        <Text
          className={`text-2xl font-bold ${
            isDarkMode ? "text-white" : "text-black"
          }`}
        >
          Voucher của bạn
        </Text>
      </View>

      <View
        className={`mb-5 p-4 rounded-xl ${
          isDarkMode ? "bg-[#1E1E1E]" : "bg-white"
        } shadow-sm`}
      >
        <Text
          className={`text-lg font-semibold mb-3 ${
            isDarkMode ? "text-white" : "text-black"
          }`}
        >
          Nhập mã voucher
        </Text>
        <View className="flex-row items-center">
          <TextInput
            className={`flex-1 border rounded-lg p-3 text-base mr-2 ${
              isDarkMode
                ? "bg-[#1E1E1E] border-[#374151] text-white"
                : "bg-white border-gray-200 text-black"
            }`}
            placeholder="Nhập mã voucher"
            placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
            value={voucherCode}
            onChangeText={setVoucherCode}
            autoCapitalize="characters"
          />
          <Button onPress={handleAddVoucher} className="h-[50px] px-4">
            <Text className="text-white font-semibold text-base">Lưu</Text>
          </Button>
        </View>
      </View>

      <View className="mb-6">
        <Text
          className={`text-lg font-semibold mb-3 ${
            isDarkMode ? "text-white" : "text-black"
          }`}
        >
          Voucher có sẵn ({availableUserVouchers.length})
        </Text>

        {availableUserVouchers.length === 0 ? (
          <View className="items-center justify-center py-8">
            <Ionicons
              name="pricetag-outline"
              size={40}
              color={isDarkMode ? "#6B7280" : "#9CA3AF"}
            />
            <Text
              className={`mt-3 text-base italic ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
              Bạn chưa có voucher nào
            </Text>
          </View>
        ) : (
          availableUserVouchers.map((item) =>
            renderVoucherItem(item.voucher, item.id, false)
          )
        )}
      </View>

      <View className="mb-6">
        <Text
          className={`text-lg font-semibold mb-3 ${
            isDarkMode ? "text-white" : "text-black"
          }`}
        >
          Khuyến mãi hiện có
        </Text>

        {activeVouchers.length === 0 ? (
          <View className="items-center justify-center py-8">
            <Ionicons
              name="pricetag-outline"
              size={40}
              color={isDarkMode ? "#6B7280" : "#9CA3AF"}
            />
            <Text
              className={`mt-3 text-base italic ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
              Hiện không có khuyến mãi nào
            </Text>
          </View>
        ) : (
          activeVouchers.map((voucher) => renderVoucherItem(voucher))
        )}
      </View>

      {usedUserVouchers.length > 0 && (
        <View className="mb-6">
          <Text
            className={`text-lg font-semibold mb-3 ${
              isDarkMode ? "text-white" : "text-black"
            }`}
          >
            Voucher đã sử dụng
          </Text>

          {usedUserVouchers.map((item) =>
            renderVoucherItem(item.voucher, item.id, true)
          )}
        </View>
      )}
    </ScrollView>
  );
}
