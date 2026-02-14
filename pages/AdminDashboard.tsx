
import React, { useState, useEffect } from 'react';
import { supabase, fetchProducts, fetchCategories, addCategory, deleteCategory } from '../lib/supabase';
import { CURRENCY_SYMBOL, STATUS_COLORS, ORDER_STATUSES } from '../constants';
import { Order, Product, Category } from '../types';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'categories'>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Search
  const [modalMode, setModalMode] = useState<'add-product' | 'edit-product' | 'add-category' | 'none'>('none');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCatName, setNewCatName] = useState('');

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
    if (modalMode === 'edit-product' && editingProduct) {
      res = await supabase.from('products').update(payload).eq('id', editingProduct.id);
    } else {
      res = await supabase.from('products').insert(payload);
    }

    if (res.error) alert("Error: " + res.error.message);
    else { setModalMode('none'); loadData(); }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    const slug = newCatName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    try {
      await addCategory(newCatName, slug);
      setNewCatName('');
      setModalMode('none');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm("Delete this category? Products in this category might lose their link.")) {
      try {
        await deleteCategory(id);
        loadData();
      } catch (err: any) {
        alert(err.message);
      }
    }
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
    setModalMode('edit-product');
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalRevenue = orders.filter(o => o.status !== 'Cancelled').reduce((acc, o) => acc + o.total_amount, 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Payment Submitted').length;

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center animate-pulse">
        <div className="w-16 h-1 bg-orange-500 rounded-full mb-4 mx-auto overflow-hidden">
          <div className="h-full bg-white w-1/3 animate-[shimmer_1s_infinite]"></div>
        </div>
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] italic">Accessing Command Hub...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* SIDEBAR */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 lg:sticky lg:top-0 lg:h-screen shadow-2xl z-20 flex flex-col">
        <div className="text-2xl font-black italic mb-16 tracking-tighter uppercase flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg"></div>
          NEXT<span className="text-orange-500">SYSTEM</span>
        </div>
        
        <nav className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide flex-1">
          {[
            { id: 'overview', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            { id: 'orders', label: 'Orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
            { id: 'products', label: 'Inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
            { id: 'categories', label: 'Categories', icon: 'M7 7h.01M7 11h.01M7 15h.01M11 7h.01M11 11h.01M11 15h.01M15 7h.01M15 11h.01M15 15h.01' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex items-center gap-4 text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-orange-600 shadow-xl text-white' : 'text-slate-500 hover:bg-slate-800'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} /></svg>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="pt-8 border-t border-slate-800">
           <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Admin Control v2.4</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 lg:p-14 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
          <div>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">{activeTab}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Command Terminal / {activeTab}</p>
          </div>
          
          <div className="flex gap-4">
            {activeTab === 'products' && (
               <div className="relative group">
                 <input 
                  type="text" 
                  placeholder="SEARCH ASSETS..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border-2 border-slate-100 rounded-2xl px-12 py-4 text-[10px] font-black uppercase tracking-widest focus:border-orange-500 transition-all outline-none"
                 />
                 <svg className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               </div>
            )}
            
            {activeTab === 'products' && (
              <button onClick={() => { setFormState({ name: '', price: '', discount_price: '', stock: '', category_id: '', description: '', image_url: '', is_featured: false, is_flash_sale: false, rating: '5', review_count: '0' }); setModalMode('add-product'); setEditingProduct(null); }} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 shadow-xl transition-all">Launch Product</button>
            )}
            
            {activeTab === 'categories' && (
              <button onClick={() => setModalMode('add-category')} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 shadow-xl transition-all">New Category</button>
            )}
          </div>
        </header>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-12 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
               <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Gross Revenue</p>
                  <p className="text-4xl font-black text-slate-900 tracking-tighter italic">{CURRENCY_SYMBOL}{totalRevenue.toLocaleString()}</p>
               </div>
               <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Trades</p>
                  <p className="text-4xl font-black text-slate-900 tracking-tighter italic">{orders.length}</p>
               </div>
               <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Pending Logs</p>
                  <p className="text-4xl font-black text-orange-600 tracking-tighter italic">{pendingOrders}</p>
               </div>
               <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Active Assets</p>
                  <p className="text-4xl font-black text-slate-900 tracking-tighter italic">{products.length}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-black uppercase tracking-tighter italic mb-8">Recent <span className="text-orange-500">Activity</span></h3>
                  <div className="space-y-6">
                    {orders.slice(0, 5).map(o => (
                      <div key={o.id} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-[10px] text-slate-300">#{o.id.slice(0,3)}</div>
                          <div>
                            <p className="text-[10px] font-black text-slate-900 uppercase">New Transaction</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">{new Date(o.created_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <p className="text-xs font-black text-slate-900">{CURRENCY_SYMBOL}{o.total_amount}</p>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                 <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full -mr-32 -mb-32 blur-3xl"></div>
                 <h3 className="text-xl font-black uppercase tracking-tighter italic mb-6">System <span className="text-orange-500">Pulse</span></h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed mb-10">All systems operational. Database response time 24ms. Cloud assets secured. Sync enabled.</p>
                 <div className="flex gap-4">
                    <div className="h-1 flex-1 bg-orange-500 rounded-full"></div>
                    <div className="h-1 flex-1 bg-slate-800 rounded-full"></div>
                    <div className="h-1 flex-1 bg-slate-800 rounded-full"></div>
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
           <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-xl animate-fadeIn">
             <div className="overflow-x-auto">
               <table className="w-full text-left min-w-[1200px]">
                 <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <th className="px-10 py-8">Reference</th>
                       <th className="px-10 py-8">Client Identity</th>
                       <th className="px-10 py-8">Asset Pay</th>
                       <th className="px-10 py-8">Status Update</th>
                       <th className="px-10 py-8 text-right">Operation</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {orders.map(order => {
                      const profile = Array.isArray((order as any).profiles) ? (order as any).profiles[0] : (order as any).profiles;
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-10 py-10">
                            <p className="font-mono text-[10px] text-slate-400 group-hover:text-slate-900 transition-colors">#{order.id.slice(0,12)}</p>
                            <p className="text-[8px] font-bold text-slate-300 uppercase mt-2">{new Date(order.created_at).toLocaleString()}</p>
                          </td>
                          <td className="px-10 py-10">
                            <p className="font-black text-slate-900 uppercase text-xs italic">{profile?.full_name || 'Anonymous'}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-1">{profile?.phone || 'No Linked Phone'}</p>
                          </td>
                          <td className="px-10 py-10">
                            <p className="text-xl font-black text-slate-900 tracking-tighter italic">{CURRENCY_SYMBOL}{order.total_amount}</p>
                            <div className="flex items-center gap-2 mt-2">
                               <span className="text-[8px] font-black uppercase text-slate-400 px-2 py-0.5 border border-slate-100 rounded">{order.payment_method}</span>
                               {order.bkash_tx_id && <span className="text-[8px] font-mono text-pink-600 bg-pink-50 px-2 py-0.5 rounded">TX: {order.bkash_tx_id}</span>}
                            </div>
                          </td>
                          <td className="px-10 py-10">
                             <select 
                               value={order.status} 
                               onChange={(e) => handleStatusChange(order.id, e.target.value)}
                               className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest border-2 outline-none cursor-pointer transition-all ${STATUS_COLORS[order.status]}`}
                             >
                               {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                          </td>
                          <td className="px-10 py-10 text-right">
                             <button onClick={() => { if(window.confirm("Purge order record?")) supabase.from('orders').delete().eq('id', order.id).then(() => loadData()); }} className="bg-red-50 text-red-400 hover:bg-red-600 hover:text-white p-4 rounded-2xl transition-all shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </td>
                        </tr>
                      );
                    })}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8 animate-fadeIn">
            {filteredProducts.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all flex flex-col">
                <div className="relative aspect-square rounded-3xl overflow-hidden mb-6 bg-slate-50">
                   <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                   <div className="absolute top-4 left-4 flex gap-2">
                      {p.stock < 5 && <span className="bg-red-600 text-white text-[7px] font-black px-2 py-1 rounded uppercase">Low Stock</span>}
                      {p.is_featured && <span className="bg-slate-900 text-white text-[7px] font-black px-2 py-1 rounded uppercase">Featured</span>}
                   </div>
                </div>
                <h3 className="font-black uppercase text-xs italic mb-2 truncate text-slate-900 tracking-tighter">{p.name}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6">{categories.find(c => c.id === p.category_id)?.name || 'Misc Asset'}</p>
                
                <div className="mt-auto flex justify-between items-center pt-6 border-t border-slate-50">
                  <div>
                    <span className="text-slate-900 font-black text-xl italic">{CURRENCY_SYMBOL}{p.discount_price || p.price}</span>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{p.stock} Units In Vault</p>
                  </div>
                  <button onClick={() => startEditProduct(p)} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg active:scale-95 italic">Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="max-w-4xl animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                  <div>
                    <h4 className="font-black uppercase italic text-slate-900 tracking-tighter">{cat.name}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Slug: {cat.slug}</p>
                  </div>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-slate-200 hover:text-red-500 transition-colors p-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
              
              <button 
                onClick={() => setModalMode('add-category')}
                className="bg-white border-4 border-dashed border-slate-100 p-8 rounded-[2.5rem] flex items-center justify-center text-slate-200 hover:text-orange-500 hover:border-orange-500/20 transition-all group"
              >
                <svg className="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* MODAL: PRODUCT */}
        {(modalMode === 'add-product' || modalMode === 'edit-product') && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl rounded-[3.5rem] p-10 md:p-14 overflow-y-auto max-h-[90vh] shadow-2xl animate-fadeIn border border-white/20">
               <div className="flex justify-between items-center mb-12">
                 <div>
                   <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">{modalMode === 'edit-product' ? 'Sync Asset' : 'Global Launch'}</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Configure inventory parameters</p>
                 </div>
                 <button onClick={() => setModalMode('none')} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 hover:bg-orange-600 hover:text-white transition-all shadow-inner">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
               </div>
               
               <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-8">
                   <div className="group">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1 group-focus-within:text-orange-500">Asset Title</label>
                      <input required className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500/20 p-5 rounded-2xl font-black text-sm uppercase italic outline-none focus:bg-white transition-all shadow-inner" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} placeholder="e.g. ULTRA BOOST 2.0" />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-6">
                     <div className="group">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Market Price</label>
                        <input required type="number" className="w-full bg-slate-50 border-2 border-transparent p-5 rounded-2xl font-black text-sm outline-none focus:border-orange-500/20 focus:bg-white transition-all shadow-inner" value={formState.price} onChange={e => setFormState({...formState, price: e.target.value})} placeholder="0.00" />
                     </div>
                     <div className="group">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Sale Value</label>
                        <input type="number" className="w-full bg-slate-50 border-2 border-transparent p-5 rounded-2xl font-black text-sm outline-none focus:border-orange-500/20 focus:bg-white transition-all shadow-inner" value={formState.discount_price} onChange={e => setFormState({...formState, discount_price: e.target.value})} placeholder="Optional" />
                     </div>
                   </div>

                   <div className="group">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Department</label>
                      <select required className="w-full bg-slate-50 border-2 border-transparent p-5 rounded-2xl font-black text-sm uppercase italic outline-none focus:border-orange-500/20 focus:bg-white transition-all shadow-inner" value={formState.category_id} onChange={e => setFormState({...formState, category_id: e.target.value})}>
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                   </div>

                   <div className="flex gap-8 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={formState.is_featured} onChange={e => setFormState({...formState, is_featured: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Featured Asset</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={formState.is_flash_sale} onChange={e => setFormState({...formState, is_flash_sale: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Flash Sale</span>
                      </label>
                   </div>
                 </div>

                 <div className="space-y-8">
                   <div className="group">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Visual Asset URL</label>
                      <input required type="url" className="w-full bg-slate-50 border-2 border-transparent p-5 rounded-2xl font-bold text-xs outline-none focus:border-orange-500/20 focus:bg-white transition-all shadow-inner" value={formState.image_url} onChange={e => setFormState({...formState, image_url: e.target.value})} placeholder="https://cloud.storage/asset.png" />
                   </div>
                   
                   <div className="group">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Technical Specs (Description)</label>
                      <textarea rows={6} className="w-full bg-slate-50 border-2 border-transparent p-6 rounded-[2rem] font-medium text-sm focus:ring-0 focus:border-orange-500/20 outline-none focus:bg-white transition-all shadow-inner" value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} placeholder="Enter detailed specifications..." />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="group">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Vault Stock</label>
                        <input required type="number" className="w-full bg-slate-50 border-2 border-transparent p-5 rounded-2xl font-black text-sm outline-none focus:border-orange-500/20 focus:bg-white transition-all shadow-inner" value={formState.stock} onChange={e => setFormState({...formState, stock: e.target.value})} placeholder="0" />
                      </div>
                      <div className="flex items-end">
                        <button type="submit" className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-900 transition-all active:scale-95 italic">Authorize Link</button>
                      </div>
                   </div>
                 </div>
               </form>
            </div>
          </div>
        )}

        {/* MODAL: CATEGORY */}
        {modalMode === 'add-category' && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-fadeIn">
               <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Define <span className="text-orange-500">Dept</span></h2>
                 <button onClick={() => setModalMode('none')} className="text-2xl font-black">×</button>
               </div>
               <form onSubmit={handleAddCategory} className="space-y-6">
                 <div className="group">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Dept Name</label>
                    <input required className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-sm uppercase italic outline-none focus:ring-2 focus:ring-orange-500/20" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Premium Footwear" />
                 </div>
                 <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-orange-600 transition-all">Authorize Dept</button>
               </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
