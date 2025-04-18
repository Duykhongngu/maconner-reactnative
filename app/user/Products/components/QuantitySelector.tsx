import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface QuantitySelectorProps {
  quantity: number;
  onChangeQuantity: (quantity: number) => void;
  isDarkMode: boolean;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onChangeQuantity,
  isDarkMode,
}) => {
  // Shared values cho animation
  const scaleDecrease = useSharedValue(1);
  const scaleIncrease = useSharedValue(1);

  // Animated styles
  const decreaseAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleDecrease.value }],
    };
  });

  const increaseAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleIncrease.value }],
    };
  });

  const handleDecrease = () => {
    if (quantity <= 1) return;

    // Tạo animation và sau đó thực hiện hành động
    scaleDecrease.value = withSpring(0.9, {}, () => {
      // Sử dụng callback của withSpring thay vì setTimeout
      scaleDecrease.value = withSpring(1);
    });

    // Thay đổi giá trị ngay lập tức
    onChangeQuantity(Math.max(1, quantity - 1));
  };

  const handleIncrease = () => {
    // Tạo animation và sau đó thực hiện hành động
    scaleIncrease.value = withSpring(0.9, {}, () => {
      // Sử dụng callback của withSpring thay vì setTimeout
      scaleIncrease.value = withSpring(1);
    });

    // Thay đổi giá trị ngay lập tức
    onChangeQuantity(quantity + 1);
  };

  return (
    <View style={styles.quantityContainer}>
      <Animated.View style={[styles.buttonContainer, decreaseAnimatedStyle]}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={handleDecrease}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
      </Animated.View>
      <Text style={[styles.quantityText, isDarkMode && styles.darkText]}>
        {quantity}
      </Text>
      <Animated.View style={[styles.buttonContainer, increaseAnimatedStyle]}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={handleIncrease}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonContainer: {
    // Container cho animated view
  },
  quantityButton: {
    width: 40,
    height: 40,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  quantityText: {
    fontSize: 18,
    marginHorizontal: 16,
  },
  darkText: {
    color: "#fff",
  },
});

export default QuantitySelector;
