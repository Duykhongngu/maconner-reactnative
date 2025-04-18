import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "~/lib/useColorScheme";
import {
  updateVoucher,
  getVoucherById,
  VoucherFormData,
} from "~/service/vouchers";
import CustomDateTimePicker from "~/components/CustomDateTimePicker";
import { Button } from "~/components/ui/button";
import { fetchProducts, Product } from "~/service/products";
import { Ionicons } from "@expo/vector-icons";
import * as z from "zod";

// Định nghĩa schema validation với Zod
const voucherSchema = z.object({
  code: z.string().min(1, "Vui lòng nhập mã voucher"),
  description: z.string().min(1, "Vui lòng nhập mô tả voucher"),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z
    .string()
    .min(1, "Vui lòng nhập giá trị giảm giá")
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Giá trị giảm giá phải là số",
    })
    .refine((val) => parseFloat(val) > 0, {
      message: "Giá trị giảm giá phải là số dương",
    }),
  maxDiscount: z
    .string()
    .refine((val) => val === "" || !isNaN(parseFloat(val)), {
      message: "Giảm giá tối đa phải là số",
    })
    .refine((val) => val === "" || parseFloat(val) > 0, {
      message: "Giảm giá tối đa phải là số dương",
    }),
  minPurchase: z
    .string()
    .refine((val) => val === "" || !isNaN(parseFloat(val)), {
      message: "Giá trị đơn hàng tối thiểu phải là số",
    })
    .refine((val) => val === "" || parseFloat(val) >= 0, {
      message: "Giá trị đơn hàng tối thiểu phải là số dương",
    }),
  usageLimit: z
    .string()
    .refine((val) => val === "" || !isNaN(parseInt(val)), {
      message: "Giới hạn sử dụng phải là số nguyên",
    })
    .refine((val) => val === "" || parseInt(val) > 0, {
      message: "Giới hạn sử dụng phải là số nguyên dương",
    }),
  startDate: z.date(),
  endDate: z.date(),
});

