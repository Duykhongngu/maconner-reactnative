import { db } from "~/firebase.config"; // Đảm bảo bạn đã cấu hình Firebase
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc, query, limit, serverTimestamp } from "firebase/firestore";

// Định nghĩa kiểu Category
export interface Category {
  id?: string; // ID sẽ được tự động tạo bởi Firestore
  name: string;
  description: string;
  image?: string; // URL to the category image
  autoUpdate?: boolean; // For trending category
  productIds?: string[]; // IDs of trending products
  isTrending?: boolean; // Flag for trending category
}

// Lấy tất cả danh mục
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    // Create a more efficient query with a reasonable limit
    const categoriesQuery = query(collection(db, "categories"), limit(50));
    const categorySnapshot = await getDocs(categoriesQuery);
    
    if (categorySnapshot.empty) {
      console.log("No categories found in the database");
      return [];
    }
    
    const categoryList: Category[] = categorySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];
    
    return categoryList;
  } catch (error) {
    console.error("Error fetching categories:", error);
    // Return an empty array instead of throwing an error
    // This will prevent the app from crashing if there's a network issue
    return [];
  }
};

// Thêm danh mục mới
export const addCategory = async (category: Omit<Category, 'id'>): Promise<void> => {
  const categoriesCollection = collection(db, "categories");
  const docRef = await addDoc(categoriesCollection, category);
  // Cập nhật id cho danh mục vừa thêm
  await updateDoc(docRef, { id: docRef.id });
};

// Cập nhật danh mục
export const updateCategory = async (categoryId: string, updatedData: Partial<Category>) => {
  // Kiểm tra xem categoryId có hợp lệ không
  if (!categoryId) {
    throw new Error("Invalid category ID");
  }

  const categoryRef = doc(db, "categories", categoryId);
  
  try {
    await updateDoc(categoryRef, updatedData);
    return await getDoc(categoryRef); // Trả về tài liệu đã cập nhật
  } catch (error) {
    console.error("Error updating category:", error);
    throw new Error("Failed to update category");
  }
};

// Xóa danh mục
export const deleteCategory = async (id: string): Promise<void> => {
  const categoryDoc = doc(db, "categories", id);
  await deleteDoc(categoryDoc);
};

// Tạo danh mục Trending
export const createTrendingCategory = async (categoryData: any) => {
  try {
    // Tạo một document mới trong collection categories
    const docRef = await addDoc(collection(db, "categories"), {
      ...categoryData,
      productIds: [], // Array trống để chứa sản phẩm trending
      lastUpdated: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error creating trending category:", error);
    throw error;
  }
};

// Cập nhật danh sách sản phẩm trong danh mục Trending
export const updateTrendingProducts = async (categoryId: string, productIds: string[]) => {
  try {
    const categoryRef = doc(db, "categories", categoryId);
    
    await updateDoc(categoryRef, {
      productIds: productIds,
      lastUpdated: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error updating trending products:", error);
    throw error;
  }
};
