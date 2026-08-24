import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useCartStore } from './cartStore';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: 'user' | 'admin';
  status?: string;
  banReason?: string;
  password?: string;
  authType?: 'google' | 'manual';
  provider?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initAuth: () => void;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

let userDocUnsub: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  initAuth: () => {
    onAuthStateChanged(auth, (firebaseUser) => {
      if (userDocUnsub) {
        userDocUnsub();
        userDocUnsub = null;
      }

      if (firebaseUser) {
        // Attach real-time snapshot to listen for real-time ban / status changes
        userDocUnsub = onSnapshot(doc(db, 'users', firebaseUser.uid), (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data();
            const provider = (data.provider || data.authProvider || '').toLowerCase();
            const isGoogle = 
              firebaseUser.providerData.some(p => p.providerId === 'google.com') ||
              provider === 'google.com' ||
              provider === 'google';

            set({
              user: {
                id: firebaseUser.uid,
                name: data.name || firebaseUser.displayName || 'User',
                email: data.email || firebaseUser.email || '',
                phone: data.phone || firebaseUser.phoneNumber || '',
                photoURL: data.photoURL || firebaseUser.photoURL || '',
                role: data.role === 'admin' ? 'admin' : 'user',
                status: data.status || 'Active',
                banReason: data.banReason || '',
                password: data.password || '',
                authType: isGoogle ? 'google' : 'manual',
                provider: data.provider || (isGoogle ? 'google.com' : 'password'),
              },
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            const isGoogle = firebaseUser.providerData.some(p => p.providerId === 'google.com');
            set({
              user: {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'User',
                email: firebaseUser.email || '',
                phone: firebaseUser.phoneNumber || '',
                photoURL: firebaseUser.photoURL || '',
                role: 'user',
                status: 'Active',
                banReason: '',
                authType: isGoogle ? 'google' : 'manual',
                provider: isGoogle ? 'google.com' : 'password',
              },
              isAuthenticated: true,
              isLoading: false,
            });
          }
        }, (error) => {
          console.error("Failed to fetch user data:", error);
          set({ user: null, isAuthenticated: false, isLoading: false });
        });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    });
  },
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  logout: async () => {
    if (userDocUnsub) {
      userDocUnsub();
      userDocUnsub = null;
    }
    await firebaseSignOut(auth);
    useCartStore.getState().clearCart();
    set({ user: null, isAuthenticated: false });
  },
}));

