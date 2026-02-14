
import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const { cart } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center h-16 md:h-24">
            {/* Logo */}
            <div className="flex-shrink-0 cursor-pointer" onClick={() => onNavigate('home')}>
              <div className="flex flex-col -space-y-1">
                <span className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                  Next<span className="text-orange-500">Bazar</span>
                </span>
                <span className="text-[8px] md:text-[10px] font-black tracking-[0.3em] text-slate-300 uppercase">Bangladesh</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-10">
              <button onClick={() => onNavigate('home')} className={`text-[11px] font-black uppercase tracking-[0.2em] transition ${currentPage === 'home' ? 'text-orange-500' : 'text-slate-400 hover:text-slate-900'}`}>Home</button>
              
              {user && (
                <button onClick={() => onNavigate('user-dashboard')} className={`text-[11px] font-black uppercase tracking-[0.2em] transition ${currentPage === 'user-dashboard' ? 'text-orange-500' : 'text-slate-400 hover:text-slate-900'}`}>My Orders</button>
              )}

              {isAdmin && (
                <button onClick={() => onNavigate('admin')} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition">Admin Panel</button>
              )}
              
              <div className="relative cursor-pointer group" onClick={() => onNavigate('cart')}>
                <svg className="w-6 h-6 text-slate-800 group-hover:text-orange-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-black border-2 border-white shadow-sm">
                    {cartCount}
                  </span>
                )}
              </div>

              {user ? (
                <div className="flex items-center gap-4 pl-4 border-l border-slate-100">
                  <div 
                    onClick={() => onNavigate('user-dashboard')}
                    className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl cursor-pointer hover:bg-slate-100 transition border border-slate-100"
                  >
                    <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white text-[10px] font-black uppercase italic shadow-sm">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Account</span>
                  </div>
                  <button onClick={signOut} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition ml-2">Logout</button>
                </div>
              ) : (
                <button onClick={() => onNavigate('login')} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition shadow-xl shadow-slate-200">Login</button>
              )}
            </div>

            {/* Mobile Header Icons */}
            <div className="md:hidden flex items-center gap-4">
               {isAdmin && <button onClick={() => onNavigate('admin')} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>}
               <div className="relative" onClick={() => onNavigate('cart')}>
                 <svg className="w-6 h-6 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                 {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[8px] rounded-full h-4 w-4 flex items-center justify-center font-black">{cartCount}</span>}
               </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50 mobile-bottom-nav px-8 py-4 flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[2rem]">
        <button onClick={() => onNavigate('home')} className={`flex flex-col items-center gap-1 ${currentPage === 'home' ? 'text-orange-500' : 'text-slate-300'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[9px] font-black uppercase tracking-tighter">Home</span>
        </button>
        <button onClick={() => onNavigate('cart')} className={`flex flex-col items-center gap-1 ${currentPage === 'cart' ? 'text-orange-500' : 'text-slate-300'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          <span className="text-[9px] font-black uppercase tracking-tighter">Cart</span>
        </button>
        <button onClick={() => user ? onNavigate('user-dashboard') : onNavigate('login')} className={`flex flex-col items-center gap-1 ${currentPage === 'user-dashboard' ? 'text-orange-500' : 'text-slate-300'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          <span className="text-[9px] font-black uppercase tracking-tighter">Orders</span>
        </button>
        <button onClick={() => user ? onNavigate('user-dashboard') : onNavigate('login')} className={`flex flex-col items-center gap-1 ${currentPage === 'login' ? 'text-orange-500' : 'text-slate-300'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span className="text-[9px] font-black uppercase tracking-tighter">Account</span>
        </button>
      </div>
    </>
  );
};

export default Navbar;
