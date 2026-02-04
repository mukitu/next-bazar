
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

  // Form State
  const [formState, setFormState] = useState({
    name: '',
    price: '',
    stock: '',
    category_id: '',
    description: '',
    image_url: '',
    is_featured: false,
    is_flash_sale: false
  });

  const loadData = async () => {
    setLoading(true);
    const [ords, prods, cats] = await Promise.all([
      supabase.from('orders').select('*, profiles(email, full_name)').order('created_at', { ascending: false }),
      fetchProducts(),
      fetchCategories()
    ]);
    setOrders(ords.data || []);
    setProducts(prods);
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormState({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category_id: product.category_id,
      description: product.description,
      image_url: product.images[0] || '',
      is_featured: product.is_featured,
      is_flash_sale: product.is_flash_sale
    });
    setModalMode('edit');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formState.name,
      slug: formState.name.toLowerCase().replace(/ /g, '-'),
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
    else {
      setModalMode('none');
      loadData();
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Permanent Delete?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) alert(error.message);
    else loadData();
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) alert(error.message);
    else loadData();
  };

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-slate-300">AUTHORIZING ADMIN ACCESS...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col p-6 space-y-8 md:sticky md:top-0 md:h-screen shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-black text-white">N</div>
          <span className="font-black text-xl tracking-tighter">NEXT<span className="text-orange-500">ADMIN</span></span>
        </div>
        <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {['overview', 'orders', 'products', 'categories'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-shrink-0 text-left px-4 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${activeTab === tab ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{activeTab} Control Center</h1>
          {activeTab === 'products' && (
            <button 
              onClick={() => { setFormState({ name: '', price: '', stock: '', category_id: '', description: '', image_url: '', is_featured: false, is_flash_sale: false }); setModalMode('add'); }}
              className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-slate-800 transition shadow-xl"
            >
              + NEW PRODUCT
            </button>
          )}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-orange-200 transition">
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Total Orders</div>
              <div className="text-5xl font-black text-slate-900">{orders.length}</div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-blue-200 transition">
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Live Inventory</div>
              <div className="text-5xl font-black text-blue-600">{products.length} <span className="text-xs text-slate-300">Items</span></div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-green-200 transition">
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Total Revenue</div>
              <div className="text-5xl font-black text-green-600">{CURRENCY_SYMBOL}{orders.reduce((acc, o) => acc + (o.status !== 'Cancelled' ? Number(o.total_amount) : 0), 0).toLocaleString()}</div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl shadow-sm border overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-6 py-4">ID/Customer</th>
                  <th className="px-6 py-4">Contact/Address</th>
                  <th className="px-6 py-4">Payment Info</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition group">
                    <td className="px-6 py-5">
                      <div className="font-mono text-[10px] text-slate-400">#{order.id.slice(0,8)}</div>
                      <div className="font-black text-slate-800 uppercase mt-1">{order.profiles?.full_name || 'Guest'}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs text-slate-500 max-w-xs truncate">{order.shipping_address}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 rounded-lg font-black text-[9px] uppercase tracking-tighter ${order.payment_method === 'BKASH' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                        {order.payment_method}
                      </span>
                      {order.bkash_tx_id && <div className="text-[9px] text-slate-400 mt-1 font-mono">{order.bkash_tx_id}</div>}
                    </td>
                    <td className="px-6 py-5 font-black text-slate-900">{CURRENCY_SYMBOL}{order.total_amount}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <select 
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="bg-slate-100 rounded-xl p-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-orange-500"
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
        )}

        {activeTab === 'products' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-3xl border shadow-sm flex flex-col group hover:border-orange-500 transition-all duration-300">
                <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative">
                  <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {p.is_featured && <span className="bg-blue-500 text-white text-[8px] font-black px-2 py-1 rounded uppercase">Featured</span>}
                    {p.is_flash_sale && <span className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded uppercase">Flash</span>}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-sm text-slate-900 truncate uppercase tracking-tighter">{p.name}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-orange-600 font-black text-sm">{CURRENCY_SYMBOL}{p.price}</span>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${p.stock < 5 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>Stock: {p.stock}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                  <button onClick={() => openEditModal(p)} className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition">EDIT</button>
                  <button onClick={() => deleteProduct(p.id)} className="p-3 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product Modal (Enhanced with Edit Support) */}
        {modalMode !== 'none' && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl animate-fadeIn overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter">{modalMode === 'edit' ? 'Update Product' : 'Create New Product'}</h2>
                <button onClick={() => setModalMode('none')} className="text-slate-300 hover:text-slate-900"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <form onSubmit={handleSaveProduct} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Product Title</label>
                  <input required placeholder="Enter name" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Price (BDT)</label>
                    <input required type="number" placeholder="0.00" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition" value={formState.price} onChange={e => setFormState({...formState, price: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Stock Count</label>
                    <input required type="number" placeholder="0" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition" value={formState.stock} onChange={e => setFormState({...formState, stock: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                    <select required className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition" value={formState.category_id} onChange={e => setFormState({...formState, category_id: e.target.value})}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Primary Image URL</label>
                    <input required placeholder="https://..." className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition" value={formState.image_url} onChange={e => setFormState({...formState, image_url: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-6">
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-5 h-5 rounded-lg border-none bg-slate-100 text-orange-500 focus:ring-0" checked={formState.is_featured} onChange={e => setFormState({...formState, is_featured: e.target.checked})} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition">Featured</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-5 h-5 rounded-lg border-none bg-slate-100 text-red-500 focus:ring-0" checked={formState.is_flash_sale} onChange={e => setFormState({...formState, is_flash_sale: e.target.checked})} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition">Flash Sale</span>
                   </label>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                  <textarea placeholder="Write product details..." className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition h-32" value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-orange-600 text-white rounded-3xl py-5 font-black text-xs uppercase tracking-widest shadow-2xl shadow-orange-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  {modalMode === 'edit' ? 'Update Product Details' : 'Deploy Product to Store'}
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
