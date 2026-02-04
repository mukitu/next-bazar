
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
  const { user, isAdmin, loading, signOut } = useAuth();

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
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const onProductClick = (p: Product) => {
    setSelectedProduct(p);
    navigate('product');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="relative">
          <div className="text-3xl font-black mb-2 tracking-tighter uppercase italic text-slate-900">Next<span className="text-orange-500">Bazar</span></div>
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 animate-[loading_1.5s_infinite_linear] w-[40%]"></div>
          </div>
        </div>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
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
        if (isAdmin) return <AdminDashboard />;
        return <HomePage products={products} onProductClick={onProductClick} />;
      case 'orders': return user ? <OrdersHistory /> : <Login onAuthSuccess={() => navigate('orders')} />;
      case 'login': return <Login onAuthSuccess={() => navigate('home')} />;
      default: return <HomePage products={products} onProductClick={onProductClick} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {currentPage !== 'admin' && <Navbar onNavigate={navigate} currentPage={currentPage} />}
      <main className="flex-1">{renderPage()}</main>
      {currentPage !== 'admin' && (
        <footer className="bg-white border-t py-12 md:py-20 px-6 pb-28 md:pb-20">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex flex-col -space-y-1 items-center md:items-start">
              <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">Next<span className="text-orange-500">Bazar</span></span>
              <span className="text-[8px] font-bold text-slate-400 tracking-[0.2em]">FAST SECURE SHOPPING</span>
            </div>
            <div className="flex gap-8 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <span onClick={() => navigate('home')} className="hover:text-orange-500 cursor-pointer">Store</span>
              <span onClick={() => navigate('orders')} className="hover:text-orange-500 cursor-pointer">Orders</span>
              <span className="text-slate-300">Privacy</span>
            </div>
            <p className="text-[8px] text-slate-300 font-black uppercase tracking-widest">© 2024 NextBazar v2.0</p>
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
