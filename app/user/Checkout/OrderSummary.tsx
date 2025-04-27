import React from "react";
import { View, Text, Image, StyleSheet, Appearance } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { CartItem } from "../Cart/CartContext";
import { useTranslation } from "react-i18next";

interface OrderSummaryProps {
  cartItems: CartItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  cartItems,
  subtotal,
  shippingFee,
  discountAmount,
  total,
}) => {
  const { t } = useTranslation();
  const colorScheme = Appearance.getColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle style={isDarkMode ? styles.darkText : styles.lightText}>
          {t("order_summary")}
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
                {t("quantity_label")} {item.quantity}
              </Text>
            </View>
            <Text
              style={isDarkMode ? styles.darkText : styles.lightText}
              className="font-semibold"
            >
              {item.price * item.quantity}VNĐ
            </Text>
          </View>
        ))}
        <Separator className="my-4" />
        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text style={isDarkMode ? styles.darkText : styles.lightText}>
              {t("subtotal")}
            </Text>
            <Text style={isDarkMode ? styles.darkText : styles.lightText}>
              {subtotal}VNĐ
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text style={isDarkMode ? styles.darkText : styles.lightText}>
              {t("shipping_fee")}
            </Text>
            <Text style={isDarkMode ? styles.darkText : styles.lightText}>
              {shippingFee}VNĐ
            </Text>
          </View>
          {discountAmount > 0 && (
            <View className="flex-row justify-between">
              <Text className="text-green-500">{t("discount")}</Text>
              <Text className="text-green-500">-{discountAmount}VNĐ</Text>
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
              {t("total_amount")}
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
  );
};

const styles = StyleSheet.create({
  darkText: {
    color: "#FFFFFF",
  },
  lightText: {
    color: "#000000",
  },
  fontBold: {
    fontWeight: "bold",
  },
});

export default OrderSummary;
