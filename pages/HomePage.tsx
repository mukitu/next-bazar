
import React, { useState, useEffect } from 'react';
import { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import { fetchCategories } from '../lib/supabase';

interface HomePageProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

const HomePage: React.FC<HomePageProps> = ({ products, onProductClick }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const mainCategories = categories.filter(c => !c.parent_id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 animate-fadeIn pb-24 md:pb-8">
      {/* Search Bar - Optimized for Mobile Thumb Access */}
      <div className="mb-6 md:mb-10">
        <div className="relative group">
           <input 
            type="text" 
            placeholder="Search for premium goods..." 
            className="w-full bg-white border border-slate-100 rounded-2xl py-4 md:py-5 px-12 focus:ring-4 focus:ring-orange-500/10 shadow-sm transition-all text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      {/* Hero Banner - Responsive Height & Padding */}
      <section className="relative h-[220px] md:h-[450px] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden mb-10 md:mb-16 shadow-xl shadow-orange-100/30">
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200" 
          alt="NextBazar Official Store" 
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent flex flex-col justify-end md:justify-center p-6 md:px-20 text-white">
          <div className="bg-orange-500 w-max px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-3 md:mb-6 shadow-lg">Limited Stock</div>
          <h1 className="text-2xl md:text-6xl font-black mb-3 md:mb-6 leading-tight tracking-tighter uppercase italic">Fastest<br/>Delivery.</h1>
          <button className="bg-white text-slate-900 px-8 md:px-12 py-3 md:py-5 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest w-max transition active:scale-95 shadow-xl">
            SHOP NOW
          </button>
        </div>
      </section>

      {/* Optimized Category Scroll */}
      <section className="mb-10 md:mb-16">
        <div className="flex items-center justify-between mb-4 md:mb-8">
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter text-slate-900">Departments</h2>
          <button onClick={() => setSelectedCategory(null)} className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline">Clear</button>
        </div>
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
          {mainCategories.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-6 md:px-10 py-3 md:py-5 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest border-2 transition-all ${selectedCategory === cat.id ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-50 hover:border-orange-200'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Optimized Product Grid */}
      <section className="mb-12">
        <div className="flex justify-between items-end mb-6 md:mb-10">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-slate-900">
              {searchQuery ? `Searching...` : 'Recommended For You'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredProducts.length} Results</p>
          </div>
        </div>
        
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-10 product-grid">
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
