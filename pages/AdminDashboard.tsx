
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
    if (!formState.image_url) return alert("Please provide a valid image URL.");

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

  const startEditProduct = (p: Product) => {
    setEditingProduct(p);
    setFormState({
      name: p.name,
      price: p.price.toString(),
      discount_price: p.discount_price?.toString() || '',
      stock: p.stock.toString(),
      category_id: p.category_id,
      description: p.description,
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
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Accessing Command Center...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <aside className="w-full lg:w-72 bg-slate-900 text-white flex flex-col p-8 lg:sticky lg:top-0 lg:h-screen shadow-2xl z-20">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center font-black italic shadow-lg shadow-orange-900/50">NB</div>
          <span className="font-black text-xl tracking-tighter uppercase">Next<span className="text-orange-500">Admin</span></span>
        </div>
        <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
          {['overview', 'orders', 'products', 'categories'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-shrink-0 text-left px-6 py-4 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${activeTab === tab ? 'bg-orange-600 text-white shadow-xl translate-x-1' : 'text-slate-500 hover:bg-slate-800'}`}
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
                setFormState({ name: '', price: '', discount_price: '', stock: '', category_id: '', description: '', image_url: '', is_featured: false, is_flash_sale: false, rating: '5', review_count: '0' }); 
                setModalMode('add'); 
                setEditingProduct(null); 
              }}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition shadow-xl active:scale-95"
            >
              + Launch Product
            </button>
          )}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Total Revenue</p>
                <p className="text-5xl font-black text-slate-900 tracking-tighter italic">{CURRENCY_SYMBOL}{totalRevenue.toLocaleString()}</p>
             </div>
             <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Gross Orders</p>
                <p className="text-5xl font-black text-slate-900 tracking-tighter italic">{orders.length}</p>
             </div>
             <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Active Assets</p>
                <p className="text-5xl font-black text-slate-900 tracking-tighter italic">{products.length}</p>
             </div>
          </div>
        )}

        {/* Orders Table remains similar, using existing professional styles */}
        {activeTab === 'orders' && (
           <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1200px]">
                {/* ... existing table header ... */}
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-6">Reference</th>
                    <th className="px-6 py-6">Customer</th>
                    <th className="px-6 py-6">Payment</th>
                    <th className="px-6 py-6">Status</th>
                    <th className="px-6 py-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map(order => {
                    const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-8">
                          <span className="font-mono text-[10px] text-slate-400 uppercase tracking-tighter">#{order.id.slice(0,8)}</span>
                        </td>
                        <td className="px-6 py-8 text-xs font-black uppercase italic tracking-tighter">{profile?.full_name || 'Guest'}</td>
                        <td className="px-6 py-8 font-black text-slate-900 tracking-tighter">{CURRENCY_SYMBOL}{order.total_amount}</td>
                        <td className="px-6 py-8">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                        </td>
                        <td className="px-6 py-8 text-right">
                          <button onClick={() => supabase.from('orders').delete().eq('id', order.id).then(() => loadData())} className="text-red-500 hover:scale-110 transition p-2">Delete</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
           </div>
        )}

        {/* Product Grid with Edit options */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm group relative">
                <div className="aspect-video relative overflow-hidden">
                  <img src={p.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                    <button onClick={() => startEditProduct(p)} className="px-5 py-2.5 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 hover:text-white transition">Edit</button>
                    <button onClick={() => supabase.from('products').delete().eq('id', p.id).then(() => loadData())} className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition">Delete</button>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-slate-900 uppercase tracking-tighter truncate italic text-lg">{p.name}</h3>
                    {p.is_featured && <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Hot</span>}
                  </div>
                  <div className="flex justify-between items-center mt-6">
                    <span className="text-orange-600 font-black text-xl">{CURRENCY_SYMBOL}{p.discount_price || p.price}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-3 py-1 rounded-full">Qty: {p.stock}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product Modal with New Fields */}
        {modalMode !== 'none' && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-4xl rounded-[2.5rem] p-8 lg:p-12 shadow-2xl animate-fadeIn my-auto">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">{modalMode === 'edit' ? 'Enhance' : 'Launch New'} Product</h2>
                <button onClick={() => setModalMode('none')} className="text-slate-400 hover:text-slate-900 text-4xl font-black transition">×</button>
              </div>

              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Title</label>
                      <input required className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Base Price (BDT)</label>
                        <input required type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold" value={formState.price} onChange={e => setFormState({...formState, price: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Sale Price (Optional)</label>
                        <input type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold" value={formState.discount_price} onChange={e => setFormState({...formState, discount_price: e.target.value})} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Rating (1-5)</label>
                        <input type="number" step="0.1" min="1" max="5" className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold" value={formState.rating} onChange={e => setFormState({...formState, rating: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Review Count</label>
                        <input type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold" value={formState.review_count} onChange={e => setFormState({...formState, review_count: e.target.value})} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Stock Quantity</label>
                      <input required type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold" value={formState.stock} onChange={e => setFormState({...formState, stock: e.target.value})} />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                      <select required className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold" value={formState.category_id} onChange={e => setFormState({...formState, category_id: e.target.value})}>
                        <option value="">Select Department</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="flex gap-4 p-4 bg-slate-900 rounded-2xl">
                      <label className="flex items-center gap-2 cursor-pointer flex-1 text-white">
                        <input type="checkbox" className="rounded-lg text-orange-600 focus:ring-0" checked={formState.is_featured} onChange={e => setFormState({...formState, is_featured: e.target.checked})} />
                        <span className="text-[10px] font-black uppercase">Feature in Slide</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer flex-1 text-white">
                        <input type="checkbox" className="rounded-lg text-red-600 focus:ring-0" checked={formState.is_flash_sale} onChange={e => setFormState({...formState, is_flash_sale: e.target.checked})} />
                        <span className="text-[10px] font-black uppercase">Flash Sale</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Image URL</label>
                      <input required type="url" className="w-full bg-slate-50 border-none rounded-xl p-4 text-[10px] font-bold" value={formState.image_url} onChange={e => setFormState({...formState, image_url: e.target.value})} />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Detailed Description</label>
                      <textarea 
                        required 
                        rows={10} 
                        className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-orange-500" 
                        placeholder="Explain product features, materials, and benefits..."
                        value={formState.description} 
                        onChange={e => setFormState({...formState, description: e.target.value})} 
                      />
                    </div>

                    <button type="submit" className="w-full bg-orange-600 text-white py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-900 transition-all active:scale-95 mt-4">
                       {modalMode === 'edit' ? 'Update Database' : 'Publish to Store'}
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
