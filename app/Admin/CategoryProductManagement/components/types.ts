import { Category as ServiceCategory } from "~/service/categoryProduct";

export interface Category extends ServiceCategory {
  isTrending?: boolean;
  autoUpdate?: boolean;
}

export interface NewCategory {
  id: string;
  name: string;
  description: string;
  image: string;
} 