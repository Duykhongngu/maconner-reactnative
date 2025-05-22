import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";

interface SearchFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  isDarkMode: boolean;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  modalVisible,
  setModalVisible,
  isDarkMode,
}) => {
  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "all":
        return "Tất cả đơn hàng";
      case "pending":
        return "Đang xử lý";
      case "completed":
        return "Hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return "Tất cả đơn hàng";
    }
  };

  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-2 border rounded border-gray-300">
        <View className="bg-white dark:bg-black">
          <Feather
            name="search"
            size={20}
            color={isDarkMode ? "#ffffff" : "#000000"}
            style={{marginHorizontal: 8}}
          />
        </View>
        <TextInput
          className={`flex-1 p-2 text-l ${
            isDarkMode ? "bg-black text-white" : "bg-white text-black"
          }`}
          placeholder="Tìm kiếm đơn hàng..."
          placeholderTextColor={isDarkMode ? "#888" : "#666"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View className="mb-4">
        <TouchableOpacity
          onPress={toggleModal}
          className={`h-12 ${
            isDarkMode ? "bg-[#333333]" : "bg-white"
          } border rounded flex-row items-center justify-between p-2`}
        >
          <Text
            className={`text-lg font-bold ${
              isDarkMode ? "text-white" : "text-black"
            }`}
          >
            {getStatusText(statusFilter)}
          </Text>
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={toggleModal}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalView,
                isDarkMode ? styles.modalDark : styles.modalLight,
              ]}
            >
              <Text
                style={[
                  styles.modalTitle,
                  isDarkMode ? styles.textDark : styles.textLight,
                ]}
              >
                Lọc theo trạng thái
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setStatusFilter("all");
                  toggleModal();
                }}
                style={[
                  styles.filterOption,
                  statusFilter === "all" &&
                    (isDarkMode ? styles.selectedDark : styles.selectedLight),
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isDarkMode ? styles.textDark : styles.textLight,
                  ]}
                >
                  Tất cả đơn hàng
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setStatusFilter("pending");
                  toggleModal();
                }}
                style={[
                  styles.filterOption,
                  statusFilter === "pending" &&
                    (isDarkMode ? styles.selectedDark : styles.selectedLight),
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isDarkMode ? styles.textDark : styles.textLight,
                  ]}
                >
                  Đang xử lý
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setStatusFilter("completed");
                  toggleModal();
                }}
                style={[
                  styles.filterOption,
                  statusFilter === "completed" &&
                    (isDarkMode ? styles.selectedDark : styles.selectedLight),
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isDarkMode ? styles.textDark : styles.textLight,
                  ]}
                >
                  Hoàn thành
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setStatusFilter("cancelled");
                  toggleModal();
                }}
                style={[
                  styles.filterOption,
                  statusFilter === "cancelled" &&
                    (isDarkMode ? styles.selectedDark : styles.selectedLight),
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isDarkMode ? styles.textDark : styles.textLight,
                  ]}
                >
                  Đã hủy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={toggleModal}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "80%",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalLight: {
    backgroundColor: "white",
  },
  modalDark: {
    backgroundColor: "#222",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  textLight: {
    color: "#000",
  },
  textDark: {
    color: "#fff",
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 8,
  },
  selectedLight: {
    backgroundColor: "#f0f0f0",
  },
  selectedDark: {
    backgroundColor: "#444",
  },
  filterText: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: "#f97316",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default SearchFilter;
