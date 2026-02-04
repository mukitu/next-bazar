
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserOrders } from '../lib/supabase';
import { Order } from '../types';
import { CURRENCY_SYMBOL, STATUS_COLORS } from '../constants';

const OrdersHistory: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserOrders(user.id).then(data => {
        setOrders(data);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400">TRACKING YOUR PACKAGES...</div>;

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <h2 className="text-2xl font-black text-slate-900 mb-2">NO ORDERS YET</h2>
        <p className="text-slate-500 mb-8">Your shopping journey starts here.</p>
        <button onClick={() => window.location.hash = 'home'} className="bg-orange-500 text-white px-10 py-4 rounded-2xl font-bold">START SHOPPING</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-slate-900 mb-10 uppercase tracking-tighter">My Orders</h1>
      <div className="space-y-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</span>
                <p className="font-mono text-xs text-slate-900">#{order.id.slice(0,8)}</p>
              </div>
              <span className={`px-4 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLORS[order.status]}`}>
                {order.status}
              </span>
            </div>
            
            <div className="flex justify-between items-end border-t pt-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase">
                {new Date(order.created_at).toLocaleDateString()} • {order.payment_method}
              </div>
              <div className="text-xl font-black text-slate-900">
                {CURRENCY_SYMBOL}{order.total_amount}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersHistory;
