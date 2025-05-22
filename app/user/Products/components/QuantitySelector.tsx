import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import AntDesign from "react-native-vector-icons/AntDesign";

interface QuantitySelectorProps {
  quantity: number;
  onChangeQuantity: (quantity: number) => void;
  isDarkMode?: boolean;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onChangeQuantity,
  isDarkMode = false,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => onChangeQuantity(Math.max(1, quantity - 1))}
        style={[
          styles.button,
          { backgroundColor: isDarkMode ? "#374151" : "#F3F4F6" },
        ]}
        accessibilityLabel={t("decrease_quantity")}
      >
        <AntDesign name="minus" size={20} color={isDarkMode ? "#D1D5DB" : "#4B5563"} />
      </TouchableOpacity>

      <Text
        style={[
          styles.quantityText,
          { color: isDarkMode ? "#ffffff" : "#000000" },
        ]}
        accessibilityLabel={t("current_quantity", { count: quantity })}
      >
        {quantity}
      </Text>

      <TouchableOpacity
        onPress={() => onChangeQuantity(quantity + 1)}
        style={[
          styles.button,
          { backgroundColor: isDarkMode ? "#374151" : "#F3F4F6" },
        ]}
        accessibilityLabel={t("increase_quantity")}
      >
        <AntDesign name="plus" size={20} color={isDarkMode ? "#D1D5DB" : "#4B5563"} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 16,
  },
});

export default QuantitySelector;
