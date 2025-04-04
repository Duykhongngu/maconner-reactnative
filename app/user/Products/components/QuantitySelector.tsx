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

  // Animated styles - Sửa kiểu dữ liệu
  const decreaseAnimatedStyle = useAnimatedStyle<AnimatedStyleProp<ViewStyle>>(
    () => {
      return {
        transform: [{ scale: scaleDecrease.value }],
      };
    }
  );

  const increaseAnimatedStyle = useAnimatedStyle<AnimatedStyleProp<ViewStyle>>(
    () => {
      return {
        transform: [{ scale: scaleIncrease.value }],
      };
    }
  );

  const handleDecrease = () => {
    if (quantity <= 1) return;

    // Sử dụng withSpring thay vì callback
    scaleDecrease.value = withSpring(0.9);

    // Sử dụng setTimeout để đảm bảo animation hoàn thành
    setTimeout(() => {
      scaleDecrease.value = withSpring(1);
      onChangeQuantity(Math.max(1, quantity - 1));
    }, 100);
  };

  const handleIncrease = () => {
    // Sử dụng withSpring thay vì callback
    scaleIncrease.value = withSpring(0.9);

    // Sử dụng setTimeout để đảm bảo animation hoàn thành
    setTimeout(() => {
      scaleIncrease.value = withSpring(1);
      onChangeQuantity(quantity + 1);
    }, 100);
  };

  return (
    <View style={styles.quantityContainer}>
      <Animated.View style={decreaseAnimatedStyle}>
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
      <Animated.View style={increaseAnimatedStyle}>
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
