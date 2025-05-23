import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  Appearance,
  Alert,
  SafeAreaView,
  View,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "~/components/ui/button";
import { useCart } from "../Cart/CartContext";
import { useOrder } from "../Order/OrderContext";
import { useRouter } from "expo-router";
import { auth } from "~/firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import { getUserData, processCheckout } from "~/service/checkout";
import { Order as OrderType } from "../Order/components/types";
import { getUserVouchers, Voucher } from "~/service/vouchers";
import { useTranslation } from "react-i18next";
import Feather from "react-native-vector-icons/Feather";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { 
  handleMoMoPayment, 
  waitForPaymentResult 
} from "~/service/momo";
import { useMoMoDeepLink } from "~/lib/useMoMoDeepLink";

// Import custom components
import ShippingForm from "./ShippingForm";
import VoucherSection from "./VoucherSection";
import PaymentMethodSelection from "./PaymentMethodSelection";
import OrderSummary from "./OrderSummary";

// Define checkout steps
enum CheckoutStep {
  SHIPPING = 0,
  REVIEW = 1,
  PAYMENT = 2,
  PROCESSING = 3, // Thêm bước xử lý thanh toán
}

// Form schema definition - Now with translations
const CheckoutContent: React.FC = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(
    CheckoutStep.SHIPPING
  );

  // Sử dụng hook để nhận thông tin về deeplink
  const { lastDeepLink } = useMoMoDeepLink();

  const formSchema = z.object({
    name: z.string().min(2, { message: t("form_validation_name") }),
    email: z.string().email({ message: t("form_validation_email") }),
    phone: z.string().min(10, { message: t("form_validation_phone") }),
    address: z.string().min(5, { message: t("form_validation_address") }),
    paymentMethod: z.enum(["cod", "momo"], {
      required_error: t("form_validation_payment"),
    }),
    voucherCode: z.string().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const { cartItems, clearCart } = useCart();
  const { setCurrentOrder } = useOrder();
  const router = useRouter();
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [voucher, setVoucher] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [userVouchers, setUserVouchers] = useState<
    { id: string; voucher: Voucher; isUsed: boolean }[]
  >([]);
  const [loadingUserVouchers, setLoadingUserVouchers] = useState(false);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const shippingFee = 30000;
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
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      paymentMethod: "cod",
      voucherCode: "",
    },
    mode: "onChange", // Validate on change for immediate feedback
  });

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
              paymentMethod: "cod",
              voucherCode: "",
            });

            // Trigger validation after setting values from database
            await trigger();
          } else {
            console.log("User information not found in Firestore");
            Alert.alert(t("error"), t("user_not_found"));
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          Alert.alert(t("error"), t("load_user_error"));
        }
      } else {
        Alert.alert(t("error"), t("login_required"));
        router.replace("/" as any);
      }
    });

    return () => unsubscribe();
  }, [reset, router, trigger, t]);

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

  // Function to validate shipping details before proceeding to next step
  const validateShippingStep = async () => {
    const isValid = await trigger(["name", "email", "phone", "address"]);
    if (isValid) {
      setCurrentStep(CheckoutStep.REVIEW);
    } else {
      Alert.alert(t("error"), t("please_fill_all_info"));
    }
  };

  // Function to move to the payment step
  const goToPaymentStep = () => {
    setCurrentStep(CheckoutStep.PAYMENT);
  };

  // Function to go back to previous step
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission and save the order to Firestore with userId
  const onSubmit = async (values: FormValues) => {
    const isValid = await trigger();

    if (!isValid) {
      Alert.alert(t("error"), t("please_fill_all_info"));
      return;
    }

    setIsPaymentLoading(true);

    try {
      const checkoutData: any = {
        ...values,
      };

      if (voucher && discountAmount > 0) {
        checkoutData.voucherId = voucher.id;
        checkoutData.discountAmount = discountAmount;
      }

      // Xử lý thanh toán MoMo
      if (values.paymentMethod === "momo") {
        const finalAmount = subtotal + shippingFee - discountAmount;
        
        // Hiển thị trạng thái đang xử lý thanh toán
        setCurrentStep(CheckoutStep.PROCESSING);
        
        // Gọi API thanh toán MoMo, kết quả trả về sẽ là một đối tượng có status và orderId
        const result = await handleMoMoPayment(
          finalAmount,
          `Thanh toán đơn hàng NAD Shop`
        );

        // Nếu quá trình khởi tạo thanh toán thành công (có được orderId và đã mở app MoMo)
        if (result.status === "pending" && result.orderId) {
          // Tạo đơn hàng với trạng thái chờ thanh toán
          const order = await processCheckout(
            {
              ...checkoutData,
              discountAmount: discountAmount.toString(),
              status: "pending", // Trạng thái chờ thanh toán
              momoOrderId: result.orderId // Lưu mã giao dịch MoMo để theo dõi
            },
            cartItems,
            subtotal,
            shippingFee
          );

          if (order) {
            setCurrentOrder(order as OrderType);
            console.log(`Order created with ID: ${order.id}, waiting for payment result...`);
            
            try {
              // Đợi kết quả thanh toán (tối đa 5 phút)
              const paymentResult = await waitForPaymentResult(result.orderId, 300000);
              console.log(`Payment result received: ${JSON.stringify(paymentResult)}`);
              
              if (paymentResult.status === "success") {
                // Thanh toán thành công, cập nhật trạng thái đơn hàng
                // Ở đây có thể gọi API để cập nhật trạng thái đơn hàng thành "completed"
                Alert.alert(
                  t("success"), 
                  t("payment_successful"),
                  [{ 
                    text: 'OK', 
                    onPress: () => {
                      clearCart();
                      router.push("/user/Order/OrderStatus");
                    }
                  }]
                );
              } else if (paymentResult.status === "cancelled") {
                // Người dùng đã hủy thanh toán
                Alert.alert(t("notification"), t("payment_cancelled"));
                setCurrentStep(CheckoutStep.PAYMENT); // Quay lại bước thanh toán
              } else {
                // Thanh toán thất bại
                Alert.alert(t("error"), t("payment_failed"));
                setCurrentStep(CheckoutStep.PAYMENT); // Quay lại bước thanh toán
              }
            } catch (error) {
              console.error("Error waiting for payment result:", error);
              Alert.alert(
                t("error"),
                t("payment_process_error"),
                [{ text: 'OK', onPress: () => setCurrentStep(CheckoutStep.PAYMENT) }]
              );
            }
          }
        } else {
          // Không thể khởi tạo thanh toán MoMo
          Alert.alert(t("error"), t("momo_init_failed"));
          setCurrentStep(CheckoutStep.PAYMENT); // Quay lại bước thanh toán
        }
        
        setIsPaymentLoading(false);
        return;
      }

      // Xử lý thanh toán COD
      const order = await processCheckout(
        {
          ...checkoutData,
          discountAmount: discountAmount.toString(),
          status: "processing", // Trạng thái đang xử lý cho COD
        },
        cartItems,
        subtotal,
        shippingFee
      );

      if (order) {
        setCurrentOrder(order as OrderType);
        clearCart();
        router.push("/user/Order/OrderStatus");
      }
    } catch (error) {
      console.error("Error processing checkout:", error);
      Alert.alert(
        t("error"),
        t(
          values.paymentMethod === "momo"
            ? "momo_payment_error"
            : "checkout_error"
        )
      );
      setCurrentStep(CheckoutStep.PAYMENT); // Đảm bảo quay lại bước thanh toán nếu có lỗi
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const colorScheme = Appearance.getColorScheme();
  const isDarkMode = colorScheme === "dark";

  // Render step indicator
  const renderStepIndicator = () => {
    // Nếu đang xử lý thanh toán, hiển thị giao diện loading
    if (currentStep === CheckoutStep.PROCESSING) {
      return (
        <View className="flex-1 justify-center items-center p-8">
          <ActivityIndicator size="large" color="#F97316" />
          <Text 
            className="mt-4 text-lg font-medium text-center"
            style={isDarkMode ? styles.darkText : styles.lightText}
          >
            {t("payment_processing")}
          </Text>
          <Text
            className="mt-2 text-sm text-center"
            style={isDarkMode ? styles.darkText : styles.lightText}
          >
            {t("dont_close_app")}
          </Text>
        </View>
      );
    }

    // Giữ nguyên code cũ cho các bước còn lại
    return (
      <View className="flex-row justify-between items-center mb-4 px-4 pt-4">
        <View className="flex-1 items-center">
          <View className="flex-row items-center">
            {currentStep >= CheckoutStep.SHIPPING ? (
              <Feather name="check-circle" size={24} color="#F97316" />
            ) : (
              <Feather name="circle" size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
            )}
            <Text
              className="ml-2 font-medium"
              style={isDarkMode ? styles.darkText : styles.lightText}
            >
              {t("shipping")}
            </Text>
          </View>
        </View>

        <View
          style={styles.connector}
          className={
            currentStep >= CheckoutStep.REVIEW ? "bg-orange-500" : "bg-gray-300"
          }
        />

        <View className="flex-1 items-center">
          <View className="flex-row items-center">
            {currentStep >= CheckoutStep.REVIEW ? (
              <Feather name="check-circle" size={24} color="#F97316" />
            ) : (
              <Feather name="circle" size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
            )}
            <Text
              className="ml-2 font-medium"
              style={isDarkMode ? styles.darkText : styles.lightText}
            >
              {t("review")}
            </Text>
          </View>
        </View>

        <View
          style={styles.connector}
          className={
            currentStep >= CheckoutStep.PAYMENT
              ? "bg-orange-500"
              : "bg-gray-300"
          }
        />

        <View className="flex-1 items-center">
          <View className="flex-row items-center">
            {currentStep >= CheckoutStep.PAYMENT ? (
              <Feather name="check-circle" size={24} color="#F97316" />
            ) : (
              <Feather name="circle" size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
            )}
            <Text
              className="ml-2 font-medium"
              style={isDarkMode ? styles.darkText : styles.lightText}
            >
              {t("payment")}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render content based on current step
  const renderContent = () => {
    // Nếu đang ở bước xử lý thanh toán
    if (currentStep === CheckoutStep.PROCESSING) {
      return (
        <View className="flex-1 justify-center items-center p-4">
          <Text 
            className="mb-6 text-base text-center"
            style={isDarkMode ? styles.darkText : styles.lightText}
          >
            {t("redirecting_to_momo")}
          </Text>
        </View>
      );
    }
    
    return (
      <>
        {/* Step 1: Shipping Information */}
        {currentStep === CheckoutStep.SHIPPING && (
          <ShippingForm control={control} errors={errors} />
        )}

        {/* Step 2: Order Review and Voucher */}
        {currentStep === CheckoutStep.REVIEW && (
          <>
            <OrderSummary
              cartItems={cartItems}
              subtotal={subtotal}
              shippingFee={shippingFee}
              discountAmount={discountAmount}
              total={total}
            />

            <VoucherSection
              control={control}
              setValue={setValue}
              getValues={getValues}
              voucher={voucher}
              setVoucher={setVoucher}
              discountAmount={discountAmount}
              setDiscountAmount={setDiscountAmount}
              voucherError={voucherError}
              setVoucherError={setVoucherError}
              isApplyingVoucher={isApplyingVoucher}
              setIsApplyingVoucher={setIsApplyingVoucher}
              userVouchers={userVouchers}
              loadUserVouchers={loadUserVouchers}
              loadingUserVouchers={loadingUserVouchers}
              subtotal={subtotal}
              cartItems={cartItems}
              router={router}
            />
          </>
        )}

        {/* Step 3: Payment */}
        {currentStep === CheckoutStep.PAYMENT && (
          <>
            <OrderSummary
              cartItems={cartItems}
              subtotal={subtotal}
              shippingFee={shippingFee}
              discountAmount={discountAmount}
              total={total}
            />

            <PaymentMethodSelection control={control} errors={errors} />
          </>
        )}

        {/* Navigation Buttons */}
        {renderNavButtons()}
      </>
    );
  };

  // Render navigation buttons
  const renderNavButtons = () => {
    // Nếu đang xử lý thanh toán, không hiển thị các nút điều hướng
    if (currentStep === CheckoutStep.PROCESSING) {
      return null;
    }
    
    // Giữ nguyên code cũ
    return (
      <View className="flex-row justify-between mt-4 mb-6 px-4">
        {currentStep > 0 && (
          <Button
            className="flex-1 mr-2"
            style={[styles.secondaryButton]}
            onPress={goToPreviousStep}
          >
            <View className="flex-row items-center">
              <Feather name="arrow-left" size={16} color="white" />
              <Text className="text-white font-semibold ml-2">
                {t("previous")}
              </Text>
            </View>
          </Button>
        )}

        {currentStep < CheckoutStep.PAYMENT ? (
          <Button
            className={currentStep === 0 ? "flex-1" : "flex-1 ml-2"}
            style={[styles.checkoutButton]}
            onPress={
              currentStep === CheckoutStep.SHIPPING
                ? validateShippingStep
                : goToPaymentStep
            }
          >
            <View className="flex-row items-center">
              <Text className="text-white font-semibold mr-2">{t("next")}</Text>
              <Feather name="arrow-right" size={16} color="white" />
            </View>
          </Button>
        ) : (
          <Button
            className="flex-1 ml-2"
            style={[
              styles.checkoutButton,
              Object.keys(errors).length > 0 || isPaymentLoading
                ? { backgroundColor: "#999" }
                : {},
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isPaymentLoading}
          >
            <Text className="text-white font-semibold">
              {isPaymentLoading ? t("payment_processing") : t("place_order")}
            </Text>
          </Button>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={isDarkMode ? styles.darkBackground : styles.lightBackground}
      >
        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Content based on current step */}
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
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
  checkoutButton: {
    paddingVertical: 12,
    backgroundColor: "#F97316",
    borderRadius: 8,
  },
  secondaryButton: {
    paddingVertical: 12,
    backgroundColor: "#64748B",
    borderRadius: 8,
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  connector: {
    height: 2,
    width: 30,
  },
});

export default CheckoutScreen;