export default function EditVoucher() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { id } = useLocalSearchParams();
  const voucherId = typeof id === "string" ? id : "";

  const [loading, setLoading] = useState(false);
  const [loadingVoucher, setLoadingVoucher] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Form state
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isActive, setIsActive] = useState(true);
  const [usageLimit, setUsageLimit] = useState("");
  const [usageCount, setUsageCount] = useState(0);
  const [applicableProducts, setApplicableProducts] = useState<
    "all" | string[]
  >("all");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [applicableCategories, setApplicableCategories] = useState<
    "all" | string[]
  >("all");

  // Date picker state
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);

  // Product filter
  const [productFilter, setProductFilter] = useState("");
  const [showProductSelector, setShowProductSelector] = useState(false);

  useEffect(() => {
    if (voucherId) {
      loadVoucherData();
      loadProducts();
    } else {
      setLoadingVoucher(false);
      Alert.alert("Lỗi", "Không tìm thấy mã voucher", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  }, [voucherId]);

  const loadVoucherData = async () => {
    try {
      setLoadingVoucher(true);
      const voucher = await getVoucherById(voucherId);

      if (voucher) {
        setCode(voucher.code);
        setDescription(voucher.description);
        setDiscountType(voucher.discountType);
        setDiscountValue(voucher.discountValue.toString());
        setMaxDiscount(
          voucher.maxDiscount ? voucher.maxDiscount.toString() : ""
        );
        setMinPurchase(
          voucher.minPurchase ? voucher.minPurchase.toString() : ""
        );
        setStartDate(voucher.startDate.toDate());
        setEndDate(voucher.endDate.toDate());
        setIsActive(voucher.isActive);
        setUsageLimit(voucher.usageLimit ? voucher.usageLimit.toString() : "");
        setUsageCount(voucher.usageCount || 0);
        setApplicableProducts(voucher.applicableProducts);

        if (
          voucher.applicableProducts !== "all" &&
          Array.isArray(voucher.applicableProducts)
        ) {
          setSelectedProducts(voucher.applicableProducts);
        }

        setApplicableCategories(voucher.applicableCategories);
      } else {
        Alert.alert("Lỗi", "Không tìm thấy mã voucher", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error("Error loading voucher data:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin voucher");
    } finally {
      setLoadingVoucher(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const productsData = await fetchProducts();
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading products:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách sản phẩm");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleStartDateChange = (selectedDate: Date) => {
    const currentDate = selectedDate || startDate;
    setShowStartDate(false);
    setStartDate(currentDate);
    setValidationErrors((prev) => ({ ...prev, endDate: "" }));

    // If end date is before start date, update end date
    if (endDate < currentDate) {
      const newEndDate = new Date(currentDate);
      newEndDate.setDate(currentDate.getDate() + 7);
      setEndDate(newEndDate);
    }
  };

  const handleEndDateChange = (selectedDate: Date) => {
    const currentDate = selectedDate || endDate;
    setShowEndDate(false);
    setEndDate(currentDate);
    setValidationErrors((prev) => ({ ...prev, endDate: "" }));
  };

  const hideStartDatePicker = () => {
    setShowStartDate(false);
  };

  const hideEndDatePicker = () => {
    setShowEndDate(false);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) => {
      const isSelected = prev.includes(productId);
      if (isSelected) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productFilter.toLowerCase())
  );

  const handleSubmit = async () => {
    // Reset validation errors
    setValidationErrors({});

    // Validate form with Zod
    const validationResult = voucherSchema.safeParse({
      code,
      description,
      discountType,
      discountValue,
      maxDiscount,
      minPurchase,
      usageLimit,
      startDate,
      endDate,
    });

    if (!validationResult.success) {
      const errors: Record<string, string> = {};

      validationResult.error.errors.forEach((error) => {
        const field = error.path[0] as string;
        errors[field] = error.message;
      });

      // Validation for specific rules not covered in schema
      if (discountType === "percentage" && parseFloat(discountValue) > 100) {
        errors["discountValue"] = "Giá trị phần trăm không thể vượt quá 100%";
      }

      if (startDate >= endDate) {
        errors["endDate"] = "Ngày kết thúc phải sau ngày bắt đầu";
      }

      setValidationErrors(errors);

      // Show the first validation error
      if (Object.keys(errors).length > 0) {
        Alert.alert("Lỗi", Object.values(errors)[0]);
        return;
      }

      return;
    }

    // Additional validation for percentage
    if (discountType === "percentage" && parseFloat(discountValue) > 100) {
      setValidationErrors({
        discountValue: "Giá trị phần trăm không thể vượt quá 100%",
      });
      Alert.alert("Lỗi", "Giá trị phần trăm không thể vượt quá 100%");
      return;
    }

    // Validate dates
    if (startDate >= endDate) {
      setValidationErrors({ endDate: "Ngày kết thúc phải sau ngày bắt đầu" });
      Alert.alert("Lỗi", "Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }

    try {
      setLoading(true);

      const voucherData: Partial<VoucherFormData> = {
        code: code.toUpperCase().trim(),
        description,
        discountType,
        discountValue: parseFloat(discountValue),
        isActive,
        startDate,
        endDate,
        applicableProducts:
          applicableProducts === "all" ? "all" : selectedProducts,
        applicableCategories: "all", // Hiện tại mặc định là tất cả danh mục
      };

      // Add optional fields if provided
      if (maxDiscount) {
        voucherData.maxDiscount = parseFloat(maxDiscount);
      }

      if (minPurchase) {
        voucherData.minPurchase = parseFloat(minPurchase);
      }

      if (usageLimit) {
        voucherData.usageLimit = parseInt(usageLimit);
      }

      await updateVoucher(voucherId, voucherData);

      Alert.alert("Thành công", "Đã cập nhật voucher", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error("Error updating voucher:", error);
      Alert.alert("Lỗi", error.message || "Không thể cập nhật voucher");
    } finally {
      setLoading(false);
    }
  };

  if (loadingVoucher) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="mt-4">Đang tải dữ liệu voucher...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        isDarkMode ? styles.containerDark : styles.containerLight,
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkMode ? "#FFFFFF" : "#000000"}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.title,
            isDarkMode ? styles.textDark : styles.textLight,
          ]}
        >
          Chỉnh sửa Voucher
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.formContainer}>
        <View style={styles.formGroup}>
          <Text
            style={[
              styles.label,
              isDarkMode ? styles.textDark : styles.textLight,
            ]}
          >
            Mã voucher
          </Text>
          <TextInput
            style={[
              styles.input,
              isDarkMode ? styles.inputDark : styles.inputLight,
              validationErrors.code ? { borderColor: "#ef4444" } : {},
            ]}
            placeholder="Ví dụ: SUMMER2023"
            placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
            value={code}
            onChangeText={(text) => {
              setCode(text);
              if (validationErrors.code) {
                setValidationErrors((prev) => ({ ...prev, code: "" }));
              }
            }}
            autoCapitalize="characters"
          />
          {validationErrors.code && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.code}
            </Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text
            style={[
              styles.label,
              isDarkMode ? styles.textDark : styles.textLight,
            ]}
          >
            Mô tả
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              isDarkMode ? styles.inputDark : styles.inputLight,
              validationErrors.description ? { borderColor: "#ef4444" } : {},
            ]}
            placeholder="Mô tả về voucher"
            placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (validationErrors.description) {
                setValidationErrors((prev) => ({ ...prev, description: "" }));
              }
            }}
            multiline
            numberOfLines={3}
          />
          {validationErrors.description && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.description}
            </Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text
            style={[
              styles.label,
              isDarkMode ? styles.textDark : styles.textLight,
            ]}
          >
            Loại giảm giá
          </Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                discountType === "percentage" && styles.radioButtonSelected,
              ]}
              onPress={() => setDiscountType("percentage")}
            >
              <Text
                style={[
                  styles.radioLabel,
                  isDarkMode ? styles.textDark : styles.textLight,
                ]}
              >
                Theo phần trăm (%)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioButton,
                discountType === "fixed" && styles.radioButtonSelected,
              ]}
              onPress={() => setDiscountType("fixed")}
            >
              <Text
                style={[
                  styles.radioLabel,
                  isDarkMode ? styles.textDark : styles.textLight,
                ]}
              >
                Số tiền cố định
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text
            style={[
              styles.label,
              isDarkMode ? styles.textDark : styles.textLight,
            ]}
          >
            Giá trị giảm giá
          </Text>
          <View style={styles.inputWithSuffix}>
            <TextInput
              style={[
                styles.input,
                styles.inputWithSuffixField,
                isDarkMode ? styles.inputDark : styles.inputLight,
                validationErrors.discountValue
                  ? { borderColor: "#ef4444" }
                  : {},
              ]}
              placeholder={
                discountType === "percentage" ? "Ví dụ: 10" : "Ví dụ: 50000"
              }
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
              value={discountValue}
              onChangeText={(text) => {
                setDiscountValue(text);
                if (validationErrors.discountValue) {
                  setValidationErrors((prev) => ({
                    ...prev,
                    discountValue: "",
                  }));
                }
              }}
              keyboardType="numeric"
            />
            <Text
              style={[
                styles.inputSuffix,
                isDarkMode ? styles.textDark : styles.textLight,
              ]}
            >
              {discountType === "percentage" ? "%" : "VNĐ"}
            </Text>
          </View>
          {validationErrors.discountValue && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.discountValue}
            </Text>
          )}
        </View>

        {discountType === "percentage" && (
          <View style={styles.formGroup}>
            <Text
              style={[
                styles.label,
                isDarkMode ? styles.textDark : styles.textLight,
              ]}
            >
              Giảm giá tối đa (tùy chọn)
            </Text>
            <View style={styles.inputWithSuffix}>
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithSuffixField,
                  isDarkMode ? styles.inputDark : styles.inputLight,
                  validationErrors.maxDiscount
                    ? { borderColor: "#ef4444" }
                    : {},
                ]}
                placeholder="Giới hạn số tiền giảm tối đa"
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
                value={maxDiscount}
                onChangeText={(text) => {
                  setMaxDiscount(text);
                  if (validationErrors.maxDiscount) {
                    setValidationErrors((prev) => ({
                      ...prev,
                      maxDiscount: "",
                    }));
                  }
                }}
                keyboardType="numeric"
              />
              <Text
                style={[
                  styles.inputSuffix,
                  isDarkMode ? styles.textDark : styles.textLight,
                ]}
              >
                VNĐ
              </Text>
            </View>
            {validationErrors.maxDiscount && (
              <Text className="text-red-500 text-xs mt-1">
                {validationErrors.maxDiscount}
              </Text>
            )}
          </View>
        )}

        <View style={styles.formGroup}>
          <Text
            style={[
              styles.label,
              isDarkMode ? styles.textDark : styles.textLight,
            ]}
          >
            Giá trị đơn hàng tối thiểu (tùy chọn)
          </Text>
          <View style={styles.inputWithSuffix}>
            <TextInput
              style={[
                styles.input,
                styles.inputWithSuffixField,
                isDarkMode ? styles.inputDark : styles.inputLight,
                validationErrors.minPurchase ? { borderColor: "#ef4444" } : {},
              ]}
              placeholder="Ví dụ: 100000"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
              value={minPurchase}
              onChangeText={(text) => {
                setMinPurchase(text);
                if (validationErrors.minPurchase) {
                  setValidationErrors((prev) => ({ ...prev, minPurchase: "" }));
                }
              }}
              keyboardType="numeric"
            />
            <Text
              style={[
                styles.inputSuffix,
                isDarkMode ? styles.textDark : styles.textLight,
              ]}
            >
              VNĐ
            </Text>
          </View>
          {validationErrors.minPurchase && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.minPurchase}
            </Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text
            style={[
              styles.label,
              isDarkMode ? styles.textDark : styles.textLight,
            ]}
          >
            Thời gian hiệu lực
          </Text>
          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              className={`flex-1 h-12 justify-center px-3 rounded-lg border ${
                validationErrors.startDate
                  ? "border-red-500"
                  : isDarkMode
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-200 text-black"
              }`}
              onPress={() => setShowStartDate(true)}
            >
              <Text
                className={`${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                {startDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <Text className={`${isDarkMode ? "text-white" : "text-gray-900"}`}>
              đến
            </Text>
            <TouchableOpacity
              className={`flex-1 h-12 justify-center px-3 rounded-lg border ${
                validationErrors.endDate
                  ? "border-red-500"
                  : isDarkMode
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-200 text-black"
              }`}
              onPress={() => setShowEndDate(true)}
            >
              <Text
                className={`${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                {endDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>
          {validationErrors.endDate && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.endDate}
            </Text>
          )}

          {showStartDate && (
            <CustomDateTimePicker
              date={startDate}
              mode="date"
              onConfirm={handleStartDateChange}
              onCancel={hideStartDatePicker}
              isVisible={showStartDate}
            />
          )}

          {showEndDate && (
            <CustomDateTimePicker
              date={endDate}
              mode="date"
              onConfirm={handleEndDateChange}
              onCancel={hideEndDatePicker}
              isVisible={showEndDate}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text
            style={[
              styles.label,
              isDarkMode ? styles.textDark : styles.textLight,
            ]}
          >
            Giới hạn sử dụng (tùy chọn)
          </Text>
          <TextInput
            style={[
              styles.input,
              isDarkMode ? styles.inputDark : styles.inputLight,
              validationErrors.usageLimit ? { borderColor: "#ef4444" } : {},
            ]}
            placeholder="Số lượt sử dụng tối đa"
            placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
            value={usageLimit}
            onChangeText={(text) => {
              setUsageLimit(text);
              if (validationErrors.usageLimit) {
                setValidationErrors((prev) => ({ ...prev, usageLimit: "" }));
              }
            }}
            keyboardType="numeric"
          />
          {validationErrors.usageLimit && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.usageLimit}
            </Text>
          )}
          {usageCount > 0 && (
            <Text style={styles.usageCountText}>
              Đã sử dụng: {usageCount} lần
            </Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <View style={styles.switchRow}>
            <Text
              style={[
                styles.label,
                isDarkMode ? styles.textDark : styles.textLight,
              ]}
            >
              Kích hoạt voucher
            </Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: "#767577", true: "#F97316" }}
              thumbColor={isActive ? "#f4f3f4" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text
            style={[
              styles.label,
              isDarkMode ? styles.textDark : styles.textLight,
            ]}
          >
            Áp dụng cho sản phẩm
          </Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                applicableProducts === "all" && styles.radioButtonSelected,
              ]}
              onPress={() => {
                setApplicableProducts("all");
                setShowProductSelector(false);
              }}
            >
              <Text
                style={[
                  styles.radioLabel,
                  isDarkMode ? styles.textDark : styles.textLight,
                ]}
              >
                Tất cả sản phẩm
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioButton,
                applicableProducts !== "all" && styles.radioButtonSelected,
              ]}
              onPress={() => {
                setApplicableProducts(selectedProducts);
                setShowProductSelector(true);
              }}
            >
              <Text
                style={[
                  styles.radioLabel,
                  isDarkMode ? styles.textDark : styles.textLight,
                ]}
              >
                Sản phẩm cụ thể
              </Text>
            </TouchableOpacity>
          </View>

          {showProductSelector && (
            <View style={styles.productSelector}>
              <TextInput
                style={[
                  styles.input,
                  styles.searchInput,
                  isDarkMode ? styles.inputDark : styles.inputLight,
                ]}
                placeholder="Tìm kiếm sản phẩm"
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
                value={productFilter}
                onChangeText={setProductFilter}
              />

              {loadingProducts ? (
                <ActivityIndicator color="#F97316" style={{ marginTop: 20 }} />
              ) : (
                <ScrollView style={styles.productList}>
                  {filteredProducts.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={[
                        styles.productItem,
                        selectedProducts.includes(product.id) &&
                          styles.productItemSelected,
                      ]}
                      onPress={() => toggleProductSelection(product.id)}
                    >
                      <Text
                        style={[
                          styles.productName,
                          isDarkMode ? styles.textDark : styles.textLight,
                        ]}
                        numberOfLines={1}
                      >
                        {product.name}
                      </Text>
                      <Ionicons
                        name={
                          selectedProducts.includes(product.id)
                            ? "checkmark-circle"
                            : "ellipse-outline"
                        }
                        size={24}
                        color={
                          selectedProducts.includes(product.id)
                            ? "#F97316"
                            : isDarkMode
                            ? "#FFFFFF"
                            : "#000000"
                        }
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            className="bg-orange-500 mb-2 w-full"
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-white font-bold text-center">
                Cập nhật Voucher
              </Text>
            )}
          </Button>
          <Button
            className="bg-gray-500 w-full"
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text className="text-white font-bold text-center">Hủy</Text>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerLight: {
    backgroundColor: "#f5f5f5",
  },
  containerDark: {
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  textLight: {
    color: "#000000",
  },
  textDark: {
    color: "#FFFFFF",
  },
  formContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  inputLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    color: "#000000",
  },
  inputDark: {
    backgroundColor: "#1E1E1E",
    borderColor: "#2D3748",
    color: "#FFFFFF",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  radioGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  radioButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
    marginBottom: 8,
  },
  radioButtonSelected: {
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    borderColor: "#F97316",
  },
  radioLabel: {
    fontSize: 14,
  },
  inputWithSuffix: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputWithSuffixField: {
    flex: 1,
  },
  inputSuffix: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateInput: {
    flex: 1,
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 16,
  },
  dateSeperator: {
    marginHorizontal: 8,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productSelector: {
    marginTop: 8,
  },
  searchInput: {
    marginBottom: 8,
  },
  productList: {
    maxHeight: 200,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  productItemSelected: {
    backgroundColor: "rgba(249, 115, 22, 0.1)",
  },
  productName: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  buttonContainer: {
    marginTop: 24,
  },
  usageCountText: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 14,
  },
});
