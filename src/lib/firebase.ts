import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  query, 
  where, 
  addDoc, 
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import config from '../../firebase-applet-config.json';
import { products as localProducts } from '../data';

// Initialize Firebase with provided configuration
export const app = initializeApp(config);

export const auth = getAuth(app);

// Use default or custom database instance
export const db = config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Test firestore connection
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client appears offline or Firestore initialization pending.");
    }
  }
}

// Seed data function to populate firestore with all mock products from data.ts
export const seedProductsIfEmpty = async () => {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    
    if (snapshot.empty) {
      console.log('Seeding initial mock products into Firestore collection...');
      for (const prod of localProducts) {
        await setDoc(doc(db, 'products', prod.id), {
          ...prod,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      console.log('All mock products successfully seeded into Firestore.');
    }
  } catch (error) {
    console.warn("Could not seed products into Firestore:", error);
  }
};

// Auto-run connection test & seed
testConnection();
seedProductsIfEmpty();

