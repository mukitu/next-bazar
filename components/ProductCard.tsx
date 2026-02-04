
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
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden group hover:shadow-md transition duration-300">
      <div 
        className="relative aspect-square overflow-hidden cursor-pointer"
        onClick={() => onClick(product)}
      >
        <img 
          src={product.images[0]} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        {product.is_flash_sale && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">FLASH SALE</span>
        )}
      </div>

      <div className="p-4">
        <h3 
          className="text-sm font-medium text-gray-900 mb-1 truncate cursor-pointer hover:text-orange-600"
          onClick={() => onClick(product)}
        >
          {product.name}
        </h3>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="text-orange-600 font-bold">
            {CURRENCY_SYMBOL}{hasDiscount ? product.discount_price : product.price}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
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
          className={`w-full py-2 rounded-lg text-xs font-bold transition ${
            product.stock > 0 
            ? 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white border border-orange-200' 
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {product.stock > 0 ? 'ADD TO CART' : 'OUT OF STOCK'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
