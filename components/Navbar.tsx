
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { fetchCategories } from '../lib/supabase';
import { Category } from '../types';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const { cart } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  return (
    <>
      {/* Top Bar */}
      <div className="bg-green-800 text-white text-[10px] font-semibold py-1.5 px-4 text-center hidden md:block">
        🚚 ঢাকায় ডেলিভারি মাত্র ৳৭০ | সারা বাংলাদেশে ৳১১০ | বিশ্বস্ত অনলাইন শপিং
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 md:px-6">
          <div className="flex items-center gap-4 md:gap-6 h-16 md:h-20">

            {/* Logo */}
            <div className="flex-shrink-0 cursor-pointer" onClick={() => onNavigate('home')}>
              <div className="flex flex-col leading-none">
                <span className="text-xl md:text-2xl font-black text-green-700 tracking-tight uppercase">
                  NEXT<span className="text-orange-500">BAZAR</span>
                </span>
                <span className="text-[8px] font-bold text-gray-400 tracking-widest uppercase">Premium E-Commerce</span>
              </div>
            </div>

            {/* Search Bar — Desktop */}
            <div className="hidden md:flex flex-1 max-w-2xl">
              <div className="flex w-full rounded-full overflow-hidden border-2 border-green-700 bg-white">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && searchQuery) onNavigate('home'); }}
                  placeholder="পণ্য খুঁজুন..."
                  className="flex-1 px-5 py-2.5 text-sm outline-none text-gray-700 font-medium"
                />
                <button className="bg-green-700 hover:bg-green-800 transition px-6 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right Icons — Desktop */}
            <div className="hidden md:flex items-center gap-6 ml-auto flex-shrink-0">
              {/* Track Order */}
              <button onClick={() => onNavigate('user-dashboard')} className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-green-700 transition group">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-[9px] font-bold uppercase tracking-wide leading-none">ট্র্যাক অর্ডার</span>
              </button>

              {/* Account */}
              {user ? (
                <button onClick={() => onNavigate('user-dashboard')} className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-green-700 transition">
                  <div className="w-5 h-5 bg-green-700 rounded-full flex items-center justify-center text-white text-[9px] font-black">{user.full_name?.charAt(0) || 'U'}</div>
                  <span className="text-[9px] font-bold uppercase tracking-wide leading-none">{user.full_name?.split(' ')[0] || 'Account'}</span>
                </button>
              ) : (
                <button onClick={() => onNavigate('login')} className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-green-700 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-[9px] font-bold uppercase tracking-wide leading-none">সাইন ইন</span>
                </button>
              )}

              {/* Cart */}
              <button onClick={() => onNavigate('cart')} className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-green-700 transition relative">
                <div className="relative">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[9px] rounded-full h-4 w-4 flex items-center justify-center font-black leading-none">{cartCount}</span>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wide leading-none">কার্ট</span>
              </button>

              {isAdmin && (
                <button onClick={() => onNavigate('admin')} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide hover:bg-blue-700 transition shadow">Admin</button>
              )}

              {user && (
                <button onClick={signOut} className="text-[9px] font-bold text-red-400 hover:text-red-600 uppercase tracking-wide transition">লগআউট</button>
              )}
            </div>

            {/* Mobile Right */}
            <div className="md:hidden flex items-center gap-3 ml-auto">
              {isAdmin && (
                <button onClick={() => onNavigate('admin')} className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
              )}
              <button onClick={() => onNavigate('cart')} className="relative">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[8px] rounded-full h-4 w-4 flex items-center justify-center font-black">{cartCount}</span>}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-3">
            <div className="flex rounded-full overflow-hidden border-2 border-green-700 bg-white">
              <input
                type="text"
                placeholder="পণ্য খুঁজুন..."
                className="flex-1 px-4 py-2 text-sm outline-none text-gray-700"
              />
              <button className="bg-green-700 px-4 flex items-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Category Navigation Bar */}
        <div className="bg-green-800 hidden md:block">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => onNavigate('home')}
                className="flex-shrink-0 px-4 py-2.5 text-white text-[11px] font-bold uppercase tracking-wide hover:bg-green-700 transition whitespace-nowrap"
              >
                সব পণ্য
              </button>
              {categories.slice(0, 10).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => onNavigate('home')}
                  className="flex-shrink-0 px-4 py-2.5 text-green-100 text-[11px] font-semibold hover:bg-green-700 hover:text-white transition whitespace-nowrap"
                >
                  {cat.name}
                </button>
              ))}
              <button className="flex-shrink-0 ml-auto px-5 py-2 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition flex items-center gap-1.5">
                ⚡ FLASH SALE
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 px-6 py-2 flex justify-between items-center shadow-lg">
        <button onClick={() => onNavigate('home')} className={`flex flex-col items-center gap-0.5 ${currentPage === 'home' ? 'text-green-700' : 'text-gray-400'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[9px] font-bold">হোম</span>
        </button>
        <button onClick={() => onNavigate('cart')} className={`flex flex-col items-center gap-0.5 relative ${currentPage === 'cart' ? 'text-green-700' : 'text-gray-400'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          {cartCount > 0 && <span className="absolute -top-1 right-0 bg-orange-500 text-white text-[8px] rounded-full h-3.5 w-3.5 flex items-center justify-center font-black">{cartCount}</span>}
          <span className="text-[9px] font-bold">কার্ট</span>
        </button>
        <button onClick={() => user ? onNavigate('user-dashboard') : onNavigate('login')} className={`flex flex-col items-center gap-0.5 ${currentPage === 'user-dashboard' ? 'text-green-700' : 'text-gray-400'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          <span className="text-[9px] font-bold">অর্ডার</span>
        </button>
        <button onClick={() => user ? onNavigate('user-dashboard') : onNavigate('login')} className={`flex flex-col items-center gap-0.5 ${currentPage === 'login' ? 'text-green-700' : 'text-gray-400'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span className="text-[9px] font-bold">অ্যাকাউন্ট</span>
        </button>
      </div>
    </>
  );
};

export default Navbar;
