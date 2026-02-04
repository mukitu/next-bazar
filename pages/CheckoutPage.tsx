
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
  const [txId, setTxId] = useState('');
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { base, charge, total } = getTotals(paymentMethod);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please login first.");
      return;
    }
    if (!address || !phone) {
      alert("Please enter full address and phone number.");
      return;
    }
    if (paymentMethod === 'BKASH' && !txId) {
      alert("Please enter your bKash Transaction ID.");
      return;
    }

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
          bkash_tx_id: txId,
          bkash_charge: paymentMethod === 'BKASH' ? charge : 0,
          cod_charge: paymentMethod === 'COD' ? charge : 0
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create Order Items
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
      console.error(err);
      alert("Order failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <button onClick={() => window.location.hash = '#home'} className="text-orange-600 font-bold hover:underline">Start Shopping</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-10">Checkout</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm">1</span>
              Shipping Information
            </h2>
            <div className="space-y-4">
              <textarea 
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full Address in Bangladesh..."
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-orange-500 h-24"
              />
              <input 
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile Number (01XXXXXXXXX)"
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm">2</span>
              Payment Method
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div 
                onClick={() => setPaymentMethod('COD')}
                className={`cursor-pointer border-2 rounded-xl p-4 flex items-center gap-4 ${paymentMethod === 'COD' ? 'border-orange-600 bg-orange-50' : 'border-gray-100'}`}
              >
                <div className="font-bold">Cash on Delivery</div>
              </div>
              <div 
                onClick={() => setPaymentMethod('BKASH')}
                className={`cursor-pointer border-2 rounded-xl p-4 flex items-center gap-4 ${paymentMethod === 'BKASH' ? 'border-pink-600 bg-pink-50' : 'border-gray-100'}`}
              >
                <div className="font-bold">bKash (Send Money)</div>
              </div>
            </div>

            {paymentMethod === 'BKASH' && (
              <div className="bg-pink-50 p-6 rounded-xl border border-pink-100 animate-fadeIn">
                <p className="text-sm mb-4">Send <b>{CURRENCY_SYMBOL}{total}</b> to <b>{BKASH_NUMBER}</b></p>
                <input 
                  type="text" 
                  placeholder="Transaction ID" 
                  value={txId} 
                  onChange={(e) => setTxId(e.target.value)}
                  className="w-full border-2 border-pink-200 rounded-lg p-3 uppercase"
                />
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border sticky top-24">
            <h2 className="text-lg font-bold mb-6 border-b pb-4">Order Summary</h2>
            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between"><span>Subtotal</span><span>{CURRENCY_SYMBOL}{base}</span></div>
              <div className="flex justify-between"><span>Charge</span><span>{CURRENCY_SYMBOL}{charge}</span></div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t mt-4"><span>Total</span><span>{CURRENCY_SYMBOL}{total}</span></div>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold disabled:opacity-50"
            >
              {isSubmitting ? 'PLACING ORDER...' : 'PLACE ORDER'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
