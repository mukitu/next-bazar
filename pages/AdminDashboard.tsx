
import React, { useState, useEffect } from 'react';
import { supabase, fetchProducts, fetchCategories } from '../lib/supabase';
import { CURRENCY_SYMBOL, STATUS_COLORS, ORDER_STATUSES } from '../constants';
import { Order, Product, Category } from '../types';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'categories'>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'none'>('none');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formState, setFormState] = useState({
    name: '', price: '', stock: '', category_id: '', description: '', image_url: '', is_featured: false, is_flash_sale: false
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [ords, prods, cats] = await Promise.all([
        supabase.from('orders').select('*, profiles(email, full_name), order_items(*, product:products(*))').order('created_at', { ascending: false }),
        fetchProducts(),
        fetchCategories()
      ]);
      setOrders(ords.data || []);
      setProducts(prods);
      setCategories(cats);
    } catch (e) { console.error("Load error:", e); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormState(prev => ({ ...prev, image_url: publicUrl }));
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.image_url) return alert("Please upload or provide an image URL.");

    const payload = {
      name: formState.name,
      slug: formState.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      price: parseFloat(formState.price),
      stock: parseInt(formState.stock),
      category_id: formState.category_id,
      description: formState.description,
      images: [formState.image_url],
      is_featured: formState.is_featured,
      is_flash_sale: formState.is_flash_sale,
      sku: editingProduct?.sku || 'SKU-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    };

    let error;
    if (modalMode === 'edit' && editingProduct) {
      const { error: err } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('products').insert(payload);
      error = err;
    }

    if (error) alert(error.message);
    else { setModalMode('none'); loadData(); }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) alert(error.message);
    else loadData();
  };

  const deleteOrder = async (id: string) => {
    if (!window.confirm("Delete this order forever?")) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) alert(error.message);
    else loadData();
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product forever?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) alert(error.message);
    else loadData();
  };

  const startEditProduct = (p: Product) => {
    setEditingProduct(p);
    setFormState({
      name: p.name,
      price: p.price.toString(),
      stock: p.stock.toString(),
      category_id: p.category_id,
      description: p.description,
      image_url: p.images[0] || '',
      is_featured: p.is_featured,
      is_flash_sale: p.is_flash_sale
    });
    setModalMode('edit');
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center animate-pulse">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Loading Admin Panel...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white flex flex-col p-8 space-y-12 lg:sticky lg:top-0 lg:h-screen shadow-2xl z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center font-black italic">NB</div>
          <span className="font-black text-xl tracking-tighter uppercase">Next<span className="text-orange-500">Admin</span></span>
        </div>
        <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
          {['overview', 'orders', 'products', 'categories'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-shrink-0 text-left px-6 py-4 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${activeTab === tab ? 'bg-orange-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-800'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 lg:p-14">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">{activeTab}</h1>
          {activeTab === 'products' && (
            <button 
              onClick={() => { setFormState({ name: '', price: '', stock: '', category_id: '', description: '', image_url: '', is_featured: false, is_flash_sale: false }); setModalMode('add'); }}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition shadow-xl"
            >
              + Add Product
            </button>
          )}
        </div>

        {activeTab === 'orders' && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-8 py-6">ID</th>
                    <th className="px-8 py-6">Customer</th>
                    <th className="px-8 py-6">Method</th>
                    <th className="px-8 py-6">Amount</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/50">
                      <td className="px-8 py-6 font-mono text-[10px] text-slate-400">#{order.id.slice(0,8)}</td>
                      <td className="px-8 py-6">
                        <div className="font-bold text-slate-900">{order.profiles?.full_name || 'User'}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{order.shipping_address}</div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${order.payment_method === 'BKASH' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                          {order.payment_method}
                        </span>
                        {order.bkash_tx_id && <div className="text-[9px] text-slate-400 mt-1 font-mono">{order.bkash_tx_id}</div>}
                      </td>
                      <td className="px-8 py-6 font-black text-slate-900">{CURRENCY_SYMBOL}{order.total_amount}</td>
                      <td className="px-8 py-6">
                        <select 
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`bg-white border rounded-lg p-2 text-[10px] font-black uppercase ${STATUS_COLORS[order.status]}`}
                          value={order.status}
                        >
                          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button onClick={() => deleteOrder(order.id)} className="text-red-400 hover:text-red-600 p-2">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm group">
                <div className="aspect-video relative">
                  <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button onClick={() => startEditProduct(p)} className="p-3 bg-white rounded-xl text-slate-900 hover:bg-orange-500 hover:text-white transition">Edit</button>
                    <button onClick={() => deleteProduct(p.id)} className="p-3 bg-white rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition">Delete</button>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-black text-slate-900 uppercase tracking-tighter truncate italic">{p.name}</h3>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-orange-600 font-black">{CURRENCY_SYMBOL}{p.price}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Stock: {p.stock}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modalMode !== 'none' && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-fadeIn overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">{modalMode === 'edit' ? 'Update' : 'New'} Product</h2>
                <button onClick={() => setModalMode('none')} className="text-slate-400 hover:text-slate-900 text-2xl font-black">×</button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Asset Image</label>
                      <div className="aspect-square bg-slate-50 rounded-2xl border-4 border-dashed border-slate-100 flex items-center justify-center relative overflow-hidden">
                        {formState.image_url ? (
                          <img src={formState.image_url} className="w-full h-full object-cover" />
                        ) : (
                          <p className="text-[9px] font-black text-slate-300 uppercase">Drop Image or Select</p>
                        )}
                        <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
                        {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center animate-spin">◌</div>}
                      </div>
                      <input 
                        type="text" 
                        placeholder="Or Paste Image URL..." 
                        value={formState.image_url} 
                        onChange={(e) => setFormState({...formState, image_url: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-xl p-4 text-[10px] font-bold mt-4"
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Title</label>
                      <input required className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Price (BDT)</label>
                        <input required type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold" value={formState.price} onChange={e => setFormState({...formState, price: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Stock</label>
                        <input required type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold" value={formState.stock} onChange={e => setFormState({...formState, stock: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                      <select required className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold" value={formState.category_id} onChange={e => setFormState({...formState, category_id: e.target.value})}>
                        <option value="">Select Dept.</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl">
                   <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formState.is_featured} onChange={e => setFormState({...formState, is_featured: e.target.checked})} />
                      <span className="text-[10px] font-black uppercase text-slate-500">Featured</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formState.is_flash_sale} onChange={e => setFormState({...formState, is_flash_sale: e.target.checked})} />
                      <span className="text-[10px] font-black uppercase text-slate-500">Flash Sale</span>
                   </label>
                </div>

                <textarea placeholder="Product Description..." className="w-full bg-slate-50 border-none rounded-2xl p-6 text-sm font-bold h-32" value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} />

                <button type="submit" disabled={uploading} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-orange-600 transition disabled:opacity-50">
                   {modalMode === 'edit' ? 'Update Inventory' : 'Publish Product'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
