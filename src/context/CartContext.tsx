"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CartItem = {
  id: string; // unique ID for cart item
  productId: string;
  variantId?: string;
  title: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  stock?: number;
  customDesignId?: string;
  customDesignReference?: string;
};

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalPrice: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('hifi_cart');
    if (saved) {
      try {
        // eslint-disable-next-line
        setItems(JSON.parse(saved) as CartItem[]);
      } catch {
        console.error("Failed to parse cart");
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('hifi_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems(current => {
      const existing = current.find(i => i.productId === item.productId && i.color === item.color && i.size === item.size);
      if (existing) {
        return current.map(i => 
          i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...current, { ...item, id: Math.random().toString(36).substring(7) }];
    });
  };

  const removeItem = (id: string) => {
    setItems(current => current.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(current => current.map(i => i.id === id ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalPrice, totalItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
