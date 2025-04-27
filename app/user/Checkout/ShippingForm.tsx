import React from "react";
import { View, Text, TextInput, StyleSheet, Appearance } from "react-native";
import { Controller, Control, FieldErrors } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { FormData } from "~/service/checkout";
import { useTranslation } from "react-i18next";

interface ShippingFormProps {
  control: Control<FormData>;
  errors: FieldErrors<FormData>;
}

const ShippingForm: React.FC<ShippingFormProps> = ({ control, errors }) => {
  const { t } = useTranslation();
  const colorScheme = Appearance.getColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <Card>
      <CardHeader>
        <CardTitle style={isDarkMode ? styles.darkText : styles.lightText}>
          {t("shipping_information")}
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
                {t("name")}
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
                {t("email")}
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
                {t("phone")}
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
                {t("address")}
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
});

export default ShippingForm;
