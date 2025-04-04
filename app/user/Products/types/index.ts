// Định nghĩa các interface

  interface Product {
  id: string;
  category: string;
  inStock: boolean;
  link: string;
  name: string;
  price: number;
  size: string;
  color: string[];
  description: string;
}

 interface CustomerReview {
  id: string;
  name: string;
  rating: number;
  comment: string;
  image?: string;
}

 interface CategoryOption {
  label: string;
  value: string;
}

 interface ColorInfo {
  name: string;
  value: string;
  textColor: string;
} 
export type { Product, CustomerReview, CategoryOption, ColorInfo };