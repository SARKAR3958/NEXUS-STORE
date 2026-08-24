import { create } from 'zustand';
import { auth, db, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  doc, getDoc, setDoc, collection, getDocs, 
  deleteDoc, updateDoc, onSnapshot, query 
} from 'firebase/firestore';

export type AdminPermission = 
  | 'dashboard' 
  | 'products' 
  | 'orders' 
  | 'users' 
  | 'requests' 
  | 'support' 
  | 'admins' 
  | 'popups'
  | 'settings';

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  'dashboard',
  'products',
  'orders',
  'users',
  'requests',
  'support',
  'admins',
  'popups',
  'settings'
];

export interface AdminRecord {
  id: string;
  name: string;
  email: string;
  secretKey: string;
  role: 'superadmin' | 'admin' | 'manager' | 'support';
  permissions: AdminPermission[];
  status: 'online' | 'offline';
  lastSeen?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  avatarUrl?: string;
}

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin';
  permissions: AdminPermission[];
  adminRecordId?: string;
}

interface AdminState {
  adminUser: AdminUser | null;
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  adminSecretKey: string;
  adminsList: AdminRecord[];
  currentAdminRecord: AdminRecord | null;
  error: string | null;
  
  // Actions
  initAdminSession: () => () => void;
  signInWithGoogle: () => Promise<FirebaseUser>;
  verifySecretKey: (inputKey: string) => Promise<{ success: boolean; message?: string }>;
  fetchAdminSecretKey: () => Promise<string>;
  updateAdminSecretKey: (newKey: string) => Promise<{ success: boolean; message?: string }>;
  fetchAdmins: () => () => void;
  createAdmin: (adminData: Omit<AdminRecord, 'id' | 'createdAt' | 'status'>) => Promise<{ success: boolean; id?: string; message?: string }>;
  updateAdmin: (id: string, updates: Partial<AdminRecord>) => Promise<{ success: boolean; message?: string }>;
  deleteAdmin: (id: string) => Promise<{ success: boolean; message?: string }>;
  updatePresence: (status: 'online' | 'offline') => Promise<void>;
  logoutAdmin: () => Promise<void>;
}

const DEFAULT_SECRET_KEY = 'speedynexus981';
const SESSION_STORAGE_KEY = 'nexus_admin_session_auth_v1';
const ACTIVE_ADMIN_ID_KEY = 'nexus_active_admin_doc_id';

