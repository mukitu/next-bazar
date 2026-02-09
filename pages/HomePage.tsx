
import React, { useState, useEffect } from 'react';
import { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import { fetchCategories } from '../lib/supabase';
import { CURRENCY_SYMBOL } from '../constants';

interface HomePageProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

const HomePage: React.FC<HomePageProps> = ({ products, onProductClick }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  const featuredProducts = products.filter(p => p.is_featured);
  
  // Auto-slide logic
  useEffect(() => {
    if (featuredProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % featuredProducts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredProducts.length]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const mainCategories = categories.filter(c => !c.parent_id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 animate-fadeIn pb-24 md:pb-8">
      {/* Search Bar */}
      <div className="mb-6 md:mb-10">
        <div className="relative group">
           <input 
            type="text" 
            placeholder="Search for premium products..." 
            className="w-full bg-white border border-slate-100 rounded-2xl py-4 md:py-5 px-12 focus:ring-4 focus:ring-orange-500/10 shadow-sm transition-all text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      {/* Featured Slider (Hot Products) */}
      {featuredProducts.length > 0 && (
        <section className="relative h-[250px] md:h-[500px] rounded-[2rem] md:rounded-[3rem] overflow-hidden mb-12 shadow-2xl group">
          <div className="relative w-full h-full">
            {featuredProducts.map((p, idx) => (
              <div 
                key={p.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <img 
                  src={p.images[0]} 
                  alt={p.name} 
                  className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-[2000ms]"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900 via-slate-900/50 to-transparent flex flex-col justify-end md:justify-center p-8 md:px-24 text-white">
                  <div className="bg-orange-600 w-max px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-4 animate-bounce">Hot Featured</div>
                  <h2 className="text-2xl md:text-6xl font-black mb-3 md:mb-6 leading-tight tracking-tighter uppercase italic drop-shadow-lg">
                    {p.name.split(' ').slice(0, 2).join(' ')}<br/>{p.name.split(' ').slice(2).join(' ')}
                  </h2>
                  <div className="flex items-center gap-4 mb-6 md:mb-10">
                    <span className="text-xl md:text-4xl font-black text-orange-500">{CURRENCY_SYMBOL}{p.discount_price || p.price}</span>
                    {p.discount_price && <span className="text-sm md:text-xl line-through text-slate-300">{CURRENCY_SYMBOL}{p.price}</span>}
                  </div>
                  <button 
                    onClick={() => onProductClick(p)}
                    className="bg-white text-slate-900 px-8 md:px-12 py-3 md:py-5 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest w-max transition-all hover:bg-orange-600 hover:text-white active:scale-95 shadow-2xl"
                  >
                    SHOP NOW
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Slider Indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {featuredProducts.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 transition-all rounded-full ${idx === currentSlide ? 'w-8 bg-orange-600' : 'w-2 bg-white/50'}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Category Icons/Selection */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900 italic">Categories</h2>
          <button onClick={() => setSelectedCategory(null)} className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline">View All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {mainCategories.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-8 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest border-2 transition-all ${selectedCategory === cat.id ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-500 border-slate-50 hover:border-orange-200 shadow-sm'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <section className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900 italic">
              {searchQuery ? 'Search Results' : 'Recommended Store'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredProducts.length} Premium Items</p>
          </div>
          <div className="flex gap-2">
             <div className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Free Delivery</div>
             <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic">Authentic</div>
          </div>
        </div>
        
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} onClick={onProductClick} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">No products found</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
