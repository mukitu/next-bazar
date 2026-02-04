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
    } catch (e) { 
      console.error("Load error:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.image_url) return alert("Please provide a valid image URL.");

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

    let response;
    if (modalMode === 'edit' && editingProduct) {
      response = await supabase.from('products').update(payload).eq('id', editingProduct.id);
    } else {
      response = await supabase.from('products').insert(payload);
    }

    if (response.error) {
      alert(response.error.message);
    } else {
      setModalMode('none');
      loadData();
    }
  };

  const addCategory = async () => {
    if (!newCatName) return;
    const { error } = await supabase.from('categories').insert({ 
      name: newCatName, 
      slug: newCatName.toLowerCase().replace(/\s+/g, '-') 
    });
    if (error) alert(error.message);
    else { setNewCatName(''); loadData(); }
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm("Delete this category?")) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) alert(error.message);
    else loadData();
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) alert(error.message);
    else loadData();
  };

  const deleteOrder = async (id: string) => {
    if (!window.confirm("Permanent Delete Order? This action cannot be undone.")) return;
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

  const totalRevenue = orders.filter(o => o.status !== 'Cancelled').reduce((acc, o) => acc + o.total_amount, 0);

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
              onClick={() => { 
                setFormState({ name: '', price: '', stock: '', category_id: '', description: '', image_url: '', is_featured: false, is_flash_sale: false }); 
                setModalMode('add'); 
                setEditingProduct(null);
              }}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition shadow-xl"
            >
              + Add Product
            </button>
          )}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Total Revenue</p>
                <p className="text-5xl font-black text-slate-900 tracking-tighter italic">{CURRENCY_SYMBOL}{totalRevenue.toLocaleString()}</p>
             </div>
             <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Gross Orders</p>
                <p className="text-5xl font-black text-slate-900 tracking-tighter italic">{orders.length}</p>
             </div>
             <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Active Assets</p>
                <p className="text-5xl font-black text-slate-900 tracking-tighter italic">{products.length}</p>
             </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-8 py-6">Ref</th>
                    <th className="px-8 py-6">Customer</th>
                    <th className="px-8 py-6">Amount</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6 font-mono text-[10px] text-slate-400">#{order.id.slice(0,8)}</td>
                      <td className="px-8 py-6">
                        <div className="font-black text-slate-900 uppercase text-xs">{order.profiles?.full_name || 'User'}</div>
                        <div className="text-[10px] text-slate-400 max-w-[150px] truncate">{order.shipping_address}</div>
                      </td>
                      <td className="px-8 py-6 font-black text-slate-900">{CURRENCY_SYMBOL}{order.total_amount}</td>
                      <td className="px-8 py-6">
                        <select 
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`bg-white border rounded-xl p-2 text-[10px] font-black uppercase outline-none ${STATUS_COLORS[order.status]}`}
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
              <div key={p.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm group relative">
                <div className="aspect-video relative overflow-hidden">
                  <img src={p.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                    <button onClick={() => startEditProduct(p)} className="px-4 py-2 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 hover:text-white transition">Edit</button>
                    <button onClick={() => deleteProduct(p.id)} className="px-4 py-2 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition">Delete</button>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-black text-slate-900 uppercase tracking-tighter truncate italic">{p.name}</h3>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-orange-600 font-black">{CURRENCY_SYMBOL}{p.price}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase">Stock: {p.stock}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="max-w-xl">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm mb-10">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">New Category</label>
                <div className="flex gap-4">
                   <input 
                      type="text" 
                      value={newCatName} 
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="e.g. Health & Beauty"
                      className="flex-1 bg-slate-50 border-none rounded-xl p-4 font-bold text-sm"
                   />
                   <button onClick={addCategory} className="bg-slate-900 text-white px-8 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition">Add</button>
                </div>
             </div>
             <div className="space-y-4">
                {categories.map(c => (
                  <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-50 flex justify-between items-center group">
                    <span className="font-black text-slate-900 uppercase tracking-tighter italic">{c.name}</span>
                    <button onClick={() => deleteCategory(c.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {modalMode !== 'none' && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 lg:p-12 shadow-2xl animate-fadeIn overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">{modalMode === 'edit' ? 'Update' : 'New'} Product</h2>
                <button onClick={() => setModalMode('none')} className="text-slate-400 hover:text-slate-900 text-2xl font-black">×</button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Image Preview</label>
                    <div className="aspect-video bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center">
                      {formState.image_url ? (
                        <img src={formState.image_url} className="w-full h-full object-cover" />
                      ) : (
                        <p className="text-[9px] font-black text-slate-300 uppercase">Image URL Required</p>
                      )}
                    </div>
                    <input 
                      required
                      type="text" 
                      placeholder="Paste Image URL here (e.g. https://...)" 
                      className="w-full bg-slate-50 border-none rounded-xl p-4 text-[11px] font-bold mt-4 focus:ring-2 focus:ring-orange-500"
                      value={formState.image_url} 
                      onChange={e => setFormState({...formState, image_url: e.target.value})}
                    />
                  </div>

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

                  <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formState.is_featured} onChange={e => setFormState({...formState, is_featured: e.target.checked})} />
                      <span className="text-[10px] font-black uppercase text-slate-500">Featured</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formState.is_flash_sale} onChange={e => setFormState({...formState, is_flash_sale: e.target.checked})} />
                      <span className="text-[10px] font-black uppercase text-slate-500">Flash Sale</span>
                    </label>
                  </div>

                  <textarea placeholder="Description..." className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold h-24" value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} />
                </div>

                <button type="submit" className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all">
                   {modalMode === 'edit' ? 'Update Product' : 'Publish Product'}
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
