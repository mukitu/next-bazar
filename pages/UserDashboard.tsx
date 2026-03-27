
import React, { useState, useEffect, useRef } from 'react';
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
  
  // Track if form has been initialized to avoid overwriting user input on re-renders
  const formInitialized = useRef(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    address: ''
  });
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Load orders only once on mount
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
    }
  }, [user?.id]);

  // Sync form with user data only when it hasn't been initialized or when user ID changes
  useEffect(() => {
    if (user && !formInitialized.current) {
      setProfileForm({
        full_name: user.full_name || '',
        phone: user.phone || '',
        address: user.address || ''
      });
      formInitialized.current = true;
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setUpdating(true);
    setMessage(null);
    
    try {
      // 1. Update in Database
      const updatedProfile = await updateProfile(user.id, profileForm);
      
      // 2. Force Global Context Update and wait for it
      await refreshProfile(user.id);
      
      // 3. Ensure local form stays in sync with what was saved
      setProfileForm({
        full_name: updatedProfile.full_name || '',
        phone: updatedProfile.phone || '',
        address: updatedProfile.address || ''
      });

      setMessage({ type: 'success', text: 'Account successfully synced with secure vault!' });
      
      // Clear success message after delay
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      console.error("Update Error:", err);
      setMessage({ type: 'error', text: err.message || 'Update failed. Check connection.' });
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
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Syncing Dashboard Assets...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 animate-fadeIn pb-32">
      {/* Top Welcome Banner */}
      <div className="bg-slate-900 rounded-[3rem] p-10 md:p-20 mb-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full -mr-32 -mt-32 blur-[100px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
          <div>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] mb-4">অ্যাকাউন্ট ভেরিফাইড</p>
            <h1 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter mb-2 leading-none">
              স্বাগতম, <span className="text-orange-500">{user?.full_name?.split(' ')[0] || 'ইউজার'}</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">{user?.email}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-10 pt-10 border-t border-white/5 w-full md:w-auto">
            <div>
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">মোট অর্ডার</p>
              <p className="text-3xl font-black italic text-white">{orders.length}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">মেম্বারশিপ</p>
              <p className="text-3xl font-black italic text-orange-500">কালিনাম</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-72 space-y-3 lg:sticky lg:top-32">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between px-8 py-6 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm ${activeTab === 'orders' ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
          >
            অর্ডার হিস্ট্রি
            <span className={`w-6 h-6 rounded-full text-[9px] flex items-center justify-center font-black ${activeTab === 'orders' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{orders.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center justify-between px-8 py-6 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm ${activeTab === 'profile' ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
          >
            প্রোফাইল আপডেট
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </button>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 w-full">
          {activeTab === 'orders' ? (
            <div className="space-y-8 animate-fadeIn">
              {orders.length === 0 ? (
                <div className="bg-white p-24 rounded-[4rem] text-center border-2 border-dashed border-slate-100 shadow-inner">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
                     <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                   </div>
                   <h3 className="text-xl font-black text-slate-300 uppercase tracking-tighter italic">No orders logged in your journey yet.</h3>
                   <p className="text-[10px] font-bold text-slate-200 uppercase tracking-widest mt-2">Start your premium collection today</p>
                </div>
              ) : (
                orders.map((order, idx) => {
                  const currentStep = STATUS_STEPS[order.status] || 0;
                  const isExpanded = expandedOrder === order.id;

                  return (
                    <div key={order.id} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-2xl group hover:border-orange-500/10">
                      <div className="p-8 md:p-14">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center font-black text-white text-sm italic shadow-xl">#{idx + 1}</div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Transaction Ref</p>
                              <p className="font-mono text-xs font-bold text-slate-900 uppercase">{order.id.slice(0, 16)}...</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <span className={`flex-1 md:flex-none text-center px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-colors ${STATUS_COLORS[order.status]}`}>
                              {order.status}
                            </span>
                            <button 
                              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                              className={`flex-1 md:flex-none px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isExpanded ? 'bg-orange-600 text-white shadow-orange-200 shadow-lg' : 'bg-slate-900 text-white hover:bg-orange-600'}`}
                            >
                              {isExpanded ? 'CLOSE' : 'DETAILS'}
                            </button>
                          </div>
                        </div>

                        {/* Order Timeline */}
                        {order.status !== 'Cancelled' && (
                          <div className="relative mb-14 px-4">
                            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-50 -translate-y-1/2 rounded-full"></div>
                            <div 
                              className="absolute top-1/2 left-0 h-[2px] bg-orange-500 -translate-y-1/2 rounded-full transition-all duration-1000"
                              style={{ width: `${Math.max(0, ((currentStep - 1) / 5) * 100)}%` }}
                            ></div>
                            <div className="relative flex justify-between">
                              {[1, 2, 3, 4, 5, 6].map((step) => (
                                <div key={step} className={`w-4 h-4 rounded-full border-2 transition-all duration-500 z-10 ${step <= currentStep ? 'bg-orange-500 border-orange-500 scale-125 shadow-lg shadow-orange-100' : 'bg-white border-slate-100'}`}></div>
                              ))}
                            </div>
                            <div className="flex justify-between mt-5">
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">অর্ডার প্লেসড</span>
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">অ্যাপ্রুভড</span>
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">ডেলিভারি সম্পন্ন</span>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-slate-50">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">অর্ডারের তারিখ</p>
                            <p className="text-[11px] font-bold text-slate-800 uppercase italic">{new Date(order.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">পেমেন্ট পদ্ধতি</p>
                            <p className="text-[11px] font-bold text-slate-800 uppercase italic">{order.payment_method}</p>
                          </div>
                          <div className="col-span-2 text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট অ্যামাউন্ট</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tighter italic">{CURRENCY_SYMBOL}{order.total_amount}</p>
                          </div>
                        </div>

                        {/* Order Items Detail Area */}
                        {isExpanded && (
                          <div className="mt-12 pt-12 border-t border-slate-50 animate-fadeIn space-y-8">
                            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Final Delivery Target</p>
                               <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase italic">{String(order.shipping_address)}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {order.order_items?.map((item: any) => (
                                <div key={item.id} className="flex items-center gap-6 bg-white p-6 rounded-3xl border border-slate-100 hover:border-orange-500/20 transition-all shadow-sm">
                                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-50 shadow-sm flex-shrink-0">
                                    <img src={item.product?.images?.[0]} className="w-full h-full object-cover" alt="" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tighter truncate">{item.product?.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{item.quantity} Units × {CURRENCY_SYMBOL}{item.price_at_time}</p>
                                    <p className="text-sm font-black text-orange-600 italic mt-2">{CURRENCY_SYMBOL}{item.quantity * item.price_at_time}</p>
                                  </div>
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
              <div className="bg-white p-12 md:p-16 rounded-[4rem] shadow-2xl border border-slate-100">
                <form onSubmit={handleProfileUpdate} className="space-y-12">
                  <div className="flex flex-col gap-3">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">পরিচয় <span className="text-orange-500">নিরাপত্তা</span></h3>
                    <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">গ্লোবাল ডেলিভারি এবং কন্টাক্ট প্যারামিটার</p>
                  </div>
                  
                  {message && (
                    <div className={`p-6 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] border-2 animate-fadeIn ${message.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                      {message.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="group">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block ml-1 group-focus-within:text-orange-500 transition-colors">Legal Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={profileForm.full_name}
                        onChange={e => setProfileForm({...profileForm, full_name: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-3xl p-7 text-sm font-black focus:ring-0 focus:border-orange-500/20 focus:bg-white transition-all uppercase italic outline-none shadow-inner" 
                      />
                    </div>

                    <div className="group">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block ml-1 group-focus-within:text-orange-500 transition-colors">Emergency Contact</label>
                      <input 
                        type="tel" 
                        required
                        value={profileForm.phone}
                        onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-3xl p-7 text-sm font-black focus:ring-0 focus:border-orange-500/20 focus:bg-white transition-all outline-none shadow-inner" 
                      />
                    </div>

                    <div className="group md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block ml-1 group-focus-within:text-orange-500 transition-colors">Vault Shipping Address</label>
                      <textarea 
                        rows={5}
                        required
                        value={profileForm.address}
                        onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-[2.5rem] p-8 text-sm font-black focus:ring-0 focus:border-orange-500/20 focus:bg-white transition-all uppercase outline-none resize-none shadow-inner leading-relaxed" 
                        placeholder="ENTER YOUR PERMANENT DELIVERY ADDRESS..."
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={updating}
                    className="w-full bg-slate-900 text-white py-8 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-orange-600 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-5"
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