export const useAdminStore = create<AdminState>((set, get) => ({
  adminUser: null,
  isAdminAuthenticated: false,
  isLoading: true,
  adminSecretKey: DEFAULT_SECRET_KEY,
  adminsList: [],
  currentAdminRecord: null,
  error: null,

  initAdminSession: () => {
    let heartbeatInterval: any = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      const isSessionActive = sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
      const storedAdminDocId = sessionStorage.getItem(ACTIVE_ADMIN_ID_KEY);
      
      if (user && isSessionActive) {
        // Fetch current master key from Firestore
        const currentKey = await get().fetchAdminSecretKey();

        // Check if there is an existing admin doc in Firestore matching user or session
        let matchedRecord: AdminRecord | null = null;
        try {
          if (storedAdminDocId) {
            const docSnap = await getDoc(doc(db, 'admins', storedAdminDocId));
            if (docSnap.exists()) {
              matchedRecord = { id: docSnap.id, ...docSnap.data() } as AdminRecord;
            }
          }
          
          if (!matchedRecord && user.email) {
            const q = query(collection(db, 'admins'));
            const snap = await getDocs(q);
            snap.forEach((d) => {
              const data = d.data() as AdminRecord;
              if (data.email?.toLowerCase() === user.email?.toLowerCase()) {
                matchedRecord = { id: d.id, ...data };
              }
            });
          }
        } catch (e) {
          console.error("Error finding admin record:", e);
        }

        const effectivePermissions = matchedRecord?.permissions && matchedRecord.permissions.length > 0
          ? matchedRecord.permissions
          : ALL_ADMIN_PERMISSIONS;

        set({
          adminUser: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || matchedRecord?.name || 'Admin',
            photoURL: user.photoURL || matchedRecord?.avatarUrl || null,
            role: 'admin',
            permissions: effectivePermissions,
            adminRecordId: matchedRecord?.id,
          },
          currentAdminRecord: matchedRecord,
          isAdminAuthenticated: true,
          adminSecretKey: currentKey,
          isLoading: false,
          error: null,
        });

        // Set online status & update lastSeen
        if (matchedRecord?.id) {
          try {
            await updateDoc(doc(db, 'admins', matchedRecord.id), {
              status: 'online',
              lastSeen: new Date().toISOString(),
            });
          } catch (err) {
            console.error("Error setting online status:", err);
          }

          // Start presence heartbeat every 45 seconds
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          heartbeatInterval = setInterval(async () => {
            if (get().isAdminAuthenticated && matchedRecord?.id) {
              try {
                await updateDoc(doc(db, 'admins', matchedRecord.id), {
                  status: 'online',
                  lastSeen: new Date().toISOString(),
                });
              } catch (e) {
                // Ignore error if deleted
              }
            }
          }, 45000);
        }

      } else {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        set({
          adminUser: user ? {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Admin User',
            photoURL: user.photoURL,
            role: 'admin',
            permissions: ALL_ADMIN_PERMISSIONS
          } : null,
          currentAdminRecord: null,
          isAdminAuthenticated: false,
          isLoading: false,
        });
      }
    });

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      unsubscribeAuth();
    };
  },

  fetchAdminSecretKey: async () => {
    try {
      const configDocRef = doc(db, 'system_config', 'admin_settings');
      const docSnap = await getDoc(configDocRef);

      if (docSnap.exists() && docSnap.data().secretKey) {
        const key = String(docSnap.data().secretKey).trim();
        set({ adminSecretKey: key });
        return key;
      } else {
        // Automatically initialize default key in Firestore
        await setDoc(configDocRef, {
          secretKey: DEFAULT_SECRET_KEY,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'system_init',
          appName: 'Nexus Store Admin'
        }, { merge: true });
        
        set({ adminSecretKey: DEFAULT_SECRET_KEY });
        return DEFAULT_SECRET_KEY;
      }
    } catch (err: any) {
      console.warn('Error reading admin secret key from Firestore, using fallback:', err);
      return DEFAULT_SECRET_KEY;
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Update user doc in Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        name: user.displayName || 'Admin User',
        email: user.email || '',
        photoURL: user.photoURL || '',
        role: 'admin',
        lastAdminLoginAttempt: new Date().toISOString(),
      }, { merge: true });

      set({
        adminUser: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'admin',
          permissions: ALL_ADMIN_PERMISSIONS,
        },
        isLoading: false
      });

      return user;
    } catch (err: any) {
      console.error('Google Sign-In Error for Admin:', err);
      set({ isLoading: false, error: err?.message || 'Google Sign-In failed.' });
      throw err;
    }
  },

  verifySecretKey: async (inputKey: string) => {
    set({ isLoading: true, error: null });
    try {
      const trimmedInput = inputKey.trim();
      const currentUser = auth.currentUser;

      // 1. Check master key
      const masterKey = (await get().fetchAdminSecretKey()).trim();
      let matchedRecord: AdminRecord | null = null;

      // 2. Also check if any admin doc has this secret key or belongs to this email
      try {
        const adminsSnap = await getDocs(collection(db, 'admins'));
        adminsSnap.forEach((d) => {
          const data = d.data() as AdminRecord;
          if (data.secretKey?.trim() === trimmedInput) {
            matchedRecord = { id: d.id, ...data };
          }
        });
      } catch (err) {
        console.warn("Error checking admins collection for key:", err);
      }

      const isKeyValid = (trimmedInput === masterKey) || (matchedRecord !== null);

      if (isKeyValid) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
        if (matchedRecord) {
          sessionStorage.setItem(ACTIVE_ADMIN_ID_KEY, (matchedRecord as AdminRecord).id);
        }

        const effectivePermissions = matchedRecord?.permissions && matchedRecord.permissions.length > 0
          ? matchedRecord.permissions
          : ALL_ADMIN_PERMISSIONS;

        if (currentUser) {
          set({
            adminUser: {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || matchedRecord?.name || 'Admin',
              photoURL: currentUser.photoURL || matchedRecord?.avatarUrl || null,
              role: 'admin',
              permissions: effectivePermissions,
              adminRecordId: matchedRecord?.id,
            },
            currentAdminRecord: matchedRecord,
            isAdminAuthenticated: true,
            isLoading: false,
            error: null
          });

          // Mark online in Firestore if admin record exists
          if (matchedRecord?.id) {
            try {
              await updateDoc(doc(db, 'admins', matchedRecord.id), {
                status: 'online',
                lastSeen: new Date().toISOString(),
              });
            } catch (e) {
              console.error("Error setting online:", e);
            }
          }
        } else {
          set({ 
            isAdminAuthenticated: true, 
            isLoading: false, 
            error: null,
            currentAdminRecord: matchedRecord,
            adminUser: {
              uid: matchedRecord?.id || 'admin_session',
              email: matchedRecord?.email || 'admin@nexus.io',
              displayName: matchedRecord?.name || 'Admin',
              photoURL: matchedRecord?.avatarUrl || null,
              role: 'admin',
              permissions: effectivePermissions,
              adminRecordId: matchedRecord?.id,
            }
          });
        }
        return { success: true };
      } else {
        set({ isLoading: false, error: 'Incorrect Admin Security Key. Access Denied.' });
        return { success: false, message: 'Incorrect Admin Security Key. Please verify and try again.' };
      }
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Verification failed.' });
      return { success: false, message: 'Verification error occurred.' };
    }
  },

  updateAdminSecretKey: async (newKey: string) => {
    if (!newKey || newKey.trim().length < 4) {
      return { success: false, message: 'Security key must be at least 4 characters long.' };
    }

    try {
      const configDocRef = doc(db, 'system_config', 'admin_settings');
      const cleanKey = newKey.trim();
      
      await setDoc(configDocRef, {
        secretKey: cleanKey,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email || 'admin',
      }, { merge: true });

      set({ adminSecretKey: cleanKey });
      return { success: true, message: 'Admin master security key successfully updated in Firestore!' };
    } catch (err: any) {
      console.error('Failed to update admin key in Firestore:', err);
      return { success: false, message: err?.message || 'Failed to update key in database.' };
    }
  },

  fetchAdmins: () => {
    try {
      const q = query(collection(db, 'admins'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: AdminRecord[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as AdminRecord);
        });

        // Sort: online first, then by createdAt desc
        list.sort((a, b) => {
          if (a.status === 'online' && b.status !== 'online') return -1;
          if (a.status !== 'online' && b.status === 'online') return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

        // Check if current user's admin doc was deleted
        const state = get();
        if (state.isAdminAuthenticated && state.adminUser?.adminRecordId) {
          const stillExists = list.some((a) => a.id === state.adminUser?.adminRecordId);
          if (!stillExists && state.adminUser.adminRecordId) {
            // Immediate kickout if deleted by another admin
            console.warn("Active admin account was deleted from Firestore. Logging out...");
            state.logoutAdmin();
          }
        }

        set({ adminsList: list });
      }, (error) => {
        console.error("Firestore onSnapshot error on admins:", error);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Failed to subscribe to admins:", error);
      return () => {};
    }
  },

  createAdmin: async (adminData) => {
    try {
      const colRef = collection(db, 'admins');
      const newDocRef = doc(colRef);
      
      const newAdmin: AdminRecord = {
        id: newDocRef.id,
        name: adminData.name.trim(),
        email: adminData.email.trim().toLowerCase(),
        secretKey: adminData.secretKey.trim(),
        role: adminData.role || 'admin',
        permissions: adminData.permissions || ALL_ADMIN_PERMISSIONS,
        status: 'offline',
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.email || 'master_admin',
        avatarUrl: adminData.avatarUrl || '',
      };

      await setDoc(newDocRef, newAdmin);
      return { success: true, id: newDocRef.id, message: 'New Administrator created successfully in Firestore!' };
    } catch (err: any) {
      console.error('Error creating admin in Firestore:', err);
      return { success: false, message: err?.message || 'Failed to create admin in Firestore.' };
    }
  },

  updateAdmin: async (id: string, updates: Partial<AdminRecord>) => {
    try {
      const docRef = doc(db, 'admins', id);
      const cleanUpdates: any = { ...updates, updatedAt: new Date().toISOString() };
      if (cleanUpdates.email) cleanUpdates.email = cleanUpdates.email.trim().toLowerCase();
      if (cleanUpdates.name) cleanUpdates.name = cleanUpdates.name.trim();
      if (cleanUpdates.secretKey) cleanUpdates.secretKey = cleanUpdates.secretKey.trim();

      await updateDoc(docRef, cleanUpdates);

      // If current user updated their own record, update state
      const state = get();
      if (state.adminUser?.adminRecordId === id) {
        set({
          adminUser: {
            ...state.adminUser,
            displayName: cleanUpdates.name || state.adminUser.displayName,
            permissions: cleanUpdates.permissions || state.adminUser.permissions,
          }
        });
      }

      return { success: true, message: 'Admin permissions and credentials updated successfully!' };
    } catch (err: any) {
      console.error('Error updating admin in Firestore:', err);
      return { success: false, message: err?.message || 'Failed to update admin in Firestore.' };
    }
  },

  deleteAdmin: async (id: string) => {
    try {
      const state = get();
      const isCurrentUser = state.adminUser?.adminRecordId === id || (state.adminUser?.email && state.adminsList.find(a => a.id === id)?.email === state.adminUser.email);
      
      // Delete document completely from Firestore
      await deleteDoc(doc(db, 'admins', id));

      // If this admin is the currently logged in user, immediately log them out
      if (isCurrentUser) {
        await state.logoutAdmin();
      }

      return { success: true, message: 'Admin account and all Firestore access data removed successfully!' };
    } catch (err: any) {
      console.error('Error deleting admin from Firestore:', err);
      return { success: false, message: err?.message || 'Failed to delete admin from Firestore.' };
    }
  },

  updatePresence: async (status: 'online' | 'offline') => {
    const state = get();
    const adminRecordId = state.adminUser?.adminRecordId;
    if (adminRecordId) {
      try {
        await updateDoc(doc(db, 'admins', adminRecordId), {
          status,
          lastSeen: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Failed to update admin presence:", err);
      }
    }
  },

  logoutAdmin: async () => {
    const state = get();
    const adminRecordId = state.adminUser?.adminRecordId;
    if (adminRecordId) {
      try {
        await updateDoc(doc(db, 'admins', adminRecordId), {
          status: 'offline',
          lastSeen: new Date().toISOString(),
        });
      } catch (e) {
        // ignore
      }
    }

    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(ACTIVE_ADMIN_ID_KEY);
    await firebaseSignOut(auth);
    set({
      adminUser: null,
      isAdminAuthenticated: false,
      currentAdminRecord: null,
      error: null
    });
  }
}));

