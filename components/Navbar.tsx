
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
      {/* Top Navbar (Desktop + Brand) */}
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* LOGO */}
            <div 
              className="flex-shrink-0 cursor-pointer active:scale-95 transition"
              onClick={() => onNavigate('home')}
            >
              <div className="flex flex-col -space-y-1">
                <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase">
                  Next<span className="text-orange-500">Bazar</span>
                </span>
                <span className="text-[7px] md:text-[8px] font-bold tracking-[0.3em] text-slate-400 uppercase">Premium Shopping</span>
              </div>
            </div>

            {/* Actions (Desktop Only) */}
            <div className="hidden md:flex items-center gap-6">
              {isAdmin && (
                <button 
                  onClick={() => onNavigate('admin')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition"
                >
                  Admin Panel
                </button>
              )}
              
              <button onClick={() => onNavigate('home')} className={`text-xs font-black uppercase tracking-widest ${currentPage === 'home' ? 'text-orange-500' : 'text-slate-500'}`}>Home</button>
              
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
                <div className="flex items-center gap-4">
                  <button onClick={() => onNavigate('orders')} className="text-xs font-black text-slate-600 hover:text-orange-500 uppercase tracking-widest">Orders</button>
                  <button onClick={signOut} className="text-[10px] font-black text-red-500 uppercase">Logout</button>
                </div>
              ) : (
                <button onClick={() => onNavigate('login')} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest">Login</button>
              )}
            </div>

            {/* Mobile-only Search Button or Admin Toggle */}
            <div className="md:hidden flex items-center gap-3">
               {isAdmin && <button onClick={() => onNavigate('admin')} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>}
               <button onClick={() => onNavigate('home')} className="p-2"><svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation (Visible only on mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50 mobile-bottom-nav px-6 py-3 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button onClick={() => onNavigate('home')} className={`flex flex-col items-center gap-1 ${currentPage === 'home' ? 'text-orange-500' : 'text-slate-400'}`}>
          <svg className="w-6 h-6" fill={currentPage === 'home' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[9px] font-black uppercase tracking-tighter">Home</span>
        </button>
        
        <button onClick={() => onNavigate('cart')} className={`flex flex-col items-center gap-1 relative ${currentPage === 'cart' ? 'text-orange-500' : 'text-slate-400'}`}>
          <svg className="w-6 h-6" fill={currentPage === 'cart' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[8px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}
          <span className="text-[9px] font-black uppercase tracking-tighter">Cart</span>
        </button>

        <button onClick={() => onNavigate('orders')} className={`flex flex-col items-center gap-1 ${currentPage === 'orders' ? 'text-orange-500' : 'text-slate-400'}`}>
          <svg className="w-6 h-6" fill={currentPage === 'orders' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          <span className="text-[9px] font-black uppercase tracking-tighter">Orders</span>
        </button>

        <button onClick={() => user ? onNavigate('orders') : onNavigate('login')} className={`flex flex-col items-center gap-1 ${currentPage === 'login' ? 'text-orange-500' : 'text-slate-400'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span className="text-[9px] font-black uppercase tracking-tighter">{user ? 'Profile' : 'Login'}</span>
        </button>
      </div>
    </>
  );
};

export default Navbar;
