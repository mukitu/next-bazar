
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
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
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg">Flash</div>
        )}
        <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      <div className="p-3 md:p-5">
        <h3 
          className="text-xs md:text-sm font-black text-slate-900 mb-1 truncate cursor-pointer hover:text-orange-600 uppercase tracking-tighter"
          onClick={() => onClick(product)}
        >
          {product.name}
        </h3>
        
        <div className="flex items-center gap-2 mb-4">
          <span className="text-orange-600 font-black text-sm md:text-lg">
            {CURRENCY_SYMBOL}{hasDiscount ? product.discount_price : product.price}
          </span>
          {hasDiscount && (
            <span className="text-[10px] text-slate-300 line-through">
              {CURRENCY_SYMBOL}{product.price}
            </span>
          )}
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product, 1);
          }}
          disabled={product.stock <= 0}
          className={`w-full py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black transition-all active:scale-95 uppercase tracking-widest ${
            product.stock > 0 
            ? 'bg-slate-900 text-white hover:bg-orange-600 shadow-md shadow-slate-100' 
            : 'bg-slate-50 text-slate-300 cursor-not-allowed'
          }`}
        >
          {product.stock > 0 ? 'Add To Cart' : 'Out Of Stock'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
