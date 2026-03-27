import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, CartItem } from '../types';
import { COD_CHARGE, BKASH_CHARGE_RATE, SHIPPING_DHAKA, SHIPPING_OUTSIDE } from '../constants';

interface Totals {
  base: number;
  shipping: number;
  paymentCharge: number;
  total: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  getTotals: (paymentMethod: 'COD' | 'BKASH', region: 'DHAKA' | 'OUTSIDE') => Totals;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('mukit_cart');
    if (saved) {
      try { 
        setCart(JSON.parse(saved)); 
      } catch (e) { 
        console.error("Cart parsing error:", e); 
      }
    }
  }, []);

  // Sync cart to local storage
  useEffect(() => {
    localStorage.setItem('mukit_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((acc, item) => {
    const price = item.product.discount_price ?? item.product.price;
    return acc + (price * item.quantity);
  }, 0);

  const getTotals = useCallback((paymentMethod: 'COD' | 'BKASH', region: 'DHAKA' | 'OUTSIDE'): Totals => {
    const base = subtotal;
    const shipping = region === 'DHAKA' ? SHIPPING_DHAKA : SHIPPING_OUTSIDE;
    let paymentCharge = 0;
    
    if (paymentMethod === 'COD') {
      paymentCharge = COD_CHARGE;
    } else {
      paymentCharge = Math.ceil(base * BKASH_CHARGE_RATE);
    }

    return {
      base,
      shipping,
      paymentCharge,
      total: base + shipping + paymentCharge
    };
  }, [subtotal]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, getTotals }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
