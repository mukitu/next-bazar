
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminDashboard from './pages/AdminDashboard';
import OrdersHistory from './pages/OrdersHistory';
import Login from './pages/Login';
import { Product } from './types';
import { supabase, fetchProducts } from './lib/supabase';

const MainContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (err) {
        console.error("Failed to load products:", err);
      }
    };
    load();

    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      setCurrentPage(hash);
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigate = (page: string) => {
    window.location.hash = page;
  };

  const onProductClick = (p: Product) => {
    setSelectedProduct(p);
    navigate('product');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="text-4xl font-black mb-4 tracking-tighter animate-pulse uppercase italic">Next<span className="text-orange-500">Bazar</span></div>
        <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full bg-orange-500 animate-loading-bar w-full"></div>
        </div>
        <style>{`
          @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-loading-bar { animation: loading-bar 1.5s infinite linear; }
        `}</style>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage products={products} onProductClick={onProductClick} />;
      case 'product': return selectedProduct ? <ProductPage product={selectedProduct} /> : <HomePage products={products} onProductClick={onProductClick} />;
      case 'cart': return <CartPage onCheckout={() => navigate('checkout')} onShop={() => navigate('home')} />;
      case 'checkout': return <CheckoutPage onComplete={() => navigate('orders')} />;
      case 'admin': 
        if (!user) return <Login onAuthSuccess={() => navigate('admin')} />;
        return isAdmin ? <AdminDashboard /> : <div className="p-20 text-center font-black text-red-600 bg-red-50 rounded-[3rem] m-8 border-4 border-dashed border-red-100 uppercase tracking-[0.2em]">ACCESS DENIED: ADMIN PRIVILEGES REQUIRED</div>;
      case 'orders': return user ? <OrdersHistory /> : <Login onAuthSuccess={() => navigate('orders')} />;
      case 'login': return <Login onAuthSuccess={() => navigate('home')} />;
      default: return <HomePage products={products} onProductClick={onProductClick} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {currentPage !== 'admin' && <Navbar onNavigate={navigate} />}
      <main className="flex-1">{renderPage()}</main>
      {currentPage !== 'admin' && (
        <footer className="bg-white border-t py-16 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex flex-col -space-y-1">
              <span className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Next<span className="text-orange-500">Bazar</span></span>
              <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em]">CRAFTED IN BANGLADESH</span>
            </div>
            <div className="flex gap-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span onClick={() => navigate('home')} className="hover:text-orange-500 cursor-pointer transition">Store</span>
              <span onClick={() => navigate('orders')} className="hover:text-orange-500 cursor-pointer transition">Tracking</span>
              <span className="hover:text-orange-500 cursor-pointer transition">Policy</span>
            </div>
            <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.2em] italic">© 2024 NEXTBAZAR OS - PRODUCTION SECURE</p>
          </div>
        </footer>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <CartProvider>
      <MainContent />
    </CartProvider>
  </AuthProvider>
);

export default App;
