
import React, { useState } from 'react';
import { Product } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { useCart } from '../context/CartContext';

interface ProductPageProps {
  product: Product;
}

const ProductPage: React.FC<ProductPageProps> = ({ product }) => {
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();

  const hasDiscount = product.discount_price && product.discount_price < product.price;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden border bg-white">
            <img src={activeImage} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {product.images.map((img, i) => (
              <button 
                key={i} 
                onClick={() => setActiveImage(img)}
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition ${activeImage === img ? 'border-orange-600' : 'border-transparent'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <nav className="text-sm text-gray-500 mb-4">
            <span className="hover:text-orange-600 cursor-pointer">Home</span> / 
            <span className="hover:text-orange-600 cursor-pointer ml-1">Products</span> / 
            <span className="ml-1 text-gray-900 font-medium">{product.name}</span>
          </nav>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <div className="flex items-center gap-2 mb-6 text-sm">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              ))}
            </div>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">4.8 (124 Ratings)</span>
            <span className="text-gray-400">|</span>
            <span className="text-orange-600 font-medium">{product.stock} In Stock</span>
          </div>

          <div className="bg-orange-50 p-6 rounded-xl mb-8">
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-orange-600">
                {CURRENCY_SYMBOL}{hasDiscount ? product.discount_price : product.price}
              </span>
              {hasDiscount && (
                <span className="text-xl text-gray-400 line-through mb-1">
                  {CURRENCY_SYMBOL}{product.price}
                </span>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">SKU</h4>
            <span className="bg-gray-100 px-3 py-1 rounded text-xs text-gray-600">{product.sku}</span>
          </div>

          <div className="mb-8">
            <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Quantity</h4>
            <div className="flex items-center border rounded-lg w-max">
              <button 
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="p-3 hover:bg-gray-50 text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
              </button>
              <input 
                type="number" 
                value={qty} 
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                className="w-16 text-center focus:outline-none border-x py-2"
              />
              <button 
                onClick={() => setQty(Math.min(product.stock, qty + 1))}
                className="p-3 hover:bg-gray-50 text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => addToCart(product, qty)}
              disabled={product.stock <= 0}
              className="flex-1 bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ADD TO CART
            </button>
            <button className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-400 hover:text-red-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>
          </div>

          <div className="mt-12 border-t pt-8">
            <h4 className="font-bold text-gray-900 mb-4">Description</h4>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
