
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
    stock: '',
    category_id: '',
    description: '',
    image_url: '',
    is_featured: false,
    is_flash_sale: false
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [ords, prods, cats] = await Promise.all([
        supabase.from('orders').select('*, profiles(email, full_name)').order('created_at', { ascending: false }),
        fetchProducts(),
        fetchCategories()
      ]);
      setOrders(ords.data || []);
      setProducts(prods);
      setCategories(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Authenticating Admin...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col p-6 space-y-8 md:sticky md:top-0 md:h-screen shadow-2xl z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center font-black text-white shadow-lg">N</div>
          <div className="flex flex-col -space-y-1">
            <span className="font-black text-lg tracking-tighter uppercase">Next<span className="text-orange-500">Admin</span></span>
            <span className="text-[8px] font-bold text-slate-500 tracking-[0.2em]">CONTROL PANEL</span>
          </div>
        </div>
        <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
          {['overview', 'orders', 'products', 'categories'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-shrink-0 text-left px-5 py-4 rounded-2xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === tab ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/30' : 'text-slate-500 hover:bg-slate-800'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{activeTab}</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time shop management</p>
          </div>
          {activeTab === 'products' && (
            <button 
              onClick={() => { setFormState({ name: '', price: '', stock: '', category_id: '', description: '', image_url: '', is_featured: false, is_flash_sale: false }); setModalMode('add'); }}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-orange-600 transition shadow-2xl hover:scale-105 active:scale-95 uppercase tracking-widest"
            >
              + ADD NEW PRODUCT
            </button>
          )}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6 border-b pb-4">Total Orders</div>
              <div className="text-6xl font-black text-slate-900 tracking-tighter">{orders.length}</div>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6 border-b pb-4">Active Inventory</div>
              <div className="text-6xl font-black text-blue-600 tracking-tighter">{products.length}</div>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6 border-b pb-4">Store Revenue</div>
              <div className="text-6xl font-black text-green-600 tracking-tighter">{CURRENCY_SYMBOL}{orders.reduce((acc, o) => acc + (o.status !== 'Cancelled' ? Number(o.total_amount) : 0), 0).toLocaleString()}</div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-8 py-6">Reference</th>
                    <th className="px-8 py-6">Customer & Shipping</th>
                    <th className="px-8 py-6">Transaction</th>
                    <th className="px-8 py-6">Value</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-8 py-6 font-mono text-[10px] text-slate-400">#{order.id.slice(0,8)}</td>
                      <td className="px-8 py-6">
                        <div className="font-black text-slate-800 uppercase text-xs mb-1">{order.profiles?.full_name || 'Anonymous User'}</div>
                        <div className="text-[10px] text-slate-400 max-w-xs truncate uppercase font-bold tracking-tight">{order.shipping_address}</div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-tighter ${order.payment_method === 'BKASH' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                          {order.payment_method}
                        </span>
                        {order.bkash_tx_id && <div className="text-[9px] text-slate-400 mt-1 font-mono">{order.bkash_tx_id}</div>}
                      </td>
                      <td className="px-8 py-6 font-black text-slate-900">{CURRENCY_SYMBOL}{order.total_amount}</td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black border uppercase tracking-widest ${STATUS_COLORS[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <select 
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="bg-slate-100 rounded-xl p-3 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-orange-500 border-none transition-all cursor-pointer"
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

        {activeTab === 'products' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col group hover:shadow-2xl transition-all duration-500">
                <div className="aspect-square rounded-[2rem] overflow-hidden mb-6 relative shadow-inner">
                  <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {p.is_featured && <span className="bg-blue-600 text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase shadow-lg">Featured</span>}
                    {p.is_flash_sale && <span className="bg-red-600 text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase shadow-lg">Flash</span>}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-sm text-slate-900 truncate uppercase tracking-tighter mb-2">{p.name}</h4>
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                    <span className="text-orange-600 font-black text-sm">{CURRENCY_SYMBOL}{p.price}</span>
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full ${p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>QTY: {p.stock}</span>
                  </div>
                </div>
                <div className="flex gap-3 mt-6 pt-6 border-t border-slate-50">
                  <button onClick={() => openEditModal(p)} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition shadow-lg">EDIT</button>
                  <button onClick={() => deleteProduct(p.id)} className="p-4 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {modalMode !== 'none' && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 md:p-14 shadow-2xl animate-fadeIn overflow-y-auto max-h-[90vh] scrollbar-hide">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">{modalMode === 'edit' ? 'Update Details' : 'New Collection'}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Store Inventory Synchronization</p>
                </div>
                <button onClick={() => setModalMode('none')} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <form onSubmit={handleSaveProduct} className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Product Title</label>
                  <input required placeholder="E.g. Premium Leather Bag" className="w-full bg-slate-50 border-none rounded-[1.5rem] p-5 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 transition" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Price (BDT)</label>
                    <input required type="number" placeholder="0.00" className="w-full bg-slate-50 border-none rounded-[1.5rem] p-5 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 transition" value={formState.price} onChange={e => setFormState({...formState, price: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Available Stock</label>
                    <input required type="number" placeholder="0" className="w-full bg-slate-50 border-none rounded-[1.5rem] p-5 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 transition" value={formState.stock} onChange={e => setFormState({...formState, stock: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Category Assignment</label>
                    <select required className="w-full bg-slate-50 border-none rounded-[1.5rem] p-5 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 transition appearance-none cursor-pointer" value={formState.category_id} onChange={e => setFormState({...formState, category_id: e.target.value})}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Direct Image URL</label>
                    <input required placeholder="https://..." className="w-full bg-slate-50 border-none rounded-[1.5rem] p-5 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 transition" value={formState.image_url} onChange={e => setFormState({...formState, image_url: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-8 bg-slate-50 p-6 rounded-[2rem]">
                   <label className="flex items-center gap-4 cursor-pointer group">
                      <input type="checkbox" className="w-6 h-6 rounded-xl border-none bg-white text-orange-600 focus:ring-0 shadow-sm" checked={formState.is_featured} onChange={e => setFormState({...formState, is_featured: e.target.checked})} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition">Featured Item</span>
                   </label>
                   <label className="flex items-center gap-4 cursor-pointer group">
                      <input type="checkbox" className="w-6 h-6 rounded-xl border-none bg-white text-red-600 focus:ring-0 shadow-sm" checked={formState.is_flash_sale} onChange={e => setFormState({...formState, is_flash_sale: e.target.checked})} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition">Flash Sale Active</span>
                   </label>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Detailed Description</label>
                  <textarea placeholder="Write product specifications..." className="w-full bg-slate-50 border-none rounded-[2rem] p-6 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 transition h-40 scrollbar-hide" value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-orange-600 text-white rounded-[2rem] py-6 font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-orange-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  {modalMode === 'edit' ? 'Commit Updates' : 'Publish Product'}
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
