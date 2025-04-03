import { db } from "~/firebase.config"; // Đảm bảo bạn đã cấu hình Firebase
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc } from "firebase/firestore";

// Định nghĩa kiểu Category
export interface Category {
  id?: string; // ID sẽ được tự động tạo bởi Firestore
  name: string;
  description: string;
}

// Lấy tất cả danh mục
export const fetchCategories = async (): Promise<Category[]> => {
  const categoriesCollection = collection(db, "categories");
  const categorySnapshot = await getDocs(categoriesCollection);
  const categoryList: Category[] = categorySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Category[];
  return categoryList;
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
