
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserOrders } from '../lib/supabase';
import { Order } from '../types';
import { CURRENCY_SYMBOL, STATUS_COLORS, STATUS_STEPS } from '../constants';

const OrdersHistory: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserOrders(user.id).then(data => {
        setOrders(data);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center animate-pulse">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Syncing Orders...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-20 animate-fadeIn">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">My <span className="text-orange-500">Journey</span></h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Track your authentic goods</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{orders.length}</p>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Orders</p>
        </div>
      </div>

      <div className="space-y-10">
        {orders.map(order => {
          const currentStep = STATUS_STEPS[order.status] || 0;
          const isExpanded = expandedOrder === order.id;

          return (
            <div key={order.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-xl">
              <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-300 text-xs">#{order.id.slice(0,4)}</div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference ID</p>
                      <p className="font-mono text-xs font-bold text-slate-900 uppercase">{order.id.slice(0,12)}...</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${STATUS_COLORS[order.status]}`}>
                      {order.status}
                    </span>
                    <button 
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="bg-slate-900 text-white px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-orange-500 transition shadow-lg"
                    >
                      {isExpanded ? 'Hide Details' : 'View Items'}
                    </button>
                  </div>
                </div>

                {/* Status Bar (Daraz Style) */}
                {order.status !== 'Cancelled' && (
                  <div className="relative mb-12 px-2">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-50 -translate-y-1/2 rounded-full"></div>
                    <div 
                      className="absolute top-1/2 left-0 h-1 bg-orange-500 -translate-y-1/2 rounded-full transition-all duration-1000"
                      style={{ width: `${(currentStep / 6) * 100}%` }}
                    ></div>
                    <div className="relative flex justify-between">
                      {[1, 2, 3, 4, 5, 6].map((step) => (
                        <div key={step} className={`w-3 h-3 rounded-full border-2 transition-all duration-500 z-10 ${step <= currentStep ? 'bg-orange-500 border-orange-500 scale-125 shadow-lg shadow-orange-200' : 'bg-white border-slate-100'}`}></div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-4 text-[8px] font-black text-slate-300 uppercase tracking-tighter">
                      <span>Placed</span>
                      <span className="hidden md:block">Payment</span>
                      <span>Approved</span>
                      <span className="hidden md:block">Packed</span>
                      <span>Shipped</span>
                      <span>Arrival</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-end gap-6 pt-8 border-t border-slate-50">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Placed On</p>
                      <p className="text-xs font-bold text-slate-800 uppercase">{new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Method</p>
                      <p className="text-xs font-bold text-slate-800 uppercase">{order.payment_method}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{CURRENCY_SYMBOL}{order.total_amount}</p>
                  </div>
                </div>

                {/* Expanded Item List */}
                {isExpanded && order.order_items && (
                  <div className="mt-8 pt-8 border-t border-slate-50 space-y-4 animate-fadeIn">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Package Contents</p>
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                        <img src={item.product?.images?.[0]} className="w-12 h-12 object-cover rounded-xl shadow-sm" alt="" />
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter truncate">{item.product?.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Qty: {item.quantity} × {CURRENCY_SYMBOL}{item.price_at_time}</p>
                        </div>
                        <p className="text-xs font-black text-slate-900">{CURRENCY_SYMBOL}{item.quantity * item.price_at_time}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersHistory;
