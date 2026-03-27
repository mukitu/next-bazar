
import React from 'react';
import { Product } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const { addToCart } = useCart();
  const hasDiscount = product.discount_price && product.discount_price < product.price;

  const renderStars = (rating: number = 5) => {
    return (
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className={`w-3 h-3 ${i < Math.floor(rating) ? 'fill-current' : 'fill-slate-200'}`} viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      <div 
        className="relative aspect-square overflow-hidden cursor-pointer"
        onClick={() => onClick(product)}
      >
        <img 
          src={product.images[0]} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
          loading="lazy"
        />
        {product.is_flash_sale && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg">Flash Sale</div>
        )}
        <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      <div className="p-3 md:p-4 flex-1 flex flex-col">
        <h3 
          className="text-xs md:text-sm font-black text-slate-900 mb-1 line-clamp-2 cursor-pointer hover:text-orange-600 uppercase tracking-tighter"
          onClick={() => onClick(product)}
        >
          {product.name}
        </h3>
        
        <div className="flex items-center gap-2 mb-2">
          {renderStars(product.rating)}
          <span className="text-[10px] text-slate-400 font-bold">({product.review_count || 0})</span>
        </div>

        <div className="flex items-center gap-2 mb-4 mt-auto">
          <span className="text-orange-600 font-black text-sm md:text-lg">
            {CURRENCY_SYMBOL}{hasDiscount ? product.discount_price : product.price}
          </span>
          {hasDiscount && (
            <span className="text-[10px] text-slate-300 line-through">
              {CURRENCY_SYMBOL}{product.price}
            </span>
          )}
        </div>

        {product.stock > 0 ? (
          <div className="flex gap-2 w-full mt-auto">
             <button 
               onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }}
               className="flex-1 py-2.5 rounded-xl text-[9px] font-black transition-all active:scale-95 uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
             >
               Add To Cart
             </button>
             <button 
               onClick={(e) => { 
                 e.stopPropagation(); 
                 addToCart(product, 1);
                 window.location.hash = 'checkout';
               }}
               className="flex-1 py-2.5 rounded-xl text-[9px] font-black transition-all active:scale-95 uppercase tracking-widest bg-slate-900 text-white hover:bg-orange-600 shadow-md shadow-slate-100"
             >
               Buy Now
             </button>
          </div>
        ) : (
          <button 
            disabled
            className="w-full mt-auto py-2.5 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest bg-slate-50 text-slate-300 cursor-not-allowed"
          >
            Out Of Stock
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
