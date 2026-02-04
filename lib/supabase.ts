
import { createClient } from '@supabase/supabase-js';
import { Product, Order, Profile, Category } from '../types';

const supabaseUrl = 'https://ydyxswzzdgygqovvneab.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkeXhzd3p6ZGd5Z3FvdnZuZWFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNjAxNzIsImV4cCI6MjA4NTczNjE3Mn0.0B03RuJFMJ5xqTxGSEyjQy9klC1wSspZSikjt901Phk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data || [];
};

export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, product:products(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const updateProductStock = async (productId: string, newStock: number) => {
  const { error } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', productId);
  if (error) throw error;
};
