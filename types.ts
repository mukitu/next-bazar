
export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount_price?: number;
  stock: number;
  sku: string;
  images: string[];
  is_featured: boolean;
  is_flash_sale: boolean;
  created_at: string;
}

export type OrderStatus = 
  | 'Pending' 
  | 'Payment Submitted' 
  | 'Approved' 
  | 'Processing' 
  | 'Shipped' 
  | 'Delivered' 
  | 'Cancelled';

export type PaymentMethod = 'COD' | 'BKASH';

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  payment_method: PaymentMethod;
  shipping_address: string;
  bkash_tx_id?: string;
  bkash_charge: number;
  cod_charge: number;
  created_at: string;
  order_items?: OrderItem[];
  profiles?: {
    email: string;
    full_name: string;
  };
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_time: number;
  product?: Product;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
