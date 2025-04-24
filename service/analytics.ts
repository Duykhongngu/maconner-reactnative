import { db } from "~/firebase.config";
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { Product } from "./products";

export interface SalesAnalytics {
  topProducts: {
    id: string;
    name: string;
    purchaseCount: number;
    price: number;
    revenue: number;
  }[];
  totalRevenue: number;
  averageOrderValue: number;
  mostPopularCategories: {
    category: string;
    categoryName: string;
    totalSales: number;
  }[];
}

export const analyzeSales = async (): Promise<SalesAnalytics> => {
  try {
    // 1. Get all products with purchase data
    const productsQuery = query(
      collection(db, "products"),
      where("purchaseCount", ">", 0),
      orderBy("purchaseCount", "desc")
    );

    const productsSnapshot = await getDocs(productsQuery);
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];

    // 2. Calculate revenue and find top products
    const topProducts = products.slice(0, 10).map(product => ({
      id: product.id,
      name: product.name,
      purchaseCount: product.purchaseCount || 0,
      price: product.price,
      revenue: (product.purchaseCount || 0) * product.price
    }));

    // 3. Calculate total revenue
    const totalRevenue = products.reduce((total, product) => 
      total + (product.purchaseCount || 0) * product.price, 0
    );

    // 4. Get orders for average order value
    const ordersQuery = query(collection(db, "orderManager"));
    const ordersSnapshot = await getDocs(ordersQuery);
    const totalOrders = ordersSnapshot.docs.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 5. Analyze popular categories
    const categoryMap = new Map<string, number>();
    products.forEach(product => {
      if (product.category) {
        const currentCount = categoryMap.get(product.category) || 0;
        categoryMap.set(product.category, currentCount + (product.purchaseCount || 0));
      }
    });

    // 6. Get category names from categories collection
    const categoriesData = [];
    for (const [categoryId, totalSales] of categoryMap.entries()) {
      const categoryRef = doc(db, "categories", categoryId);
      const categorySnap = await getDoc(categoryRef);
      const categoryName = categorySnap.exists() ? categorySnap.data().name : "Unknown Category";
      
      categoriesData.push({
        category: categoryId,
        categoryName: categoryName,
        totalSales: totalSales
      });
    }

    const mostPopularCategories = categoriesData
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);

    return {
      topProducts,
      totalRevenue,
      averageOrderValue,
      mostPopularCategories
    };
  } catch (error) {
    console.error("Error analyzing sales:", error);
    throw error;
  }
};