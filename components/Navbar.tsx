
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const { cart } = useCart();
  const { user, signOut } = useAuth();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = async () => {
    await signOut();
    onNavigate('home');
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex-shrink-0 cursor-pointer flex items-center gap-2"
            onClick={() => onNavigate('home')}
          >
            <span className="text-blue-600 text-2xl font-black tracking-tighter uppercase">Next<span className="text-orange-600">Bazar</span></span>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <input 
                type="text" 
                placeholder="Search products..." 
                className="w-full bg-gray-100 border-none rounded-full py-2 px-4 focus:ring-2 focus:ring-orange-500 text-sm"
              />
              <button className="absolute right-3 top-2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </div>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-4">
            <div 
              className="relative cursor-pointer group p-2"
              onClick={() => onNavigate('cart')}
            >
              <svg className="w-6 h-6 text-gray-700 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-orange-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </div>

            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 text-gray-700 hover:text-orange-600">
                  <span className="hidden sm:inline text-sm font-medium">{user.full_name || user.email.split('@')[0]}</span>
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs uppercase">
                    {user.email[0]}
                  </div>
                </button>
                <div className="absolute right-0 top-10 w-48 bg-white shadow-xl border rounded-lg overflow-hidden hidden group-hover:block">
                  <button 
                    onClick={() => onNavigate('orders')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                  >
                    My Orders
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => onNavigate('login')}
                className="bg-orange-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-orange-700 transition"
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
