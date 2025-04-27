import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  Appearance,
  Alert,
  SafeAreaView,
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
import { FormData, getUserData, processCheckout } from "~/service/checkout";
import { Order as OrderType } from "../Order/components/types";
import { getUserVouchers, Voucher } from "~/service/vouchers";
import { useTranslation } from "react-i18next";

// Import custom components
import ShippingForm from "./ShippingForm";
import VoucherSection from "./VoucherSection";
import PaymentMethodSelection from "./PaymentMethodSelection";
import OrderSummary from "./OrderSummary";

// Form schema definition - Now with translations
const CheckoutContent: React.FC = () => {
  const { t } = useTranslation();

  const formSchema = z.object({
    name: z.string().min(2, { message: t("form_validation_name") }),
    email: z.string().email({ message: t("form_validation_email") }),
    phone: z.string().min(10, { message: t("form_validation_phone") }),
    address: z.string().min(5, { message: t("form_validation_address") }),
    paymentMethod: z.enum(["stripe", "cod"], {
      required_error: t("form_validation_payment"),
    }),
    voucherCode: z.string().optional(),
  });

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

  // Handle form submission and save the order to Firestore with userId
  const onSubmit = async (values: FormData) => {
    const isValid = await trigger();
    if (!isValid) {
      Alert.alert(t("error"), t("please_fill_all_info"));
      return;
    }

    setIsPaymentLoading(true);

    try {
      // Only include voucher data if a voucher is selected and valid
      const checkoutData: any = {
        ...values,
      };

      // Only add voucher data if a voucher is selected and valid
      if (voucher && discountAmount > 0) {
        checkoutData.voucherId = voucher.id;
        checkoutData.discountAmount = discountAmount;
      }

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
      Alert.alert(t("error"), t("checkout_error"));
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const colorScheme = Appearance.getColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={isDarkMode ? styles.darkBackground : styles.lightBackground}
      >
        {/* Shipping Information Form */}
        <ShippingForm control={control} errors={errors} />

        {/* Voucher Section */}
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

        {/* Payment Method Selection */}
        <PaymentMethodSelection control={control} errors={errors} />

        {/* Order Summary */}
        <OrderSummary
          cartItems={cartItems}
          subtotal={subtotal}
          shippingFee={shippingFee}
          discountAmount={discountAmount}
          total={total}
        />

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
              ? t("payment_processing")
              : Object.keys(errors).length > 0
              ? t("please_fill_all_info")
              : t("place_order")}
          </Text>
        </Button>
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
});

export default CheckoutScreen;
