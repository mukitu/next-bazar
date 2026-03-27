
import { createClient } from '@supabase/supabase-js';
import { Product, Order, Profile, Category, SitePage } from '../types';

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

export const addCategory = async (name: string, slug: string) => {
  const { data, error } = await supabase.from('categories').insert([{ name, slug }]).select();
  if (error) throw error;
  return data;
};

export const deleteCategory = async (id: string) => {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
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

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Profile;
};

export const fetchSitePages = async (): Promise<SitePage[]> => {
  const { data, error } = await supabase
    .from('site_pages')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data || [];
};

export const fetchSitePage = async (slug: string): Promise<SitePage | null> => {
  const { data, error } = await supabase
    .from('site_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  if (error) return null;
  return data;
};
