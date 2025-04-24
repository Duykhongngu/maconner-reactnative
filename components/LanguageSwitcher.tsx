import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "./ui/text";
import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    // Chuyển đổi giữa tiếng Việt và tiếng Anh
    const nextLanguage = i18n.language === "vi" ? "en" : "vi";
    i18n.changeLanguage(nextLanguage);
  };

  return (
    <TouchableOpacity onPress={toggleLanguage} style={styles.container}>
      <Text style={styles.text}>
        {i18n.language === "vi" ? "🇻🇳 VI" : "🇺🇸 EN"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default LanguageSwitcher;
