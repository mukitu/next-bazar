
import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import Login from './pages/Login';
import { Product } from './types';
import { fetchProducts } from './lib/supabase';

const MainContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  const loadInitialData = useCallback(async () => {
    setProductsLoading(true);
    setLoadError(false);
    
    // Safety timeout: If fetchProducts takes > 5s, stop blocking the UI
    const timeout = setTimeout(() => {
      setProductsLoading(false);
      if (products.length === 0) setLoadError(true);
    }, 5000);

    try {
      const data = await fetchProducts();
      if (data && data.length > 0) {
        setProducts(data);
        setLoadError(false);
      }
    } catch (err) {
      console.error("Critical Load Error:", err);
      setLoadError(true);
    } finally {
      setProductsLoading(false);
      clearTimeout(timeout);
    }
  }, [products.length]);

  useEffect(() => {
    loadInitialData();

    // FORCE clear splash screen after 3 seconds regardless of auth state
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      setCurrentPage(hash);
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    
    return () => {
      window.removeEventListener('hashchange', handleHash);
      clearTimeout(splashTimer);
    };
  }, [loadInitialData]);

  // Transition from splash once auth is ready, but limited by the 3s timeout above
  useEffect(() => {
    if (!authLoading) {
      const t = setTimeout(() => setShowSplash(false), 200);
      return () => clearTimeout(t);
    }
  }, [authLoading]);

  const navigate = (page: string) => {
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const onProductClick = (p: Product) => {
    setSelectedProduct(p);
    navigate('product');
  };

  // Only show splash if BOTH are true AND we haven't hit the safety timeout
  if (showSplash && authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 animate-fadeIn">
        <div className="text-center relative">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-orange-500/10 rounded-full blur-[80px]"></div>
          <div className="text-4xl md:text-5xl font-black mb-6 tracking-tighter uppercase italic text-white relative">
            Next<span className="text-orange-500">Bazar</span>
          </div>
          <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mx-auto relative">
            <div className="h-full bg-orange-500 animate-[shimmer_1.5s_infinite] w-full origin-left"></div>
          </div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-8 animate-pulse italic">Securing Neural Link...</p>
        </div>
        <style>{`
          @keyframes shimmer {
            0% { transform: scaleX(0); opacity: 0; }
            50% { transform: scaleX(0.7); opacity: 1; }
            100% { transform: scaleX(1); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home': 
        if (productsLoading && products.length === 0) {
          return (
            <div className="max-w-7xl mx-auto px-4 py-32 text-center animate-fadeIn">
              <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full mx-auto mb-6 animate-spin"></div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Syncing Master Cache...</h3>
            </div>
          );
        }
        if (loadError && products.length === 0) {
          return (
            <div className="max-w-7xl mx-auto px-4 py-32 text-center animate-fadeIn">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">Sync Interrupted</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2 mb-10">Database handshake failed</p>
              <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:bg-orange-600 transition-all">Emergency Reboot</button>
            </div>
          );
        }
        return <HomePage products={products} onProductClick={onProductClick} />;
      case 'product': return selectedProduct ? <ProductPage product={selectedProduct} /> : <HomePage products={products} onProductClick={onProductClick} />;
      case 'cart': return <CartPage onCheckout={() => navigate('checkout')} onShop={() => navigate('home')} />;
      case 'checkout': return <CheckoutPage onComplete={() => navigate('user-dashboard')} />;
      case 'admin': 
        if (isAdmin) return <AdminDashboard />;
        return <HomePage products={products} onProductClick={onProductClick} />;
      case 'user-dashboard': 
      case 'orders': 
        return user ? <UserDashboard /> : <Login onAuthSuccess={() => navigate('user-dashboard')} />;
      case 'login': return <Login onAuthSuccess={() => navigate('home')} />;
      default: return <HomePage products={products} onProductClick={onProductClick} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {currentPage !== 'admin' && <Navbar onNavigate={navigate} currentPage={currentPage} />}
      <main className="flex-1">
        {renderPage()}
      </main>
      {currentPage !== 'admin' && (
        <footer className="bg-slate-900 text-white py-16 px-6 pb-28 md:pb-16 mt-20">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex flex-col -space-y-1 items-center md:items-start">
              <span className="text-2xl font-black tracking-tighter uppercase italic">Next<span className="text-orange-500">Bazar</span></span>
              <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Premium BD E-Commerce</span>
            </div>
            <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span onClick={() => navigate('home')} className="hover:text-orange-500 cursor-pointer transition">Store</span>
              <span onClick={() => navigate('user-dashboard')} className="hover:text-orange-500 cursor-pointer transition">Track My Orders</span>
              <span className="hover:text-orange-500 cursor-pointer transition">Privacy Policy</span>
            </div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">© 2024 NEXTBAZAR.CO</p>
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
