import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Button } from "~/components/ui/button";
import { Order, OrderItem } from "../types";

interface OrderItemProps {
  order: Order;
  updateOrderStatus: (orderId: string, newStatus: string) => Promise<void>;
  isDarkMode: boolean;
  formatDate: (dateString: string) => string;
}

const OrderItemComponent: React.FC<OrderItemProps> = ({
  order,
  updateOrderStatus,
  isDarkMode,
  formatDate,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const screenWidth = Dimensions.get("window").width;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#f97316";
      case "completed":
        return "#10b981";
      case "cancelled":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "ĐANG XỬ LÝ";
      case "completed":
        return "HOÀN THÀNH";
      case "cancelled":
        return "ĐÃ HỦY";
      default:
        return status.toUpperCase();
    }
  };

  const renderOrderItems = () => {
    if (!order.cartItems || order.cartItems.length === 0) {
      return (
        <View className="mt-4">
          <Text
            className={`text-lg font-bold ${
              isDarkMode ? "text-white" : "text-black"
            }`}
          >
            Danh mục sản phẩm
          </Text>
          <Text
            className={`text-sm italic mt-2 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Không có sản phẩm nào trong đơn hàng này.
          </Text>
        </View>
      );
    }

    return (
      <View className="mt-4">
        <Text
          className={`text-lg font-bold ${
            isDarkMode ? "text-white" : "text-black"
          }`}
        >
          Danh mục sản phẩm
        </Text>
        {order.cartItems.map((item, index) => (
          <View
            key={`${item.id}-${item.color}-${item.size}`}
            className={`mt-3 p-3 border rounded-lg ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <View className="flex-row">
              <View className="w-[80] h-[80] rounded-lg overflow-hidden mr-3">
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                    onError={(e) =>
                      console.log("Image error:", e.nativeEvent.error)
                    }
                  />
                ) : (
                  <Image
                    source={require("~/assets/images/NADlogo.png")}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row justify-between items-start">
                  <Text
                    className={`text-base font-semibold flex-1 ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-base font-semibold text-orange-500 ml-2">
                    {(item.price * item.quantity).toLocaleString("vi-VN")} VNĐ
                  </Text>
                </View>
                <Text
                  className={`text-xs mt-1 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Mã SP: {item.id}
                </Text>
                <Text
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {item.price.toLocaleString("vi-VN")} VNĐ x {item.quantity}
                </Text>
                {item.color && (
                  <View className="flex-row items-center mt-1">
                    <Text
                      className={`text-xs mr-2 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Màu: {item.color}
                    </Text>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: item.color.toLowerCase(),
                        borderRadius: 6,
                      }}
                    />
                  </View>
                )}
                {item.size && (
                  <Text
                    className={`text-xs mt-1 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Kích thước: {item.size}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className={`p-3 mb-3 rounded border ${
          isDarkMode
            ? "bg-[#1E1E1E] border-gray-600"
            : "bg-white border-gray-300"
        }`}
        activeOpacity={0.7}
      >
        <View className="flex-row justify-between items-center mb-1">
          <Text
            className={`text-base font-bold ${
              isDarkMode ? "text-white" : "text-black"
            }`}
            numberOfLines={1}
          >
            Đơn hàng: #{order.id.substring(0, 8)}
          </Text>
          <View
            style={{
              backgroundColor: getStatusColor(order.status) + "20",
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                color: getStatusColor(order.status),
                fontWeight: "600",
                fontSize: 12,
              }}
            >
              {getStatusText(order.status)}
            </Text>
          </View>
        </View>

        <Text
          className={`text-sm ${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}
          numberOfLines={1}
        >
          Khách hàng: {order.name || "N/A"}
        </Text>
        <Text
          className={`text-sm ${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          Ngày đặt: {formatDate(order.date)}
        </Text>
        <Text
          className={`text-base font-bold mt-1 ${
            isDarkMode ? "text-white" : "text-black"
          }`}
        >
          Tổng tiền: {order.total.toLocaleString("vi-VN")} VNĐ
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDarkMode ? "#1E1E1E" : "white" },
              { width: screenWidth > 500 ? "90%" : "100%" },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="p-4">
                <View className="flex-row justify-between items-center mb-4">
                  <Text
                    className={`text-xl font-bold ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    Chi tiết đơn hàng
                  </Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    className="p-2"
                  >
                    <Text
                      className={`text-lg ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="mb-4">
                  <Text
                    className={`text-base font-bold ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    Mã đơn hàng: {order.id}
                  </Text>
                  <Text
                    className={`text-sm mt-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Khách hàng: {order.name || "N/A"}
                  </Text>
                  <Text
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Email: {order.email || "N/A"}
                  </Text>
                  <Text
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Số điện thoại: {order.phone || "N/A"}
                  </Text>
                  <Text
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Ngày đặt: {formatDate(order.date)}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Text
                      className={`text-sm mr-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Trạng thái:
                    </Text>
                    <View
                      style={{
                        backgroundColor: getStatusColor(order.status) + "20",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 12,
                      }}
                    >
                      <Text
                        style={{
                          color: getStatusColor(order.status),
                          fontWeight: "600",
                          fontSize: 12,
                        }}
                      >
                        {getStatusText(order.status)}
                      </Text>
                    </View>
                  </View>
                  <Text
                    className={`text-lg font-bold mt-2 ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    Tổng tiền: {order.total.toLocaleString("vi-VN")} VNĐ
                  </Text>
                </View>

                {renderOrderItems()}

                <View className="mt-6">
                  <Text
                    className={`text-base font-bold mb-2 ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    Cập nhật trạng thái
                  </Text>
                  <View className="flex-row flex-wrap justify-between">
                    <Button
                      onPress={() => {
                        updateOrderStatus(order.id, "pending");
                        setModalVisible(false);
                      }}
                      className="bg-orange-500 p-2 rounded"
                      style={{
                        width: screenWidth > 500 ? "32%" : "100%",
                        marginBottom: screenWidth > 500 ? 0 : 8,
                      }}
                    >
                      <Text className="text-white text-center">Đang xử lý</Text>
                    </Button>
                    <Button
                      onPress={() => {
                        updateOrderStatus(order.id, "completed");
                        setModalVisible(false);
                      }}
                      className="bg-green-500 p-2 rounded"
                      style={{
                        width: screenWidth > 500 ? "32%" : "100%",
                        marginBottom: screenWidth > 500 ? 0 : 8,
                      }}
                    >
                      <Text className="text-white text-center">Hoàn thành</Text>
                    </Button>
                    <Button
                      onPress={() => {
                        updateOrderStatus(order.id, "cancelled");
                        setModalVisible(false);
                      }}
                      className="bg-red-500 p-2 rounded"
                      style={{ width: screenWidth > 500 ? "32%" : "100%" }}
                    >
                      <Text className="text-white text-center">Hủy đơn</Text>
                    </Button>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    maxHeight: "90%",
    borderRadius: 20,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default OrderItemComponent;
