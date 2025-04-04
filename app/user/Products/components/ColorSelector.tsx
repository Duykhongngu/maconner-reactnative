import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  AnimatedStyleProp,
} from "react-native-reanimated";

interface ColorInfo {
  name: string;
  value: string;
  textColor: string;
}

// Khai báo mảng màu cố định trong component
const AVAILABLE_COLORS: ColorInfo[] = [
  { name: "White", value: "#FFFFFF", textColor: "#000000" },
  { name: "Black", value: "#000000", textColor: "#FFFFFF" },
  { name: "Red", value: "#FF0000", textColor: "#FFFFFF" },
  { name: "Blue", value: "#0000FF", textColor: "#FFFFFF" },
  { name: "Green", value: "#008000", textColor: "#FFFFFF" },
  { name: "Yellow", value: "#FFFF00", textColor: "#000000" },
  { name: "Purple", value: "#800080", textColor: "#FFFFFF" },
  { name: "Orange", value: "#FFA500", textColor: "#000000" },
  { name: "Pink", value: "#FFC0CB", textColor: "#000000" },
  { name: "Gray", value: "#808080", textColor: "#FFFFFF" },
  { name: "Brown", value: "#A52A2A", textColor: "#FFFFFF" },
  { name: "Cyan", value: "#00FFFF", textColor: "#000000" },
];

interface ColorSelectorProps {
  colors: string[];
  selectedColor: string;
  onSelectColor: (color: string) => void;
  isDarkMode: boolean;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({
  colors,
  selectedColor,
  onSelectColor,
  isDarkMode,
}) => {
  // Di chuyển hàm getColorInfo vào trong component
  const getColorInfo = (colorName: string): ColorInfo => {
    const colorInfo = AVAILABLE_COLORS.find(
      (c) => c.name.toLowerCase() === colorName.toLowerCase()
    );
    return (
      colorInfo || { name: colorName, value: "#CCCCCC", textColor: "#000000" }
    );
  };

  if (!colors || colors.length === 0) {
    return (
      <Text
        style={[
          styles.colorText,
          { color: isDarkMode ? "#FFFFFF" : "#000000" },
        ]}
      >
        Không có màu sắc
      </Text>
    );
  }

  return (
    <View style={styles.colorContainer}>
      {colors.map((colorName) => {
        const colorInfo = getColorInfo(colorName);
        const isSelected = selectedColor === colorName;

        // Tạo một component con để xử lý animation riêng cho mỗi màu
        return (
          <ColorOption
            key={colorName}
            colorName={colorName}
            colorInfo={colorInfo}
            isSelected={isSelected}
            onSelect={() => onSelectColor(colorName)}
          />
        );
      })}
    </View>
  );
};

// Tạo component con để xử lý animation
interface ColorOptionProps {
  colorName: string;
  colorInfo: ColorInfo;
  isSelected: boolean;
  onSelect: () => void;
}

const ColorOption: React.FC<ColorOptionProps> = ({
  colorName,
  colorInfo,
  isSelected,
  onSelect,
}) => {
  // Shared value cho animation
  const scale = useSharedValue(1);

  // Cập nhật scale khi isSelected thay đổi
  React.useEffect(() => {
    // Sử dụng withSpring để animation mượt mà
    scale.value = withSpring(isSelected ? 1.1 : 1);
  }, [isSelected, scale]);

  // Animated style - Sửa kiểu dữ liệu
  const animatedStyle = useAnimatedStyle<AnimatedStyleProp<ViewStyle>>(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={[styles.colorOptionContainer, animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.colorOption,
          { backgroundColor: colorInfo.value },
          isSelected && {
            borderWidth: 3,
            borderColor: "#FF6B00",
          },
        ]}
        onPress={onSelect}
      >
        <Text style={[styles.colorText, { color: colorInfo.textColor }]}>
          {colorName}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  colorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  colorOptionContainer: {
    margin: 5,
  },
  colorOption: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  colorText: {
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
  },
});

export default ColorSelector;
