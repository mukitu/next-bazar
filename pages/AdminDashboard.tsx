
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
        supabase.from('orders').select('*, profiles(email, full_name), order_items(*, product:products(*))').order('created_at', { ascending: false }),
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

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formState.name,
      slug: formState.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
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

    if (res.error) {
      alert("Error saving product: " + res.error.message);
    } else { 
      setModalMode('none'); 
      loadData(); 
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
    setModalMode('edit');
  };

  const totalRevenue = orders.filter(o => o.status !== 'Cancelled').reduce((acc, o) => acc + o.total_amount, 0);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center animate-pulse">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs italic">LOADING NEXTBAZAR COMMAND CENTER...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 lg:sticky lg:top-0 lg:h-screen shadow-2xl z-20">
        <div className="text-2xl font-black italic mb-12 tracking-tighter uppercase">NEXT<span className="text-orange-500">ADMIN</span></div>
        <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
          {['overview', 'orders', 'products', 'categories'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)} 
              className={`flex-shrink-0 text-left px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-orange-600 shadow-xl translate-x-1' : 'text-slate-500 hover:bg-slate-800'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 lg:p-14">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-slate-900">{activeTab}</h1>
          {activeTab === 'products' && (
            <button 
              onClick={() => { 
                setFormState({ name: '', price: '', discount_price: '', stock: '', category_id: '', description: '', image_url: '', is_featured: false, is_flash_sale: false, rating: '5', review_count: '0' }); 
                setModalMode('add'); 
                setEditingProduct(null); 
              }} 
              className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition shadow-xl active:scale-95"
            >
              + Launch New Product
            </button>
          )}
        </div>

        {/* OVERVIEW TAB - Kept exactly as previous logic */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-500">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Total Realized Revenue</p>
                <p className="text-5xl font-black text-slate-900 tracking-tighter italic">{CURRENCY_SYMBOL}{totalRevenue.toLocaleString()}</p>
             </div>
             <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-500">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Total Gross Orders</p>
                <p className="text-5xl font-black text-slate-900 tracking-tighter italic">{orders.length}</p>
             </div>
             <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-500">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Active Catalog Assets</p>
                <p className="text-5xl font-black text-slate-900 tracking-tighter italic">{products.length}</p>
             </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-6">
                   <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                   {p.is_featured && <div className="absolute top-3 left-3 bg-orange-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase">Featured</div>}
                </div>
                <h3 className="font-black uppercase text-sm italic mb-4 truncate text-slate-900">{p.name}</h3>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-orange-600 font-black text-lg">{CURRENCY_SYMBOL}{p.discount_price || p.price}</span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase">Stock: {p.stock}</span>
                  </div>
                  <button onClick={() => startEditProduct(p)} className="bg-slate-50 hover:bg-slate-900 hover:text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
           <div className="max-w-md">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 mb-10">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 block">New Department Name</label>
                 <input type="text" placeholder="e.g. Smart Electronics" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full bg-slate-50 border-none p-5 rounded-2xl mb-6 font-bold text-sm focus:ring-2 focus:ring-orange-500" />
                 <button onClick={async () => { if(!newCatName) return; await supabase.from('categories').insert({ name: newCatName, slug: newCatName.toLowerCase().replace(/\s+/g, '-') }); loadData(); setNewCatName(''); }} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl">Add Department</button>
              </div>
              <div className="space-y-4">
                 {categories.map(c => (
                   <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-50 flex justify-between items-center group hover:bg-slate-50 transition-all">
                      <span className="font-black uppercase text-xs italic text-slate-600">{c.name}</span> 
                      <button onClick={async () => { if(!window.confirm("Delete category?")) return; await supabase.from('categories').delete().eq('id', c.id); loadData(); }} className="text-red-300 hover:text-red-500 transition-colors p-2 font-black uppercase text-[10px]">Delete</button>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
           <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
             <div className="overflow-x-auto">
               <table className="w-full text-left min-w-[1000px]">
                 <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <th className="px-8 py-6 italic">Order Ref</th>
                       <th className="px-8 py-6 italic">Customer</th>
                       <th className="px-8 py-6 italic">Revenue</th>
                       <th className="px-8 py-6 italic">Progress</th>
                       <th className="px-8 py-6 italic text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-8 font-mono text-[10px] text-slate-400">#{order.id.slice(0,8)}</td>
                        <td className="px-8 py-8">
                          <p className="font-black text-slate-900 uppercase text-xs italic tracking-tighter">{(order as any).profiles?.full_name || 'Guest User'}</p>
                          <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-widest">{order.payment_method}</p>
                        </td>
                        <td className="px-8 py-8 font-black text-slate-900 text-lg tracking-tighter">{CURRENCY_SYMBOL}{order.total_amount}</td>
                        <td className="px-8 py-8">
                           <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                        </td>
                        <td className="px-8 py-8 text-right">
                           <button onClick={() => supabase.from('orders').delete().eq('id', order.id).then(() => loadData())} className="text-red-400 hover:text-red-600 p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {/* PRODUCT SETUP MODAL - Enhanced with requested fields */}
        {modalMode !== 'none' && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl rounded-[3.5rem] p-10 lg:p-14 overflow-y-auto max-h-[95vh] shadow-2xl animate-fadeIn">
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">{modalMode === 'edit' ? 'Enhance Product' : 'Launch New Product'}</h2>
                <button onClick={() => setModalMode('none')} className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-full hover:bg-red-50 hover:text-red-500 transition-all font-black text-2xl">×</button>
              </div>

              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block ml-1">Product Identity / Title</label>
                    <input required className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-sm italic focus:ring-2 focus:ring-orange-500 uppercase tracking-tighter" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} placeholder="e.g. ULTRA SLIM SMARTPHONE" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block ml-1">Price (৳)</label>
                       <input required type="number" className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-sm focus:ring-2 focus:ring-orange-500" value={formState.price} onChange={e => setFormState({...formState, price: e.target.value})} placeholder="Regular Price" />
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block ml-1">Sale Price (Optional)</label>
                       <input type="number" className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-sm focus:ring-2 focus:ring-orange-500" value={formState.discount_price} onChange={e => setFormState({...formState, discount_price: e.target.value})} placeholder="Flash Sale Price" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block ml-1">Star Rating (1.0 - 5.0)</label>
                       <input type="number" step="0.1" max="5" min="1" className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-sm focus:ring-2 focus:ring-orange-500" value={formState.rating} onChange={e => setFormState({...formState, rating: e.target.value})} />
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block ml-1">Review Count (Shown to users)</label>
                       <input type="number" className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-sm focus:ring-2 focus:ring-orange-500" value={formState.review_count} onChange={e => setFormState({...formState, review_count: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block ml-1">Warehouse Stock</label>
                      <input required type="number" className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-sm focus:ring-2 focus:ring-orange-500" value={formState.stock} onChange={e => setFormState({...formState, stock: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block ml-1">Department</label>
                      <select required className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-sm focus:ring-2 focus:ring-orange-500 uppercase italic" value={formState.category_id} onChange={e => setFormState({...formState, category_id: e.target.value})}>
                        <option value="">Select Dept</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-6 p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl shadow-slate-200">
                    <label className="flex items-center gap-3 cursor-pointer group flex-1">
                      <input type="checkbox" className="w-5 h-5 rounded-lg border-none text-orange-600 focus:ring-0 cursor-pointer" checked={formState.is_featured} onChange={e => setFormState({...formState, is_featured: e.target.checked})} />
                      <span className="text-[11px] font-black uppercase tracking-widest group-hover:text-orange-500 transition-colors">Hot Feature</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group flex-1">
                      <input type="checkbox" className="w-5 h-5 rounded-lg border-none text-red-600 focus:ring-0 cursor-pointer" checked={formState.is_flash_sale} onChange={e => setFormState({...formState, is_flash_sale: e.target.checked})} />
                      <span className="text-[11px] font-black uppercase tracking-widest group-hover:text-red-500 transition-colors">Flash Sale</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block ml-1">Primary Asset Image URL</label>
                    <input required type="url" placeholder="Direct link to image (Unsplash, Pinterest, etc.)" className="w-full bg-slate-50 border-none p-5 rounded-2xl font-bold text-xs focus:ring-2 focus:ring-orange-500" value={formState.image_url} onChange={e => setFormState({...formState, image_url: e.target.value})} />
                    {formState.image_url && (
                      <div className="mt-4 aspect-video rounded-2xl overflow-hidden border-2 border-slate-50 shadow-inner">
                        <img src={formState.image_url} className="w-full h-full object-cover" alt="Preview" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block ml-1">Comprehensive Product Description</label>
                    <textarea 
                      rows={10} 
                      className="w-full bg-slate-50 border-none p-6 rounded-[2rem] font-medium text-sm focus:ring-2 focus:ring-orange-500 leading-relaxed scrollbar-hide" 
                      placeholder="Describe features, specifications, and warranty information in detail..." 
                      value={formState.description} 
                      onChange={e => setFormState({...formState, description: e.target.value})} 
                    />
                  </div>
                  <button type="submit" className="w-full bg-orange-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-900 transition-all hover:scale-[1.01] active:scale-95 shadow-orange-900/30">
                     {modalMode === 'edit' ? 'UPDATE GLOBAL DATABASE' : 'LAUNCH TO LIVE MARKET'}
                  </button>
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
