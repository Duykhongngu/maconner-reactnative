import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Appearance,
} from "react-native";
import { DollarSign, Wallet } from "lucide-react-native";
import { Controller, Control, FieldErrors } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { FormData } from "~/service/checkout";
import { useTranslation } from "react-i18next";

interface PaymentMethodSelectionProps {
  control: Control<FormData>;
  errors: FieldErrors<FormData>;
}

const PaymentMethodSelection: React.FC<PaymentMethodSelectionProps> = ({
  control,
  errors,
}) => {
  const { t } = useTranslation();
  const colorScheme = Appearance.getColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle style={isDarkMode ? styles.darkText : styles.lightText}>
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
                <DollarSign
                  color={value === "cod" ? "#F97316" : "#6B7280"}
                  className="mr-2"
                />
                <Text style={isDarkMode ? styles.darkText : styles.lightText}>
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
                <Wallet
                  color={value === "momo" ? "#F97316" : "#6B7280"}
                  className="mr-2"
                />
                <Text style={isDarkMode ? styles.darkText : styles.lightText}>
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

const styles = StyleSheet.create({
  darkText: {
    color: "#FFFFFF",
  },
  lightText: {
    color: "#000000",
  },
});

export default PaymentMethodSelection;
