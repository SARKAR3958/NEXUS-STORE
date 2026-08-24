import { create } from 'zustand';
import { db, seedProductsIfEmpty } from '../lib/firebase';
import { collection, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { products as fallbackProducts, categories } from '../data';

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  sales?: string;
  image: string;
  images?: string[];
  features?: string[];
  version?: string;
  isSale?: boolean;
  license?: string;
  enabled?: boolean;
  createdAt?: string | Date;
}

interface ProductsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  initProducts: () => void;
  getProductById: (id: string) => Product | undefined;
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: fallbackProducts,
  isLoading: true,
  error: null,

  initProducts: () => {
    try {
      // Listen to real-time changes in Firestore collection "products"
      const productsRef = collection(db, 'products');
      
      const unsubscribe = onSnapshot(
        productsRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Product[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as Product;
              list.push({
                ...data,
                id: docSnap.id || data.id,
              });
            });
            set({ products: list, isLoading: false, error: null });
          } else {
            // If empty in Firestore, trigger auto-seeding
            seedProductsIfEmpty().then(() => {
              set({ products: fallbackProducts, isLoading: false });
            });
          }
        },
        (err) => {
          console.warn('Firestore onSnapshot error, using fallback catalog:', err);
          set({ products: fallbackProducts, isLoading: false, error: err.message });
        }
      );

      return unsubscribe;
    } catch (err: any) {
      console.warn('Failed to subscribe to Firestore products:', err);
      set({ products: fallbackProducts, isLoading: false });
    }
  },

  getProductById: (id: string) => {
    return get().products.find((p) => String(p.id) === String(id)) || fallbackProducts.find((p) => String(p.id) === String(id));
  },
}));
