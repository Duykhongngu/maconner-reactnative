import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Switch,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadImage } from "~/service/products";
import { CategoryOption } from "./types";

interface ProductFormProps {
  newProduct: any;
  setNewProduct: (product: any) => void;
  multipleImages: string[];
  setMultipleImages: (images: string[]) => void;
  categories: CategoryOption[];
  isDarkColorScheme: boolean;
  selectedColors: string[];
  setSelectedColors: (colors: string[]) => void;
  loading: boolean;
  handleAddProduct: () => void;
  handleUpdateProduct: () => void;
  resetForm: () => void;
  editingProduct: any;
}

const ProductForm = ({
  newProduct,
  setNewProduct,
  multipleImages,
  setMultipleImages,
  categories,
  isDarkColorScheme,
  selectedColors,
  setSelectedColors,
  loading,
  handleAddProduct,
  handleUpdateProduct,
  resetForm,
  editingProduct,
}: ProductFormProps) => {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [priceText, setPriceText] = useState<string>("");
  const [purchasePriceText, setPurchasePriceText] = useState<string>("");

  useEffect(() => {
    if (newProduct.price > 0) {
      setPriceText(newProduct.price.toString());
    } else {
      setPriceText("");
    }

    if (newProduct.purchasePrice > 0) {
      setPurchasePriceText(newProduct.purchasePrice.toString());
    } else {
      setPurchasePriceText("");
    }
  }, [newProduct.price, newProduct.purchasePrice]);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Lỗi", "Cần cấp quyền truy cập thư viện ảnh");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        try {
          const uploadedUrl = await uploadImage(result.assets[0].uri);
          setNewProduct({ ...newProduct, link: uploadedUrl });
          setMultipleImages([...multipleImages, uploadedUrl]);
        } catch (error) {
          console.error("Error uploading image:", error);
          Alert.alert("Lỗi", "Tải ảnh lên thất bại. Vui lòng thử lại.");
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Chọn ảnh thất bại. Vui lòng thử lại.");
    }
  };

  const removeImage = (imageUrl: string) => {
    setMultipleImages(multipleImages.filter((url) => url !== imageUrl));
  };

  const renderCategorySelector = () => {
    const selectedCategory = categories.find(
      (cat) => cat.value === newProduct.category
    );

    return (
      <View>
        <TouchableOpacity
          className={`border ${
            isDarkColorScheme
              ? "border-gray-600 bg-gray-700"
              : "border-gray-300 bg-white"
          } rounded p-4 my-1`}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text
            className={`text-base ${
              !selectedCategory?.label
                ? isDarkColorScheme
                  ? "text-gray-400"
                  : "text-gray-400"
                : isDarkColorScheme
                ? "text-white"
                : "text-black"
            }`}
          >
            {selectedCategory?.label || "Chọn danh mục"}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={showCategoryModal}
          transparent={true}
          animationType="slide"
        >
          <View className="flex-1 justify-end bg-black/50">
            <View
              className={`${
                isDarkColorScheme ? "bg-black" : "bg-white"
              } rounded-t-3xl p-5 max-h-[70%]`}
            >
              <Text
                className={`text-lg font-semibold text-center mb-4 ${
                  isDarkColorScheme ? "text-white" : "text-gray-800"
                }`}
              >
                Chọn danh mục
              </Text>

              <ScrollView className="mb-4">
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    className={`p-4 border-b ${
                      isDarkColorScheme ? "border-gray-700" : "border-gray-200"
                    } ${
                      newProduct.category === category.value
                        ? isDarkColorScheme
                          ? "bg-blue-900/30"
                          : "bg-blue-50"
                        : ""
                    }`}
                    onPress={() => {
                      setNewProduct({
                        ...newProduct,
                        category: category.value,
                      });
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text
                      className={`text-base ${
                        newProduct.category === category.label
                          ? isDarkColorScheme
                            ? "text-blue-400 font-semibold"
                            : "text-blue-600 font-semibold"
                          : isDarkColorScheme
                          ? "text-gray-200"
                          : "text-gray-800"
                      }`}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                className={`p-4 ${
                  isDarkColorScheme ? "bg-gray-700" : "bg-gray-200"
                } rounded-lg items-center`}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text
                  className={`text-base font-semibold ${
                    isDarkColorScheme ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  Hủy
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderColorPicker = () => {
    const colors = [
      { en: "Red", vi: "Đỏ" },
      { en: "Green", vi: "Xanh lá" },
      { en: "Blue", vi: "Xanh dương" },
      { en: "Yellow", vi: "Vàng" },
      { en: "Black", vi: "Đen" },
      { en: "White", vi: "Trắng" },
    ];

    return (
      <View>
        <Text
          className={`text-base font-medium mb-1 ${
            isDarkColorScheme ? "text-gray-100" : "text-gray-800"
          }`}
        >
          Chọn màu sắc:
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {colors.map((color) => (
            <TouchableOpacity
              key={color.en}
              onPress={() => {
                if (selectedColors.includes(color.en)) {
                  setSelectedColors(
                    selectedColors.filter((c) => c !== color.en)
                  );
                } else {
                  setSelectedColors([...selectedColors, color.en]);
                }
              }}
              style={{
                backgroundColor: color.en.toLowerCase(),
                padding: 10,
                borderRadius: 5,
                margin: 5,
                borderWidth: selectedColors.includes(color.en) ? 2 : 0,
                borderColor: selectedColors.includes(color.en)
                  ? "black"
                  : "transparent",
              }}
            >
              <Text style={{ color: "gray" }}>{color.vi}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View
      className={`${
        isDarkColorScheme ? "bg-black" : "bg-gray-50"
      } p-4 rounded-lg mb-5 shadow`}
    >
      <Text
        className={`text-base font-medium mb-1 ${
          isDarkColorScheme ? "text-gray-100" : "text-gray-800"
        }`}
      >
        Danh mục:
      </Text>
      {renderCategorySelector()}

      <Text
        className={`text-base font-medium mb-1 mt-3 ${
          isDarkColorScheme ? "text-gray-100" : "text-gray-800"
        }`}
      >
        Tên sản phẩm:
      </Text>
      <TextInput
        placeholder="Nhập tên sản phẩm"
        placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
        value={newProduct.name}
        onChangeText={(text: string) =>
          setNewProduct({ ...newProduct, name: text })
        }
        className={`border ${
          isDarkColorScheme
            ? "border-gray-600 bg-gray-700 text-white"
            : "border-gray-300 bg-white text-gray-800"
        } p-4 my-1 rounded text-base`}
      />

      <Text
        className={`text-base font-medium mb-1 mt-3 ${
          isDarkColorScheme ? "text-gray-100" : "text-gray-800"
        }`}
      >
        Giá bán:
      </Text>
      <TextInput
        placeholder="Nhập giá bán (VD: 12.50)"
        placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
        value={priceText}
        onChangeText={(text: string) => {
          const normalizedText = text.replace(",", ".");
          if (
            normalizedText === "" ||
            /^(\d+\.?\d*|\.\d+)$/.test(normalizedText)
          ) {
            setPriceText(normalizedText);
            setNewProduct({
              ...newProduct,
              price: normalizedText === "" ? 0 : parseFloat(normalizedText),
            });
          }
        }}
        keyboardType="decimal-pad"
        className={`border ${
          isDarkColorScheme
            ? "border-gray-600 bg-gray-700 text-white"
            : "border-gray-300 bg-white text-gray-800"
        } p-4 my-1 rounded text-base`}
      />

      <Text
        className={`text-base font-medium mb-1 mt-3 ${
          isDarkColorScheme ? "text-gray-100" : "text-gray-800"
        }`}
      >
        Giá nhập:
      </Text>
      <TextInput
        placeholder="Nhập giá nhập (VD: 8.50)"
        placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
        value={purchasePriceText}
        onChangeText={(text: string) => {
          const normalizedText = text.replace(",", ".");
          if (
            normalizedText === "" ||
            /^(\d+\.?\d*|\.\d+)$/.test(normalizedText)
          ) {
            setPurchasePriceText(normalizedText);
            setNewProduct({
              ...newProduct,
              purchasePrice:
                normalizedText === "" ? 0 : parseFloat(normalizedText),
            });
          }
        }}
        keyboardType="decimal-pad"
        className={`border ${
          isDarkColorScheme
            ? "border-gray-600 bg-gray-700 text-white"
            : "border-gray-300 bg-white text-gray-800"
        } p-4 my-1 rounded text-base`}
      />

      <Text
        className={`text-base font-medium mb-1 mt-3 ${
          isDarkColorScheme ? "text-gray-100" : "text-gray-800"
        }`}
      >
        Mô tả:
      </Text>
      <TextInput
        placeholder="Nhập mô tả sản phẩm"
        placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
        value={newProduct.description}
        onChangeText={(text: string) =>
          setNewProduct({ ...newProduct, description: text })
        }
        multiline={true}
        numberOfLines={4}
        className={`border ${
          isDarkColorScheme
            ? "border-gray-600 bg-gray-700 text-white"
            : "border-gray-300 bg-white text-gray-800"
        } p-4 my-1 rounded text-base`}
      />

      <Text
        className={`text-base font-medium mb-1 mt-3 ${
          isDarkColorScheme ? "text-gray-100" : "text-gray-800"
        }`}
      >
        Hình ảnh sản phẩm:
      </Text>
      <View className="flex-row items-center my-1">
        <TextInput
          placeholder="URL hình ảnh (hoặc chọn hình)"
          placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
          value={newProduct.link}
          onChangeText={(text: string) =>
            setNewProduct({ ...newProduct, link: text })
          }
          className={`border ${
            isDarkColorScheme
              ? "border-gray-600 bg-gray-700 text-white"
              : "border-gray-300 bg-white text-gray-800"
          } p-4 rounded flex-1 mr-2 text-base`}
        />
        <TouchableOpacity
          className="bg-orange-500 py-4 px-5 rounded justify-center items-center"
          onPress={pickImage}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-base">Chọn</Text>
        </TouchableOpacity>
      </View>

      {/* Multiple Images Display */}
      {multipleImages.length > 0 && (
        <View className="mt-2">
          <Text
            className={`text-base font-medium mb-2 ${
              isDarkColorScheme ? "text-gray-100" : "text-gray-800"
            }`}
          >
            Hình ảnh đã chọn ({multipleImages.length}):
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="my-2"
          >
            {multipleImages.map((imgUrl, index) => (
              <View
                key={index}
                className={`mr-3 border rounded overflow-hidden ${
                  isDarkColorScheme
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-300 bg-gray-100"
                }`}
              >
                <Image
                  source={{ uri: imgUrl }}
                  className="w-[100px] h-[100px]"
                  style={{ resizeMode: "cover" }}
                />
                <TouchableOpacity
                  className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                  onPress={() => removeImage(imgUrl)}
                >
                  <Text className="text-white font-bold text-xs">✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {newProduct.link && !multipleImages.includes(newProduct.link) ? (
        <View
          className={`items-center my-2 rounded overflow-hidden border ${
            isDarkColorScheme
              ? "border-gray-700 bg-black"
              : "border-gray-300 bg-gray-100"
          }`}
        >
          <Image
            source={{ uri: newProduct.link }}
            className="w-[200px] h-[200px]"
            style={{ resizeMode: "contain" }}
            onError={() => {
              Alert.alert("Lỗi", "Không thể tải ảnh xem trước");
              setNewProduct({ ...newProduct, link: "" });
            }}
          />
          <TouchableOpacity
            className="bg-orange-500 py-2 px-4 rounded mt-2 mb-2"
            onPress={() => {
              setMultipleImages([...multipleImages, newProduct.link]);
              setNewProduct({ ...newProduct, link: "" });
            }}
          >
            <Text className="text-white font-semibold">Thêm vào hình ảnh</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View className="flex-row items-center my-4">
        <Text
          className={`text-base mr-2 ${
            isDarkColorScheme ? "text-gray-100" : "text-gray-800"
          }`}
        >
          Còn hàng:
        </Text>
        <Switch
          value={newProduct.inStock}
          onValueChange={(value: boolean) =>
            setNewProduct({ ...newProduct, inStock: value })
          }
          trackColor={{ false: "#767577", true: "#f0883e" }}
          thumbColor={newProduct.inStock ? "#d96716" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
        />
      </View>

      <Text
        className={`text-base font-medium mb-1 mt-3 ${
          isDarkColorScheme ? "text-gray-100" : "text-gray-800"
        }`}
      >
        Màu sắc:
      </Text>
      {renderColorPicker()}

      <View className="mb-4">
        <Text
          className={`text-base font-medium mb-1 ${
            isDarkColorScheme ? "text-gray-100" : "text-gray-800"
          }`}
        >
          Số lượng trong kho:
        </Text>
        <TextInput
          placeholder="Nhập số lượng"
          placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
          value={String(newProduct.stockQuantity || 0)}
          onChangeText={(text) =>
            setNewProduct({
              ...newProduct,
              stockQuantity: Number(text) || 0,
            })
          }
          keyboardType="numeric"
          className={`border ${
            isDarkColorScheme
              ? "border-gray-600 bg-gray-700 text-white"
              : "border-orange-200 text-gray-800"
          } p-3 rounded-md text-base`}
        />
      </View>

      <View className="mb-4">
        <Text
          className={`text-base font-medium mb-1 ${
            isDarkColorScheme ? "text-gray-100" : "text-gray-800"
          }`}
        >
          Số lượt mua:
        </Text>
        <TextInput
          placeholder="Nhập số lượt mua"
          placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
          value={String(newProduct.purchaseCount || 0)}
          onChangeText={(text) =>
            setNewProduct({
              ...newProduct,
              purchaseCount: Number(text) || 0,
            })
          }
          keyboardType="numeric"
          className={`border ${
            isDarkColorScheme
              ? "border-gray-600 bg-gray-700 text-white"
              : "border-orange-200 text-gray-800"
          } p-3 rounded-md text-base`}
        />
      </View>

      <View className="mb-4 flex-row justify-between items-center">
        <Text
          className={`text-base font-medium ${
            isDarkColorScheme ? "text-gray-100" : "text-gray-800"
          }`}
        >
          Đánh dấu là sản phẩm thịnh hành:
        </Text>
        <Switch
          value={newProduct.trending || false}
          onValueChange={(value) =>
            setNewProduct({ ...newProduct, trending: value })
          }
          trackColor={{ false: "#767577", true: "#ff8c00" }}
          thumbColor={newProduct.trending ? "#f4f3f4" : "#f4f3f4"}
        />
      </View>

      {editingProduct ? (
        <>
          <TouchableOpacity
            className={`py-4 px-4 rounded-lg mt-4 ${
              loading || !newProduct.category || !newProduct.name
                ? "bg-gray-400"
                : "bg-yellow-400"
            }`}
            onPress={handleUpdateProduct}
            disabled={loading || !newProduct.category || !newProduct.name}
          >
            <Text className="text-black text-center font-bold text-base">
              {loading ? "Đang cập nhật..." : "Cập nhật sản phẩm"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`py-4 px-4 rounded-lg mt-2 ${
              isDarkColorScheme ? "bg-red-700" : "bg-red-500"
            }`}
            onPress={resetForm}
          >
            <Text className="text-white text-center font-bold text-base">
              Hủy chỉnh sửa
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          className={`py-4 px-4 rounded-lg mt-4 ${
            loading || !newProduct.category || !newProduct.name
              ? "bg-gray-400"
              : "bg-yellow-400"
          }`}
          onPress={handleAddProduct}
          disabled={loading || !newProduct.category || !newProduct.name}
        >
          <Text className="text-black text-center font-bold text-base">
            {loading ? "Đang thêm..." : "Thêm sản phẩm"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ProductForm;
