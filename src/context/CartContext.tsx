import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CartItem, CustomSaladSpec } from '../types';

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  pendingSubscriptionCustom: CustomSaladSpec | null;
  setPendingSubscriptionCustom: (spec: CustomSaladSpec | null) => void;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = 'freshbowl_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [pendingSubscriptionCustom, setPendingSubscriptionCustom] = useState<CustomSaladSpec | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (incoming: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const qty = incoming.quantity || 1;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === incoming.id);
      if (existing) {
        return prev.map((i) => (i.id === incoming.id ? { ...i, quantity: i.quantity + qty } : i));
      }
      return [...prev, { ...incoming, quantity: qty }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = Number(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0).toFixed(2));
  const deliveryFee = items.length === 0 ? 0 : subtotal >= 25 ? 0 : 2.5;
  const totalAmount = Number((subtotal + deliveryFee).toFixed(2));

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        deliveryFee,
        totalAmount,
        pendingSubscriptionCustom,
        setPendingSubscriptionCustom,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
