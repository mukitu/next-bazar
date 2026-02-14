import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserOrders, updateProfile } from '../lib/supabase';
import { Order } from '../types';
import { CURRENCY_SYMBOL, STATUS_COLORS, STATUS_STEPS } from '../constants';

const UserDashboard: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    address: ''
  });
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserOrders(user.id).then(data => {
        setOrders(data || []);
        setLoading(false);
      }).catch(err => {
        console.error("Orders Load Error:", err);
        setLoading(false);
      });
      
      setProfileForm({
        full_name: user.full_name || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdating(true);
    setMessage(null);
    try {
      await updateProfile(user.id, profileForm);
      await refreshProfile(user.id);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update credentials.' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center animate-pulse">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Loading Account...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-20 animate-fadeIn pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter italic">My <span className="text-orange-500">Dashboard</span></h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 ml-1">Account Management</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex-1 md:flex-none px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            My Orders ({orders.length})
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex-1 md:flex-none px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Edit Profile
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        <div className="space-y-8">
          {orders.length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-100">
               <p className="text-slate-300 font-black uppercase tracking-widest text-xs">No orders found.</p>
            </div>
          ) : (
            orders.map(order => {
              const currentStep = STATUS_STEPS[order.status] || 0;
              const isExpanded = expandedOrder === order.id;

              return (
                <div key={order.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-xl">
                  <div className="p-8 md:p-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-300 text-[10px]">#{String(order.id).slice(0,4)}</div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Order ID</p>
                          <p className="font-mono text-xs font-bold text-slate-900 uppercase">{String(order.id).slice(0,12)}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 w-full md:w-auto">
                        <span className={`flex-1 md:flex-none text-center px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${STATUS_COLORS[order.status]}`}>
                          {String(order.status)}
                        </span>
                        <button 
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          className="flex-1 md:flex-none bg-slate-900 text-white px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition"
                        >
                          {isExpanded ? 'Hide' : 'Details'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-slate-50">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                        <p className="text-[10px] font-bold text-slate-800">{new Date(order.created_at).toLocaleDateString('en-GB')}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment</p>
                        <p className="text-[10px] font-bold text-slate-800">{String(order.payment_method)}</p>
                      </div>
                      <div className="col-span-2 text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                        <p className="text-2xl font-black text-slate-900 italic">{CURRENCY_SYMBOL}{order.total_amount}</p>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-10 pt-10 border-t border-slate-50 animate-fadeIn space-y-6">
                        <div className="bg-slate-50 p-6 rounded-3xl">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Address</p>
                           <p className="text-xs font-bold text-slate-700 leading-relaxed italic">{String(order.shipping_address)}</p>
                        </div>
                        <div className="space-y-3">
                          {order.order_items?.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-50">
                              <img src={item.product?.images?.[0]} className="w-12 h-12 object-cover rounded-xl shadow-sm" alt="" />
                              <div className="flex-1">
                                <p className="text-[10px] font-black text-slate-900 truncate">{String(item.product?.name)}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{item.quantity} x {CURRENCY_SYMBOL}{item.price_at_time}</p>
                              </div>
                              <p className="text-xs font-black text-slate-900">{CURRENCY_SYMBOL}{item.quantity * item.price_at_time}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto animate-fadeIn">
          {message && (
            <div className={`mb-8 p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 ${message.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
              {message.text}
            </div>
          )}

          <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-xl border border-slate-100">
            <form onSubmit={handleProfileUpdate} className="space-y-8">
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Profile <span className="text-orange-500">Settings</span></h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={profileForm.full_name}
                    onChange={e => setProfileForm({...profileForm, full_name: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-5 text-sm font-bold focus:border-orange-500/30 outline-none" 
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    value={profileForm.phone}
                    onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-5 text-sm font-bold focus:border-orange-500/30 outline-none" 
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Default Address</label>
                  <textarea 
                    rows={4}
                    required
                    value={profileForm.address}
                    onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-5 text-sm font-bold focus:border-orange-500/30 outline-none resize-none" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={updating}
                className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-orange-600 transition-all disabled:opacity-50"
              >
                {updating ? 'SAVING...' : 'UPDATE PROFILE'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
