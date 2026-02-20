export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  badges?: string[];
  rating?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  slug: string;
}

export enum SortOption {
  NEWEST = "newest",
  PRICE_LOW = "price_low",
  PRICE_HIGH = "price_high",
}
