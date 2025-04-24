import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, limit, getDoc } from "firebase/firestore";
import { db } from "~/firebase.config";
import axios from "axios";

export interface Product {
  id: string;
  category: string;
  inStock: boolean;
  link: string;
  images?: string[];
  name: string;
  price: number;
  purchasePrice: number; // Add this as required field
  description: string;
  color: string[];
  purchaseCount?: number;
  trending?: boolean;
  stockQuantity?: number;
  totalReviews?: number;
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        category: data.category || "",
        inStock: data.inStock ?? true,
        link: data.link || "",
        images: data.images || [],
        name: data.name || "",
        price: data.price || 0,
        purchasePrice: data.purchasePrice || 0,
        description: data.description || "",
        color: data.color || [],
        purchaseCount: data.purchaseCount || 0,
        trending: data.Trending || false,
        stockQuantity: data.stockQuantity || 0,
      };
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

export async function fetchTrendingProducts(): Promise<Product[]> {
  try {
    const q = query(
      collection(db, "products"),
      where("trending", "==", true),
      limit(10)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        category: data.category || "",
        inStock: data.inStock ?? true,
        link: data.link || "",
        images: data.images || [],
        name: data.name || "",
        price: data.price || 0,
        purchasePrice: data.purchasePrice || 0,
        description: data.description || "",
        color: data.color || [],
        purchaseCount: data.purchaseCount || 0,
        trending: data.trending || false,
        stockQuantity: data.stockQuantity || 0,
      };
    });
  } catch (error) {
    console.error("Error fetching trending products:", error);
    throw error;
  }
}

export async function updatePurchaseCount(productId: string, increment: number = 1): Promise<void> {
  try {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      throw new Error("Product not found");
    }
    
    const currentCount = productSnap.data().purchaseCount || 0;
    
    await updateDoc(productRef, {
      purchaseCount: currentCount + increment
    });
  } catch (error) {
    console.error("Error updating purchase count:", error);
    throw error;
  }
}

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

export async function updateStockQuantity(productId: string, quantity: number): Promise<void> {
  try {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      throw new Error("Product not found");
    }
    
    const currentStock = productSnap.data().stockQuantity || 0;
    const newStock = currentStock + quantity;
    
    const finalStock = Math.max(0, newStock);
    
    const inStock = finalStock > 0;
    
    await updateDoc(productRef, {
      stockQuantity: finalStock,
      inStock: inStock
    });
    
  } catch (error) {
    console.error("Error updating stock quantity:", error);
    throw error;
  }
}
