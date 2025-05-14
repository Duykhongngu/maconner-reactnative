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
import {
  CheckCircle2,
  Circle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react-native";
import { handleMoMoPayment } from "~/service/momo";

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
}

// Form schema definition - Now with translations
const CheckoutContent: React.FC = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(
    CheckoutStep.SHIPPING
  );

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
        const success = await handleMoMoPayment(
          finalAmount,
          `Thanh toán đơn hàng NAD Shop`
        );

        if (success) {
          // Tạo đơn hàng với trạng thái chờ thanh toán
          const order = await processCheckout(
            {
              ...checkoutData,
              discountAmount: discountAmount.toString(),
              status: "pending", // Trạng thái chờ thanh toán
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
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const colorScheme = Appearance.getColorScheme();
  const isDarkMode = colorScheme === "dark";

  // Render step indicator
  const renderStepIndicator = () => {
    return (
      <View className="flex-row justify-between items-center mb-4 px-4 pt-4">
        <View className="flex-1 items-center">
          <View className="flex-row items-center">
            {currentStep >= CheckoutStep.SHIPPING ? (
              <CheckCircle2 size={24} color="#F97316" />
            ) : (
              <Circle size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
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
              <CheckCircle2 size={24} color="#F97316" />
            ) : (
              <Circle size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
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
              <CheckCircle2 size={24} color="#F97316" />
            ) : (
              <Circle size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
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

  // Render navigation buttons
  const renderNavButtons = () => {
    return (
      <View className="flex-row justify-between mt-4 mb-6 px-4">
        {currentStep > 0 && (
          <Button
            className="flex-1 mr-2"
            style={[styles.secondaryButton]}
            onPress={goToPreviousStep}
          >
            <View className="flex-row items-center">
              <ArrowLeft size={16} color="white" />
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
              <ArrowRight size={16} color="white" />
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
