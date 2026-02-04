
import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onNavigate: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const { cart } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* LOGO */}
          <div 
            className="flex-shrink-0 cursor-pointer group"
            onClick={() => onNavigate('home')}
          >
            <div className="flex flex-col -space-y-1">
              <span className="text-2xl font-black text-slate-900 tracking-tighter uppercase transition group-hover:text-blue-600">
                Next<span className="text-orange-500">Bazar</span>
              </span>
              <span className="text-[8px] font-bold tracking-[0.3em] text-slate-400 uppercase text-center">Premium Shopping</span>
            </div>
          </div>

          {/* Search (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-10">
            <div className="relative w-full group">
              <input 
                type="text" 
                placeholder="Find anything..." 
                className="w-full bg-slate-100 border-none rounded-2xl py-3 px-5 focus:ring-2 focus:ring-orange-500 text-sm transition-all"
              />
              <button className="absolute right-4 top-3 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-6">
            {isAdmin && (
              <button 
                onClick={() => onNavigate('admin')}
                className="flex items-center gap-2 text-[10px] font-black text-white bg-blue-600 px-4 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 uppercase tracking-widest"
              >
                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                Admin Panel
              </button>
            )}

            <div 
              className="relative cursor-pointer p-2 hover:bg-slate-50 rounded-full transition"
              onClick={() => onNavigate('cart')}
            >
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-white">
                  {cartCount}
                </span>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-3 border-l pl-6">
                <button 
                  onClick={() => onNavigate('orders')}
                  className="hidden sm:block text-xs font-black text-slate-600 hover:text-orange-500 uppercase tracking-widest"
                >
                  Orders
                </button>
                <button 
                  onClick={signOut}
                  className="text-[10px] font-black text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition uppercase tracking-widest"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => onNavigate('login')}
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition active:scale-95 shadow-lg shadow-slate-200"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
