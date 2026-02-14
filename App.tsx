
import React, { useState, useEffect } from 'react';
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
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (err) {
        console.error("Products load error:", err);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="text-3xl font-black mb-4 tracking-tighter uppercase italic text-white">Next<span className="text-orange-500">Bazar</span></div>
          <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-orange-500 animate-pulse w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage products={products} onProductClick={onProductClick} />;
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
    <div className="min-h-screen flex flex-col">
      {currentPage !== 'admin' && <Navbar onNavigate={navigate} currentPage={currentPage} />}
      <main className="flex-1">{renderPage()}</main>
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
