import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Appearance,
  Alert,
  Platform,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  CreditCard,
  DollarSign,
  Tag,
  ChevronDown,
  ChevronUp,
  Copy,
  X,
} from "lucide-react-native";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { useCart } from "../Cart/CartContext";
import { useOrder } from "../Order/OrderContext";
import { useRouter } from "expo-router";
import { auth } from "~/firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import {
  FormData,
  getUserData,
  processCheckout,
  STRIPE_PUBLISHABLE_KEY,
} from "~/service/checkout";
import { Order as OrderType } from "../Order/components/types";
import { validateVoucher, getUserVouchers, Voucher } from "~/service/vouchers";

// Form schema definition
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must have at least 2 characters" }),
  email: z.string().email({ message: "Invalid email" }),
  phone: z.string().min(10, { message: "Invalid phone number" }),
  address: z
    .string()
    .min(5, { message: "Address must have at least 5 characters" }),
  paymentMethod: z.enum(["stripe", "cod"], {
    required_error: "Please select a payment method",
  }),
  voucherCode: z.string().optional(),
});

const CheckoutContent: React.FC = () => {
  const { cartItems, clearCart } = useCart();
  const { setCurrentOrder } = useOrder();
  const router = useRouter();
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [voucher, setVoucher] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [userVouchers, setUserVouchers] = useState<
    { id: string; voucher: Voucher; isUsed: boolean }[]
  >([]);
  const [loadingUserVouchers, setLoadingUserVouchers] = useState(false);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const shippingFee = 30;
  const total = subtotal + shippingFee - discountAmount;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    trigger,
    watch,
    setValue,
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      paymentMethod: "stripe",
      voucherCode: "",
    },
    mode: "onChange", // Validate on change for immediate feedback
  });

  // Watch the payment method to show UI conditionally
  const selectedPaymentMethod = watch("paymentMethod");
  const voucherCode = watch("voucherCode");

  // Get user information from Firestore based on userId when logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userData = await getUserData(currentUser.uid);
          if (userData) {
            reset({
              name: userData.displayName || "",
              email: userData.email || "",
              phone: userData.phone_number || "",
              address: userData.address || "",
              paymentMethod: "stripe",
              voucherCode: "",
            });

            // Trigger validation after setting values from database
            await trigger();
          } else {
            console.log("User information not found in Firestore");
            Alert.alert(
              "Notice",
              "User information not found. Please fill in manually."
            );
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          Alert.alert("Error", "Could not load user information.");
        }
      } else {
        Alert.alert("Error", "You need to be logged in to place an order.");
        router.replace("/" as any);
      }
    });

    return () => unsubscribe();
  }, [reset, router, trigger]);

  // Load user vouchers when component mounts
  useEffect(() => {
    if (auth.currentUser) {
      loadUserVouchers();
    }
  }, []);

  // Load user vouchers
  const loadUserVouchers = async () => {
    if (!auth.currentUser) return;

    try {
      setLoadingUserVouchers(true);
      const vouchers = await getUserVouchers(auth.currentUser.uid);
      // Filter out used vouchers
      setUserVouchers(vouchers.filter((v) => !v.isUsed));
    } catch (error) {
      console.error("Error loading user vouchers:", error);
    } finally {
      setLoadingUserVouchers(false);
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
        Alert.alert("Thành công", "Đã áp dụng mã giảm giá!");
      } else {
        setVoucher(null);
        setDiscountAmount(0);
        setValue("voucherCode", "");
        setVoucherError(result.message || "Mã giảm giá không hợp lệ");
      }
    } catch (error) {
      console.error("Error applying voucher:", error);
      setVoucherError("Có lỗi xảy ra khi áp dụng mã giảm giá");
      setValue("voucherCode", "");
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  // Handle manual voucher application
  const handleApplyVoucher = async () => {
    const code = getValues("voucherCode");
    if (!code) {
      setVoucherError("Vui lòng nhập mã voucher");
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
        Alert.alert("Thành công", "Đã áp dụng mã giảm giá!");
      } else {
        setVoucher(null);
        setDiscountAmount(0);
        setVoucherError(result.message || "Mã giảm giá không hợp lệ");
      }
    } catch (error) {
      console.error("Error applying voucher:", error);
      setVoucherError("Có lỗi xảy ra khi áp dụng mã giảm giá");
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  // Remove applied voucher
  const handleRemoveVoucher = () => {
    setVoucher(null);
    setDiscountAmount(0);
    setValue("voucherCode", "");
    setVoucherError(null);
  };

  // Format discount value for display
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

  // Handle form submission and save the order to Firestore with userId
  const onSubmit = async (values: FormData) => {
    // First check if the form is valid
    const isValid = await trigger();
    if (!isValid) {
      Alert.alert(
        "Error",
        "Please fill in all required information before placing an order"
      );
      return;
    }

    setIsPaymentLoading(true);

    try {
      // Add voucher information to the checkout process
      const checkoutData = {
        ...values,
        voucherId: voucher?.id,
        discountAmount: discountAmount.toFixed(2),
      };

      const order = await processCheckout(
        checkoutData,
        cartItems,
        subtotal,
        shippingFee
      );

      if (order) {
        // Chuyển đổi định dạng Order sang định dạng OrderType cho OrderContext
        const orderForContext: OrderType = {
          id: order.id,
          date: order.date,
          cartItems: order.cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            color: item.color || "Default",
            size: item.size || "Standard",
            image: item.image || "",
            images: item.images || [],
            description: item.description || "",
          })),
          total: order.total,
          userId: order.userId,
          name: order.name,
          email: order.email,
          phone: order.phone,
          address: order.address,
          country: order.country,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          subtotal: order.subtotal,
          shippingFee: order.shippingFee,
          status: order.status,
          discountAmount: discountAmount.toFixed(2),
          voucherId: voucher?.id,
        };

        // Update current order in OrderContext
        setCurrentOrder(orderForContext);

        // Clear the cart
        clearCart();

        // Navigate to order status page
        setTimeout(() => {
          router.push("/user/Order/OrderStatus" as any);
        }, 500);
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      Alert.alert(
        "Error",
        "Something went wrong during checkout. Please try again."
      );
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const colorScheme = Appearance.getColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      style={isDarkMode ? styles.darkBackground : styles.lightBackground}
    >
      <Card>
        <CardHeader>
          <CardTitle style={isDarkMode ? styles.darkText : styles.lightText}>
            Thông tin giao hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="mb-4">
                <Text
                  style={isDarkMode ? styles.darkText : styles.lightText}
                  className="mb-2 font-medium"
                >
                  Họ và tên
                </Text>
                <TextInput
                  style={[
                    isDarkMode ? styles.darkInput : styles.lightInput,
                    errors.name ? { borderColor: "#ef4444" } : {},
                  ]}
                  placeholder="Nguyễn Văn A"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                {errors.name && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.name.message}
                  </Text>
                )}
              </View>
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="mb-4">
                <Text
                  style={isDarkMode ? styles.darkText : styles.lightText}
                  className="mb-2 font-medium"
                >
                  Email
                </Text>
                <TextInput
                  style={[
                    isDarkMode ? styles.darkInput : styles.lightInput,
                    errors.email ? { borderColor: "#ef4444" } : {},
                  ]}
                  placeholder="example@email.com"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.email.message}
                  </Text>
                )}
              </View>
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="mb-4">
                <Text
                  style={isDarkMode ? styles.darkText : styles.lightText}
                  className="mb-2 font-medium"
                >
                  Số điện thoại
                </Text>
                <TextInput
                  style={[
                    isDarkMode ? styles.darkInput : styles.lightInput,
                    errors.phone ? { borderColor: "#ef4444" } : {},
                  ]}
                  placeholder="0123456789"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="phone-pad"
                />
                {errors.phone && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.phone.message}
                  </Text>
                )}
              </View>
            )}
          />
          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="mb-4">
                <Text
                  style={isDarkMode ? styles.darkText : styles.lightText}
                  className="mb-2 font-medium"
                >
                  Địa chỉ
                </Text>
                <TextInput
                  style={[
                    isDarkMode ? styles.darkInput : styles.lightInput,
                    errors.address ? { borderColor: "#ef4444" } : {},
                  ]}
                  placeholder="123 Đường ABC, Quận XYZ"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                {errors.address && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.address.message}
                  </Text>
                )}
              </View>
            )}
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle style={isDarkMode ? styles.darkText : styles.lightText}>
            Mã giảm giá
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
                    placeholder="Nhập mã giảm giá"
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
                        ? "Đang xử lý..."
                        : voucher
                        ? "Hủy"
                        : "Áp dụng"}
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
                      Chọn voucher có sẵn
                    </Text>
                    <ChevronDown size={16} color="#F97316" />
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
                      <Tag size={16} color="#F97316" />
                      <Text className="font-bold text-orange-500 ml-2">
                        {voucher.code}
                      </Text>
                    </View>
                    <Text className="text-gray-700 mt-1">
                      {voucher.description}
                    </Text>
                    <Text className="text-gray-700 mt-1">
                      Giảm: {formatDiscountValue(voucher)}
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
                    Chọn voucher
                  </Text>
                  <TouchableOpacity onPress={() => setShowVoucherModal(false)}>
                    <X color={isDarkMode ? "#FFFFFF" : "#000000"} size={24} />
                  </TouchableOpacity>
                </View>

                {loadingUserVouchers ? (
                  <View className="items-center justify-center p-4">
                    <ActivityIndicator color="#F97316" size="large" />
                    <Text
                      style={isDarkMode ? styles.darkText : styles.lightText}
                      className="mt-2"
                    >
                      Đang tải danh sách voucher...
                    </Text>
                  </View>
                ) : userVouchers.length === 0 ? (
                  <View className="items-center justify-center p-4">
                    <Text
                      style={isDarkMode ? styles.darkText : styles.lightText}
                      className="text-center"
                    >
                      Bạn chưa có voucher nào.
                    </Text>
                    <TouchableOpacity
                      className="mt-4 bg-orange-500 px-4 py-2 rounded-md"
                      onPress={() => {
                        setShowVoucherModal(false);
                        router.push("/user/Vouchers" as any);
                      }}
                    >
                      <Text className="text-white font-medium">
                        Khám phá voucher
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
                            <Tag size={20} color="#F97316" />
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
                              Giảm: {formatDiscountValue(item.voucher)}
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
                                Hết hạn:{" "}
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

      <Card className="mt-4">
        <CardHeader>
          <CardTitle style={isDarkMode ? styles.darkText : styles.lightText}>
            Phương thức thanh toán
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field: { onChange, value } }) => (
              <View>
                <TouchableOpacity
                  className={`flex-row items-center p-4 border rounded-md mb-2 ${
                    value === "stripe"
                      ? "border-orange-500"
                      : errors.paymentMethod
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  onPress={() => onChange("stripe")}
                >
                  <CreditCard
                    color={value === "stripe" ? "#F97316" : "#6B7280"}
                    className="mr-2"
                  />
                  <Text style={isDarkMode ? styles.darkText : styles.lightText}>
                    Thanh toán qua Stripe
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-row items-center p-4 border rounded-md ${
                    value === "cod"
                      ? "border-orange-500"
                      : errors.paymentMethod
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  onPress={() => onChange("cod")}
                >
                  <DollarSign
                    color={value === "cod" ? "#F97316" : "#6B7280"}
                    className="mr-2"
                  />
                  <Text style={isDarkMode ? styles.darkText : styles.lightText}>
                    Thanh toán khi nhận hàng
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.paymentMethod && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.paymentMethod.message}
            </Text>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle style={isDarkMode ? styles.darkText : styles.lightText}>
            Tóm tắt đơn hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cartItems.map((item) => (
            <View
              key={`${item.id}-${item.color}`}
              className="flex-row items-center mb-4"
            >
              <Image
                source={
                  typeof item.image === "string"
                    ? { uri: item.image }
                    : item.image
                }
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 8,
                  marginRight: 16,
                }}
              />
              <View className="flex-1">
                <Text
                  style={isDarkMode ? styles.darkText : styles.lightText}
                  className="font-semibold"
                >
                  {item.name}
                </Text>

                <Text style={isDarkMode ? styles.darkText : styles.lightText}>
                  Số lượng: {item.quantity}
                </Text>
              </View>
              <Text
                style={isDarkMode ? styles.darkText : styles.lightText}
                className="font-semibold"
              >
                {(item.price * item.quantity).toFixed(2)}VNĐ
              </Text>
            </View>
          ))}
          <Separator className="my-4" />
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text style={isDarkMode ? styles.darkText : styles.lightText}>
                Tổng tiền hàng
              </Text>
              <Text style={isDarkMode ? styles.darkText : styles.lightText}>
                {subtotal.toFixed(2)}VNĐ
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text style={isDarkMode ? styles.darkText : styles.lightText}>
                Phí vận chuyển
              </Text>
              <Text style={isDarkMode ? styles.darkText : styles.lightText}>
                {shippingFee.toFixed(2)}VNĐ
              </Text>
            </View>
            {discountAmount > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-green-500">Giảm giá</Text>
                <Text className="text-green-500">
                  -{discountAmount.toFixed(2)}VNĐ
                </Text>
              </View>
            )}
            <Separator />
            <View className="flex-row justify-between">
              <Text
                style={[
                  styles.fontBold,
                  isDarkMode ? styles.darkText : styles.lightText,
                ]}
              >
                Tổng cộng
              </Text>
              <Text
                style={[
                  styles.fontBold,
                  isDarkMode ? styles.darkText : styles.lightText,
                ]}
              >
                {total.toFixed(2)}VNĐ
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>

      <Button
        style={[
          styles.checkoutButton,
          Object.keys(errors).length > 0 || isPaymentLoading
            ? { backgroundColor: "#999" }
            : {},
        ]}
        className="w-full mt-4 mb-6"
        onPress={handleSubmit(onSubmit)}
        disabled={isPaymentLoading}
      >
        <Text style={styles.checkoutButtonText}>
          {isPaymentLoading
            ? "Đang xử lý thanh toán..."
            : Object.keys(errors).length > 0
            ? "Vui lòng điền đầy đủ thông tin"
            : "Đặt hàng"}
        </Text>
      </Button>
    </ScrollView>
  );
};

const CheckoutScreen: React.FC = () => {
  return <CheckoutContent />;
};

const styles = StyleSheet.create({
  darkBackground: {
    backgroundColor: "#121212",
  },
  lightBackground: {
    backgroundColor: "#FFFFFF",
  },
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
  checkoutButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: "#F97316",
    borderRadius: 8,
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  fontBold: {
    fontWeight: "bold",
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

export default CheckoutScreen;
