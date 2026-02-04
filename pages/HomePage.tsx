
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Dynamic Search Bar (Mobile First) */}
      <div className="lg:hidden mb-8">
        <div className="relative group">
           <input 
            type="text" 
            placeholder="Search for authentic goods..." 
            className="w-full bg-white border border-slate-100 rounded-2xl py-5 px-12 focus:ring-4 focus:ring-orange-500/10 shadow-sm transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className="w-6 h-6 absolute left-4 top-4.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      {/* Hero Banner - Mobile Responsive */}
      <section className="relative h-[280px] md:h-[500px] rounded-[2.5rem] overflow-hidden mb-16 shadow-2xl shadow-orange-100/50">
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200" 
          alt="Banner" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent flex flex-col justify-end md:justify-center p-10 md:px-24 text-white">
          <div className="bg-orange-500 w-max px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-lg shadow-orange-500/20">Summer Essentials</div>
          <h1 className="text-4xl md:text-7xl font-black mb-6 leading-tight tracking-tighter uppercase italic">Next Gen<br/>Shopping.</h1>
          <p className="hidden md:block text-lg text-slate-300 mb-10 max-w-md font-medium">Experience lightning fast delivery across Bangladesh. Authentic brands, verified sellers.</p>
          <button className="bg-white text-slate-900 px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest w-max transition hover:bg-orange-500 hover:text-white hover:scale-105 active:scale-95 shadow-2xl">
            EXPLORE STORE
          </button>
        </div>
      </section>

      {/* Modern Category Selector */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Department</h2>
          <button onClick={() => setSelectedCategory(null)} className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline">Reset View</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
          {mainCategories.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest border-2 transition-all duration-300 ${selectedCategory === cat.id ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-500 border-slate-50 hover:border-orange-200'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Grid */}
      <section className="mb-20">
        <div className="flex justify-between items-end mb-10">
          <div className="space-y-1">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">
              {searchQuery ? `Searching for "${searchQuery}"` : 'Handpicked for you'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredProducts.length} Items Available</p>
          </div>
        </div>
        
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-10">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} onClick={onProductClick} />
            ))}
          </div>
        ) : (
          <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">The catalog is empty in this view</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
