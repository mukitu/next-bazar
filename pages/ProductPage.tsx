
import React, { useState } from 'react';
import { Product } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { useCart } from '../context/CartContext';

interface ProductPageProps {
  product: Product;
  onNavigate?: (page: string) => void;
}

const ProductPage: React.FC<ProductPageProps> = ({ product, onNavigate }) => {
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();

  const hasDiscount = product.discount_price && product.discount_price < product.price;

  const renderStars = (rating: number = 5) => {
    return (
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-current' : 'fill-slate-200'}`} viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl bg-white">
            <img src={activeImage} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {product.images.map((img, i) => (
              <button 
                key={i} 
                onClick={() => setActiveImage(img)}
                className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all ${activeImage === img ? 'border-orange-600 scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <nav className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <span className="hover:text-orange-600 cursor-pointer transition-colors">Home</span> 
            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
            <span className="hover:text-orange-600 cursor-pointer transition-colors">Products</span> 
            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
            <span className="text-slate-900 truncate">{product.name}</span>
          </nav>
          
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 uppercase italic tracking-tighter leading-tight">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              {renderStars(product.rating)}
              <span className="text-xs font-black text-slate-900 ml-1">{product.rating || 5.0}</span>
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{product.review_count || 0} Authenticated Reviews</span>
            <div className="h-4 w-[2px] bg-slate-100"></div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {product.stock > 0 ? `${product.stock} In Stock` : 'Out Of Stock'}
            </span>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] mb-10 shadow-2xl shadow-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Current Market Price</p>
            <div className="flex items-end gap-4">
              <span className="text-5xl font-black text-orange-500 tracking-tighter">
                {CURRENCY_SYMBOL}{hasDiscount ? product.discount_price : product.price}
              </span>
              {hasDiscount && (
                <span className="text-2xl text-slate-600 line-through mb-1 font-bold">
                  {CURRENCY_SYMBOL}{product.price}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em]">Product SKU</h4>
              <span className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest">{product.sku}</span>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em]">Purchase Quantity</h4>
              <div className="flex items-center bg-white border-2 border-slate-100 rounded-2xl w-max overflow-hidden shadow-sm">
                <button 
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-4 hover:bg-slate-50 text-slate-400 transition-colors font-black"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg>
                </button>
                <input 
                  type="number" 
                  value={qty} 
                  readOnly
                  className="w-14 text-center bg-transparent font-black text-sm text-slate-900"
                />
                <button 
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="p-4 hover:bg-slate-50 text-slate-400 transition-colors font-black"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => addToCart(product, qty)}
              disabled={product.stock <= 0}
              className="flex-1 bg-slate-100 text-slate-900 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-200 transition-all shadow-2xl active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed border-2 border-slate-200"
            >
              Add To Cart
            </button>
            <button 
              onClick={() => {
                addToCart(product, qty);
                if (onNavigate) {
                   onNavigate('checkout');
                 } else {
                   window.history.pushState(null, '', '/checkout');
                   window.dispatchEvent(new PopStateEvent('popstate'));
                 }
              }}
              disabled={product.stock <= 0}
              className="flex-1 bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-orange-600 transition-all shadow-2xl active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
            >
              {product.stock > 0 ? 'Buy Now' : 'Out Of Stock'}
            </button>
            <button className="p-6 border-2 border-slate-100 rounded-[2rem] hover:bg-slate-50 transition-all text-slate-300 hover:text-red-500 shadow-sm flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>
          </div>

          <div className="mt-16 border-t border-slate-100 pt-10">
            <h4 className="text-xl font-black text-slate-900 mb-6 uppercase italic tracking-tighter">Product <span className="text-orange-500">Description</span></h4>
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-sm"
              dangerouslySetInnerHTML={{ __html: product.description || 'No description available.' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
