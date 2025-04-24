export interface Product {
  id: string;
  category: string;
  inStock: boolean;
  link: string;
  images?: string[];
  name: string;
  price: number;
  purchasePrice: number;
  description: string;
  color: string[];
  purchaseCount?: number;
  trending?: boolean;
  stockQuantity?: number;
}

export interface CategoryOption {
  label: string;
  value: string;
}

export interface NewProduct extends Omit<Product, 'id'> {
  // Fields specific to new products can be added here if needed
}

// Thêm default export
const ProductTypes = {};

export default ProductTypes;

