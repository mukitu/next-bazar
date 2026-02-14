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

  const [formState, setFormState] = useState({
    name: '', 
    price: '', 
    discount_price: '', 
    stock: '', 
    category_id: '', 
    description: '', 
    image_url: '', 
    is_featured: false, 
    is_flash_sale: false, 
    rating: '5', 
    review_count: '0'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [ords, prods, cats] = await Promise.all([
        supabase.from('orders').select('*, profiles(email, full_name, phone), order_items(*, product:products(*))').order('created_at', { ascending: false }),
        fetchProducts(),
        fetchCategories()
      ]);
      setOrders(ords.data || []);
      setProducts(prods);
      setCategories(cats);
    } catch (e) { 
      console.error("Admin Load Error:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) alert(error.message);
    else loadData();
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = Date.now();
    const baseSlug = formState.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const finalSlug = editingProduct ? editingProduct.slug : `${baseSlug}-${timestamp}`;

    const payload = {
      name: formState.name,
      slug: finalSlug,
      price: parseFloat(formState.price),
      discount_price: formState.discount_price ? parseFloat(formState.discount_price) : null,
      stock: parseInt(formState.stock),
      category_id: formState.category_id,
      description: formState.description,
      images: [formState.image_url],
      is_featured: formState.is_featured,
      is_flash_sale: formState.is_flash_sale,
      rating: parseFloat(formState.rating),
      review_count: parseInt(formState.review_count),
      sku: editingProduct?.sku || 'NB-' + Math.random().toString(36).substr(2, 7).toUpperCase()
    };

    let res;
    if (modalMode === 'edit' && editingProduct) {
      res = await supabase.from('products').update(payload).eq('id', editingProduct.id);
    } else {
      res = await supabase.from('products').insert(payload);
    }

    if (res.error) alert("Error: " + res.error.message);
    else { setModalMode('none'); loadData(); }
  };

  const startEditProduct = (p: Product) => {
    setEditingProduct(p);
    setFormState({
      name: p.name, 
      price: p.price.toString(), 
      discount_price: p.discount_price?.toString() || '',
      stock: p.stock.toString(), 
      category_id: p.category_id, 
      description: p.description || '',
      image_url: p.images[0] || '', 
      is_featured: p.is_featured, 
      is_flash_sale: p.is_flash_sale,
      rating: (p.rating || 5).toString(), 
      review_count: (p.review_count || 0).toString()
    });
    setModalMode('edit');
  };

  const totalRevenue = orders.filter(o => o.status !== 'Cancelled').reduce((acc, o) => acc + o.total_amount, 0);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center animate-pulse">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs italic">LOADING COMMAND CENTER...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 lg:sticky lg:top-0 lg:h-screen shadow-2xl z-20">
        <div className="text-2xl font-black italic mb-12 tracking-tighter uppercase">NEXT<span className="text-orange-500">ADMIN</span></div>
        <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
          {['overview', 'orders', 'products', 'categories'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)} 
              className={`flex-shrink-0 text-left px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-orange-600 shadow-xl' : 'text-slate-500 hover:bg-slate-800'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 lg:p-14">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900">{activeTab}</h1>
          {activeTab === 'products' && (
            <button onClick={() => { setFormState({ name: '', price: '', discount_price: '', stock: '', category_id: '', description: '', image_url: '', is_featured: false, is_flash_sale: false, rating: '5', review_count: '0' }); setModalMode('add'); setEditingProduct(null); }} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 shadow-xl transition-all">Launch Product</button>
          )}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Revenue</p>
                <p className="text-5xl font-black text-slate-900 tracking-tighter italic">{CURRENCY_SYMBOL}{totalRevenue.toLocaleString()}</p>
             </div>
             <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Orders</p>
                <p className="text-5xl font-black text-slate-900 tracking-tighter italic">{orders.length}</p>
             </div>
             <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Active Assets</p>
                <p className="text-5xl font-black text-slate-900 tracking-tighter italic">{products.length}</p>
             </div>
          </div>
        )}

        {activeTab === 'orders' && (
           <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
             <div className="overflow-x-auto">
               <table className="w-full text-left min-w-[1200px]">
                 <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <th className="px-8 py-6">Reference</th>
                       <th className="px-8 py-6">Customer & Contact</th>
                       <th className="px-8 py-6">Shipping Address</th>
                       <th className="px-8 py-6">Payment</th>
                       <th className="px-8 py-6">Total</th>
                       <th className="px-8 py-6">Status</th>
                       <th className="px-8 py-6 text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {orders.map(order => {
                      const profilesRaw = (order as any).profiles;
                      // Handle both object and array response from Supabase join
                      const profile = Array.isArray(profilesRaw) ? profilesRaw[0] : profilesRaw;
                      
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-8 font-mono text-[10px] text-slate-400">#{order.id.slice(0,8)}</td>
                          <td className="px-8 py-8">
                            <p className="font-black text-slate-900 uppercase text-xs italic">{profile?.full_name || 'Guest'}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{profile?.phone || 'No Phone'}</p>
                          </td>
                          <td className="px-8 py-8 max-w-xs">
                            <p className="text-[10px] font-bold text-slate-600 leading-relaxed uppercase">{order.shipping_address}</p>
                          </td>
                          <td className="px-8 py-8">
                            <p className="text-[10px] font-black uppercase tracking-widest">{order.payment_method}</p>
                            {order.bkash_tx_id && <p className="text-[9px] font-mono text-pink-600 mt-1">TXID: {order.bkash_tx_id}</p>}
                          </td>
                          <td className="px-8 py-8 font-black text-slate-900 text-lg tracking-tighter">{CURRENCY_SYMBOL}{order.total_amount}</td>
                          <td className="px-8 py-8">
                             <select 
                               value={order.status} 
                               onChange={(e) => handleStatusChange(order.id, e.target.value)}
                               className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border-2 outline-none cursor-pointer ${STATUS_COLORS[order.status]}`}
                             >
                               {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                          </td>
                          <td className="px-8 py-8 text-right">
                             <button onClick={() => { if(window.confirm("Delete order?")) supabase.from('orders').delete().eq('id', order.id).then(() => loadData()); }} className="text-red-300 hover:text-red-600 transition-colors p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </td>
                        </tr>
                      );
                    })}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {products.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-6">
                   <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                </div>
                <h3 className="font-black uppercase text-sm italic mb-4 truncate text-slate-900">{p.name}</h3>
                <div className="flex justify-between items-center">
                  <span className="text-orange-600 font-black text-lg">{CURRENCY_SYMBOL}{p.discount_price || p.price}</span>
                  <button onClick={() => startEditProduct(p)} className="bg-slate-50 hover:bg-slate-900 hover:text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {modalMode !== 'none' && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-[3rem] p-10 overflow-y-auto max-h-[90vh] shadow-2xl animate-fadeIn">
               <div className="flex justify-between items-center mb-10">
                 <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">{modalMode === 'edit' ? 'Update Asset' : 'New Launch'}</h2>
                 <button onClick={() => setModalMode('none')} className="text-2xl font-black">×</button>
               </div>
               <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                   <input required className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-sm uppercase italic" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} placeholder="Product Title" />
                   <div className="grid grid-cols-2 gap-4">
                     <input required type="number" className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-sm" value={formState.price} onChange={e => setFormState({...formState, price: e.target.value})} placeholder="Price" />
                     <input type="number" className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-sm" value={formState.discount_price} onChange={e => setFormState({...formState, discount_price: e.target.value})} placeholder="Sale Price" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <input type="number" step="0.1" max="5" min="0" className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-sm" value={formState.rating} onChange={e => setFormState({...formState, rating: e.target.value})} placeholder="Rating (1-5)" />
                      <input type="number" className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-sm" value={formState.review_count} onChange={e => setFormState({...formState, review_count: e.target.value})} placeholder="Review Count" />
                   </div>
                   <input required type="number" className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-sm" value={formState.stock} onChange={e => setFormState({...formState, stock: e.target.value})} placeholder="Stock" />
                   <select required className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-sm uppercase italic" value={formState.category_id} onChange={e => setFormState({...formState, category_id: e.target.value})}>
                     <option value="">Select Dept</option>
                     {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                 </div>
                 <div className="space-y-6">
                   <input required type="url" className="w-full bg-slate-50 border-none p-5 rounded-2xl font-bold text-xs" value={formState.image_url} onChange={e => setFormState({...formState, image_url: e.target.value})} placeholder="Image URL" />
                   <textarea rows={6} className="w-full bg-slate-50 border-none p-5 rounded-2xl font-medium text-sm focus:ring-2 focus:ring-orange-500" value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} placeholder="Description..." />
                   <button type="submit" className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-900 transition-all">Submit Asset</button>
                 </div>
               </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
