
import React, { useState, useEffect, useRef } from 'react';
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
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  const featuredProducts = products.filter(p => p.is_featured);

  useEffect(() => {
    if (featuredProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % featuredProducts.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [featuredProducts.length]);

  const isSearching = searchQuery.trim().length > 0;
  const flatFiltered = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // A-Z sorted categories that have at least one product
  const sortedCategories = [...categories]
    .filter(cat => products.some(p => p.category_id === cat.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Products with no or unknown category
  const uncategorised = products.filter(p => !p.category_id || !categories.find(c => c.id === p.category_id));

  const scrollToCategory = (catId: string) => {
    setSelectedCategory(catId);
    const el = sectionRefs.current[catId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 animate-fadeIn pb-32">

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search products by name..."
            className="w-full bg-white border-none rounded-[2rem] py-5 px-14 shadow-xl shadow-slate-200/40 text-sm font-medium focus:ring-4 focus:ring-orange-500/10 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Hero Slider */}
      {featuredProducts.length > 0 && (
        <section className="relative h-[280px] md:h-[550px] rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden mb-16 shadow-2xl group">
          <div className="absolute inset-0 flex transition-transform duration-1000" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {featuredProducts.map((p) => (
              <div key={p.id} className="min-w-full h-full relative cursor-pointer" onClick={() => onProductClick(p)}>
                <img src={p.images[0]} className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-[3000ms]" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent p-10 md:p-24 flex flex-col justify-end md:justify-center">
                  <div className="bg-orange-600 w-max px-4 py-1.5 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-white mb-6 animate-pulse shadow-lg shadow-orange-900/40">Hot Featured</div>
                  <h2 className="text-3xl md:text-7xl font-black text-white uppercase italic tracking-tighter mb-4 md:mb-8 leading-tight max-w-2xl drop-shadow-2xl">
                    {p.name.split(' ').slice(0, 2).join(' ')}<br />{p.name.split(' ').slice(2).join(' ')}
                  </h2>
                  <div className="flex items-center gap-6 mb-8 md:mb-12">
                    <span className="text-2xl md:text-5xl font-black text-orange-500 drop-shadow-md">{CURRENCY_SYMBOL}{p.discount_price || p.price}</span>
                    {p.discount_price && <span className="text-lg md:text-2xl line-through text-slate-400 font-bold">{CURRENCY_SYMBOL}{p.price}</span>}
                  </div>
                  <button className="bg-white text-slate-900 px-10 md:px-14 py-4 md:py-5 rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] w-max hover:bg-orange-600 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-2xl">VIEW DETAILS</button>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-10">
            {featuredProducts.map((_, idx) => (
              <button key={idx} onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }} className={`h-1.5 transition-all rounded-full ${idx === currentSlide ? 'w-12 bg-orange-600 shadow-lg shadow-orange-500/50' : 'w-3 bg-white/40 hover:bg-white/60'}`} />
            ))}
          </div>
        </section>
      )}

      {/* Category Quick-Jump Bar (only when not searching) */}
      {!isSearching && sortedCategories.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-slate-900">Browse <span className="text-orange-500">Categories</span></h2>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sortedCategories.length} Departments</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {sortedCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`flex-shrink-0 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all hover:scale-105 active:scale-95 ${selectedCategory === cat.id ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}
              >
                {cat.name}
                <span className="ml-2 text-[8px] opacity-50">({products.filter(p => p.category_id === cat.id).length})</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* SEARCH RESULTS MODE */}
      {isSearching && (
        <section>
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-slate-900">Results for "{searchQuery}"</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">{flatFiltered.length} items found</p>
            </div>
            <button onClick={() => setSearchQuery('')} className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline">Clear</button>
          </div>
          {flatFiltered.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5 md:gap-8">
              {flatFiltered.map(p => <ProductCard key={p.id} product={p} onClick={onProductClick} />)}
            </div>
          ) : (
            <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
              <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">No products found</p>
            </div>
          )}
        </section>
      )}

      {/* CATEGORY-WISE A to Z product sections */}
      {!isSearching && (
        <div className="space-y-20">
          {sortedCategories.map(cat => {
            const catProducts = products.filter(p => p.category_id === cat.id);
            if (catProducts.length === 0) return null;
            return (
              <section
                key={cat.id}
                ref={el => { sectionRefs.current[cat.id] = el; }}
                className="scroll-mt-24"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-10 bg-orange-500 rounded-full"></div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-slate-900">{cat.name}</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{catProducts.length} Products</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest px-5 py-2.5 rounded-xl border-2 border-orange-100 bg-orange-50">
                    {catProducts.length} Items
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 md:gap-8">
                  {catProducts.map(p => (
                    <ProductCard key={p.id} product={p} onClick={onProductClick} />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Uncategorised products */}
          {uncategorised.length > 0 && (
            <section className="scroll-mt-24">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1.5 h-10 bg-slate-300 rounded-full"></div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-slate-500">Other Products</h2>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-0.5">{uncategorised.length} Products</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 md:gap-8">
                {uncategorised.map(p => (
                  <ProductCard key={p.id} product={p} onClick={onProductClick} />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {sortedCategories.length === 0 && uncategorised.length === 0 && (
            <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-inner">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">The collection is currently empty</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
