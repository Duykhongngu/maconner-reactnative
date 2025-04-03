import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "~/firebase.config";
import axios from "axios";

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

export const fetchProducts = async (): Promise<Product[]> => {
  const querySnapshot = await getDocs(collection(db, "products"));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    category: doc.data().category || "",
    inStock: doc.data().inStock !== false,
    link: doc.data().link || "",
    name: doc.data().name || "",
    price: Number(doc.data().price) || 0,
    size: doc.data().size || "xs",
    color: doc.data().color || "Not specified",
  }));
};

export const addProduct = async (productData: Omit<Product, "id">) => {
  return await addDoc(collection(db, "products"), productData);
};

export const updateProduct = async (productId: string, productData: Omit<Product, "id">) => {
  const productRef = doc(db, "products", productId);
  return await updateDoc(productRef, productData);
};

export const deleteProduct = async (productId: string) => {
  const productRef = doc(db, "products", productId);
  return await deleteDoc(productRef);
};

export const uploadImage = async (imageUri: string): Promise<string> => {
  if (!imageUri) {
    throw new Error("Invalid image URI: URI is empty");
  }

  const formData = new FormData();
  const fileName = imageUri.split("/").pop() || "upload.jpg";
  const fileType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";

  formData.append("file", {
    uri: imageUri,
    type: fileType,
    name: fileName,
  } as any);
  formData.append("upload_preset", "marconer");

  const cloudinaryResponse = await axios.post(
    `https://api.cloudinary.com/v1_1/dpyzwrsni/image/upload`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000,
    }
  );

  return cloudinaryResponse.data.secure_url;
};
