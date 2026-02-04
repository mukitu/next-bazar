
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
      console.error("Admin Load Error:", e); 
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

    let res;
    if (modalMode === 'edit' && editingProduct) {
      res = await supabase.from('products').update(payload).eq('id', editingProduct.id);
    } else {
      res = await supabase.from('products').insert(payload);
    }

    if (res.error) alert(res.error.message);
    else { setModalMode('none'); loadData(); }
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
    if (!window.confirm("Permanent Delete Category?")) return;
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
    if (!window.confirm("Delete Order Record?")) return;
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
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Admin Interface Loading...</p>
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
              onClick={() => { setFormState({ name: '', price: '', stock: '', category_id: '', description: '', image_url: '', is_featured: false, is_flash_sale: false }); setModalMode('add'); setEditingProduct(null); }}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition shadow-xl"
            >
              + Create Product
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
              <table className="w-full text-left min-w-[1200px]">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-6">Reference</th>
                    <th className="px-6 py-6">Customer & Contact</th>
                    <th className="px-6 py-6">Shipping Address</th>
                    <th className="px-6 py-6">Payment Details</th>
                    <th className="px-6 py-6">Total Bill</th>
                    <th className="px-6 py-6">Status</th>
                    <th className="px-6 py-6 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {orders.map(order => {
                    const addressParts = order.shipping_address.split(', Phone: ');
                    const mainAddress = addressParts[0];
                    const phoneNumber = addressParts[1] || 'Not Provided';
                    
                    // Safely handle profiles (could be object or array depending on join behavior)
                    const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-8">
                          <span className="font-mono text-[10px] text-slate-400 uppercase tracking-tighter">#{order.id.slice(0,8)}</span>
                          <p className="text-[9px] text-slate-300 font-bold mt-1 uppercase">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </td>
                        
                        <td className="px-6 py-8">
                          <div className="font-black text-slate-900 uppercase text-xs italic tracking-tighter">
                            {profile?.full_name || 'Guest User'}
                          </div>
                          <div className="flex items-center gap-1.5 mt-2">
                             <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                             <span className="text-[11px] font-black text-blue-600 tracking-tight">{phoneNumber}</span>
                          </div>
                          <div className="text-[9px] text-slate-400 font-medium lowercase mt-1">{profile?.email}</div>
                        </td>

                        <td className="px-6 py-8 max-w-[250px]">
                           <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination: {order.shipping_region}</p>
                             <p className="text-xs font-bold text-slate-600 leading-relaxed italic">{mainAddress}</p>
                           </div>
                        </td>

                        <td className="px-6 py-8">
                          <div className="flex flex-col gap-2">
                            <span className={`w-max px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${order.payment_method === 'BKASH' ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {order.payment_method}
                            </span>
                            {order.payment_method === 'BKASH' && order.bkash_tx_id && (
                              <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg">
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Transaction ID</p>
                                <p className="text-[10px] font-mono font-bold tracking-tighter">{order.bkash_tx_id}</p>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-8">
                          <div className="font-black text-slate-900 text-lg tracking-tighter">
                            {CURRENCY_SYMBOL}{order.total_amount}
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                            incl. ৳{order.shipping_charge} ship
                          </p>
                        </td>

                        <td className="px-6 py-8">
                          <select 
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className={`bg-white border rounded-xl p-2.5 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-orange-500 shadow-sm ${STATUS_COLORS[order.status]}`}
                            value={order.status}
                          >
                            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>

                        <td className="px-6 py-8 text-right">
                          <button onClick={() => deleteOrder(order.id)} className="text-slate-300 hover:text-red-500 transition-colors p-3 hover:bg-red-50 rounded-xl">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm group relative">
                <div className="aspect-video relative overflow-hidden">
                  <img src={p.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                    <button onClick={() => startEditProduct(p)} className="px-5 py-2.5 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 hover:text-white transition">Edit</button>
                    <button onClick={() => deleteProduct(p.id)} className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition">Delete</button>
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

        {activeTab === 'categories' && (
          <div className="max-w-xl">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm mb-10">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Add New Category</label>
                <div className="flex gap-4">
                   <input 
                      type="text" 
                      value={newCatName} 
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="e.g. Health & Beauty"
                      className="flex-1 bg-slate-50 border-none rounded-xl p-4 font-bold text-sm focus:ring-2 focus:ring-orange-500"
                   />
                   <button onClick={addCategory} className="bg-slate-900 text-white px-8 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition">Add</button>
                </div>
             </div>
             <div className="space-y-4">
                {categories.map(c => (
                  <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-50 flex justify-between items-center group shadow-sm">
                    <span className="font-black text-slate-900 uppercase tracking-tighter italic">{c.name}</span>
                    <button onClick={() => deleteCategory(c.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {modalMode !== 'none' && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 lg:p-12 shadow-2xl animate-fadeIn my-auto">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">{modalMode === 'edit' ? 'Update' : 'New'} Product</h2>
                <button onClick={() => setModalMode('none')} className="text-slate-400 hover:text-slate-900 text-4xl font-black transition">×</button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Direct Image Link</label>
                    <div className="aspect-video bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center mb-4">
                      {formState.image_url ? (
                        <img src={formState.image_url} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <p className="text-[10px] font-black text-slate-300 uppercase">Image Preview Placeholder</p>
                      )}
                    </div>
                    <input 
                      required
                      type="url" 
                      placeholder="Paste Image URL (e.g. Unsplash, Pinterest link)" 
                      className="w-full bg-slate-50 border-none rounded-xl p-4 text-[11px] font-bold focus:ring-2 focus:ring-orange-500"
                      value={formState.image_url} 
                      onChange={e => setFormState({...formState, image_url: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Title</label>
                    <input required className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
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
                      <option value="">Choose Department</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="flex gap-4 p-5 bg-slate-900 rounded-[1.5rem] border border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input type="checkbox" className="rounded-lg bg-slate-800 border-none text-orange-600 focus:ring-0" checked={formState.is_featured} onChange={e => setFormState({...formState, is_featured: e.target.checked})} />
                      <span className="text-[10px] font-black uppercase text-slate-400">Featured</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input type="checkbox" className="rounded-lg bg-slate-800 border-none text-red-600 focus:ring-0" checked={formState.is_flash_sale} onChange={e => setFormState({...formState, is_flash_sale: e.target.checked})} />
                      <span className="text-[10px] font-black uppercase text-slate-400">Flash Sale</span>
                    </label>
                  </div>

                <button type="submit" className="w-full bg-orange-600 text-white py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-900 transition-all hover:scale-[1.01] active:scale-95">
                   {modalMode === 'edit' ? 'Update Database' : 'Publish Product'}
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
