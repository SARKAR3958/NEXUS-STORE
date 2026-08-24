import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, Package, ShoppingCart, Users, 
  Settings, LogOut, Menu, X, 
  ChevronRight, Bell, Search, User as UserIcon,
  Shield, MessageSquare, FileQuestion, Megaphone
} from "lucide-react";
import { useAdminStore, AdminPermission } from "@/store/adminStore";
import { ASSETS } from "@/assets";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface NavItemDef {
  label: string;
  path: string;
  icon: any;
  permission: AdminPermission;
  exact?: boolean;
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { adminUser, currentAdminRecord, isAdminAuthenticated, logoutAdmin, isLoading, initAdminSession } = useAdminStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  useEffect(() => {
    // Listen to pending orders count
    const ordersQuery = query(collection(db, "orders"), where("status", "==", "Pending"));
    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      setPendingOrdersCount(snapshot.size);
    }, (err) => console.warn("Orders badge listener warning:", err));

    // Listen to unread support chats count
    const supportQuery = query(collection(db, "support_chat_io"), where("unreadByAdmin", "==", true));
    const unsubSupport = onSnapshot(supportQuery, (snapshot) => {
      setUnreadSupportCount(snapshot.size);
    }, (err) => console.warn("Support badge listener warning:", err));

    return () => {
      unsubOrders();
      unsubSupport();
    };
  }, []);

  useEffect(() => {
    const unsub = initAdminSession();
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [initAdminSession]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090a10] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400 font-mono">Loading Nexus Admin...</p>
        </div>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const allNavItems: NavItemDef[] = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard, permission: "dashboard", exact: true },
    { label: "Products", path: "/admin/products", icon: Package, permission: "products" },
    { label: "Orders", path: "/admin/orders", icon: ShoppingCart, permission: "orders" },
    { label: "Support", path: "/admin/support", icon: MessageSquare, permission: "support" },
    { label: "Users", path: "/admin/users", icon: Users, permission: "users" },
    { label: "Admins", path: "/admin/admins", icon: Shield, permission: "admins" },
    { label: "Popups", path: "/admin/popups", icon: Megaphone, permission: "popups" },
    { label: "Settings", path: "/admin/settings", icon: Settings, permission: "settings" },
  ];

  // Filter navigation items by granted permissions
  const allowedPermissions = adminUser?.permissions || [
    'dashboard', 'products', 'orders', 'users', 'support', 'admins', 'popups', 'settings'
  ];

  const navItems = allNavItems.filter((item) => 
    allowedPermissions.includes(item.permission)
  );

  const isActive = (item: NavItemDef) => {
    if (item.exact) {
      return location.pathname === "/admin" || location.pathname === "/admin/";
    }
    if (item.path.includes("?")) {
      const [basePath, search] = item.path.split("?");
      return location.pathname === basePath && location.search.includes(search);
    }
    return location.pathname === item.path || location.pathname.startsWith(item.path + "/");
  };

  const handleLogout = async () => {
    await logoutAdmin();
    navigate("/admin/login");
  };

  const displayName = adminUser?.displayName || currentAdminRecord?.name || "Admin";
  const displayEmail = adminUser?.email || currentAdminRecord?.email || "admin@nexus.io";
  const displayRole = currentAdminRecord?.role ? currentAdminRecord.role.toUpperCase() : "SUPER ADMIN";

  return (
    <div className="min-h-screen bg-[#07080e] text-white flex flex-col lg:flex-row antialiased selection:bg-[#8b5cf6] selection:text-white font-sans">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 bg-[#0c0d15] border-r border-[#1a1c2b] shrink-0 sticky top-0 h-screen z-30">
        
        {/* Brand Header */}
        <div className="p-5 border-b border-[#181928] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={ASSETS.headerLogo} 
              alt="Nexus Store" 
              className="h-7 w-auto object-contain transition-transform group-hover:scale-105" 
            />
            <div>
              <span className="font-mono font-black text-white tracking-wider text-xs block">NEXUS STORE</span>
              <span className="text-[10px] text-purple-400 font-sans tracking-wide block font-semibold">Admin Panel</span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            const badgeCount = item.permission === "orders" ? pendingOrdersCount : item.permission === "support" ? unreadSupportCount : 0;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  active
                    ? "bg-[#8b5cf6] text-white shadow-[0_0_15px_rgba(139,92,246,0.35)] font-bold"
                    : "text-gray-400 hover:text-white hover:bg-[#131422]"
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform ${active ? "text-white" : "text-gray-400 group-hover:text-purple-300"}`} />
                <span className="flex-1 text-[13px]">{item.label}</span>
                {badgeCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-purple-600 text-white shadow-[0_0_8px_rgba(139,92,246,0.6)] animate-pulse">
                    {badgeCount}
                  </span>
                )}
                {active && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
              </Link>
            );
          })}
        </nav>

        {/* Admin Profile Card at Bottom */}
        <div className="p-3 border-t border-[#181928] bg-[#0c0d15]">
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#131422] border border-[#212338]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                {adminUser?.photoURL ? (
                  <img
                    src={adminUser.photoURL}
                    alt={displayName}
                    className="w-9 h-9 rounded-full object-cover border border-purple-500/50"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#8b5cf6] to-[#a78bfa] p-0.5 shrink-0 flex items-center justify-center">
                    <div className="w-full h-full bg-[#161726] rounded-full flex items-center justify-center text-[#a78bfa] text-xs font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
                {/* Live Online Dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#131422]" />
              </div>

              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{displayName}</p>
                <p className="text-[10px] text-purple-400/90 truncate font-mono">{displayRole}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN WORKSPACE */}
      <div className={`flex-1 flex flex-col min-w-0 bg-[#080910] ${
        location.pathname.startsWith('/admin/support') ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}>
        
        {/* TOP HEADER BAR */}
        <header className="bg-[#0c0d15] border-b border-[#1a1c2b] sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Mobile brand & toggle */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-xl bg-[#141524] border border-[#23253b] text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/admin" className="flex items-center gap-2">
              <img src={ASSETS.headerLogo} alt="Nexus Store" className="h-8 w-auto object-contain" />
              <span className="font-mono font-bold text-white text-[16px]">NEXUS STORE</span>
            </Link>
          </div>

          {/* Search bar in center */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search anything..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-[#141524] border border-[#212338] text-gray-200 text-xs rounded-xl pl-9 pr-4 py-2 placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] transition-colors"
              />
            </div>
          </div>

          {/* Right actions: Admins Link, Settings, Logout (Hidden on mobile) */}
          <div className="hidden sm:flex items-center gap-3 shrink-0 ml-auto">
            

            
            

            {/* Settings */}
            <button 
              onClick={() => navigate("/admin/settings")}
              className="p-2 text-gray-300 hover:text-white hover:bg-[#141524] rounded-xl transition-colors cursor-pointer"
              title="Admin Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Profile Avatar Pill */}
            <div 
              onClick={() => navigate("/admin/admins")}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8b5cf6] to-[#a78bfa] p-0.5 cursor-pointer"
              title={`${displayName} (${displayEmail})`}
            >
              <div className="w-full h-full bg-[#161726] rounded-full flex items-center justify-center text-[#a78bfa] text-xs font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* MOBILE SIDE DRAWER NAVIGATION */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              {/* Dark Overlay Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              />

              {/* Side Drawer Panel */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 250 }}
                className="relative w-[280px] max-w-[85vw] h-full bg-[#0c0d15] border-r border-[#20223b] flex flex-col z-50 shadow-2xl"
              >
                {/* Drawer Header */}
                <div className="p-4 border-b border-[#181928] flex items-center justify-between">
                  <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5">
                    <img 
                      src={ASSETS.headerLogo} 
                      alt="Nexus Store" 
                      className="h-7 w-auto object-contain" 
                    />
                    <div>
                      <span className="font-mono font-black text-white text-xs block">NEXUS STORE</span>
                      <span className="text-[10px] text-purple-400 font-sans tracking-wide block font-semibold">Admin Panel</span>
                    </div>
                  </Link>

                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-xl bg-[#141524] text-gray-400 hover:text-white border border-[#23253b] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                  {navItems.map((item) => {
                    const active = isActive(item);
                    const Icon = item.icon;
                    const badgeCount = item.permission === "orders" ? pendingOrdersCount : item.permission === "support" ? unreadSupportCount : 0;
                    return (
                      <Link
                        key={item.label}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                          active
                            ? "bg-[#8b5cf6] text-white font-bold shadow-[0_0_15px_rgba(139,92,246,0.35)]"
                            : "text-gray-300 hover:text-white hover:bg-[#131422]"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? "text-white" : "text-gray-400 group-hover:text-purple-300"}`} />
                        <span className="flex-1 text-[13px]">{item.label}</span>
                        {badgeCount > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-purple-600 text-white shadow-[0_0_8px_rgba(139,92,246,0.6)] animate-pulse">
                            {badgeCount}
                          </span>
                        )}
                        {active && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                      </Link>
                    );
                  })}
                </nav>

                {/* Bottom Profile & Actions */}
                <div className="p-3 border-t border-[#181928] bg-[#0a0b12] space-y-2">
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#131422] border border-[#212338]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8b5cf6] to-[#a78bfa] p-0.5 shrink-0 flex items-center justify-center">
                        <div className="w-full h-full bg-[#161726] rounded-full flex items-center justify-center text-[#a78bfa] text-xs font-bold">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{displayName}</p>
                        <p className="text-[10px] text-purple-400/90 truncate font-mono">{displayRole}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      title="Log out"
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>

                 
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MAIN PAGE OUTLET */}
        <main className={`flex-1 flex flex-col min-h-0 ${
          location.pathname.startsWith('/admin/support')
            ? 'p-0 overflow-hidden'
            : 'p-4 sm:p-6 lg:p-8 overflow-y-auto'
        }`}>
          <Outlet />
        </main>
      </div>

    </div>
  );
}


