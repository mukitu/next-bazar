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

  // Use getTotals from CartContext to get accurate figures based on current selection
  const { base, shipping, paymentCharge, total } = getTotals(paymentMethod, region);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("দয়া করে আগে লগইন করুন।");
    if (!address || !phone) return alert("দয়া করে পূর্ণ ঠিকানা এবং ফোন নম্বর প্রবেশ করান।");
    if (paymentMethod === 'BKASH' && !txId) return alert("দয়া করে আপনার বিকাশ ট্রানজ্যাকশন আইডি (Transaction ID) প্রবেশ করান।");

    setIsSubmitting(true);
    try {
      // 1. Create Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: paymentMethod === 'BKASH' ? 'Payment Submitted' : 'Pending',
          total_amount: total,
          payment_method: paymentMethod,
          shipping_address: `${address}, Phone: ${phone}`,
          shipping_region: region === 'DHAKA' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে',
          shipping_charge: shipping,
          bkash_tx_id: paymentMethod === 'BKASH' ? txId : null,
          bkash_charge: paymentMethod === 'BKASH' ? paymentCharge : 0,
          cod_charge: paymentMethod === 'COD' ? paymentCharge : 0
        })
        .select().single();

      if (orderError) throw orderError;

      // 2. Insert Order Items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_time: item.product.discount_price ?? item.product.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // 3. Clear Cart and Finish
      clearCart();
      alert("সফল হয়েছে! আপনার অর্ডার রেকর্ড করা হয়েছে।");
      onComplete();
    } catch (err: any) {
      console.error("Order process error:", err);
      alert("অর্ডার ব্যর্থ হয়েছে: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
      <h1 className="text-4xl font-black mb-10 tracking-tighter uppercase italic">নিরাপদ <span className="text-orange-500">চেকআউট</span></h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {/* Shipping Info */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h2 className="text-lg font-black mb-8 uppercase tracking-widest text-slate-400 flex items-center gap-4">
              <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">০১</span>
              ডেলিভারি বিবরণ
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button 
                type="button"
                onClick={() => setRegion('DHAKA')}
                className={`p-5 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${region === 'DHAKA' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-50 text-slate-400'}`}
              >
                Inside Dhaka (৳60)
              </button>
              <button 
                type="button"
                onClick={() => setRegion('OUTSIDE')}
                className={`p-5 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${region === 'OUTSIDE' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-50 text-slate-400'}`}
              >
                Outside Dhaka (৳120)
              </button>
            </div>

            <div className="space-y-4">
              <textarea 
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="বিস্তারিত শিপিং ঠিকানা (বাড়ি, রাস্তা, এলাকা)..."
                className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-orange-500 h-32"
              />
              <input 
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="মোবাইল নম্বর (উদাঃ 01XXXXXXXXX)"
                className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </section>

          {/* Payment Method */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h2 className="text-lg font-black mb-8 uppercase tracking-widest text-slate-400 flex items-center gap-4">
              <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">০২</span>
              পেমেন্ট নির্বাচন
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div 
                onClick={() => setPaymentMethod('COD')}
                className={`cursor-pointer border-2 rounded-2xl p-6 transition-all ${paymentMethod === 'COD' ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-50 text-slate-400 hover:border-slate-200'}`}
              >
                <p className="font-black uppercase tracking-widest text-[10px] mb-1">বিকল্প ০১</p>
                <h3 className="font-black text-xl tracking-tighter uppercase">ক্যাশ অন ডেলিভারি (COD)</h3>
                <p className={`text-[9px] mt-2 font-bold uppercase ${paymentMethod === 'COD' ? 'text-slate-400' : 'text-slate-300'}`}>+৳১০ সার্ভিস চার্জ</p>
              </div>
              <div 
                onClick={() => setPaymentMethod('BKASH')}
                className={`cursor-pointer border-2 rounded-2xl p-6 transition-all ${paymentMethod === 'BKASH' ? 'border-pink-600 bg-pink-600 text-white shadow-xl' : 'border-slate-50 text-slate-400 hover:border-slate-200'}`}
              >
                <p className="font-black uppercase tracking-widest text-[10px] mb-1">বিকল্প ০২</p>
                <h3 className="font-black text-xl tracking-tighter uppercase">বিকাশ ম্যানুয়াল</h3>
                <p className={`text-[9px] mt-2 font-bold uppercase ${paymentMethod === 'BKASH' ? 'text-pink-200' : 'text-slate-300'}`}>+১.৮৫% সেন্ড মানি চার্জ</p>
              </div>
            </div>

            {paymentMethod === 'BKASH' && (
              <div className="bg-pink-50 p-8 rounded-[2rem] border border-pink-100 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-6">
                  <div>
                    <p className="text-[10px] font-black text-pink-600 uppercase tracking-widest mb-1">পার্সোনাল বিকাশ নম্বর</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">{BKASH_NUMBER}</p>
                  </div>
                  <div className="md:text-right">
                    <p className="text-[10px] font-black text-pink-600 uppercase tracking-widest mb-1">সর্বমোট অ্যামাউন্ট (চার্জসহ)</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">{CURRENCY_SYMBOL}{total}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-pink-400 uppercase leading-relaxed">দয়া করে আমাদের বিকাশ নম্বরে সঠিক অ্যামাউন্ট "সেন্ড মানি" করুন, এরপর নিচে আপনার ট্রানজ্যাকশন আইডি পেস্ট করুন।</p>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">ট্রানজ্যাকশন আইডি (Transaction ID)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. BXA1234567" 
                    value={txId} 
                    onChange={(e) => setTxId(e.target.value.toUpperCase())}
                    className="w-full bg-white border-2 border-pink-100 rounded-xl p-4 uppercase font-mono font-bold text-center focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl sticky top-24 border border-slate-800">
            <h2 className="text-xl font-black mb-8 uppercase tracking-tighter border-b border-slate-800 pb-6 italic">চেকআউট <span className="text-orange-500">বিল</span></h2>
            <div className="space-y-4 mb-10 text-[10px] font-black uppercase tracking-widest">
              <div className="flex justify-between text-slate-500"><span>পণ্যের উপমোট</span><span className="text-white">{CURRENCY_SYMBOL}{base}</span></div>
              <div className="flex justify-between text-slate-500"><span>শিপিং চার্জ ({region === 'DHAKA' ? 'ঢাকা' : 'ঢাকার বাইরে'})</span><span className="text-white">{CURRENCY_SYMBOL}{shipping}</span></div>
              <div className="flex justify-between text-slate-500"><span>{paymentMethod} চার্জ</span><span className="text-white">{CURRENCY_SYMBOL}{paymentCharge}</span></div>
              <div className="flex justify-between font-black text-3xl pt-8 border-t border-slate-800 mt-6 tracking-tighter text-orange-500">
                <span>সর্বমোট (Total)</span>
                <span>{CURRENCY_SYMBOL}{total}</span>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-white text-slate-900 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-orange-600 hover:text-white transition-all disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? 'যাচাই করা হচ্ছে...' : 'এখনই অর্ডার করুন'}
            </button>
            <p className="text-[8px] text-center mt-6 text-slate-500 font-bold uppercase tracking-[0.3em]">এনক্রিপ্টেড নিরাপদ ট্রানজ্যাকশন</p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
