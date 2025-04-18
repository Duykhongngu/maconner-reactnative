import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { useColorScheme } from "../lib/useColorScheme";

interface CustomDateTimePickerProps {
  isVisible: boolean;
  mode: "date" | "time" | "datetime";
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  date?: Date;
  minimumDate?: Date;
  maximumDate?: Date;
}

const MONTHS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  isVisible,
  mode,
  onConfirm,
  onCancel,
  date = new Date(),
  minimumDate,
  maximumDate,
}) => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [selectedDate, setSelectedDate] = useState<Date>(date);
  const [selectedHour, setSelectedHour] = useState<number>(date.getHours());
  const [selectedMinute, setSelectedMinute] = useState<number>(
    date.getMinutes()
  );
  const [selectedDay, setSelectedDay] = useState<number>(date.getDate());
  const [selectedMonth, setSelectedMonth] = useState<number>(date.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(date.getFullYear());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(
    mode === "date" || mode === "datetime"
  );
  const [showTimePicker, setShowTimePicker] = useState<boolean>(
    mode === "time" || mode === "datetime"
  );

  // Update state when date prop changes
  useEffect(() => {
    if (date) {
      setSelectedDate(date);
      setSelectedHour(date.getHours());
      setSelectedMinute(date.getMinutes());
      setSelectedDay(date.getDate());
      setSelectedMonth(date.getMonth());
      setSelectedYear(date.getFullYear());
    }
  }, [date]);

  // Generate years (from 10 years ago to 10 years in the future)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  // Generate days based on selected month and year
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const days = Array.from(
    { length: getDaysInMonth(selectedYear, selectedMonth) },
    (_, i) => i + 1
  );

  // Generate hours (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Generate minutes (0-59)
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleConfirm = () => {
    const newDate = new Date(
      selectedYear,
      selectedMonth,
      selectedDay,
      mode === "date" ? 0 : selectedHour,
      mode === "date" ? 0 : selectedMinute
    );

    // Check if date is within range
    if (minimumDate && newDate < minimumDate) {
      setSelectedDate(minimumDate);
      onConfirm(minimumDate);
      return;
    }

    if (maximumDate && newDate > maximumDate) {
      setSelectedDate(maximumDate);
      onConfirm(maximumDate);
      return;
    }

    setSelectedDate(newDate);
    onConfirm(newDate);
  };

  // Components for each picker type
  const renderDatePicker = () => {
    return (
      <View className={`mb-${mode === "datetime" ? 2 : 0}`}>
        <View className="flex-row justify-between">
          <View className="flex-1 items-center">
            <Text
              className={`text-sm font-bold mb-1 ${
                isDarkMode ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Tháng
            </Text>
            <ScrollView
              className="h-[150px] w-4/5"
              showsVerticalScrollIndicator={false}
            >
              {MONTHS.map((month, index) => (
                <TouchableOpacity
                  key={month}
                  className={`p-2.5 items-center justify-center rounded-md ${
                    selectedMonth === index ? "bg-orange-100" : ""
                  }`}
                  onPress={() => setSelectedMonth(index)}
                >
                  <Text
                    className={`text-base ${
                      selectedMonth === index
                        ? "font-bold text-orange-500"
                        : isDarkMode
                        ? "text-gray-300"
                        : "text-gray-700"
                    }`}
                  >
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View className="flex-1 items-center">
            <Text
              className={`text-sm font-bold mb-1 ${
                isDarkMode ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Ngày
            </Text>
            <ScrollView
              className="h-[150px] w-4/5"
              showsVerticalScrollIndicator={false}
            >
              {days.map((day) => (
                <TouchableOpacity
                  key={`day-${day}`}
                  className={`p-2.5 items-center justify-center rounded-md ${
                    selectedDay === day ? "bg-orange-100" : ""
                  }`}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text
                    className={`text-base ${
                      selectedDay === day
                        ? "font-bold text-orange-500"
                        : isDarkMode
                        ? "text-gray-300"
                        : "text-gray-700"
                    }`}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View className="flex-1 items-center">
            <Text
              className={`text-sm font-bold mb-1 ${
                isDarkMode ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Năm
            </Text>
            <ScrollView
              className="h-[150px] w-4/5"
              showsVerticalScrollIndicator={false}
            >
              {years.map((year) => (
                <TouchableOpacity
                  key={`year-${year}`}
                  className={`p-2.5 items-center justify-center rounded-md ${
                    selectedYear === year ? "bg-orange-100" : ""
                  }`}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text
                    className={`text-base ${
                      selectedYear === year
                        ? "font-bold text-orange-500"
                        : isDarkMode
                        ? "text-gray-300"
                        : "text-gray-700"
                    }`}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  };

  const renderTimePicker = () => {
    return (
      <View>
        <View className="flex-row justify-between">
          <View className="flex-1 items-center">
            <Text
              className={`text-sm font-bold mb-1 ${
                isDarkMode ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Giờ
            </Text>
            <ScrollView
              className="h-[150px] w-4/5"
              showsVerticalScrollIndicator={false}
            >
              {hours.map((hour) => (
                <TouchableOpacity
                  key={`hour-${hour}`}
                  className={`p-2.5 items-center justify-center rounded-md ${
                    selectedHour === hour ? "bg-orange-100" : ""
                  }`}
                  onPress={() => setSelectedHour(hour)}
                >
                  <Text
                    className={`text-base ${
                      selectedHour === hour
                        ? "font-bold text-orange-500"
                        : isDarkMode
                        ? "text-gray-300"
                        : "text-gray-700"
                    }`}
                  >
                    {hour.toString().padStart(2, "0")}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View className="flex-1 items-center">
            <Text
              className={`text-sm font-bold mb-1 ${
                isDarkMode ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Phút
            </Text>
            <ScrollView
              className="h-[150px] w-4/5"
              showsVerticalScrollIndicator={false}
            >
              {minutes.map((minute) => (
                <TouchableOpacity
                  key={`minute-${minute}`}
                  className={`p-2.5 items-center justify-center rounded-md ${
                    selectedMinute === minute ? "bg-orange-100" : ""
                  }`}
                  onPress={() => setSelectedMinute(minute)}
                >
                  <Text
                    className={`text-base ${
                      selectedMinute === minute
                        ? "font-bold text-orange-500"
                        : isDarkMode
                        ? "text-gray-300"
                        : "text-gray-700"
                    }`}
                  >
                    {minute.toString().padStart(2, "0")}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  };

  const { width } = Dimensions.get("window");

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View className="flex-1 bg-black/50 justify-center items-center">
          <TouchableWithoutFeedback>
            <View
              className={`w-[90%] rounded-xl p-5 shadow-lg ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <View className="items-center mb-5">
                <Text
                  className={`text-xl font-bold mb-1 ${
                    isDarkMode ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  {mode === "date"
                    ? "Chọn Ngày"
                    : mode === "time"
                    ? "Chọn Giờ"
                    : "Chọn Ngày & Giờ"}
                </Text>
                <Text
                  className={`text-base ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {selectedDate.toLocaleString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: mode !== "date" ? "2-digit" : undefined,
                    minute: mode !== "date" ? "2-digit" : undefined,
                    hour12: false,
                  })}
                </Text>
              </View>

              <View className="mb-5">
                {showDatePicker && renderDatePicker()}
                {showTimePicker && renderTimePicker()}
              </View>

              <View className="flex-row justify-end">
                <TouchableOpacity
                  className={`p-2.5 ml-2.5 rounded-md ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-200"
                  }`}
                  onPress={onCancel}
                >
                  <Text
                    className={`text-base ${
                      isDarkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Hủy
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="p-2.5 ml-2.5 rounded-md bg-orange-500"
                  onPress={handleConfirm}
                >
                  <Text className="text-base text-white">Xác nhận</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default CustomDateTimePicker;
