export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    image: string;
    tag: string;
    description: string;
    details: string[];
    material: string;
    care: string;
    sizes: string[];
    colors: { name: string; hex: string }[];
    inStock?: boolean;
    ratingAvg?: number;
    ratingCount?: number;
}

export interface Rack {
    id: string;
    title: string;
    subtitle: string;
    productCount: number;
}

export interface CartItem {
  id: string;
  product: Product;
  size: string;
  color: string;
  quantity: number;
}
