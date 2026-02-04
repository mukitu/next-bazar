import React, { useState, useEffect } from 'react';
import { supabase, fetchProducts, fetchCategories } from '../lib/supabase.ts';
import { CURRENCY_SYMBOL, STATUS_COLORS, ORDER_STATUSES } from '../constants.ts';
import { Order, Product, Category } from '../types.ts';

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
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
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
    if (!window.confirm("Permanent Delete Order? This cannot be undone.")) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) alert(error.message);
    else loadData();
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Delete Product Asset?")) return;
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
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Accessing Admin OS...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <aside className="w-full lg:w-72 bg-slate-900 text-white flex flex-col p-8 lg:sticky lg:top-0 lg:h-screen shadow-2xl z-20">
        <div className="flex items-center gap-4 mb-12">
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
              + Create New Product
            </button>
          )}
        </div>

        {activeTab === 'orders' && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-8 py-6">Reference</th>
                    <th className="px-8 py-6">Customer</th>
                    <th className="px-8 py-6">Payment</th>
                    <th className="px-8 py-6">Total</th>
                    <th className="px-8 py-6">Status Control</th>
                    <th className="px-8 py-6 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6 font-mono text-[10px] text-slate-400">#{order.id.slice(0,8).toUpperCase()}</td>
                      <td className="px-8 py-6">
                        <div className="font-black text-slate-900 uppercase text-xs">{order.profiles?.full_name || 'Anonymous'}</div>
                        <div className="text-[10px] text-slate-400 max-w-[200px] truncate">{order.shipping_address}</div>
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
                          className={`bg-white border rounded-xl p-3 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer ${STATUS_COLORS[order.status]}`}
                          value={order.status}
                        >
                          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => deleteOrder(order.id)} 
                          className="bg-red-50 text-red-500 p-3 rounded-xl hover:bg-red-500 hover:text-white transition shadow-sm"
                          title="Delete Permanently"
                        >
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
              <div key={p.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm group relative">
                <div className="aspect-video relative overflow-hidden">
                  <img src={p.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                    <button onClick={() => startEditProduct(p)} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 hover:text-white transition">Edit</button>
                    <button onClick={() => deleteProduct(p.id)} className="px-6 py-3 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition">Delete</button>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="font-black text-slate-900 uppercase tracking-tighter truncate italic text-lg">{p.name}</h3>
                  <div className="flex justify-between items-center mt-6">
                    <span className="text-orange-600 font-black text-xl">{CURRENCY_SYMBOL}{p.price}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-3 py-1 rounded-full">Qty: {p.stock}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {modalMode !== 'none' && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 lg:p-10">
            <div className="bg-white w-full max-w-3xl rounded-[3rem] p-10 lg:p-16 shadow-2xl animate-fadeIn overflow-y-auto max-h-full scrollbar-hide">
              <div className="flex justify-between items-center mb-14">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter italic text-slate-900">{modalMode === 'edit' ? 'Update' : 'New Collection'}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Inventory Management Terminal</p>
                </div>
                <button onClick={() => setModalMode('none')} className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all font-black text-2xl">×</button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Visual Asset</label>
                      <div className="aspect-square bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center relative overflow-hidden group">
                        {formState.image_url ? (
                          <img src={formState.image_url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <svg className="w-12 h-12 text-slate-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <p className="text-[10px] font-black text-slate-300 uppercase">Drop or Select</p>
                          </div>
                        )}
                        <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" disabled={uploading} title="Click to upload image" />
                        {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>}
                      </div>
                      
                      <div className="mt-6">
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Or Direct CDN URL</label>
                        <input 
                          type="text" 
                          placeholder="https://images.unsplash.com/..." 
                          value={formState.image_url} 
                          onChange={(e) => setFormState({...formState, image_url: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-[11px] font-bold focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Product Title</label>
                      <input required placeholder="e.g. Premium Wireless Headset" className="w-full bg-slate-50 border-none rounded-2xl p-6 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 italic" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Price (BDT)</label>
                        <input required type="number" className="w-full bg-slate-50 border-none rounded-2xl p-6 text-sm font-bold" value={formState.price} onChange={e => setFormState({...formState, price: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Stock Count</label>
                        <input required type="number" className="w-full bg-slate-50 border-none rounded-2xl p-6 text-sm font-bold" value={formState.stock} onChange={e => setFormState({...formState, stock: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Assigned Category</label>
                      <select required className="w-full bg-slate-50 border-none rounded-2xl p-6 text-sm font-bold cursor-pointer" value={formState.category_id} onChange={e => setFormState({...formState, category_id: e.target.value})}>
                        <option value="">Choose Department</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 p-8 bg-slate-900 rounded-[2.5rem]">
                   <label className="flex items-center gap-4 cursor-pointer flex-1">
                      <input type="checkbox" className="w-10 h-10 rounded-xl border-none bg-slate-800 text-orange-600 focus:ring-0" checked={formState.is_featured} onChange={e => setFormState({...formState, is_featured: e.target.checked})} />
                      <span className="text-[10px] font-black uppercase text-slate-400">Featured in Home</span>
                   </label>
                   <label className="flex items-center gap-4 cursor-pointer flex-1">
                      <input type="checkbox" className="w-10 h-10 rounded-xl border-none bg-slate-800 text-red-600 focus:ring-0" checked={formState.is_flash_sale} onChange={e => setFormState({...formState, is_flash_sale: e.target.checked})} />
                      <span className="text-[10px] font-black uppercase text-slate-400">Flash Sale Active</span>
                   </label>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Detailed Specs</label>
                  <textarea placeholder="Write full specifications..." className="w-full bg-slate-50 border-none rounded-[2rem] p-8 text-sm font-bold h-48 scrollbar-hide" value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} />
                </div>

                <button type="submit" disabled={uploading} className="w-full bg-orange-600 text-white py-8 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-900 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50">
                   {modalMode === 'edit' ? 'Synchronize Updates' : 'Publish Product to Store'}
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
