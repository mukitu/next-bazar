
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

      {/* Hero Slider — Professional Split Layout */}
      {featuredProducts.length > 0 && (
        <section className="relative overflow-hidden mb-10 md:mb-16">
          {/* Slide Track */}
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {featuredProducts.map((p) => (
              <div
                key={p.id}
                className="min-w-full cursor-pointer"
                onClick={() => onProductClick(p)}
              >
                <div className="relative flex flex-col md:flex-row items-stretch rounded-2xl md:rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br from-green-900 via-green-800 to-green-700 min-h-[220px] md:min-h-[420px]">
                  {/* Left — Text Panel */}
                  <div className="flex-1 flex flex-col justify-center px-8 py-10 md:px-16 md:py-14 z-10 relative">
                    {/* Decorative circles */}
                    <div className="absolute -top-10 -left-10 w-48 h-48 bg-white/5 rounded-full"></div>
                    <div className="absolute bottom-0 left-20 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>

                    {/* Badge */}
                    <div className="flex items-center gap-2 mb-5">
                      <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                        ⚡ বিশেষ অফার
                      </span>
                      {p.is_flash_sale && (
                        <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full animate-pulse">
                          Flash Sale
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h2 className="text-2xl md:text-5xl font-black text-white leading-tight mb-3 md:mb-5 max-w-lg drop-shadow">
                      {p.name.length > 50 ? p.name.substring(0, 50) + '...' : p.name}
                    </h2>

                    {/* Price */}
                    <div className="flex items-center gap-4 mb-6 md:mb-8">
                      <span className="text-3xl md:text-5xl font-black text-orange-400">
                        {CURRENCY_SYMBOL}{p.discount_price || p.price}
                      </span>
                      {p.discount_price && (
                        <div className="flex flex-col">
                          <span className="text-base md:text-xl line-through text-white/40 font-bold">{CURRENCY_SYMBOL}{p.price}</span>
                          <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-black uppercase tracking-wide">
                            {Math.round(((p.price - p.discount_price) / p.price) * 100)}% OFF
                          </span>
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <div className="flex gap-3">
                      <button className="bg-white text-green-800 px-8 py-3 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-orange-500 hover:text-white transition-all shadow-lg active:scale-95">
                        এখনই কিনুন
                      </button>
                      <button className="border-2 border-white/30 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition">
                        বিস্তারিত দেখুন
                      </button>
                    </div>
                  </div>

                  {/* Right — Product Image */}
                  <div className="w-full md:w-[42%] flex-shrink-0 relative min-h-[200px] md:min-h-0 overflow-hidden">
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="w-full h-full object-cover md:object-contain object-center transform hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-green-800/30 md:from-green-800 via-transparent to-transparent pointer-events-none"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Dots */}
          {featuredProducts.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {featuredProducts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-green-700' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
                />
              ))}
            </div>
          )}

          {/* Arrow Buttons */}
          {featuredProducts.length > 1 && (
            <>
              <button
                onClick={() => setCurrentSlide(prev => (prev - 1 + featuredProducts.length) % featuredProducts.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition z-10"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <button
                onClick={() => setCurrentSlide(prev => (prev + 1) % featuredProducts.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition z-10"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
              </button>
            </>
          )}
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
