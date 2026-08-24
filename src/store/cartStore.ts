import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  category: string;
  thumbnailUrl?: string;
  image?: string;
  description?: string;
  images?: string[];
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (isOpen: boolean) => void;
  getTotals: () => { subtotal: number; count: number };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) => {
        const { items } = get();
        // Prevent duplicates for digital assets (usually buy once)
        if (!items.find((i) => i.id === item.id)) {
          set({ items: [...items, item], isOpen: true });
        } else {
          set({ isOpen: true });
        }
      },
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setCartOpen: (isOpen) => set({ isOpen }),
      getTotals: () => {
        const { items } = get();
        const subtotal = items.reduce((sum, item) => sum + item.price, 0);
        return { subtotal, count: items.length };
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }), // Only persist items, not UI state (isOpen)
    }
  )
);
