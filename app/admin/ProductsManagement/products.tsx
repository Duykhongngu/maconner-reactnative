"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  FlatList,
  StyleSheet,
  Switch,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "~/firebase.config";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";

interface Product {
  id: string;
  category: string;
  inStock: boolean;
  link: string;
  name: string;
  price: number;
  size: string;
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
  });

  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const categories: CategoryOption[] = [
    { label: "Select Category", value: "" },
    { label: "VisorClip", value: "visorclip" },
    { label: "Valentine", value: "valentine" },
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const allProducts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      setProducts(allProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert("Error", "Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (imageUri: string): Promise<string> => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("file", blob, "upload.jpg");
      formData.append("upload_preset", "your-upload-preset");

      const cloudinaryResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/your-cloud-name/image/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setImageUrl(cloudinaryResponse.data.secure_url);
      return cloudinaryResponse.data.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
      return "";
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need camera roll permissions to upload images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setNewProduct({ ...newProduct, link: result.assets[0].uri });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category) {
      Alert.alert(
        "Missing Information",
        "Please fill in at least the name and category fields"
      );
      return;
    }

    setLoading(true);

    const productData = {
      ...newProduct,
      price: Number(newProduct.price) || 0,
    };

    try {
      await addDoc(collection(db, "products"), productData);

      await fetchProducts();

      setNewProduct({
        category: "",
        id: "",
        inStock: true,
        link: "",
        name: "",
        price: 0,
        size: "xs",
      });
      setImageUrl("");

      Alert.alert("Success", "Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert("Error", "Failed to add product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productItem}>
      <Text style={styles.productName}>
        {item.name} - ${item.price.toFixed(2)}
      </Text>
      {item.link && (
        <Image source={{ uri: item.link }} style={styles.productImage} />
      )}
      <Text>Category: {item.category}</Text>
      <Text>Size: {item.size}</Text>
      <Text>In Stock: {item.inStock ? "Yes" : "No"}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Product Management</Text>

        <View style={styles.formContainer}>
          <Text style={styles.sectionLabel}> Category:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={newProduct.category}
              onValueChange={(value: string) =>
                setNewProduct({ ...newProduct, category: value })
              }
              style={styles.picker}
            >
              {categories.map((category) => (
                <Picker.Item
                  key={category.value}
                  label={category.label}
                  value={category.value}
                />
              ))}
            </Picker>
          </View>
          <Text style={styles.sectionLabel}> Product Name:</Text>
          <TextInput
            placeholder="Product Name"
            value={newProduct.name}
            onChangeText={(text: string) =>
              setNewProduct({ ...newProduct, name: text })
            }
            style={styles.input}
          />
          <Text style={styles.sectionLabel}> Price:</Text>
          <TextInput
            placeholder="Price (e.g., 12.50)"
            value={newProduct.price === 0 ? "" : newProduct.price.toString()}
            onChangeText={(text: string) => {
              if (text === "" || /^\d*\.?\d*$/.test(text)) {
                setNewProduct({
                  ...newProduct,
                  price: text === "" ? 0 : parseFloat(text) || 0,
                });
              }
            }}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <Text style={styles.sectionLabel}> Image Products:</Text>
          <View style={styles.imageInputContainer}>
            <TextInput
              placeholder="Image URL (or pick an image)"
              value={newProduct.link}
              onChangeText={(text: string) =>
                setNewProduct({ ...newProduct, link: text })
              }
              style={[styles.input, styles.imageImageInput]}
            />
            <Button title="Pick" onPress={pickImage} color="#007AFF" />
          </View>

          {newProduct.link ? (
            <Image
              source={{ uri: newProduct.link }}
              style={styles.previewImage}
            />
          ) : null}

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>In Stock:</Text>
            <Switch
              value={newProduct.inStock}
              onValueChange={(value: boolean) =>
                setNewProduct({ ...newProduct, inStock: value })
              }
            />
          </View>

          <View style={styles.sizeSection}>
            <Text style={styles.sectionLabel}>Size:</Text>
            <View style={styles.sizeContainer}>
              {["xs", "s", "m", "l", "xl", "2xl"].map((size) => (
                <Button
                  key={size}
                  title={size}
                  onPress={() => setNewProduct({ ...newProduct, size })}
                  color={newProduct.size === size ? "#007AFF" : "#666"}
                />
              ))}
            </View>
          </View>

          <Button
            title={loading ? "Adding..." : "Add Product"}
            onPress={handleAddProduct}
            disabled={loading || !newProduct.category || !newProduct.name}
            color="#fff200"
          />
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginVertical: 5,
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
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
  previewImage: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    alignSelf: "center",
    marginVertical: 10,
    borderRadius: 5,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
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
  },
  sizeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  productItem: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    marginVertical: 5,
    backgroundColor: "#fff",
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
