import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Appearance,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { Controller, Control, FieldErrors } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { FormData } from "~/service/checkout";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "~/lib/useColorScheme";

interface PaymentMethodSelectionProps {
  control: Control<FormData>;
  errors: FieldErrors<FormData>;
}

const PaymentMethodSelection: React.FC<PaymentMethodSelectionProps> = ({
  control,
  errors,
}) => {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className={isDarkMode ? "text-white" : "text-black"}>
          {t("payment_method")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Controller
          control={control}
          name="paymentMethod"
          render={({ field: { onChange, value } }) => (
            <View className="space-y-4">
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
                <FontAwesome
                  name="dollar"
                  size={20}
                  color={value === "cod" ? "#F97316" : "#6B7280"}
                  style={{marginRight: 8}}
                />
                <Text className={isDarkMode ? "text-white" : "text-black"}>
                  {t("cod_payment")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-row items-center p-4 border rounded-md ${
                  value === "momo"
                    ? "border-orange-500"
                    : errors.paymentMethod
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                onPress={() => onChange("momo")}
              >
                <MaterialIcons
                  name="account-balance-wallet"
                  size={20}
                  color={value === "momo" ? "#F97316" : "#6B7280"}
                  style={{marginRight: 8}}
                />
                <Text className={isDarkMode ? "text-white" : "text-black"}>
                  MoMo E-Wallet
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
  );
};

export default PaymentMethodSelection;
