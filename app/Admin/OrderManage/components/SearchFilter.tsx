import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
} from "react-native";
import { Search } from "lucide-react-native";

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

  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-2 border rounded border-gray-300">
        <View className="bg-white dark:bg-black">
          <Search
            size={20}
            color={isDarkMode ? "#ffffff" : "#000000"}
            className="mx-2"
          />
        </View>
        <TextInput
          className={`flex-1 p-2 text-l ${
            isDarkMode ? "bg-black text-white" : "bg-white text-black"
          }`}
          placeholder="Search orders..."
          placeholderTextColor={isDarkMode ? "#888" : "#666"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View className="mb-4">
        <TouchableOpacity
          onPress={toggleModal}
          className={`h-12 ${
            isDarkMode ? "bg-[#333333] text-white" : "bg-white text-black"
          } border rounded flex-row items-center justify-between p-2`}
        >
          <Text className="text-lg font-bold text-black dark:text-white">
            {statusFilter === "all"
              ? "All Orders"
              : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
          </Text>
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={toggleModal}
        >
          <View style={styles.modalView}>
            <TouchableOpacity
              onPress={() => {
                setStatusFilter("all");
                toggleModal();
              }}
              className="p-2"
            >
              <Text>All Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setStatusFilter("pending");
                toggleModal();
              }}
              className="p-2"
            >
              <Text>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setStatusFilter("completed");
                toggleModal();
              }}
              className="p-2"
            >
              <Text>Completed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setStatusFilter("cancelled");
                toggleModal();
              }}
              className="p-2"
            >
              <Text>Cancelled</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleModal} className="p-2">
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
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

export default SearchFilter;
