"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Switch,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
} from "~/service/products";

interface Product {
  id: string;
  category: string;
  inStock: boolean;
  link: string;
  name: string;
  price: number;
  size: string;
  color: string;
}

interface CategoryOption {
  label: string;
  value: string;
}

const ProductManagementScreen = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState<Product>({
    category: "",
    id: "",
    inStock: true,
    link: "",
    name: "",
    price: 0,
    size: "xs",
    color: "", // Để trống để người dùng nhập
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const categories: CategoryOption[] = [
    { label: "Select Category", value: "" },
    { label: "VisorClip", value: "visorclip" },
    { label: "Valentine", value: "valentine" },
  ];

  useEffect(() => {
    fetchProductsData();
  }, []);

  const fetchProductsData = async () => {
    setLoading(true);
    try {
      const allProducts = await fetchProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert("Error", "Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.color) {
      Alert.alert(
        "Missing Information",
        "Please fill in the name, category, and color fields"
      );
      return;
    }

    setLoading(true);
    const productData = {
      ...newProduct,
      price: isNaN(Number(newProduct.price)) ? 0 : Number(newProduct.price),
    };

    try {
      await addProduct(productData);
      await fetchProductsData();
      resetForm();
      Alert.alert("Success", "Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert("Error", "Failed to add product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({ ...product });
    setImageUrl(product.link);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    if (!newProduct.name || !newProduct.category || !newProduct.color) {
      Alert.alert(
        "Missing Information",
        "Please fill in the name, category, and color fields"
      );
      return;
    }

    setLoading(true);
    const productData = {
      ...newProduct,
      price: isNaN(Number(newProduct.price)) ? 0 : Number(newProduct.price),
    };

    try {
      await updateProduct(editingProduct.id, productData);
      await fetchProductsData();
      resetForm();
      Alert.alert("Success", "Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
      Alert.alert("Error", "Failed to update product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteProduct(productId);
              await fetchProductsData();
              Alert.alert("Success", "Product deleted successfully!");
            } catch (error) {
              console.error("Error deleting product:", error);
              Alert.alert(
                "Error",
                "Failed to delete product. Please try again."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setNewProduct({
      category: "",
      id: "",
      inStock: true,
      link: "",
      name: "",
      price: 0,
      size: "xs",
      color: "",
    });
    setImageUrl("");
    setEditingProduct(null);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productItem}>
      <Text style={styles.productName}>
        {item.name} - ${(item.price ?? 0).toFixed(2)}
      </Text>
      {item.link && (
        <Image
          source={{ uri: item.link }}
          style={styles.productImage}
          onError={(e) =>
            console.error("Image loading error:", e.nativeEvent.error)
          }
        />
      )}
      <Text>Category: {item.category}</Text>
      <Text>Size: {item.size}</Text>
      <Text>Color: {item.color}</Text>
      <Text>In Stock: {item.inStock ? "Yes" : "No"}</Text>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditProduct(item)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteProduct(item.id)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const SizeButton = ({
    size,
    selected,
    onPress,
  }: {
    size: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.sizeButton, selected && styles.selectedSizeButton]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.sizeButtonText,
          selected && styles.selectedSizeButtonText,
        ]}
      >
        {size}
      </Text>
    </TouchableOpacity>
  );

  const renderCategorySelector = () => {
    const selectedCategory = categories.find(
      (cat) => cat.value === newProduct.category
    );

    return (
      <View>
        <TouchableOpacity
          style={styles.categorySelector}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text
            style={[
              styles.categorySelectorText,
              !selectedCategory?.label && styles.categorySelectorPlaceholder,
            ]}
          >
            {selectedCategory?.label || "Select Category"}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={showCategoryModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Category</Text>

              <ScrollView style={styles.categoryList}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.categoryItem,
                      newProduct.category === category.value &&
                        styles.selectedCategoryItem,
                    ]}
                    onPress={() => {
                      setNewProduct({
                        ...newProduct,
                        category: category.value,
                      });
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryItemText,
                        newProduct.category === category.value &&
                          styles.selectedCategoryItemText,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const pickImage = async () => {
    try {
      // Yêu cầu quyền truy cập thư viện ảnh
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Lỗi", "Cần cấp quyền truy cập thư viện ảnh để tiếp tục");
        return;
      }

      // Mở thư viện ảnh để chọn
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        setLoading(true);
        try {
          // Upload ảnh và lấy URL
          const uploadedUrl = await uploadImage(result.assets[0].uri);
          setNewProduct({ ...newProduct, link: uploadedUrl });
        } catch (error) {
          console.error("Lỗi khi tải ảnh lên:", error);
          Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Lỗi khi chọn ảnh:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Product Management</Text>

        <View style={styles.formContainer}>
          <Text style={styles.sectionLabel}>Category:</Text>
          {renderCategorySelector()}

          <Text style={styles.sectionLabel}>Product Name:</Text>
          <TextInput
            placeholder="Product Name"
            value={newProduct.name}
            onChangeText={(text: string) =>
              setNewProduct({ ...newProduct, name: text })
            }
            style={styles.input}
          />

          <Text style={styles.sectionLabel}>Price:</Text>
          <TextInput
            placeholder="Price (e.g., 12.50)"
            value={newProduct.price === 0 ? "" : newProduct.price.toString()}
            onChangeText={(text: string) => {
              if (text === "" || /^\d*\.?\d*$/.test(text)) {
                setNewProduct({
                  ...newProduct,
                  price: text === "" ? 0 : Number.parseFloat(text) || 0,
                });
              }
            }}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <Text style={styles.sectionLabel}>Color:</Text>
          <TextInput
            placeholder="Enter color (e.g., Red, Blue)"
            value={newProduct.color}
            onChangeText={(text: string) =>
              setNewProduct({ ...newProduct, color: text })
            }
            style={styles.input}
          />

          <Text style={styles.sectionLabel}>Image Products:</Text>
          <View style={styles.imageInputContainer}>
            <TextInput
              placeholder="Image URL (or pick an image)"
              value={newProduct.link}
              onChangeText={(text: string) =>
                setNewProduct({ ...newProduct, link: text })
              }
              style={[styles.input, styles.imageImageInput]}
            />
            <TouchableOpacity
              style={styles.pickButton}
              onPress={pickImage}
              disabled={loading}
            >
              <Text style={styles.pickButtonText}>Pick</Text>
            </TouchableOpacity>
          </View>

          {newProduct.link ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: newProduct.link }}
                style={styles.previewImage}
                onError={() => {
                  Alert.alert("Error", "Failed to load image preview");
                  setNewProduct({ ...newProduct, link: "" });
                }}
              />
            </View>
          ) : null}

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>In Stock:</Text>
            <Switch
              value={newProduct.inStock}
              onValueChange={(value: boolean) =>
                setNewProduct({ ...newProduct, inStock: value })
              }
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={newProduct.inStock ? "#007AFF" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
            />
          </View>

          <View style={styles.sizeSection}>
            <Text style={styles.sectionLabel}>Size:</Text>
            <View style={styles.sizeContainer}>
              {["xs", "s", "m", "l", "xl", "2xl"].map((size) => (
                <SizeButton
                  key={size}
                  size={size}
                  selected={newProduct.size === size}
                  onPress={() => setNewProduct({ ...newProduct, size })}
                />
              ))}
            </View>
          </View>

          {editingProduct ? (
            <>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleUpdateProduct}
                disabled={
                  loading ||
                  !newProduct.category ||
                  !newProduct.name ||
                  !newProduct.color
                }
              >
                <Text style={styles.addButtonText}>
                  {loading ? "Updating..." : "Update Product"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelEditButton}
                onPress={resetForm}
              >
                <Text style={styles.cancelEditButtonText}>Cancel Edit</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[
                styles.addButton,
                (loading ||
                  !newProduct.category ||
                  !newProduct.name ||
                  !newProduct.color) &&
                  styles.disabledButton,
              ]}
              onPress={handleAddProduct}
              disabled={
                loading ||
                !newProduct.category ||
                !newProduct.name ||
                !newProduct.color
              }
            >
              <Text style={styles.addButtonText}>
                {loading ? "Adding..." : "Add Product"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {loading && (
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={styles.loader}
          />
        )}

        <Text style={styles.sectionTitle}>All Products:</Text>
        {products.length > 0 ? (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyMessage}>No products found</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  formContainer: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  categorySelector: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 15,
    backgroundColor: "#fff",
    marginVertical: 5,
  },
  categorySelectorText: {
    fontSize: 16,
    color: "#000",
  },
  categorySelectorPlaceholder: {
    color: "#999",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 15,
    color: "#333",
  },
  categoryList: {
    marginBottom: 15,
  },
  categoryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedCategoryItem: {
    backgroundColor: "#f0f8ff",
  },
  categoryItemText: {
    fontSize: 16,
    color: "#333",
  },
  selectedCategoryItemText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  cancelButton: {
    padding: 15,
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 15,
    marginVertical: 5,
    borderRadius: 5,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  imageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  imageImageInput: {
    flex: 1,
    marginRight: 10,
  },
  pickButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  pickButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  imagePreviewContainer: {
    alignItems: "center",
    marginVertical: 10,
    borderRadius: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f0f0f0",
  },
  previewImage: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  switchLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  sizeSection: {
    marginVertical: 10,
  },
  sectionLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
    fontWeight: "500",
  },
  sizeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sizeButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f0f0f0",
    minWidth: 45,
    alignItems: "center",
  },
  selectedSizeButton: {
    backgroundColor: "#007AFF",
    borderColor: "#0056b3",
  },
  sizeButtonText: {
    fontSize: 14,
    color: "#333",
  },
  selectedSizeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#fff200",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },
  addButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: "#f0f0f0",
    opacity: 0.7,
  },
  cancelEditButton: {
    backgroundColor: "#FF4444",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  cancelEditButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  productItem: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    marginVertical: 5,
    backgroundColor: "#fff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  productName: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  productImage: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    marginVertical: 10,
    backgroundColor: "#f9f9f9",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 10,
  },
  editButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  editButtonText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: "#FF4444",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 5,
  },
  loader: {
    marginVertical: 20,
  },
  emptyMessage: {
    textAlign: "center",
    fontStyle: "italic",
    marginVertical: 10,
    color: "#888",
  },
});

export default ProductManagementScreen;
