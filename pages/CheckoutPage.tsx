
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CURRENCY_SYMBOL, BKASH_NUMBER } from '../constants';
import { supabase } from '../lib/supabase';

interface CheckoutPageProps {
  onComplete: () => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ onComplete }) => {
  const { cart, getTotals, clearCart } = useCart();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BKASH'>('COD');
  const [region, setRegion] = useState<'DHAKA' | 'OUTSIDE'>('DHAKA');
  const [txId, setTxId] = useState('');
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { base, shipping, paymentCharge, total } = getTotals(paymentMethod, region);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Please login first.");
    if (!address || !phone) return alert("Please enter full address and phone number.");
    if (paymentMethod === 'BKASH' && !txId) return alert("Please enter your bKash Transaction ID.");

    setIsSubmitting(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: paymentMethod === 'BKASH' ? 'Payment Submitted' : 'Pending',
          total_amount: total,
          payment_method: paymentMethod,
          shipping_address: `${address}, Phone: ${phone}`,
          shipping_region: region === 'DHAKA' ? 'Inside Dhaka' : 'Outside Dhaka',
          shipping_charge: shipping,
          bkash_tx_id: txId,
          bkash_charge: paymentMethod === 'BKASH' ? paymentCharge : 0,
          cod_charge: paymentMethod === 'COD' ? paymentCharge : 0
        })
        .select().single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_time: item.product.discount_price ?? item.product.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      clearCart();
      alert("Order placed successfully!");
      onComplete();
    } catch (err: any) {
      alert("Order failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
      <h1 className="text-4xl font-black mb-10 tracking-tighter uppercase italic">Secure <span className="text-orange-500">Checkout</span></h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {/* Shipping Info */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h2 className="text-lg font-black mb-8 uppercase tracking-widest text-slate-400 flex items-center gap-4">
              <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">01</span>
              Delivery Details
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button 
                type="button"
                onClick={() => setRegion('DHAKA')}
                className={`p-5 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${region === 'DHAKA' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-50 text-slate-400'}`}
              >
                Inside Dhaka (৳70)
              </button>
              <button 
                type="button"
                onClick={() => setRegion('OUTSIDE')}
                className={`p-5 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${region === 'OUTSIDE' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-50 text-slate-400'}`}
              >
                Outside Dhaka (৳110)
              </button>
            </div>

            <div className="space-y-4">
              <textarea 
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Detailed Shipping Address..."
                className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-orange-500 h-32"
              />
              <input 
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile Number (e.g. 01711223344)"
                className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </section>

          {/* Payment Method */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h2 className="text-lg font-black mb-8 uppercase tracking-widest text-slate-400 flex items-center gap-4">
              <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">02</span>
              Payment Selection
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div 
                onClick={() => setPaymentMethod('COD')}
                className={`cursor-pointer border-2 rounded-2xl p-6 transition-all ${paymentMethod === 'COD' ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-50 text-slate-400'}`}
              >
                <p className="font-black uppercase tracking-widest text-[10px] mb-1">Method 01</p>
                <h3 className="font-black text-xl tracking-tighter uppercase">Cash On Delivery</h3>
                <p className={`text-[9px] mt-2 font-bold uppercase ${paymentMethod === 'COD' ? 'text-slate-400' : 'text-slate-300'}`}>+৳10 COD Charge</p>
              </div>
              <div 
                onClick={() => setPaymentMethod('BKASH')}
                className={`cursor-pointer border-2 rounded-2xl p-6 transition-all ${paymentMethod === 'BKASH' ? 'border-pink-600 bg-pink-600 text-white shadow-xl' : 'border-slate-50 text-slate-400'}`}
              >
                <p className="font-black uppercase tracking-widest text-[10px] mb-1">Method 02</p>
                <h3 className="font-black text-xl tracking-tighter uppercase">bKash Manual</h3>
                <p className={`text-[9px] mt-2 font-bold uppercase ${paymentMethod === 'BKASH' ? 'text-pink-200' : 'text-slate-300'}`}>+1.85% Send Money Fee</p>
              </div>
            </div>

            {paymentMethod === 'BKASH' && (
              <div className="bg-pink-50 p-8 rounded-[2rem] border border-pink-100 animate-fadeIn">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="text-[10px] font-black text-pink-600 uppercase tracking-widest mb-1">Send Money to</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">{BKASH_NUMBER}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-pink-600 uppercase tracking-widest mb-1">Exact Amount</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">{CURRENCY_SYMBOL}{total}</p>
                  </div>
                </div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Transaction ID</label>
                <input 
                  type="text" 
                  required
                  placeholder="Enter 10-digit ID" 
                  value={txId} 
                  onChange={(e) => setTxId(e.target.value)}
                  className="w-full bg-white border-2 border-pink-100 rounded-xl p-4 uppercase font-mono font-bold text-center focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>
            )}
          </section>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl sticky top-24 border border-slate-800">
            <h2 className="text-xl font-black mb-8 uppercase tracking-tighter border-b border-slate-800 pb-6 italic">Order <span className="text-orange-500">Summary</span></h2>
            <div className="space-y-4 mb-10 text-[10px] font-black uppercase tracking-widest">
              <div className="flex justify-between text-slate-500"><span>Items Subtotal</span><span className="text-white">{CURRENCY_SYMBOL}{base}</span></div>
              <div className="flex justify-between text-slate-500"><span>Delivery Charge</span><span className="text-white">{CURRENCY_SYMBOL}{shipping}</span></div>
              <div className="flex justify-between text-slate-500"><span>Payment Fee</span><span className="text-white">{CURRENCY_SYMBOL}{paymentCharge}</span></div>
              <div className="flex justify-between font-black text-2xl pt-6 border-t border-slate-800 mt-6 tracking-tighter text-orange-500">
                <span>TOTAL</span>
                <span>{CURRENCY_SYMBOL}{total}</span>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-white text-slate-900 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? 'PROCESSING...' : 'CONFIRM ORDER'}
            </button>
            <p className="text-[8px] text-center mt-6 text-slate-500 font-bold uppercase tracking-widest">Secure checkout by NextBazar OS</p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
