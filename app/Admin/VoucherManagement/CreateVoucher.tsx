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
import { useRouter } from "expo-router";
import { useColorScheme } from "~/lib/useColorScheme";
import { addVoucher, VoucherFormData } from "~/service/vouchers";
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
    .refine((val) => val === "" || parseFloat(val) >= 0, {
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

export default function CreateVoucher() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [loading, setLoading] = useState(false);
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
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // Default to 30 days in the future
    return date;
  });
  const [isActive, setIsActive] = useState(true);
  const [usageLimit, setUsageLimit] = useState("");
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
    loadProducts();
  }, []);

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

      const voucherData: VoucherFormData = {
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

      await addVoucher(voucherData);

      Alert.alert("Thành công", "Đã tạo voucher mới", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error("Error creating voucher:", error);
      Alert.alert("Lỗi", error.message || "Không thể tạo voucher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[
        styles.container,
        isDarkMode ? styles.containerDark : styles.containerLight,
      ]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkMode ? "#E5E7EB" : "#1E1E1E"}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            isDarkMode ? styles.textDark : styles.textLight,
          ]}
        >
          Tạo Voucher Mới
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text
          style={[
            styles.label,
            isDarkMode ? styles.textDark : styles.textLight,
          ]}
        >
          Mã Voucher *
        </Text>
        <TextInput
          style={[
            styles.input,
            isDarkMode ? styles.inputDark : styles.inputLight,
            validationErrors.code ? { borderColor: "#ef4444" } : {},
          ]}
          placeholder="Nhập mã voucher (vd: SUMMER2023)"
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
          Mô tả *
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            isDarkMode ? styles.inputDark : styles.inputLight,
            validationErrors.description ? { borderColor: "#ef4444" } : {},
          ]}
          placeholder="Nhập mô tả voucher"
          placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            if (validationErrors.description) {
              setValidationErrors((prev) => ({ ...prev, description: "" }));
            }
          }}
          multiline={true}
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
          Loại giảm giá *
        </Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[
              styles.radioButton,
              discountType === "percentage" && styles.radioButtonSelected,
            ]}
            onPress={() => setDiscountType("percentage")}
          >
            <View
              style={[
                styles.radioCircle,
                discountType === "percentage" && styles.radioCircleSelected,
              ]}
            >
              {discountType === "percentage" && (
                <View style={styles.radioChecked} />
              )}
            </View>
            <Text
              style={[
                styles.radioLabel,
                isDarkMode ? styles.textDark : styles.textLight,
              ]}
            >
              Phần trăm (%)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radioButton,
              discountType === "fixed" && styles.radioButtonSelected,
            ]}
            onPress={() => setDiscountType("fixed")}
          >
            <View
              style={[
                styles.radioCircle,
                discountType === "fixed" && styles.radioCircleSelected,
              ]}
            >
              {discountType === "fixed" && <View style={styles.radioChecked} />}
            </View>
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
          Giá trị giảm giá *
        </Text>
        <View style={styles.inputWithSuffix}>
          <TextInput
            style={[
              styles.input,
              styles.inputWithSuffixField,
              isDarkMode ? styles.inputDark : styles.inputLight,
              validationErrors.discountValue ? { borderColor: "#ef4444" } : {},
            ]}
            placeholder="Giá trị giảm giá"
            placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
            value={discountValue}
            onChangeText={(text) => {
              setDiscountValue(text);
              if (validationErrors.discountValue) {
                setValidationErrors((prev) => ({ ...prev, discountValue: "" }));
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
                validationErrors.maxDiscount ? { borderColor: "#ef4444" } : {},
              ]}
              placeholder="Giới hạn số tiền giảm tối đa"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
              value={maxDiscount}
              onChangeText={(text) => {
                setMaxDiscount(text);
                if (validationErrors.maxDiscount) {
                  setValidationErrors((prev) => ({ ...prev, maxDiscount: "" }));
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
            placeholder="Giá trị đơn hàng tối thiểu để áp dụng"
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
          Thời gian hiệu lực *
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
            <Text className={`${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {startDate.toLocaleDateString("vi-VN")}
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
            <Text className={`${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {endDate.toLocaleDateString("vi-VN")}
            </Text>
          </TouchableOpacity>
        </View>
        {validationErrors.endDate && (
          <Text className="text-red-500 text-xs mt-1">
            {validationErrors.endDate}
          </Text>
        )}

        <CustomDateTimePicker
          isVisible={showStartDate}
          mode="date"
          onConfirm={handleStartDateChange}
          onCancel={hideStartDatePicker}
          date={startDate}
          minimumDate={new Date()}
        />

        <CustomDateTimePicker
          isVisible={showEndDate}
          mode="date"
          onConfirm={handleEndDateChange}
          onCancel={hideEndDatePicker}
          minimumDate={startDate}
          date={endDate}
        />
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
          placeholder="Số lần voucher có thể được sử dụng"
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
      </View>

      <View style={styles.formGroup}>
        <Text
          style={[
            styles.label,
            isDarkMode ? styles.textDark : styles.textLight,
          ]}
        >
          Trạng thái
        </Text>
        <View style={styles.switchContainer}>
          <Text
            style={[
              styles.switchLabel,
              isDarkMode ? styles.textDark : styles.textLight,
            ]}
          >
            {isActive ? "Đang hoạt động" : "Vô hiệu hóa"}
          </Text>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: "#767577", true: "#F97316" }}
            thumbColor={isActive ? "#fff" : "#f4f3f4"}
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
              setSelectedProducts([]);
            }}
          >
            <View
              style={[
                styles.radioCircle,
                applicableProducts === "all" && styles.radioCircleSelected,
              ]}
            >
              {applicableProducts === "all" && (
                <View style={styles.radioChecked} />
              )}
            </View>
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
              setApplicableProducts([]);
              setShowProductSelector(true);
            }}
          >
            <View
              style={[
                styles.radioCircle,
                applicableProducts !== "all" && styles.radioCircleSelected,
              ]}
            >
              {applicableProducts !== "all" && (
                <View style={styles.radioChecked} />
              )}
            </View>
            <Text
              style={[
                styles.radioLabel,
                isDarkMode ? styles.textDark : styles.textLight,
              ]}
            >
              Chọn sản phẩm cụ thể
            </Text>
          </TouchableOpacity>
        </View>

        {applicableProducts !== "all" && (
          <TouchableOpacity
            style={[
              styles.productSelectorButton,
              isDarkMode
                ? styles.productSelectorButtonDark
                : styles.productSelectorButtonLight,
            ]}
            onPress={() => setShowProductSelector(!showProductSelector)}
          >
            <Text
              style={[
                styles.productSelectorButtonText,
                isDarkMode ? styles.textDark : styles.textLight,
              ]}
            >
              {selectedProducts.length > 0
                ? `Đã chọn ${selectedProducts.length} sản phẩm`
                : "Chọn sản phẩm"}
            </Text>
            <Ionicons
              name={showProductSelector ? "chevron-up" : "chevron-down"}
              size={20}
              color={isDarkMode ? "#E5E7EB" : "#1E1E1E"}
            />
          </TouchableOpacity>
        )}

        {showProductSelector && applicableProducts !== "all" && (
          <View style={styles.productSelector}>
            <TextInput
              style={[
                styles.input,
                styles.productSearchInput,
                isDarkMode ? styles.inputDark : styles.inputLight,
              ]}
              placeholder="Tìm kiếm sản phẩm"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
              value={productFilter}
              onChangeText={setProductFilter}
            />

            {loadingProducts ? (
              <ActivityIndicator
                size="small"
                color="#F97316"
                style={styles.productLoading}
              />
            ) : (
              <ScrollView style={styles.productList} nestedScrollEnabled={true}>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={[
                        styles.productItem,
                        isDarkMode
                          ? styles.productItemDark
                          : styles.productItemLight,
                        selectedProducts.includes(product.id) &&
                          styles.productItemSelected,
                      ]}
                      onPress={() => toggleProductSelection(product.id)}
                    >
                      <View style={styles.productInfo}>
                        <Text
                          style={[
                            styles.productName,
                            isDarkMode ? styles.textDark : styles.textLight,
                          ]}
                        >
                          {product.name}
                        </Text>
                        <Text
                          style={[
                            styles.productPrice,
                            isDarkMode ? styles.textDark : styles.textLight,
                          ]}
                        >
                          {new Intl.NumberFormat("vi-VN").format(product.price)}{" "}
                          VNĐ
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text
                    style={[
                      styles.noProductsText,
                      isDarkMode ? styles.textDark : styles.textLight,
                    ]}
                  >
                    Không tìm thấy sản phẩm
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submitButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Tạo Voucher</Text>
          )}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerLight: {
    backgroundColor: "#FFFFFF",
  },
  containerDark: {
    backgroundColor: "#121212",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 8,
  },
  textLight: {
    color: "#1E1E1E",
  },
  textDark: {
    color: "#E5E7EB",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: "500",
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    color: "#1E1E1E",
  },
  inputDark: {
    backgroundColor: "#1E1E1E",
    borderColor: "#374151",
    color: "#E5E7EB",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  radioGroup: {
    flexDirection: "row",
    marginBottom: 8,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  radioButtonSelected: {
    // No specific style needed
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  radioCircleSelected: {
    // No specific style needed
  },
  radioChecked: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F97316",
  },
  radioLabel: {
    fontSize: 16,
  },
  inputWithSuffix: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputWithSuffixField: {
    flex: 1,
  },
  inputSuffix: {
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    justifyContent: "center",
  },
  dateToText: {
    marginHorizontal: 10,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    fontSize: 16,
  },
  productSelectorButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  productSelectorButtonLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
  },
  productSelectorButtonDark: {
    backgroundColor: "#1E1E1E",
    borderColor: "#374151",
  },
  productSelectorButtonText: {
    fontSize: 16,
  },
  productSelector: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    maxHeight: 300,
  },
  productSearchInput: {
    marginBottom: 12,
  },
  productList: {
    maxHeight: 200,
  },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  productItemLight: {
    // No specific style needed
  },
  productItemDark: {
    borderBottomColor: "#374151",
  },
  productItemSelected: {
    backgroundColor: "#FEF3C7",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: "#F97316",
  },
  checkboxContainer: {
    padding: 0,
    margin: 0,
    marginLeft: 0,
    marginRight: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  productLoading: {
    marginVertical: 20,
  },
  noProductsText: {
    textAlign: "center",
    marginVertical: 20,
    fontStyle: "italic",
  },
  buttonContainer: {
    marginTop: 20,
  },
  submitButton: {
    height: 50,
    backgroundColor: "#F97316",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
