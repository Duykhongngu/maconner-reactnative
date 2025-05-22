import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Appearance,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import AntDesign from "react-native-vector-icons/AntDesign";
import {
  Controller,
  Control,
  UseFormGetValues,
  UseFormSetValue,
} from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { FormData } from "~/service/checkout";
import { Voucher, validateVoucher } from "~/service/vouchers";
import { useTranslation } from "react-i18next";

interface VoucherSectionProps {
  control: Control<FormData>;
  setValue: UseFormSetValue<FormData>;
  getValues: UseFormGetValues<FormData>;
  voucher: Voucher | null;
  setVoucher: React.Dispatch<React.SetStateAction<Voucher | null>>;
  discountAmount: number;
  setDiscountAmount: React.Dispatch<React.SetStateAction<number>>;
  voucherError: string | null;
  setVoucherError: React.Dispatch<React.SetStateAction<string | null>>;
  isApplyingVoucher: boolean;
  setIsApplyingVoucher: React.Dispatch<React.SetStateAction<boolean>>;
  userVouchers: { id: string; voucher: Voucher; isUsed: boolean }[];
  loadUserVouchers: () => Promise<void>;
  loadingUserVouchers: boolean;
  subtotal: number;
  cartItems: any[];
  router: any;
}

const VoucherSection: React.FC<VoucherSectionProps> = ({
  control,
  setValue,
  getValues,
  voucher,
  setVoucher,
  discountAmount,
  setDiscountAmount,
  voucherError,
  setVoucherError,
  isApplyingVoucher,
  setIsApplyingVoucher,
  userVouchers,
  loadUserVouchers,
  loadingUserVouchers,
  subtotal,
  cartItems,
  router,
}) => {
  const { t } = useTranslation();
  const colorScheme = Appearance.getColorScheme();
  const isDarkMode = colorScheme === "dark";
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  // Format discount value for display
  const formatDiscountValue = (voucher: Voucher) => {
    if (voucher.discountType === "percentage") {
      let text = `${voucher.discountValue}%`;
      if (voucher.maxDiscount) {
        text += ` (${t("voucher_discount")} ${voucher.maxDiscount} VNĐ)`;
      }
      return text;
    } else {
      return `${voucher.discountValue} VNĐ`;
    }
  };

  // Handle manual voucher application
  const handleApplyVoucher = async () => {
    const code = getValues("voucherCode");
    if (!code) {
      setVoucherError(t("please_enter_voucher"));
      return;
    }

    setIsApplyingVoucher(true);
    setVoucherError(null);

    try {
      // Get product IDs from cart items
      const productIds = cartItems.map((item) => item.id);

      // Validate the voucher
      const result = await validateVoucher(code, productIds, [], subtotal);

      if (result.valid && result.voucher) {
        setVoucher(result.voucher);

        // Calculate discount
        let discount = 0;
        if (result.voucher.discountType === "percentage") {
          discount = (subtotal * result.voucher.discountValue) / 100;

          // Check for max discount limit
          if (
            result.voucher.maxDiscount &&
            discount > result.voucher.maxDiscount
          ) {
            discount = result.voucher.maxDiscount;
          }
        } else {
          // Fixed discount
          discount = result.voucher.discountValue;

          // Ensure discount isn't more than the subtotal
          if (discount > subtotal) {
            discount = subtotal;
          }
        }

        setDiscountAmount(discount);
        Alert.alert(t("success"), t("voucher_success"));
      } else {
        setVoucher(null);
        setDiscountAmount(0);
        setVoucherError(result.message || t("invalid_voucher"));
      }
    } catch (error) {
      console.error("Error applying voucher:", error);
      setVoucherError(t("error_applying_voucher"));
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  // Validate and apply a voucher
  const validateAndApplyVoucher = async (voucherToApply: Voucher) => {
    setIsApplyingVoucher(true);
    setVoucherError(null);

    try {
      // Get product IDs from cart items
      const productIds = cartItems.map((item) => item.id);

      // Validate the voucher
      const result = await validateVoucher(
        voucherToApply.code,
        productIds,
        [],
        subtotal
      );

      if (result.valid && result.voucher) {
        setVoucher(result.voucher);

        // Calculate discount
        let discount = 0;
        if (result.voucher.discountType === "percentage") {
          discount = (subtotal * result.voucher.discountValue) / 100;

          // Check for max discount limit
          if (
            result.voucher.maxDiscount &&
            discount > result.voucher.maxDiscount
          ) {
            discount = result.voucher.maxDiscount;
          }
        } else {
          // Fixed discount
          discount = result.voucher.discountValue;

          // Ensure discount isn't more than the subtotal
          if (discount > subtotal) {
            discount = subtotal;
          }
        }

        setDiscountAmount(discount);
        Alert.alert(t("success"), t("voucher_success"));
      } else {
        setVoucher(null);
        setDiscountAmount(0);
        setValue("voucherCode", "");
        setVoucherError(result.message || t("invalid_voucher"));
      }
    } catch (error) {
      console.error("Error applying voucher:", error);
      setVoucherError(t("error_applying_voucher"));
      setValue("voucherCode", "");
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  // Select a voucher from the modal
  const handleSelectVoucher = async (selectedVoucher: Voucher) => {
    // Close modal
    setShowVoucherModal(false);

    // Reset any previous voucher and error
    setVoucher(null);
    setDiscountAmount(0);
    setVoucherError(null);

    // Set the voucher code in the form
    setValue("voucherCode", selectedVoucher.code);

    // Apply the voucher
    await validateAndApplyVoucher(selectedVoucher);
  };

  // Remove applied voucher
  const handleRemoveVoucher = () => {
    setVoucher(null);
    setDiscountAmount(0);
    setValue("voucherCode", "");
    setVoucherError(null);
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle style={isDarkMode ? styles.darkText : styles.lightText}>
          {t("voucher_section")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Controller
          control={control}
          name="voucherCode"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-2">
              <View className="flex-row">
                <TextInput
                  style={[
                    isDarkMode ? styles.darkInput : styles.lightInput,
                    voucherError ? { borderColor: "#ef4444" } : {},
                    { flex: 1, marginRight: 8 },
                  ]}
                  placeholder={t("enter_voucher_code")}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  editable={!voucher}
                  autoCapitalize="characters"
                />
                <Button
                  className={voucher ? "bg-red-500" : "bg-orange-500"}
                  onPress={voucher ? handleRemoveVoucher : handleApplyVoucher}
                  disabled={isApplyingVoucher}
                >
                  <Text className="text-white font-semibold">
                    {isApplyingVoucher
                      ? t("processing")
                      : voucher
                      ? t("cancel")
                      : t("apply")}
                  </Text>
                </Button>
              </View>

              {/* Toggle button for showing vouchers */}
              {!voucher && (
                <TouchableOpacity
                  className="flex-row items-center mt-2 mb-1"
                  onPress={() => {
                    setShowVoucherModal(true);
                    loadUserVouchers(); // Refresh vouchers
                  }}
                >
                  <Text className="text-orange-500 mr-2">
                    {t("select_available_vouchers")}
                  </Text>
                  <Feather name="chevron-down" size={16} color="#F97316" />
                </TouchableOpacity>
              )}

              {voucherError && (
                <Text className="text-red-500 text-sm mt-1">
                  {voucherError}
                </Text>
              )}
              {voucher && (
                <View className="mt-2 p-3 bg-orange-100 rounded-md border border-orange-200">
                  <View className="flex-row items-center">
                    <FontAwesome name="tag" size={16} color="#F97316" />
                    <Text className="font-bold text-orange-500 ml-2">
                      {voucher.code}
                    </Text>
                  </View>
                  <Text className="text-gray-700 mt-1">
                    {voucher.description}
                  </Text>
                  <Text className="text-gray-700 mt-1">
                    {t("voucher_discount")}: {formatDiscountValue(voucher)}
                  </Text>
                </View>
              )}
            </View>
          )}
        />

        {/* Voucher selection modal */}
        <Modal
          visible={showVoucherModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowVoucherModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                isDarkMode ? styles.darkBackground : styles.lightBackground,
              ]}
            >
              <View style={styles.modalHeader}>
                <Text
                  style={[
                    styles.modalTitle,
                    isDarkMode ? styles.darkText : styles.lightText,
                  ]}
                >
                  {t("choose_voucher")}
                </Text>
                <TouchableOpacity onPress={() => setShowVoucherModal(false)}>
                  <AntDesign name="close" size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
                </TouchableOpacity>
              </View>

              {loadingUserVouchers ? (
                <View className="items-center justify-center p-4">
                  <ActivityIndicator color="#F97316" size="large" />
                  <Text
                    style={isDarkMode ? styles.darkText : styles.lightText}
                    className="mt-2"
                  >
                    {t("loading_vouchers")}
                  </Text>
                </View>
              ) : userVouchers.length === 0 ? (
                <View className="items-center justify-center p-4">
                  <Text
                    style={isDarkMode ? styles.darkText : styles.lightText}
                    className="text-center"
                  >
                    {t("no_vouchers")}
                  </Text>
                  <TouchableOpacity
                    className="mt-4 bg-orange-500 px-4 py-2 rounded-md"
                    onPress={() => {
                      setShowVoucherModal(false);
                      router.push("/user/Vouchers/VoucherScreen" as any);
                    }}
                  >
                    <Text className="text-white font-medium">
                      {t("explore_vouchers")}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={userVouchers}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.voucherItem,
                        isDarkMode
                          ? styles.voucherItemDark
                          : styles.voucherItemLight,
                      ]}
                      onPress={() => handleSelectVoucher(item.voucher)}
                    >
                      <View style={styles.voucherContent}>
                        <View style={styles.voucherIconContainer}>
                          <FontAwesome name="tag" size={20} color="#F97316" />
                        </View>
                        <View style={styles.voucherDetails}>
                          <Text
                            style={[
                              styles.voucherCode,
                              isDarkMode ? styles.darkText : styles.lightText,
                            ]}
                          >
                            {item.voucher.code}
                          </Text>
                          <Text
                            style={[
                              styles.voucherDescription,
                              isDarkMode
                                ? { color: "#CBD5E1" }
                                : { color: "#64748B" },
                            ]}
                          >
                            {item.voucher.description}
                          </Text>
                          <Text style={styles.voucherDiscount}>
                            {t("voucher_discount")}:{" "}
                            {formatDiscountValue(item.voucher)}
                          </Text>

                          {/* Show expiration date */}
                          {item.voucher.endDate && (
                            <Text
                              style={[
                                styles.voucherExpiry,
                                isDarkMode
                                  ? { color: "#CBD5E1" }
                                  : { color: "#64748B" },
                              ]}
                            >
                              {t("voucher_expiry")}:{" "}
                              {new Date(
                                item.voucher.endDate.toMillis()
                              ).toLocaleDateString()}
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      </CardContent>
    </Card>
  );
};

const styles = StyleSheet.create({
  darkText: {
    color: "#FFFFFF",
  },
  lightText: {
    color: "#000000",
  },
  darkInput: {
    borderColor: "#FFFFFF",
    backgroundColor: "#1E1E1E",
    color: "#FFFFFF",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  lightInput: {
    borderColor: "#000000",
    backgroundColor: "#FFFFFF",
    color: "#000000",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  darkBackground: {
    backgroundColor: "#121212",
  },
  lightBackground: {
    backgroundColor: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderRadius: 10,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  voucherItem: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    marginHorizontal: 15,
  },
  voucherItemDark: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333333",
  },
  voucherItemLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E0E0E0",
  },
  voucherContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  voucherIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  voucherDetails: {
    flex: 1,
  },
  voucherCode: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  voucherDescription: {
    fontSize: 14,
    marginBottom: 2,
  },
  voucherDiscount: {
    marginTop: 4,
    fontWeight: "bold",
    color: "#F97316",
  },
  voucherExpiry: {
    marginTop: 4,
    fontSize: 12,
  },
});

export default VoucherSection;
