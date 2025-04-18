import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Clipboard,
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

      // Tải danh sách voucher đang hoạt động
      const activeVouchersData = await fetchActiveVouchers();
      setActiveVouchers(activeVouchersData);

      // Tải danh sách voucher của người dùng
      const userVouchersData = await getUserVouchers(auth.currentUser.uid);
      setUserVouchers(userVouchersData);
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

  const handleAddVoucher = async () => {
    if (!voucherCode.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mã voucher");
      return;
    }

    if (!auth.currentUser) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập để thêm voucher");
      return;
    }

    try {
      // Kiểm tra xem mã voucher có tồn tại và hợp lệ không
      const matchedVoucher = activeVouchers.find(
        (voucher) => voucher.code === voucherCode.toUpperCase().trim()
      );

      if (!matchedVoucher) {
        Alert.alert("Lỗi", "Mã voucher không tồn tại hoặc đã hết hạn");
        return;
      }

      // Kiểm tra xem người dùng đã có voucher này chưa
      const alreadyHasVoucher = userVouchers.some(
        (item) => item.voucher.id === matchedVoucher.id
      );

      if (alreadyHasVoucher) {
        Alert.alert("Thông báo", "Bạn đã có voucher này trong ví");
        return;
      }

      // Thêm voucher vào ví của người dùng
      await addVoucherToUser(auth.currentUser.uid, matchedVoucher.id);

      Alert.alert("Thành công", "Đã thêm voucher vào ví của bạn");

      // Làm mới danh sách
      setVoucherCode("");
      loadVouchers();
    } catch (error) {
      console.error("Error adding voucher:", error);
      Alert.alert("Lỗi", "Không thể thêm voucher");
    }
  };

  const handleCopyCode = (code: string) => {
    Clipboard.setString(code);
    Alert.alert("Thành công", "Đã sao chép mã voucher");
  };

  // Phân loại voucher của người dùng
  const availableUserVouchers = userVouchers.filter((item) => !item.isUsed);
  const usedUserVouchers = userVouchers.filter((item) => item.isUsed);

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("vi-VN");
  };

  const formatDiscountValue = (voucher: Voucher) => {
    if (voucher.discountType === "percentage") {
      let text = `${voucher.discountValue}%`;
      if (voucher.maxDiscount) {
        text += ` (tối đa ${voucher.maxDiscount} VNĐ)`;
      }
      return text;
    } else {
      return `${voucher.discountValue} VNĐ`;
    }
  };

  const renderVoucherItem = (
    voucher: Voucher,
    userVoucherId?: string,
    isUsed = false
  ) => {
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
              {voucher.code}
            </Text>
            <Text
              className={`text-base font-medium ${
                isUsed ? "text-gray-400" : "text-orange-500"
              }`}
            >
              Giảm {formatDiscountValue(voucher)}
            </Text>
          </View>
        </View>

        <Text
          className={`mb-2 text-sm ${
            isDarkMode ? "text-white" : "text-black"
          } ${isUsed ? "text-gray-400" : ""}`}
        >
          {voucher.description}
        </Text>

        {voucher.minPurchase && (
          <Text
            className={`text-sm mb-1 ${
              isDarkMode ? "text-white" : "text-black"
            } ${isUsed ? "text-gray-400" : ""}`}
          >
            Đơn tối thiểu: {voucher.minPurchase} VNĐ
          </Text>
        )}

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
                // Kiểm tra xem người dùng đã có voucher này chưa
                const alreadyHasVoucher = userVouchers.some(
                  (item) => item.voucher.id === voucher.id
                );

                if (alreadyHasVoucher) {
                  Alert.alert("Thông báo", "Bạn đã có voucher này trong ví");
                  return;
                }

                // Thêm voucher vào ví
                addVoucherToUser(auth.currentUser.uid, voucher.id)
                  .then(() => {
                    Alert.alert("Thành công", "Đã thêm voucher vào ví của bạn");
                    loadVouchers();
                  })
                  .catch((error) => {
                    console.error("Error adding voucher to wallet:", error);
                    Alert.alert("Lỗi", "Không thể thêm voucher vào ví");
                  });
              } else {
                Alert.alert("Lỗi", "Bạn cần đăng nhập để lưu voucher");
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
