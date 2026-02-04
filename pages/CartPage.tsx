
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
      <div className="max-w-4xl mx-auto py-32 px-4 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
        <button onClick={onShop} className="bg-orange-600 text-white px-10 py-4 rounded-full font-bold hover:shadow-xl transition">
          START SHOPPING
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-10">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => (
            <div key={item.product.id} className="bg-white p-4 rounded-2xl border flex gap-4 items-center">
              <img src={item.product.images[0]} className="w-20 h-20 object-cover rounded-lg border" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{item.product.name}</h3>
                <p className="text-orange-600 font-bold text-sm">
                  {CURRENCY_SYMBOL}{item.product.discount_price ?? item.product.price}
                </p>
              </div>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="px-3 py-1 hover:bg-gray-50">-</button>
                <span className="px-4 py-1 text-sm font-bold border-x">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="px-3 py-1 hover:bg-gray-50">+</button>
              </div>
              <button onClick={() => removeFromCart(item.product.id)} className="text-gray-400 hover:text-red-500 p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl border shadow-sm sticky top-24">
            <h2 className="text-xl font-bold mb-6">Summary</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{CURRENCY_SYMBOL}{subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Calculated at next step</span>
              </div>
              <div className="border-t pt-4 flex justify-between text-lg font-bold">
                <span>Estimated Total</span>
                <span className="text-orange-600">{CURRENCY_SYMBOL}{subtotal}</span>
              </div>
            </div>
            <button onClick={onCheckout} className="w-full bg-orange-600 text-white py-5 rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-[1.01] transition-all">
              PROCEED TO CHECKOUT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
