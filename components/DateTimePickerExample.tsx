import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import CustomDateTimePicker from "./CustomDateTimePicker";

const DateTimePickerExample = () => {
  const [date, setDate] = useState(new Date());
  const [mode, setMode] = useState<"date" | "time" | "datetime">("date");
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const showDatePicker = (pickerMode: "date" | "time" | "datetime") => {
    setMode(pickerMode);
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleConfirm = (selectedDate: Date) => {
    setDate(selectedDate);
    hideDatePicker();
  };

  // Format the date based on the mode
  const formatDate = (date: Date, mode: "date" | "time" | "datetime") => {
    if (mode === "date") {
      return date.toLocaleDateString();
    } else if (mode === "time") {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleString();
    }
  };

  return (
    <View className="flex-1 p-5 justify-center bg-gray-50">
      <Text className="text-2xl font-bold mb-5 text-center">
        DateTimePicker Example
      </Text>

      <View className="bg-white p-4 rounded-lg mb-8 shadow">
        <Text className="text-base mb-1 text-gray-600">Selected {mode}:</Text>
        <Text className="text-lg font-bold">{formatDate(date, mode)}</Text>
      </View>

      <View className="gap-2.5">
        <TouchableOpacity
          className="bg-blue-600 p-4 rounded-lg items-center mb-2"
          onPress={() => showDatePicker("date")}
        >
          <Text className="text-white text-base font-semibold">
            Show Date Picker
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-blue-600 p-4 rounded-lg items-center mb-2"
          onPress={() => showDatePicker("time")}
        >
          <Text className="text-white text-base font-semibold">
            Show Time Picker
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-blue-600 p-4 rounded-lg items-center mb-2"
          onPress={() => showDatePicker("datetime")}
        >
          <Text className="text-white text-base font-semibold">
            Show Date & Time Picker
          </Text>
        </TouchableOpacity>
      </View>

      <CustomDateTimePicker
        isVisible={isDatePickerVisible}
        mode={mode}
        date={date}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        // Optional: You can set min/max dates if needed
        // minimumDate={new Date(2020, 0, 1)}
        // maximumDate={new Date(2030, 11, 31)}
      />
    </View>
  );
};

export default DateTimePickerExample;
