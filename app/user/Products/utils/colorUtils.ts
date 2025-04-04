// Các hàm xử lý màu sắc
import { ColorInfo } from '../types';

// Khai báo mảng màu cố định
export const AVAILABLE_COLORS: ColorInfo[] = [
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

// Hàm lấy thông tin màu từ tên màu
export const getColorInfo = (colorName: string): ColorInfo => {
  const colorInfo = AVAILABLE_COLORS.find(
    c => c.name.toLowerCase() === colorName.toLowerCase()
  );
  return colorInfo || { name: colorName, value: "#CCCCCC", textColor: "#000000" };
}; 