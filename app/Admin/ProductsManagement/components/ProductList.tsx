import React from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { Product, CategoryOption } from "./types";

interface ProductListProps {
  products: Product[];
  categories: CategoryOption[];
  isDarkColorScheme: boolean;
  handleEditProduct: (product: Product) => void;
  handleDeleteProduct: (productId: string) => void;
}

const ProductList = ({
  products,
  categories,
  isDarkColorScheme,
  handleEditProduct,
  handleDeleteProduct,
}: ProductListProps) => {
  const renderProduct = (item: Product) => (
    <View
      className={`p-4 border border-${
        isDarkColorScheme ? "gray-700" : "gray-200"
      } rounded-lg my-1 ${isDarkColorScheme ? "bg-black" : "bg-white"}`}
    >
      <Text
        className={`font-bold text-base mb-1 ${
          isDarkColorScheme ? "text-gray-100" : "text-gray-800"
        }`}
      >
        {item.name} - {(item.price ?? 0).toFixed(2)} đ
      </Text>

      {/* Display multiple images in a row */}
      {item.images && item.images.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="my-2"
        >
          {item.images.map((imageUrl, index) => (
            <Image
              key={index}
              source={{ uri: imageUrl }}
              className="w-[100px] h-[100px] mr-2 bg-gray-100"
              style={{ resizeMode: "contain" }}
              onError={(e) =>
                console.error("Lỗi tải hình ảnh:", e.nativeEvent.error)
              }
            />
          ))}
        </ScrollView>
      ) : item.link ? (
        <Image
          source={{ uri: item.link }}
          className="w-[100px] h-[100px] my-2 bg-gray-100"
          style={{ resizeMode: "contain" }}
          onError={(e) =>
            console.error("Lỗi tải hình ảnh:", e.nativeEvent.error)
          }
        />
      ) : null}

      <Text className={isDarkColorScheme ? "text-gray-300" : "text-gray-700"}>
        Danh mục: {categories.find((cat) => cat.value === item.category)?.label}
      </Text>
      <Text className={isDarkColorScheme ? "text-gray-300" : "text-gray-700"}>
        Mô tả: {item.description}
      </Text>
      <View className="flex-row justify-between">
        <Text className={isDarkColorScheme ? "text-gray-300" : "text-gray-700"}>
          Giá bán: {(item.price ?? 0).toFixed(2)} đ
        </Text>
        <Text className={isDarkColorScheme ? "text-gray-300" : "text-gray-700"}>
          Giá nhập: {(item.purchasePrice ?? 0).toFixed(2)} đ
        </Text>
      </View>
      <Text className={isDarkColorScheme ? "text-gray-300" : "text-gray-700"}>
        Còn hàng: {item.inStock ? "Có" : "Không"}
      </Text>
      <Text className={isDarkColorScheme ? "text-gray-300" : "text-gray-700"}>
        Số lượng trong kho: {item.stockQuantity || 0}
      </Text>
      <Text className={isDarkColorScheme ? "text-gray-300" : "text-gray-700"}>
        Số lượt mua: {item.purchaseCount || 0}
      </Text>
      <Text className={isDarkColorScheme ? "text-gray-300" : "text-gray-700"}>
        Màu sắc:{" "}
        {Array.isArray(item.color) ? item.color.join(", ") : "Chưa chọn"}
      </Text>
      <View className="flex-row justify-end mt-2 gap-2">
        <TouchableOpacity
          className="bg-yellow-400 py-2 px-4 rounded"
          onPress={() => handleEditProduct(item)}
        >
          <Text className="text-black font-semibold text-sm">Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`${
            isDarkColorScheme ? "bg-red-700" : "bg-red-500"
          } py-2 px-4 rounded`}
          onPress={() => handleDeleteProduct(item.id)}
        >
          <Text className="text-white font-semibold text-sm">Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View>
      <View className="flex-row justify-between items-center mb-2">
        <Text
          className={`text-xl font-bold ${
            isDarkColorScheme
              ? "text-gray-100 bg-black"
              : "text-gray-800 bg-gray-100"
          } p-2 rounded`}
        >
          Danh sách sản phẩm
        </Text>
        <Text
          className={`${
            isDarkColorScheme ? "text-gray-300" : "text-gray-600"
          } text-base`}
        >
          {products.length} sản phẩm
        </Text>
      </View>

      <View>
        {products.length > 0 ? (
          products.map((item) => (
            <View key={item.id}>{renderProduct(item)}</View>
          ))
        ) : (
          <View
            className={`p-8 border ${
              isDarkColorScheme ? "border-gray-700" : "border-gray-200"
            } rounded-lg my-2 items-center justify-center`}
          >
            <Text
              className={`text-center py-2 italic ${
                isDarkColorScheme ? "text-gray-400" : "text-gray-500"
              } text-base`}
            >
              Không tìm thấy sản phẩm nào
            </Text>
            <Text
              className={`text-center ${
                isDarkColorScheme ? "text-gray-500" : "text-gray-600"
              }`}
            >
              Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ProductList;
