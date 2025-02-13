const trend1 = require("~/assets/images/trend1.webp");
const trend2 = require("~/assets/images/trend2.webp");
const trend3 = require("~/assets/images/trend3.webp");
const trend4 = require("~/assets/images/trend4.webp");
const trend5 = require("~/assets/images/trend5.webp");
const trend6 = require("~/assets/images/trend6.webp");
const trend7 = require("~/assets/images/trend7.webp");
const trend8 = require("~/assets/images/trend8.webp");
export interface Product {
    id: number;
    name: string;
    description: string;
    price: string;
    img: string;
    rating: number;
    reviews: number;
    colors: string[];
    sizes: string[];
    category: string;
    inStock: boolean;
    images: string[];
    link: string;
  }
  
export const trendingProducts: Product[] = [
    {
      id: 1,
      name: "Drive Safe",
      description:
        "Drive Safe I F*cking Love You - Funny Gifts For Husband, Wife",
      price: "19.95 ",
      img: trend1,
      rating: 5,
      reviews: 20,
      colors: ["black", "gray", "red"],
      sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
      category: "Valentine's Day",
      inStock: true,
      images: [trend1, trend1, trend1, trend1],
      link: "Products/[id]",
    },
    {
      id: 2,
      name: "Boxer",
      description:
        "I Licked It So It's Mine Naughty Couple - Personalized Men's Boxer Briefs",
      price: "26.95 ",
      img: trend2,
      rating: 5,
      reviews: 15,
      colors: ["black", "gray", "red"],
      sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
      category: "Valentine's Day",
      inStock: true,
      images: [trend2, trend2, trend2, trend2],
      link: "/details",
    },
    {
      id: 3,
      name: "Puzzle Name ",
      description: "Friendship Puzzle Hearts - Personalized Heart Puzzle Name",
      price: "26.95 ",
      img: trend3,
      rating: 5,
      reviews: 18,
      colors: ["black", "gray", "red"],
      sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
      category: "Valentine's Day",
      inStock: true,
      images: [trend3, trend3, trend3, trend3],
      link: "/details",
    },
    {
      id: 4,
      name: "Personalized Mug",
      description: "F#ck Valentine's Day, I Love You Everyday - Personalized Mug",
      price: "19.95 ",
      img: trend4,
      rating: 5,
      reviews: 22,
      colors: ["black", "gray", "red"],
      sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
      category: "Valentine's Day",
      inStock: true,
      images: [trend4, trend4, trend4, trend4],
      link: "/details",
    },
    {
      id: 5,
      name: "Car Ornament",
      description:
        "I Have An Angel Watching Over Me - Personalized Photo Car Ornament",
      price: "26.95 ",
      img: trend5,
      rating: 5,
      reviews: 25,
      colors: ["black", "gray", "red"],
      sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
      category: "Valentine's Day",
      inStock: true,
      images: [trend5, trend5, trend5, trend5],
      link: "/details",
    },
    {
      id: 6,
      name: "Personalized Mug",
      description: "A Girl & Her Dogs Has Unbreakable Bond - Personalized Mug",
      price: "26.95 ",
      img: trend6,
      rating: 5,
      reviews: 16,
      colors: ["black", "gray", "red"],
      sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
      category: "Valentine's Day",
      inStock: true,
      images: [trend6, trend6, trend6, trend6],
      link: "/details",
    },
    {
      id: 7,
      name: "Suncatcher ",
      description:
        "You & Me We Got This - Personalized Window Hanging Suncatcher",
      price: "26.95 ",
      img: trend7,
      rating: 5,
      reviews: 16,
      colors: ["black", "gray", "red"],
      sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
      category: "Valentine's Day",
      inStock: true,
      images: [trend6, trend6, trend6, trend6],
      link: "/details",
    },
    {
      id: 8,
      name: "Bottle Lamps",
      description:
        "Fuck Valentine's Day I Love You Everyday - Personalized Bottle Lamps",
      price: "26.95 ",
      img: trend8,
      rating: 5,
      reviews: 21,
      colors: ["black", "gray", "red"],
      sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
      category: "Valentine's Day",
      inStock: true,
      images: [trend8, trend8, trend8, trend8],
      link: "/details",
    },
  ];