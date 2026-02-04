
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
    } catch (e) { console.error(e); } finally { setLoading(false); }
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
    const payload = {
      name: formState.name,
      slug: formState.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      price: parseFloat(formState.price),
      stock: parseInt(formState.stock),
      category_id: formState.category_id,
      description: formState.description,
      images: [formState.image_url || 'https://via.placeholder.com/400'],
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

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center animate-pulse">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs italic">NextBazar OS Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar - Desktop Only */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white flex flex-col p-8 space-y-12 lg:sticky lg:top-0 lg:h-screen shadow-2xl z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-600 rounded-[1.2rem] flex items-center justify-center font-black text-white shadow-xl shadow-orange-600/20 text-xl italic">NB</div>
          <div className="flex flex-col -space-y-1">
            <span className="font-black text-xl tracking-tighter uppercase">Next<span className="text-orange-500">Admin</span></span>
            <span className="text-[8px] font-bold text-slate-500 tracking-[0.3em] uppercase">Control System V2</span>
          </div>
        </div>
        <nav className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
          {['overview', 'orders', 'products', 'categories'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-shrink-0 text-left px-6 py-5 rounded-2xl text-[10px] font-black transition-all uppercase tracking-[0.2em] ${activeTab === tab ? 'bg-orange-600 text-white shadow-2xl shadow-orange-600/40 translate-x-1' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 lg:p-14">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <div>
            <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic">{activeTab}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">NextBazar Global Management Hub</p>
          </div>
          {activeTab === 'products' && (
            <button 
              onClick={() => { setFormState({ name: '', price: '', stock: '', category_id: '', description: '', image_url: '', is_featured: false, is_flash_sale: false }); setModalMode('add'); }}
              className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[10px] hover:bg-orange-600 transition shadow-2xl hover:scale-105 active:scale-95 uppercase tracking-[0.2em]"
            >
              + ADD NEW ASSET
            </button>
          )}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { label: 'Total Volume', value: orders.length, color: 'text-slate-900' },
              { label: 'Live Inventory', value: products.length, color: 'text-blue-600' },
              { label: 'Gross Revenue', value: `${CURRENCY_SYMBOL}${orders.reduce((acc, o) => acc + (o.status !== 'Cancelled' ? Number(o.total_amount) : 0), 0).toLocaleString()}`, color: 'text-orange-500' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8 border-b border-slate-50 pb-6 flex justify-between">
                  {stat.label}
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>
                <div className={`text-6xl font-black tracking-tighter ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-10 py-8 italic">REF_ID</th>
                    <th className="px-10 py-8">CLIENT_INFO</th>
                    <th className="px-10 py-8">TRANS_TYPE</th>
                    <th className="px-10 py-8">AMOUNT</th>
                    <th className="px-10 py-8">STATUS</th>
                    <th className="px-10 py-8">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-8 font-mono text-[10px] text-slate-400 group-hover:text-slate-900">#{order.id.slice(0,8).toUpperCase()}</td>
                      <td className="px-10 py-8">
                        <div className="font-black text-slate-900 uppercase text-xs mb-1">{order.profiles?.full_name || 'Anonymous'}</div>
                        <div className="text-[10px] text-slate-400 max-w-xs truncate font-bold uppercase tracking-tight">{order.shipping_address}</div>
                      </td>
                      <td className="px-10 py-8">
                        <span className={`px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest ${order.payment_method === 'BKASH' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                          {order.payment_method}
                        </span>
                        {order.bkash_tx_id && <div className="text-[9px] text-pink-400 mt-2 font-mono font-bold tracking-widest">{order.bkash_tx_id}</div>}
                      </td>
                      <td className="px-10 py-8 font-black text-slate-900 text-lg tracking-tighter">{CURRENCY_SYMBOL}{order.total_amount}</td>
                      <td className="px-10 py-8">
                        <span className={`px-5 py-2 rounded-full text-[9px] font-black border uppercase tracking-[0.2em] ${STATUS_COLORS[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <select 
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="bg-slate-100 rounded-2xl p-4 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-orange-500 border-none transition-all cursor-pointer hover:bg-slate-200"
                          value={order.status}
                        >
                          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Product Modal with File Upload */}
        {modalMode !== 'none' && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-[4rem] p-10 lg:p-16 shadow-2xl animate-fadeIn overflow-y-auto max-h-[90vh] scrollbar-hide border border-white/20">
              <div className="flex justify-between items-start mb-14">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter italic">{modalMode === 'edit' ? 'Update Detail' : 'New Asset'}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Inventory Management Protocol</p>
                </div>
                <button onClick={() => setModalMode('none')} className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-orange-500 transition-all active:scale-90 shadow-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-10">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Asset Image (Auto Upload)</label>
                      <div className="relative group">
                        <div className={`aspect-square bg-slate-50 rounded-[3rem] overflow-hidden border-4 border-dashed border-slate-100 flex items-center justify-center relative transition-all ${uploading ? 'animate-pulse' : ''}`}>
                          {formState.image_url ? (
                            <img src={formState.image_url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-8">
                               <svg className="w-12 h-12 text-slate-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Select Image</p>
                            </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            disabled={uploading}
                          />
                          {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>}
                        </div>
                        {formState.image_url && <button type="button" onClick={() => setFormState({...formState, image_url: ''})} className="absolute -top-3 -right-3 w-10 h-10 bg-red-500 text-white rounded-2xl shadow-xl flex items-center justify-center font-black text-lg">×</button>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Product Identity</label>
                      <input required placeholder="E.g. Vintage Leather Jacket" className="w-full bg-slate-50 border-none rounded-2xl p-6 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 transition italic" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Price (BDT)</label>
                        <input required type="number" placeholder="0" className="w-full bg-slate-50 border-none rounded-2xl p-6 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 transition" value={formState.price} onChange={e => setFormState({...formState, price: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">In-Stock</label>
                        <input required type="number" placeholder="0" className="w-full bg-slate-50 border-none rounded-2xl p-6 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 transition" value={formState.stock} onChange={e => setFormState({...formState, stock: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Assigned Department</label>
                      <select required className="w-full bg-slate-50 border-none rounded-2xl p-6 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 transition appearance-none cursor-pointer" value={formState.category_id} onChange={e => setFormState({...formState, category_id: e.target.value})}>
                        <option value="">Select Dept.</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800">
                   <label className="flex items-center gap-6 cursor-pointer group">
                      <input type="checkbox" className="w-8 h-8 rounded-xl border-none bg-slate-800 text-orange-600 focus:ring-0 shadow-inner" checked={formState.is_featured} onChange={e => setFormState({...formState, is_featured: e.target.checked})} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition">Featured Status</span>
                   </label>
                   <label className="flex items-center gap-6 cursor-pointer group">
                      <input type="checkbox" className="w-8 h-8 rounded-xl border-none bg-slate-800 text-red-600 focus:ring-0 shadow-inner" checked={formState.is_flash_sale} onChange={e => setFormState({...formState, is_flash_sale: e.target.checked})} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition">Flash Activation</span>
                   </label>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Asset Specifications</label>
                  <textarea placeholder="Write full product details here..." className="w-full bg-slate-50 border-none rounded-[2.5rem] p-8 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 transition h-48 scrollbar-hide" value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} />
                </div>

                <button 
                  type="submit" 
                  disabled={uploading}
                  className="w-full bg-orange-600 text-white rounded-[2.5rem] py-8 font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl shadow-orange-600/30 hover:bg-slate-900 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                >
                  {modalMode === 'edit' ? 'Synchronize Updates' : 'Publish Asset to Store'}
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
