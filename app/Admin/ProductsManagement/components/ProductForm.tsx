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
        Alert.alert("Error", "Media library permission is required");
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
          Alert.alert("Error", "Failed to upload image. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
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
            {selectedCategory?.label || "Select Category"}
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
                Select Category
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
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderColorPicker = () => {
    const colors = ["Red", "Green", "Blue", "Yellow", "Black", "White"];

    return (
      <View>
        <Text
          className={`text-base font-medium mb-1 ${
            isDarkColorScheme ? "text-gray-100" : "text-gray-800"
          }`}
        >
          Select Colors:
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {colors.map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => {
                if (selectedColors.includes(color)) {
                  setSelectedColors(selectedColors.filter((c) => c !== color));
                } else {
                  setSelectedColors([...selectedColors, color]);
                }
              }}
              style={{
                backgroundColor: color.toLowerCase(),
                padding: 10,
                borderRadius: 5,
                margin: 5,
                borderWidth: selectedColors.includes(color) ? 2 : 0,
                borderColor: selectedColors.includes(color)
                  ? "black"
                  : "transparent",
              }}
            >
              <Text style={{ color: "white" }}>{color}</Text>
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
        Category:
      </Text>
      {renderCategorySelector()}

      <Text
        className={`text-base font-medium mb-1 mt-3 ${
          isDarkColorScheme ? "text-gray-100" : "text-gray-800"
        }`}
      >
        Product Name:
      </Text>
      <TextInput
        placeholder="Product Name"
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
        Selling Price:
      </Text>
      <TextInput
        placeholder="Selling Price (e.g., 12.50)"
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
        Purchase Price:
      </Text>
      <TextInput
        placeholder="Purchase Price (e.g., 8.50)"
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
        Description:
      </Text>
      <TextInput
        placeholder="Enter description"
        placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
        value={newProduct.description}
        onChangeText={(text: string) =>
          setNewProduct({ ...newProduct, description: text })
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
        Image Products:
      </Text>
      <View className="flex-row items-center my-1">
        <TextInput
          placeholder="Image URL (or pick images)"
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
          <Text className="text-white font-semibold text-base">Pick</Text>
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
            Selected Images ({multipleImages.length}):
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
              Alert.alert("Error", "Failed to load image preview");
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
            <Text className="text-white font-semibold">Add to Images</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View className="flex-row items-center my-4">
        <Text
          className={`text-base mr-2 ${
            isDarkColorScheme ? "text-gray-100" : "text-gray-800"
          }`}
        >
          In Stock:
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
        Color:
      </Text>
      {renderColorPicker()}

      <View className="mb-4">
        <Text
          className={`text-base font-medium mb-1 ${
            isDarkColorScheme ? "text-gray-100" : "text-gray-800"
          }`}
        >
          Stock Quantity:
        </Text>
        <TextInput
          placeholder="Enter stock quantity"
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
          Purchase Count:
        </Text>
        <TextInput
          placeholder="Enter purchase count"
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
          Mark as Trending Product:
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
              {loading ? "Updating..." : "Update Product"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`py-4 px-4 rounded-lg mt-2 ${
              isDarkColorScheme ? "bg-red-700" : "bg-red-500"
            }`}
            onPress={resetForm}
          >
            <Text className="text-white text-center font-bold text-base">
              Cancel Edit
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
            {loading ? "Adding..." : "Add Product"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ProductForm;
