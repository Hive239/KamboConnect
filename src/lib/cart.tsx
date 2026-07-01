import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Product } from '@/types/entities';

export interface CartLine {
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  image_url?: string;
  seller_name?: string;
}

interface CartValue {
  items: CartLine[];
  count: number;
  total: number;
  add: (p: Product, qty?: number) => void;
  remove: (product_id: string) => void;
  setQty: (product_id: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | undefined>(undefined);
const KEY = 'kc_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartLine[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items]);

  const add = (p: Product, qty = 1) =>
    setItems((cur) => {
      const found = cur.find((i) => i.product_id === p.id);
      if (found) return cur.map((i) => (i.product_id === p.id ? { ...i, quantity: i.quantity + qty } : i));
      return [...cur, { product_id: p.id, title: p.title, price: p.price, quantity: qty, image_url: p.image_urls?.[0], seller_name: p.seller_name }];
    });
  const remove = (id: string) => setItems((cur) => cur.filter((i) => i.product_id !== id));
  const setQty = (id: string, qty: number) =>
    setItems((cur) => (qty <= 0 ? cur.filter((i) => i.product_id !== id) : cur.map((i) => (i.product_id === id ? { ...i, quantity: qty } : i))));
  const clear = () => setItems([]);

  const count = items.reduce((n, i) => n + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return <CartContext.Provider value={{ items, count, total, add, remove, setQty, clear }}>{children}</CartContext.Provider>;
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
