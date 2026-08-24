import { useState, useEffect } from "react";
import { Navigate, Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Package, Download, ExternalLink, Crown, 
  CreditCard, LogOut, Home, Headphones, 
  Pencil, ChevronRight, ChevronLeft, ShieldCheck, HelpCircle, 
  CheckCircle, UserCheck, Key, Search, Check, Clock, 
  AlertCircle, Calendar, ArrowUpRight, FileText, X, Sparkles, Eye,
  Star, ShoppingCart, Zap, CheckCircle2, Layers, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { products as fallbackProducts } from "@/data";
import { useProductsStore } from "@/store/productsStore";
import { useCartStore } from "@/store/cartStore";
import { ASSETS } from "@/assets";
import { formatCurrency } from "@/lib/currency";

export interface OrderProduct {
  _id: string;
  title: string;
  category: string;
  price: number;
  originalPrice?: number;
  image?: string;
  images?: string[];
  description?: string;
  features?: string[];
  version?: string;
  rating?: number;
  reviews?: number;
}

export interface Order {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string | Date | any;
  products: OrderProduct[];
  paymentProof?: string | null;
}

export function Profile() {
  const { user, isAuthenticated, isLoading, setUser, logout } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addItem: addToCart } = useCartStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(true);
  
  // Product Details Modal state
  const [selectedProductForModal, setSelectedProductForModal] = useState<OrderProduct | null>(null);
  const [modalActiveImageIndex, setModalActiveImageIndex] = useState(0);
  const [cartSuccessMessage, setCartSuccessMessage] = useState<string | null>(null);
  
  // Tab state - focused strictly on Dashboard, My Orders, and Support
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'My Orders' | 'Support Center'>('Dashboard');
  
  // For mobile responsive view management (on mobile, user can view the list, tap to open detail tab view)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Profile Edit states & Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [newPhone, setNewPhone] = useState(user?.phone || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // My Orders sub-states (filters & search)
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'rejected'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedMobileOrder, setSelectedMobileOrder] = useState<any | null>(null);
  const [selectedTransactionReceipt, setSelectedTransactionReceipt] = useState<string | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'orders' || tabParam === 'history') {
      setActiveTab('My Orders');
      setMobileDetailOpen(true);
    } else if (tabParam === 'support') {
      setActiveTab('Support Center');
      setMobileDetailOpen(true);
    } else if (tabParam === 'dashboard') {
      setActiveTab('Dashboard');
      setMobileDetailOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setNewName(user.name);
      setNewPhone(user.phone || "");
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const fetchOrders = async () => {
        try {
          const ordersRef = collection(db, "orders");
          const q = query(ordersRef, where("userId", "==", user.id));
          const snapshot = await getDocs(q);
          
          const lookupProduct = (idOrTitle?: string, title?: string) => {
            const storeProds = useProductsStore.getState().products || [];
            const allProds = [...storeProds, ...fallbackProducts];
            return allProds.find(p => 
              (idOrTitle && (String(p.id) === String(idOrTitle) || (p as any)._id === idOrTitle)) ||
              (title && p.title.toLowerCase().trim() === title.toLowerCase().trim()) ||
              (idOrTitle && p.title.toLowerCase().trim() === idOrTitle.toLowerCase().trim())
            );
          };

          const fetchedOrders: Order[] = [];
          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const productsList: OrderProduct[] = [];
            
            if (data.items && Array.isArray(data.items)) {
              for (const item of data.items) {
                const itemId = item.id || item._id || "";
                const itemTitle = item.title || "";
                const matched = lookupProduct(itemId, itemTitle);

                const prodImage = item.image || item.thumbnailUrl || matched?.image || ASSETS.ecommercePhones;
                const prodImages = matched?.images && matched.images.length > 0
                  ? matched.images
                  : [prodImage, ASSETS.marketplaceWeb, ASSETS.pcHero, ASSETS.foodDelivery].filter(Boolean);

                productsList.push({
                  _id: itemId || matched?.id || `prod_${Math.random()}`,
                  title: itemTitle || matched?.title || "Digital Product Asset",
                  category: item.category || matched?.category || "Apps",
                  price: item.price || matched?.price || 0,
                  originalPrice: matched?.originalPrice || (item.price ? item.price * 1.5 : 99),
                  image: prodImage,
                  images: prodImages,
                  description: matched?.description || "High-performance digital asset template and clean source code package built with modern architecture and production-ready features.",
                  features: matched?.features || ["Full Source Code (.ZIP)", "Web & Mobile Responsive", "Firebase / DB Ready", "Lifetime Updates & Support"],
                  version: matched?.version || "1.0.0",
                  rating: matched?.rating || 4.9,
                  reviews: matched?.reviews || 320,
                });
              }
            } else if (data.products && Array.isArray(data.products)) {
              for (const pid of data.products) {
                if (typeof pid === "object" && pid !== null) {
                  const item = pid;
                  const itemId = item.id || item._id || "";
                  const itemTitle = item.title || "";
                  const matched = lookupProduct(itemId, itemTitle);
                  const prodImage = item.image || item.thumbnailUrl || matched?.image || ASSETS.ecommercePhones;
                  const prodImages = matched?.images && matched.images.length > 0
                    ? matched.images
                    : [prodImage, ASSETS.marketplaceWeb, ASSETS.pcHero, ASSETS.foodDelivery].filter(Boolean);

                  productsList.push({
                    _id: itemId || matched?.id || `prod_${Math.random()}`,
                    title: itemTitle || matched?.title || "Digital Product Asset",
                    category: item.category || matched?.category || "Apps",
                    price: item.price || matched?.price || 0,
                    originalPrice: matched?.originalPrice || (item.price ? item.price * 1.5 : 99),
                    image: prodImage,
                    images: prodImages,
                    description: matched?.description || "High-performance digital asset template and clean source code package built with modern architecture and production-ready features.",
                    features: matched?.features || ["Full Source Code (.ZIP)", "Web & Mobile Responsive", "Firebase / DB Ready", "Lifetime Updates & Support"],
                    version: matched?.version || "1.0.0",
                    rating: matched?.rating || 4.9,
                    reviews: matched?.reviews || 320,
                  });
                } else {
                  const pDoc = await getDoc(doc(db, "products", pid));
                  const matched = lookupProduct(pid);
                  if (pDoc.exists()) {
                    const pData = pDoc.data();
                    const prodImage = pData.image || pData.thumbnailUrl || matched?.image || ASSETS.ecommercePhones;
                    const prodImages = matched?.images && matched.images.length > 0
                      ? matched.images
                      : [prodImage, ASSETS.marketplaceWeb, ASSETS.pcHero, ASSETS.foodDelivery].filter(Boolean);

                    productsList.push({
                      _id: pDoc.id,
                      title: pData.title || matched?.title || "Digital Product Asset",
                      category: pData.category || matched?.category || "Apps",
                      price: pData.price || matched?.price || 0,
                      originalPrice: matched?.originalPrice || (pData.price ? pData.price * 1.5 : 99),
                      image: prodImage,
                      images: prodImages,
                      description: pData.description || matched?.description || "High-performance digital asset template and clean source code package built with modern architecture and production-ready features.",
                      features: matched?.features || ["Full Source Code (.ZIP)", "Web & Mobile Responsive", "Firebase / DB Ready", "Lifetime Updates & Support"],
                      version: matched?.version || "1.0.0",
                      rating: matched?.rating || 4.9,
                      reviews: matched?.reviews || 320,
                    });
                  } else if (matched) {
                    const prodImage = matched.image || ASSETS.ecommercePhones;
                    productsList.push({
                      _id: matched.id,
                      title: matched.title,
                      category: matched.category,
                      price: matched.price,
                      originalPrice: matched.originalPrice,
                      image: prodImage,
                      images: matched.images && matched.images.length > 0 ? matched.images : [prodImage, ASSETS.marketplaceWeb, ASSETS.pcHero].filter(Boolean),
                      description: matched.description,
                      features: matched.features,
                      version: matched.version || "1.0.0",
                      rating: matched.rating || 4.9,
                      reviews: matched.reviews || 320,
                    });
                  }
                }
              }
            }
            
            fetchedOrders.push({
              _id: docSnap.id,
              totalAmount: data.totalAmount || 0,
              status: data.status || "pending",
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
              products: productsList,
              paymentProof: data.paymentProof || data.screenshotProof || data.screenshotUrl || data.depositProof || null
            });
          }
          
          fetchedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(fetchedOrders);
        } catch (error) {
          console.error("Failed to fetch orders", error);
        } finally {
          setFetchingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06070c]">
        <div className="w-8 h-8 border-4 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth" />;

  const handleLogout = async () => {
    await logout();
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setProfileMessage({ type: 'error', text: 'Name is required' });
      return;
    }
    setIsUpdatingProfile(true);
    setProfileMessage(null);
    try {
      if (user?.id) {
        await updateDoc(doc(db, "users", user.id), {
          name: newName.trim(),
          phone: newPhone.trim(),
        });
        setUser({
          ...user,
          name: newName.trim(),
          phone: newPhone.trim()
        });
        setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleTabSelect = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setMobileDetailOpen(true);
  };

  // Pre-compiled total downloads count
  const totalDownloads = orders.reduce((acc, curr) => acc + curr.products.length, 0);

  // Pre-compiled list of all unique products owned by user
  const ownedProducts = orders.flatMap(o => o.products);

  const isGoogleUser = Boolean(
    auth.currentUser?.providerData.some(p => p.providerId === 'google.com') ||
    (user?.photoURL && user.photoURL.includes('googleusercontent.com')) ||
    (user as any)?.provider === 'google.com' ||
    (user as any)?.provider === 'google' ||
    (user as any)?.authType === 'google'
  );

  // Left Section containing the profile UI exactly matching the screenshot structure
  const ProfileLeftMenu = () => (
    <div className="space-y-4">
      {/* 1. Top profile section with avatar, User name, email, and Edit Profile button */}
      <div className="bg-[#0d0e15]/90 border border-[#202234] rounded-[24px] p-5 flex items-center justify-between shadow-[0_4px_25px_rgba(139,92,246,0.05)] backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.name} 
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full object-cover border-2 border-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              />
            ) : (
              <div className="w-14 h-14 bg-[#141520] text-[#a78bfa] rounded-full flex items-center justify-center border-2 border-[#8b5cf6]/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                <User className="w-6 h-6" />
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0d0e15]" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-bold text-white tracking-wide">{user?.name || "Sarkar"}</h2>
            <p className="text-[11px] text-gray-400 line-clamp-1">{user?.email || "sarkar4824@gmail.com"}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              {isGoogleUser ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-md shadow-sm">
                  <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Google Account
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/50 px-2 py-0.5 rounded-md shadow-sm">
                  <Key className="w-2.5 h-2.5 text-[#a78bfa]" />
                  Manual Sign In
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Edit Profile button */}
        
      </div>

      {/* 2. Three small statistic cards - focused on orders and investment */}
      <div className="bg-[#0d0e15]/90 border border-[#202234] rounded-[24px] p-4 shadow-[0_4px_25px_rgba(139,92,246,0.05)] backdrop-blur-xl">
        <div className="grid grid-cols-3 gap-2 text-center divide-x divide-[#202234]">
          {/* Card 1: Total Orders */}
          <div className="flex flex-col items-center justify-center py-1">
            <Package className="w-5 h-5 text-[#a78bfa] mb-1.5" />
            <span className="text-base font-black text-white leading-none">{orders.length}</span>
            <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Orders</span>
          </div>

          {/* Card 2: Approved/Delivered */}
          <div className="flex flex-col items-center justify-center py-1">
            <CheckCircle className="w-5 h-5 text-emerald-400 mb-1.5" />
            <span className="text-base font-black text-white leading-none">
              {orders.filter(o => o.status?.toLowerCase() === 'approved' || o.status?.toLowerCase() === 'completed').length}
            </span>
            <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Approved</span>
          </div>

          {/* Card 3: Total Spent */}
          <div className="flex flex-col items-center justify-center py-1">
            <CreditCard className="w-5 h-5 text-[#c084fc] mb-1.5" />
            <span className="text-base font-black text-[#a78bfa] leading-none">
              ${orders.reduce((acc, curr) => acc + curr.totalAmount, 0).toFixed(0)}
            </span>
            <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Spent</span>
          </div>
        </div>
      </div>

      {/* 3. Navigation menu - clean and focused */}
      <div className="bg-[#0d0e15]/90 border border-[#202234] rounded-[24px] p-2.5 shadow-[0_4px_25px_rgba(139,92,246,0.05)] backdrop-blur-xl">
        <nav className="space-y-1">
          {[
            { id: 'Dashboard', icon: Home, label: 'Dashboard' },
            { id: 'My Orders', icon: Package, label: 'My Orders' },
            { id: 'Support Center', icon: Headphones, label: 'Support Center' }
          ].map((item) => {
            const IconComponent = item.icon;
            const isSelected = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabSelect(item.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all relative text-left group cursor-pointer ${
                  isSelected 
                    ? 'bg-[#151622]/90 text-[#a78bfa] font-bold' 
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {/* Accent selector bar on the left */}
                {isSelected && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#8b5cf6] rounded-r-md" />
                )}
                
                <div className="flex items-center gap-3">
                  <IconComponent className={`w-4 h-4 transition-colors ${isSelected ? 'text-[#8b5cf6]' : 'text-gray-400 group-hover:text-white'}`} />
                  <span className="text-[13px] font-semibold">{item.label}</span>
                </div>
                
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-[#8b5cf6] translate-x-0.5' : 'text-gray-600 group-hover:text-white'}`} />
              </button>
            );
          })}
        </nav>
      </div>

      {/* 4. Sign Out button matching outline in screenshot */}
      <button 
        onClick={handleLogout}
        className="w-full bg-[#0d0e15]/80 hover:bg-[#8b5cf6]/5 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-[20px] py-3.5 px-4 font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(239,68,68,0.03)] cursor-pointer"
      >
        <LogOut className="w-4 h-4 shrink-0" />
        <span>Sign Out</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#06070c] pb-24 md:pb-12 text-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        
        {/* Desktop Layout - Side by Side */}
        <div className="hidden md:flex gap-8">
          
          {/* Left profile and menu bar */}
          <aside className="w-80 shrink-0 sticky top-24">
            <ProfileLeftMenu />
          </aside>

          {/* Right details content pane */}
          <main className="flex-1 min-w-0 bg-[#0d0e15]/40 border border-[#202234] rounded-[32px] p-6 lg:p-8 shadow-xl min-h-[600px] backdrop-blur-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Tab title header */}
                <div className="flex items-center justify-between border-b border-[#202234] pb-4">
                  <div>
                    <h1 className="text-lg font-extrabold text-white tracking-wide uppercase font-mono text-[#a78bfa]">{activeTab}</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Manage and track your products, downloads, and account information.</p>
                  </div>
                </div>

                {/* Dashboard Tab */}
                {activeTab === 'Dashboard' && (
                  <div className="space-y-6">
                    {/* Welcome message */}
                    <div className="bg-gradient-to-r from-violet-950/40 to-[#0d0e15] border border-[#8b5cf6]/20 rounded-2xl p-5 flex items-center justify-between shadow-[0_0_30px_rgba(139,92,246,0.05)]">
                      <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                          Welcome Back, {user?.name || "Sarkar"}! <span className="text-[#a78bfa] font-mono">⚡</span>
                        </h2>
                        <p className="text-xs text-gray-400 mt-1 max-w-md">You have {orders.length} registered orders in our systems with priority access to Nexus support and elite pre-built source codes.</p>
                      </div>
                      <Link to="/products">
                        <Button className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-[11px] font-bold h-9 px-4 rounded-lg shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all">
                          Shop Products
                        </Button>
                      </Link>
                    </div>

                    {/* Stats summary list */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-[#0f101a] border border-[#222436] p-4.5 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#8b5cf6]/5 rounded-full blur-lg"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Total Orders</span>
                        <div className="text-2xl font-black text-white">{orders.length}</div>
                        <div className="text-[10.5px] text-gray-500 mt-1">Processed transactions</div>
                      </div>
                      <div className="bg-[#0f101a] border border-[#222436] p-4.5 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-lg"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Approved Deliveries</span>
                        <div className="text-2xl font-black text-emerald-400">
                          {orders.filter(o => o.status?.toLowerCase() === 'approved' || o.status?.toLowerCase() === 'completed').length}
                        </div>
                        <div className="text-[10.5px] text-gray-500 mt-1">Ready for high-speed ZIP downloads</div>
                      </div>
                      <div className="bg-[#0f101a] border border-[#222436] p-4.5 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/5 rounded-full blur-lg"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Total Amount Invested</span>
                        <div className="text-2xl font-black text-[#a78bfa]">${orders.reduce((acc, curr) => acc + curr.totalAmount, 0).toFixed(2)}</div>
                        <div className="text-[10.5px] text-gray-500 mt-1">SadaPay / EasyPaisa checkout</div>
                      </div>
                    </div>


                  </div>
                )}

                {/* My Orders Tab */}
                {activeTab === 'My Orders' && (
                  <div className="space-y-6">
                    {/* Header Controls for Search and Filters */}
                    <div className="bg-[#0f101a] border border-[#222436] rounded-2xl p-4.5 space-y-4">
                      <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
                        {/* Search Bar */}
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text" 
                            placeholder="Search orders by Product name or ID..."
                            value={orderSearch}
                            onChange={(e) => setOrderSearch(e.target.value)}
                            className="w-full bg-[#0d0e15] border border-[#222435] focus:border-[#8b5cf6]/50 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                          />
                          {orderSearch && (
                            <button onClick={() => setOrderSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Order status stat helper */}
                        <div className="text-right shrink-0 hidden lg:block">
                          <span className="text-[10px] text-gray-400 font-mono">TOTAL ORDERS SAVED: <b className="text-white font-black">{orders.length}</b></span>
                        </div>
                      </div>

                      {/* Filter Chips list */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {[
                          { id: 'all', label: 'All', count: orders.length },
                          { id: 'pending', label: 'Pending', count: orders.filter(o => {
                            const s = o.status?.toLowerCase();
                            const isApproved = s === 'approved' || s === 'completed' || s === 'unlocked';
                            const isFailed = s === 'failed' || s === 'rejected';
                            return !isApproved && !isFailed;
                          }).length },
                          { id: 'rejected', label: 'Rejected', count: orders.filter(o => o.status?.toLowerCase() === 'failed' || o.status?.toLowerCase() === 'rejected').length }
                        ].map((chip) => {
                          const isActive = orderStatusFilter === chip.id;
                          return (
                            <button
                              key={chip.id}
                              onClick={() => setOrderStatusFilter(chip.id as any)}
                              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold tracking-wide transition-all flex items-center gap-2 cursor-pointer ${
                                isActive 
                                  ? 'bg-[#8b5cf6] text-white shadow-[0_0_12px_rgba(139,92,246,0.25)] border border-[#a78bfa]/40' 
                                  : 'bg-[#0d0e15] text-gray-400 hover:text-white border border-[#202234] hover:bg-[#141522]'
                              }`}
                            >
                              <span>{chip.label}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500'}`}>{chip.count}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Orders listing grid */}
                    {fetchingOrders ? (
                      <div className="py-16 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-3 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-gray-400 font-mono">Syncing live payments database...</span>
                      </div>
                    ) : orders.filter(order => {
                      const searchString = orderSearch.toLowerCase();
                      const matchesSearch = order._id.toLowerCase().includes(searchString) || 
                        order.products.some(p => p.title.toLowerCase().includes(searchString) || p.category.toLowerCase().includes(searchString));
                        
                      if (orderStatusFilter === 'all') return matchesSearch;
                      const s = order.status?.toLowerCase();
                      const isApproved = s === 'approved' || s === 'completed' || s === 'unlocked';
                      const isFailed = s === 'failed' || s === 'rejected';
                      const isPending = !isApproved && !isFailed;
                      if (orderStatusFilter === 'pending') return matchesSearch && isPending;
                      if (orderStatusFilter === 'rejected') return matchesSearch && isFailed;
                      return matchesSearch;
                    }).length === 0 ? (
                      <div className="bg-[#0f101a] border border-[#222436] p-12 rounded-2xl text-center space-y-4 shadow-inner">
                        <Package className="w-12 h-12 text-gray-600 mx-auto" />
                        <h3 className="text-sm font-bold text-white">No Matching Orders Found</h3>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                          We couldn't find any orders matching your criteria. Try adjusting your search query or filter types.
                        </p>
                        <Link to="/products">
                          <Button className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs h-9 px-5 rounded-lg font-bold">Browse Nexus Catalog</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {orders.filter(order => {
                          const searchString = orderSearch.toLowerCase();
                          const matchesSearch = order._id.toLowerCase().includes(searchString) || 
                            order.products.some(p => p.title.toLowerCase().includes(searchString) || p.category.toLowerCase().includes(searchString));
                            
                          if (orderStatusFilter === 'all') return matchesSearch;
                          const s = order.status?.toLowerCase();
                          const isApproved = s === 'approved' || s === 'completed' || s === 'unlocked';
                          const isFailed = s === 'failed' || s === 'rejected';
                          const isPending = !isApproved && !isFailed;
                          if (orderStatusFilter === 'pending') return matchesSearch && isPending;
                          if (orderStatusFilter === 'rejected') return matchesSearch && isFailed;
                          return matchesSearch;
                        }).map((order) => {
                          const statVal = order.status?.toLowerCase();
                          const isApproved = statVal === 'approved' || statVal === 'completed' || statVal === 'unlocked';
                          const isFailed = statVal === 'failed' || statVal === 'rejected';
                          const isPending = !isApproved && !isFailed;
                          return (
                            <div key={order._id} className="bg-[#0b0c13] border border-[#202234] rounded-[20px] p-4 text-xs relative overflow-hidden shadow-md text-left transition-all">
                              <div className="flex items-center justify-between gap-2 cursor-pointer" onClick={() => setSelectedMobileOrder(order)}>
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="w-[52px] h-[52px] rounded-xl overflow-hidden shrink-0 bg-[#151624] border border-[#262942]">
                                    {order.products[0]?.image ? (
                                      <img src={order.products[0].image} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[#a78bfa]">
                                        <Package className="w-6 h-6" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col min-w-0 text-left justify-center py-0.5">
                                    <span className="text-[11px] text-gray-500 font-mono font-bold tracking-widest uppercase mb-1">ORDER ID: #NEX-{order._id.slice(0, 7).toUpperCase()}</span>
                                    <span className="font-extrabold text-white truncate text-[14px]">{order.products[0]?.title || "Digital Asset"}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0 justify-center py-0.5">
                                  <span className="text-[#c084fc] font-black text-[14px] mb-1">${order.totalAmount.toFixed(2)}</span>
                                  <span className={`text-[12px] font-black tracking-wide ${
                                    isApproved ? 'text-emerald-400' : isPending ? 'text-[#ffb000]' : 'text-red-400'
                                  }`}>
                                    {isApproved ? 'Approved' : isPending ? 'Pending' : 'Rejected'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Support Center Tab */}
                {activeTab === 'Support Center' && (
                  <div className="space-y-4">
                    <div className="bg-[#0f101a] border border-[#222436] rounded-2xl p-5 space-y-4 text-left">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Premium Support</h3>
                      
                      <div className="text-[13px] text-gray-300 leading-relaxed space-y-4">
                        <p>
                          In Nexus Customer Support, you get premium customer support designed to make your experience smooth and hassle-free. Our support system includes NEXUS AI ASSISTANT for quick help with common questions and guidance, along with NEXUS ADMIN SUPPORT, where you can directly chat with our admin team for personalized assistance. Our current estimated reply time is 1–2 hours, so whenever you need help, our team is here to assist you as quickly as possible.
                        </p>
                      </div>

                      <div className="border-t border-[#222436] pt-5 mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5 text-gray-400">
                          <HelpCircle className="w-5 h-5 text-[#8b5cf6]" />
                          <span className="text-[11px] font-semibold">Still need customized support or have a pending issue?</span>
                        </div>
                        <button 
                          onClick={() => {
                            const chatTrigger = document.querySelector('[aria-label="Customer Support Chat"]') as HTMLButtonElement;
                            if (chatTrigger) chatTrigger.click();
                          }}
                          className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-[11px] font-extrabold tracking-wider uppercase h-10 px-6 rounded-lg shadow-md transition-all cursor-pointer"
                        >
                          OPEN CHAT ASSISTANT
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Mobile Layout - Dynamic Toggle Screens */}
        <div className="md:hidden">
          <AnimatePresence mode="wait">
            {!mobileDetailOpen ? (
              // 1. Mobile view: Profile menu (represents exactly the screenshot)
              <motion.div
                key="mobile-menu"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 max-w-md mx-auto"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">My Account Dashboard</span>
                </div>
                <ProfileLeftMenu />
              </motion.div>
            ) : (
              // 2. Mobile view: Detail content panel (when tap a menu item)
              <motion.div
                key="mobile-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 max-w-md mx-auto bg-[#0d0e15]/90 border border-[#202234] rounded-[24px] p-4 shadow-xl backdrop-blur-xl"
              >
                {/* Back button header */}
                <button 
                  onClick={() => setMobileDetailOpen(false)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#a78bfa] hover:text-[#c084fc] font-bold uppercase tracking-wider mb-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                  <span>Back to Menu</span>
                </button>

                <div className="border-b border-[#202234] pb-3 mb-4 text-left">
                  <h1 className="text-[17px] font-black text-white uppercase tracking-wider font-arial text-center text-[#a78bfa] mt-1">{activeTab}</h1>
                </div>

                {/* Dashboard Mobile Tab */}
                {activeTab === 'Dashboard' && (
                  <div className="space-y-5 text-left">
                    <div className="bg-gradient-to-br from-violet-950/30 to-[#10111a] border border-[#8b5cf6]/20 rounded-xl p-4">
                      <h2 className="text-xs font-bold text-white">Welcome, {user?.name || "Sarkar"}!</h2>
                      <p className="text-[11px] text-gray-400 mt-1 leading-normal">You have {orders.length} orders in your history.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#10111a] border border-[#222436] p-3 rounded-xl">
                        <span className="text-[9px] font-bold text-gray-400 block uppercase">Total Orders</span>
                        <span className="text-lg font-black text-white">{orders.length}</span>
                      </div>
                      <div className="bg-[#10111a] border border-[#222436] p-3 rounded-xl">
                        <span className="text-[9px] font-bold text-gray-400 block uppercase">Total Spent</span>
                        <span className="text-lg font-black text-[#a78bfa]">{formatCurrency(orders.reduce((acc, curr) => acc + curr.totalAmount, 0))}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider font-mono">Recent Orders</span>
                      {orders.slice(0, 3).map((order) => {
                        const firstProd = order.products[0];
                        return (
                          <div key={order._id} className="bg-[#10111a] border border-[#222436] p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {firstProd?.image ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedProductForModal(firstProd);
                                    setModalActiveImageIndex(0);
                                  }}
                                  className="w-10 h-10 rounded-lg bg-[#141524] border border-[#24263a] overflow-hidden shrink-0 cursor-pointer"
                                >
                                  <img src={firstProd.image} alt="" className="w-full h-full object-cover" />
                                </button>
                              ) : null}
                              <div className="min-w-0">
                                <span className="text-[9px] text-gray-500 font-mono">ORDER ID: #NEX-{order._id.slice(0, 7).toUpperCase()}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (firstProd) {
                                      setSelectedProductForModal(firstProd);
                                      setModalActiveImageIndex(0);
                                    }
                                  }}
                                  className="font-bold text-white block mt-0.5 max-w-[140px] truncate text-left hover:text-[#a78bfa] cursor-pointer"
                                >
                                  {order.products.map(p => p.title).join(', ') || 'N/A'}
                                </button>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-[#a78bfa]">${order.totalAmount.toFixed(2)}</span>
                              <span className={`text-[9px] font-bold block ${
                                order.status?.toLowerCase() === 'approved' || order.status?.toLowerCase() === 'completed' || order.status?.toLowerCase() === 'unlocked'
                                  ? 'text-emerald-400' 
                                  : order.status?.toLowerCase() === 'failed' || order.status?.toLowerCase() === 'rejected'
                                    ? 'text-red-400'
                                    : 'text-amber-400'
                              }`}>
                                {order.status?.toLowerCase() === 'approved' || order.status?.toLowerCase() === 'completed' || order.status?.toLowerCase() === 'unlocked'
                                  ? 'Approved'
                                  : order.status?.toLowerCase() === 'failed' || order.status?.toLowerCase() === 'rejected'
                                    ? 'Rejected'
                                    : 'Pending'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* My Orders Mobile Tab */}
                {activeTab === 'My Orders' && (
                  <div className="space-y-4 text-left">
                    {/* Simple search bar & state counts without scroll */}
                    <div className="space-y-2 text-left">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" 
                          placeholder="Search products..."
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                          className="w-full bg-[#07080d] border border-[#1d1f33] focus:border-[#8b5cf6]/50 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none transition-all"
                        />
                      </div>
                      
                      {/* Compact filter buttons arranged in a grid */}
                      <div className="grid grid-cols-3 gap-1.5 pb-1">
                        {[
                          { id: 'all', label: 'All' },
                          { id: 'pending', label: 'Pending' },
                          { id: 'rejected', label: 'Rejected' }
                        ].map((chip) => {
                          const isActive = orderStatusFilter === chip.id;
                          return (
                            <button
                              key={chip.id}
                              onClick={() => setOrderStatusFilter(chip.id as any)}
                              className={`py-1.5 rounded-lg text-[9.5px] font-bold tracking-wide transition-all text-center cursor-pointer border ${
                                isActive 
                                  ? 'bg-[#8b5cf6] text-white border-[#a78bfa]/40 shadow-[0_0_10px_rgba(139,92,246,0.3)]' 
                                  : 'bg-[#07080d] text-gray-400 border-[#1d1f33] hover:text-white'
                              }`}
                            >
                              {chip.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {fetchingOrders ? (
                      <div className="py-8 flex justify-center"><div className="w-5 h-5 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" /></div>
                    ) : orders.filter(order => {
                      const searchString = orderSearch.toLowerCase();
                      const matchesSearch = order._id.toLowerCase().includes(searchString) || 
                        order.products.some(p => p.title.toLowerCase().includes(searchString) || p.category.toLowerCase().includes(searchString));
                        
                      if (orderStatusFilter === 'all') return matchesSearch;
                      const s = order.status?.toLowerCase();
                      const isApproved = s === 'approved' || s === 'completed' || s === 'unlocked';
                      const isFailed = s === 'failed' || s === 'rejected';
                      const isPending = !isApproved && !isFailed;
                      if (orderStatusFilter === 'pending') return matchesSearch && isPending;
                      if (orderStatusFilter === 'rejected') return matchesSearch && isFailed;
                      return matchesSearch;
                    }).length === 0 ? (
                      <div className="bg-[#0b0c13] border border-[#1c1d2e] p-8 rounded-xl text-center text-xs text-gray-400 font-mono">No matching orders found.</div>
                    ) : (
                      <div className="space-y-4">
                        {orders.filter(order => {
                          const searchString = orderSearch.toLowerCase();
                          const matchesSearch = order._id.toLowerCase().includes(searchString) || 
                            order.products.some(p => p.title.toLowerCase().includes(searchString) || p.category.toLowerCase().includes(searchString));
                            
                          if (orderStatusFilter === 'all') return matchesSearch;
                          const s = order.status?.toLowerCase();
                          const isApproved = s === 'approved' || s === 'completed' || s === 'unlocked';
                          const isFailed = s === 'failed' || s === 'rejected';
                          const isPending = !isApproved && !isFailed;
                          if (orderStatusFilter === 'pending') return matchesSearch && isPending;
                          if (orderStatusFilter === 'rejected') return matchesSearch && isFailed;
                          return matchesSearch;
                        }).map((order) => {
                          const statVal = order.status?.toLowerCase();
                          const isApproved = statVal === 'approved' || statVal === 'completed' || statVal === 'unlocked';
                          const isFailed = statVal === 'failed' || statVal === 'rejected';
                          const isPending = !isApproved && !isFailed;

                          return (
                            <div key={order._id} className="bg-[#0b0c13] border border-[#202234] rounded-[20px] p-4 text-xs relative overflow-hidden shadow-md text-left transition-all">
                              <div className="flex items-center justify-between gap-2 cursor-pointer" onClick={() => setSelectedMobileOrder(order)}>
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="w-[52px] h-[52px] rounded-xl overflow-hidden shrink-0 bg-[#151624] border border-[#262942]">
                                    {order.products[0]?.image ? (
                                      <img src={order.products[0].image} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[#a78bfa]">
                                        <Package className="w-6 h-6" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col min-w-0 text-left justify-center py-0.5">
                                    <span className="text-[11px] text-gray-500 font-mono font-bold tracking-widest uppercase mb-1">ID: #NEX-{order._id.slice(0, 7).toUpperCase()}</span>
                                    <span className="font-extrabold text-white truncate text-[14px]">{order.products[0]?.title || "Digital Asset"}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0 justify-center py-0.5">
                                  <span className="text-[#c084fc] font-black text-[14px] mb-1">${order.totalAmount.toFixed(2)}</span>
                                  <span className={`text-[12px] font-black tracking-wide ${
                                    isApproved ? 'text-emerald-400' : isPending ? 'text-[#ffb000]' : 'text-red-400'
                                  }`}>
                                    {isApproved ? 'Approved' : isPending ? 'Pending' : 'Rejected'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Support Center Mobile Tab */}
                {activeTab === 'Support Center' && (
                  <div className="space-y-4 text-left">
                    <div className="bg-[#10111a] border border-[#222436] p-5 rounded-xl space-y-4">
                      <div className="space-y-3">
                        <h4 className="font-bold text-white text-sm">Premium Support</h4>
                        <p className="text-gray-300 text-[12px] leading-relaxed">
                          In Nexus Customer Support, you get premium customer support designed to make your experience smooth and hassle-free. Our support system includes NEXUS AI ASSISTANT for quick help with common questions and guidance, along with NEXUS ADMIN SUPPORT, where you can directly chat with our admin team for personalized assistance. Our current estimated reply time is 1–2 hours, so whenever you need help, our team is here to assist you as quickly as possible.
                        </p>
                      </div>
                      
                      <div className="space-y-3 pt-4 border-t border-[#222436]/50">
                        <div className="flex items-center gap-2 text-gray-400">
                          <HelpCircle className="w-4 h-4 text-[#8b5cf6]" />
                          <span className="text-[11px] font-semibold">Need customized support?</span>
                        </div>
                        <button 
                          onClick={() => {
                            const chatTrigger = document.querySelector('[aria-label="Customer Support Chat"]') as HTMLButtonElement;
                            if (chatTrigger) chatTrigger.click();
                          }}
                          className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-[11px] font-extrabold tracking-wider uppercase h-10 px-4 rounded-lg shadow-md transition-all cursor-pointer"
                        >
                          OPEN CHAT ASSISTANT
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE PRODUCT DETAILS & VISUAL GALLERY MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedProductForModal && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
            onClick={() => setSelectedProductForModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.1 }}
              className="w-full max-w-4xl bg-[#0e0f18] border border-[#26283d] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden relative my-auto text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Header */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#1f2134] bg-[#121320]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#a78bfa]">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#a78bfa] font-mono uppercase tracking-widest font-bold block">
                      Product Details & Visual Gallery
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-white line-clamp-1">
                      {selectedProductForModal.title}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProductForModal(null)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-[#181926] hover:bg-[#25283d] transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content Body */}
              <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Image Showcase with Carousel and Thumbnails */}
                  <div className="lg:col-span-6 space-y-3">
                    {/* Main Image Frame */}
                    <div className="relative aspect-[16/11] bg-[#07080e] rounded-2xl overflow-hidden border border-[#222438] group flex items-center justify-center shadow-lg">
                      {selectedProductForModal.images && selectedProductForModal.images[modalActiveImageIndex] ? (
                        <img 
                          src={selectedProductForModal.images[modalActiveImageIndex]} 
                          alt={selectedProductForModal.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <img 
                          src={selectedProductForModal.image || ASSETS.ecommercePhones} 
                          alt={selectedProductForModal.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}

                      {/* Badges on image */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                        <span className="bg-[#8b5cf6]/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-md">
                          {selectedProductForModal.category}
                        </span>
                        <span className="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider shadow-md">
                          Verified Asset
                        </span>
                      </div>

                      {/* Image Counter */}
                      {selectedProductForModal.images && selectedProductForModal.images.length > 1 && (
                        <span className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-0.5 rounded-md border border-white/10">
                          {modalActiveImageIndex + 1} / {selectedProductForModal.images.length}
                        </span>
                      )}

                      {/* Previous / Next Arrow Controls */}
                      {selectedProductForModal.images && selectedProductForModal.images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setModalActiveImageIndex((prev) => (prev > 0 ? prev - 1 : selectedProductForModal.images!.length - 1))}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 hover:bg-[#8b5cf6] text-white flex items-center justify-center border border-white/15 transition-all shadow-md active:scale-90 cursor-pointer"
                            aria-label="Previous"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setModalActiveImageIndex((prev) => (prev < selectedProductForModal.images!.length - 1 ? prev + 1 : 0))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 hover:bg-[#8b5cf6] text-white flex items-center justify-center border border-white/15 transition-all shadow-md active:scale-90 cursor-pointer"
                            aria-label="Next"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Thumbnail Strip */}
                    {selectedProductForModal.images && selectedProductForModal.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        {selectedProductForModal.images.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setModalActiveImageIndex(idx)}
                            className={`relative aspect-[16/10] rounded-xl overflow-hidden border p-0.5 transition-all cursor-pointer ${
                              modalActiveImageIndex === idx
                                ? "border-[#8b5cf6] ring-2 ring-[#8b5cf6]/40 scale-100"
                                : "border-[#202235] opacity-50 hover:opacity-100 scale-95"
                            }`}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Product Information & Details */}
                  <div className="lg:col-span-6 space-y-4">
                    {/* Title & Rating */}
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                        {selectedProductForModal.title}
                      </h2>
                    </div>

                    {/* Price and Savings */}
                    <div className="p-3.5 rounded-xl bg-[#131422] border border-[#24273e] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-mono block">License Price</span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-2xl font-black text-[#a78bfa] font-mono">
                            {formatCurrency(selectedProductForModal.price)}
                          </span>
                          {selectedProductForModal.originalPrice && selectedProductForModal.originalPrice > selectedProductForModal.price && (
                            <span className="text-xs text-gray-500 line-through">
                              {formatCurrency(selectedProductForModal.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block">
                        Detailed Description
                      </span>
                      <p className="text-xs text-gray-300 leading-relaxed bg-[#07080e] p-3.5 rounded-xl border border-[#1b1d2e]">
                        {selectedProductForModal.description}
                      </p>
                    </div>

                    {/* Key Features */}
                    {selectedProductForModal.features && selectedProductForModal.features.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block">
                          Included Features & Deliverables
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedProductForModal.features.map((feat, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-gray-300 bg-[#07080e] px-3 py-2 rounded-lg border border-[#1b1d2e]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
                              <span className="text-[11px] font-medium leading-tight">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}


                  </div>
                </div>
              </div>

              {/* Toast Feedback */}
              {cartSuccessMessage && (
                <div className="mx-6 mb-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs flex items-center gap-2 shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{cartSuccessMessage}</span>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-[#1f2134] bg-[#121320] flex flex-col sm:flex-row items-center justify-between gap-3">
                <Link
                  to={`/product/${selectedProductForModal._id}`}
                  onClick={() => setSelectedProductForModal(null)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1a1b2b] hover:bg-[#25283e] border border-[#2b2e46] text-xs font-bold text-white transition-colors"
                >
                  <span>Open Full Product Page</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#a78bfa]" />
                </Link>

                <div className="w-full sm:w-auto flex items-center gap-2">
                  <Button
                    onClick={() => {
                      addToCart({
                        id: selectedProductForModal._id,
                        title: selectedProductForModal.title,
                        price: selectedProductForModal.price,
                        category: selectedProductForModal.category,
                        thumbnailUrl: selectedProductForModal.image,
                      });
                      setCartSuccessMessage(`Added "${selectedProductForModal.title}" to cart!`);
                      setTimeout(() => setCartSuccessMessage(null), 3000);
                    }}
                    className="flex-1 sm:flex-none bg-[#171827] hover:bg-[#212338] text-gray-200 hover:text-white border border-[#2b2e46] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-[#a78bfa]" />
                    <span>Buy Again / Add to Cart</span>
                  </Button>

                  <Button
                    onClick={() => setSelectedProductForModal(null)}
                    className="flex-1 sm:flex-none bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] cursor-pointer"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Selected Mobile Order Modal */}
      <AnimatePresence>
        {selectedMobileOrder && (
          <div className="fixed inset-0 z-[100] flex flex-col bg-[#0b0c13] md:bg-black/80 md:backdrop-blur-sm md:items-center md:justify-center md:p-6">
            <div className="flex-1 md:flex-none overflow-y-auto px-4 py-6 md:bg-[#0b0c13] md:border md:border-[#202234] md:rounded-[32px] md:w-full md:max-w-xl md:max-h-[90vh] md:shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <button 
                  onClick={() => setSelectedMobileOrder(null)} 
                  className="w-10 h-10 rounded-full bg-[#151624] border border-[#262942] flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="text-lg font-black text-white tracking-wider">Order Details</h2>
              </div>
              
              <div className="bg-[#12131f] border border-[#222436] rounded-3xl p-5 space-y-6">
                {/* Header matching image.png exactly */}
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest block font-mono">Order ID</span>
                    <h3 className="text-[22px] font-black text-white tracking-tight leading-none">
                      #NEX-{selectedMobileOrder._id.slice(0, 7).toUpperCase()}
                    </h3>
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <span>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(selectedMobileOrder.createdAt))}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                        <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span>{new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(selectedMobileOrder.createdAt))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Custom status pill matching image.png */}
                  <span className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider select-none shrink-0 mt-1 ${
                    (selectedMobileOrder.status?.toLowerCase() === 'approved' || selectedMobileOrder.status?.toLowerCase() === 'completed' || selectedMobileOrder.status?.toLowerCase() === 'unlocked')
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : (selectedMobileOrder.status?.toLowerCase() === 'failed' || selectedMobileOrder.status?.toLowerCase() === 'rejected')
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse'
                  }`}>
                    {(selectedMobileOrder.status?.toLowerCase() === 'approved' || selectedMobileOrder.status?.toLowerCase() === 'completed' || selectedMobileOrder.status?.toLowerCase() === 'unlocked') ? 'Approved' : (selectedMobileOrder.status?.toLowerCase() === 'failed' || selectedMobileOrder.status?.toLowerCase() === 'rejected') ? 'Rejected' : 'Pending'}
                  </span>
                </div>

                <div className="border-t border-[#202235] w-full pt-6">
                  <h4 className="text-[13px] font-black text-white tracking-wide block mb-3">ORDER ITEMS</h4>
                  
                  <div className="bg-[#181926] border border-[#2a2c42] rounded-2xl p-4">
                    {selectedMobileOrder.products.map((prod: any, idx: number) => (
                      <div key={prod._id || idx} className="py-4 first:pt-0 last:pb-0 border-b border-[#2a2c42]/50 last:border-0">
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProductForModal(prod);
                              setModalActiveImageIndex(0);
                            }}
                            className="w-20 h-20 rounded-xl bg-[#11121d] border border-[#202235]/60 overflow-hidden shrink-0 shadow-sm flex items-center justify-center cursor-pointer mt-0.5"
                          >
                            {prod.image ? (
                              <img src={prod.image} alt={prod.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-[#151624] text-[#a78bfa]">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                          </button>
                          <div className="text-left flex-1 min-w-0 py-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProductForModal(prod);
                                setModalActiveImageIndex(0);
                              }}
                              className="font-extrabold text-white text-[15px] tracking-wide leading-snug hover:text-[#a78bfa] transition-colors block text-left cursor-pointer break-words"
                            >
                              {prod.title}
                            </button>
                            <span className="text-[13px] text-gray-400 block mt-1">{prod.category}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProductForModal(prod);
                                setModalActiveImageIndex(0);
                              }}
                              className="mt-3 text-[11px] text-[#a78bfa] font-bold flex items-center gap-1.5 bg-[#8b5cf6]/10 px-3 py-1.5 rounded-lg border border-[#8b5cf6]/20 cursor-pointer w-max"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-[#2a2c42]">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">QTY</span>
                            <span className="text-sm font-bold text-white">1</span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">PRICE</span>
                            <span className="font-black text-[#a78bfa] text-sm">
                              Rs. {prod.price ? prod.price.toFixed(2) : selectedMobileOrder.totalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#202235] pt-5">
                  <span className="font-black text-white text-[15px]">Total Amount</span>
                  <span className="text-[#a78bfa] font-black text-[17px] font-mono">Rs. {selectedMobileOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {selectedMobileOrder.paymentProof ? (
                <div className="mt-6 mb-10">
                  <Button 
                    onClick={() => setSelectedTransactionReceipt(selectedMobileOrder.paymentProof)}
                    className="w-full bg-[#5c44e4] hover:bg-[#4a34c4] text-white font-extrabold py-4 rounded-xl transition-all shadow-[0_4px_20px_rgba(92,68,228,0.3)] text-[13px] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>VIEW TRANSACTION RECEIPT</span>
                  </Button>
                </div>
              ) : (
                <div className="mt-6 mb-10">
                  <div className="w-full bg-[#151624] text-gray-500 font-extrabold py-4 rounded-xl text-[13px] flex items-center justify-center gap-2 cursor-not-allowed border border-[#262942]">
                    <FileText className="w-4 h-4" />
                    <span>NO RECEIPT AVAILABLE</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction Receipt Modal */}
      <AnimatePresence>
        {selectedTransactionReceipt && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4">
            <div className="bg-[#0b0c13] border border-[#202234] rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-[#202234] flex items-center justify-between">
                <h3 className="text-sm font-black text-white tracking-wider">Transaction Receipt</h3>
                <button 
                  onClick={() => setSelectedTransactionReceipt(null)} 
                  className="w-8 h-8 rounded-full bg-[#151624] border border-[#262942] flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#07080d]">
                <img 
                  src={selectedTransactionReceipt} 
                  alt="Transaction Receipt" 
                  className="max-w-full h-auto rounded-lg object-contain max-h-[70vh]" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = ASSETS.ecommercePhones; // fallback if image breaks
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

