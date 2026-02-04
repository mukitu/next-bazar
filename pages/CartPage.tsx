import React from 'react';
import { useCart } from '../context/CartContext';
import { CURRENCY_SYMBOL } from '../constants';

interface CartPageProps {
  onCheckout: () => void;
  onShop: () => void;
}

const CartPage: React.FC<CartPageProps> = ({ onCheckout, onShop }) => {
  const { cart, updateQuantity, removeFromCart, subtotal } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-32 px-4 text-center animate-fadeIn">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2 italic">Empty Cart</h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-8">Your bag is as light as air.</p>
        <button onClick={onShop} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition shadow-xl active:scale-95">
          START SHOPPING
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
      <h1 className="text-4xl font-black mb-12 tracking-tighter uppercase italic">My <span className="text-orange-500">Cart</span></h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {cart.map(item => (
            <div key={item.product.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex gap-6 items-center shadow-sm transition hover:shadow-md">
              <img src={item.product.images[0]} className="w-24 h-24 object-cover rounded-2xl border bg-slate-50" alt="" />
              <div className="flex-1">
                <h3 className="font-black text-slate-900 uppercase tracking-tighter text-sm italic">{item.product.name}</h3>
                <p className="text-orange-600 font-black text-lg mt-1">
                  {CURRENCY_SYMBOL}{item.product.discount_price ?? item.product.price}
                </p>
              </div>
              <div className="flex items-center bg-slate-50 rounded-xl overflow-hidden border">
                <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="px-4 py-2 hover:bg-white transition text-slate-400 font-black">-</button>
                <span className="px-4 py-2 text-xs font-black text-slate-900 border-x">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="px-4 py-2 hover:bg-white transition text-slate-400 font-black">+</button>
              </div>
              <button onClick={() => removeFromCart(item.product.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl sticky top-24">
            <h2 className="text-xl font-black mb-8 uppercase tracking-tighter italic">Order <span className="text-orange-500">Summary</span></h2>
            
            <div className="space-y-4 mb-10 text-[10px] font-black uppercase tracking-widest">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span className="text-slate-900">{CURRENCY_SYMBOL}{subtotal}</span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-4">* Shipping & other charges calculated at checkout</p>
              <div className="border-t border-slate-50 pt-6 flex justify-between text-2xl font-black tracking-tighter">
                <span>SUBTOTAL</span>
                <span className="text-orange-600">{CURRENCY_SYMBOL}{subtotal}</span>
              </div>
            </div>
            <button onClick={onCheckout} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-orange-600 transition-all hover:scale-[1.02] active:scale-95">
              PROCEED TO CHECKOUT
            </button>
            <p className="text-[8px] text-center mt-6 text-slate-300 font-bold uppercase tracking-widest">NextBazar Fast Secure System</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
