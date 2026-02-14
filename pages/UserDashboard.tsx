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
      const loadOrders = async () => {
        try {
          const data = await fetchUserOrders(user.id);
          setOrders(data || []);
        } catch (err) {
          console.error("Orders Load Error:", err);
        } finally {
          setLoading(false);
        }
      };
      
      loadOrders();
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
      setMessage({ type: 'success', text: 'Profile successfully updated!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Could not update profile.' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center animate-pulse">
        <div className="w-16 h-1 bg-orange-500 rounded-full mb-4 mx-auto overflow-hidden">
          <div className="h-full bg-slate-900 w-1/2 animate-[shimmer_1.5s_infinite]"></div>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Syncing Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 animate-fadeIn pb-32">
      {/* Top Banner / Hero */}
      <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 mb-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10">
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] mb-4">Account Overview</p>
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-8 leading-none">
            Welcome, <span className="text-orange-500">{user?.full_name?.split(' ')[0] || 'User'}</span>
          </h1>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-white/5">
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Orders</p>
              <p className="text-2xl font-black italic">{orders.length}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Membership</p>
              <p className="text-2xl font-black italic text-orange-500">PLATINUM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-64 space-y-2 sticky top-28">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
          >
            Order History
            <span className={`w-5 h-5 rounded-full text-[8px] flex items-center justify-center ${activeTab === 'orders' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{orders.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
          >
            Profile Sync
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 w-full">
          {activeTab === 'orders' ? (
            <div className="space-y-6">
              {orders.length === 0 ? (
                <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-100 shadow-inner">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                   </div>
                   <p className="text-slate-300 font-black uppercase tracking-widest text-xs italic">No orders found in your timeline.</p>
                </div>
              ) : (
                orders.map((order, idx) => {
                  const currentStep = STATUS_STEPS[order.status] || 0;
                  const isExpanded = expandedOrder === order.id;

                  return (
                    <div key={order.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-xl hover:border-orange-500/20">
                      <div className="p-8 md:p-10">
                        {/* Header: Order ID & Status */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-900 text-[10px] border border-slate-100 shadow-inner italic">#{idx + 1}</div>
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Transaction Ref</p>
                              <p className="font-mono text-xs font-bold text-slate-900 uppercase tracking-tight">{String(order.id).slice(0, 14)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 w-full md:w-auto">
                            <span className={`flex-1 md:flex-none text-center px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                              {order.status}
                            </span>
                            <button 
                              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                              className={`flex-1 md:flex-none px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${isExpanded ? 'bg-orange-600 text-white' : 'bg-slate-900 text-white hover:bg-orange-500'}`}
                            >
                              {isExpanded ? 'CLOSE' : 'DETAILS'}
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar (Daraz/Amazon Style) */}
                        {order.status !== 'Cancelled' && (
                          <div className="relative mb-10 px-2 mt-12">
                            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -translate-y-1/2"></div>
                            <div 
                              className="absolute top-1/2 left-0 h-[2px] bg-orange-500 -translate-y-1/2 transition-all duration-1000"
                              style={{ width: `${Math.max(0, ((currentStep - 1) / 5) * 100)}%` }}
                            ></div>
                            <div className="relative flex justify-between">
                              {[1, 2, 3, 4, 5, 6].map((step) => (
                                <div key={step} className={`w-4 h-4 rounded-full border-2 transition-all duration-500 z-10 ${step <= currentStep ? 'bg-orange-500 border-orange-500 scale-110' : 'bg-white border-slate-200'}`}></div>
                              ))}
                            </div>
                            <div className="flex justify-between mt-4">
                              <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Placed</span>
                              <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Approved</span>
                              <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Arrival</span>
                            </div>
                          </div>
                        )}

                        {/* Order Meta Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-slate-50">
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Entry Date</p>
                            <p className="text-[10px] font-bold text-slate-800 uppercase italic">{new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Pay Gateway</p>
                            <p className="text-[10px] font-bold text-slate-800 uppercase italic">{order.payment_method}</p>
                          </div>
                          <div className="col-span-2 text-right">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Asset Value</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter italic">{CURRENCY_SYMBOL}{order.total_amount}</p>
                          </div>
                        </div>

                        {/* Expanded Items List */}
                        {isExpanded && (
                          <div className="mt-10 pt-10 border-t border-slate-100 animate-fadeIn space-y-6">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Delivery Target</p>
                               <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase italic">{String(order.shipping_address)}</p>
                            </div>
                            <div className="space-y-4">
                              {order.order_items?.map((item: any) => (
                                <div key={item.id} className="flex items-center gap-5 bg-white p-5 rounded-2xl border border-slate-100 group hover:border-orange-500/20 transition-all">
                                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-50 shadow-sm flex-shrink-0">
                                    <img src={item.product?.images?.[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-tighter truncate">{item.product?.name}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Qty: {item.quantity} × {CURRENCY_SYMBOL}{item.price_at_time}</p>
                                  </div>
                                  <p className="text-sm font-black text-slate-900 italic">{CURRENCY_SYMBOL}{item.quantity * item.price_at_time}</p>
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
            <div className="animate-fadeIn">
              <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-xl border border-slate-100">
                <form onSubmit={handleProfileUpdate} className="space-y-10">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Identity <span className="text-orange-500">Sync</span></h3>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Global delivery parameters</p>
                  </div>
                  
                  {message && (
                    <div className={`p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 animate-fadeIn ${message.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                      {message.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="group">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1 group-focus-within:text-orange-500 transition-colors">Legal Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={profileForm.full_name}
                        onChange={e => setProfileForm({...profileForm, full_name: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-6 text-sm font-black focus:ring-0 focus:border-orange-500/30 focus:bg-white transition-all uppercase italic outline-none" 
                      />
                    </div>

                    <div className="group">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1 group-focus-within:text-orange-500 transition-colors">Hotline Contact</label>
                      <input 
                        type="tel" 
                        required
                        value={profileForm.phone}
                        onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-6 text-sm font-black focus:ring-0 focus:border-orange-500/30 focus:bg-white transition-all outline-none" 
                      />
                    </div>

                    <div className="group md:col-span-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1 group-focus-within:text-orange-500 transition-colors">Main Logistics Address</label>
                      <textarea 
                        rows={4}
                        required
                        value={profileForm.address}
                        onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-6 text-sm font-black focus:ring-0 focus:border-orange-500/30 focus:bg-white transition-all uppercase outline-none resize-none" 
                        placeholder="ENTER YOUR FULL SHIPPING ADDRESS..."
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={updating}
                    className="w-full bg-slate-900 text-white py-7 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-orange-600 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-4"
                  >
                    {updating ? 'EXECUTING SYNC...' : 'AUTHORIZE UPDATES'}
                    {!updating && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
