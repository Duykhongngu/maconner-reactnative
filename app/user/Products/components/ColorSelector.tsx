import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

interface ColorSelectorProps {
  colors: string[];
  selectedColor: string;
  onSelectColor: (color: string) => void;
  isDarkMode?: boolean;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({
  colors,
  selectedColor,
  onSelectColor,
  isDarkMode = false,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {colors.map((color) => (
        <TouchableOpacity
          key={color}
          onPress={() => onSelectColor(color)}
          style={[
            styles.colorButton,
            { borderColor: isDarkMode ? "#4B5563" : "#E5E7EB" },
            selectedColor === color && styles.selectedButton,
          ]}
        >
          <Text
            style={[
              styles.colorText,
              { color: isDarkMode ? "#ffffff" : "#000000" },
            ]}
          >
            {t(`color_${color.toLowerCase()}`, { defaultValue: color })}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  colorButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    margin: 4,
  },
  selectedButton: {
    borderColor: "#F97316",
    backgroundColor: "rgba(249, 115, 22, 0.1)",
  },
  colorText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default ColorSelector;
