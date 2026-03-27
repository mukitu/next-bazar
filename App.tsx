
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
import SitePageView from './pages/SitePageView';
import { Product } from './types';
import { fetchProducts } from './lib/supabase';

const MainContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [currentPageSlug, setCurrentPageSlug] = useState('');
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
    setGlobalSearch(''); // clear search on navigation
  };

  const navigateToPage = (slug: string) => {
    setCurrentPageSlug(slug);
    navigate('page');
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
        return <HomePage products={products} onProductClick={onProductClick} searchQuery={globalSearch} onSearchChange={setGlobalSearch} />;
      case 'product': return selectedProduct ? <ProductPage product={selectedProduct} /> : <HomePage products={products} onProductClick={onProductClick} searchQuery={globalSearch} onSearchChange={setGlobalSearch} />;
      case 'cart': return <CartPage onCheckout={() => navigate('checkout')} onShop={() => navigate('home')} />;
      case 'checkout': return <CheckoutPage onComplete={() => navigate('user-dashboard')} />;
      case 'admin': 
        if (isAdmin) return <AdminDashboard onNavigatePage={navigateToPage} />;
        return <HomePage products={products} onProductClick={onProductClick} searchQuery={globalSearch} onSearchChange={setGlobalSearch} />;
      case 'user-dashboard': 
      case 'orders': 
        return user ? <UserDashboard /> : <Login onAuthSuccess={() => navigate('user-dashboard')} />;
      case 'login': return <Login onAuthSuccess={() => navigate('home')} />;
      case 'page': return currentPageSlug ? <SitePageView slug={currentPageSlug} onBack={() => navigate('home')} /> : <HomePage products={products} onProductClick={onProductClick} searchQuery={globalSearch} onSearchChange={setGlobalSearch} />;
      default: return <HomePage products={products} onProductClick={onProductClick} searchQuery={globalSearch} onSearchChange={setGlobalSearch} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {currentPage !== 'admin' && <Navbar onNavigate={navigate} onNavigatePage={navigateToPage} currentPage={currentPage} searchQuery={globalSearch} onSearchChange={setGlobalSearch} />}
      <main className="flex-1">
        {renderPage()}
      </main>
      {currentPage !== 'admin' && (
        <footer className="bg-gray-900 text-gray-300 pt-16 pb-28 md:pb-0 mt-12">
          {/* Main Footer Columns */}
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-10 pb-12 border-b border-gray-700">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4">
                <span className="text-2xl font-black text-white uppercase tracking-tight">NEXT<span className="text-orange-500">BAZAR</span></span>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Premium E-Commerce</p>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">বিশ্বস্ত অনলাইন শপিং প্ল্যাটফর্ম। সেরা মানের পণ্য, দ্রুত ডেলিভারি।</p>
              <div className="space-y-2 text-xs text-gray-400">
                <p className="flex items-center gap-2">📍 ঢাকা, বাংলাদেশ</p>
                <p className="flex items-center gap-2">📞 01700-000000</p>
                <p className="flex items-center gap-2">✉️ support@nextbazar.com</p>
              </div>
              <div className="flex gap-3 mt-5">
                <a href="#" className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold hover:bg-blue-700 transition">f</a>
                <a href="#" className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-white text-xs font-bold hover:bg-sky-600 transition">t</a>
                <a href="#" className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold hover:opacity-90 transition">in</a>
              </div>
            </div>

            {/* Information */}
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-widest mb-5 border-b border-gray-700 pb-3">তথ্য</h4>
              <ul className="space-y-2.5 text-xs text-gray-400">
                {[
                  { label: 'আমাদের সম্পর্কে', slug: 'about-us' },
                  { label: 'যোগাযোগ', slug: 'contact' },
                  { label: 'শর্তাবলী', slug: 'terms' },
                  { label: 'গোপনীয়তা নীতি', slug: 'privacy' },
                  { label: 'ক্যারিয়ার', slug: 'career' },
                ].map(item => (
                  <li key={item.slug}><button onClick={() => navigateToPage(item.slug)} className="hover:text-orange-400 transition text-left">{item.label}</button></li>
                ))}
              </ul>
            </div>

            {/* Shop By */}
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-widest mb-5 border-b border-gray-700 pb-3">কেনাকাটা</h4>
              <ul className="space-y-2.5 text-xs text-gray-400">
                {['নতুন পণ্য', 'ফ্ল্যাশ সেল', 'বিশেষ অফার', 'ফিচার্ড পণ্য', 'সব পণ্য'].map(item => (
                  <li key={item}><button onClick={() => navigate('home')} className="hover:text-orange-400 transition text-left">{item}</button></li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-widest mb-5 border-b border-gray-700 pb-3">সাপোর্ট</h4>
              <ul className="space-y-2.5 text-xs text-gray-400">
                {['সাপোর্ট সেন্টার', 'কিভাবে অর্ডার করবেন', 'অর্ডার ট্র্যাকিং', 'পেমেন্ট', 'শিপিং', 'FAQ'].map(item => (
                  <li key={item}><span className="hover:text-orange-400 transition cursor-pointer">{item}</span></li>
                ))}
              </ul>
            </div>

            {/* Policy */}
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-widest mb-5 border-b border-gray-700 pb-3">পলিসি</h4>
              <ul className="space-y-2.5 text-xs text-gray-400">
                {[
                  { label: 'রিটার্ন পলিসি', slug: 'return-policy' },
                  { label: 'রিফান্ড পলিসি', slug: 'refund-policy' },
                  { label: 'এক্সচেঞ্জ', slug: 'exchange' },
                  { label: 'বাতিল করুন', slug: 'cancellation' },
                  { label: 'এক্সট্রা ডিসকাউন্ট', slug: 'extra-discount' },
                ].map(item => (
                  <li key={item.slug}><button onClick={() => navigateToPage(item.slug)} className="hover:text-orange-400 transition text-left">{item.label}</button></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Payment Methods + Copyright */}
          <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[11px] text-gray-500">© ২০২৬ NextBazar. সমস্ত অধিকার সংরক্ষিত।</p>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="text-[10px] text-gray-500 font-semibold mr-1">পেমেন্ট করুন:</span>
              {['VISA', 'MasterCard', 'bKash', 'Nagad', 'Rocket', 'COD'].map(method => (
                <span key={method} className="bg-gray-700 text-gray-300 text-[9px] font-bold px-2.5 py-1 rounded border border-gray-600">{method}</span>
              ))}
            </div>
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
