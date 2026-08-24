import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Search, Bell, ShoppingCart, Lock, Menu, X, User as UserIcon, LogOut, History, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useNotificationStore } from "@/store/notificationStore";
import { ASSETS } from "@/assets";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items, toggleCart } = useCartStore();
  const { notifications, toggleOpen: toggleNotification } = useNotificationStore();

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleOutsideClick = (event: PointerEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, [mobileMenuOpen]);

  const handleCartClick = () => {
    if (window.innerWidth < 768) {
      navigate('/cart');
    } else {
      toggleCart();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  // Desktop navigation (PC & Laptop)
  const desktopNavLinks = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
  ];

  // Mobile navigation drawer links
  const mobileNavLinks = [
    { name: "Home", path: "/" },
    { name: "All Products", path: "/products" },
    { name: "Apps", path: "/products?cat=apps" },
    { name: "Websites", path: "/products?cat=websites" },
    { name: "Custom Apps", path: "/products?cat=custom" },
    { name: "Source Code", path: "/products?cat=source" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0d0e15]/95 backdrop-blur-xl border-b border-[#1e202c]">
      <div className="w-full max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Mobile Menu + Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="md:hidden text-gray-300 hover:text-white p-1"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <Link to="/" className="flex items-center gap-2.5 group">
            <img 
              src={ASSETS.headerLogo} 
              alt="Nexus Store" 
              className="h-8 max-h-9 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <span className="text-white font-bold text-lg tracking-wider font-mono">NEXUS STORE</span>
          </Link>
        </div>

        {/* Center-Left: Desktop Navigation Links (PC & Laptop) */}
        <nav className="hidden md:flex items-center space-x-2 lg:space-x-3 shrink-0">
          {desktopNavLinks.map((link) => {
            const isActive = link.path === "/" 
              ? path === "/" 
              : path.startsWith("/products");

            return (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium px-4 py-2 rounded-xl transition-all ${
                  isActive
                    ? "text-[#a78bfa] bg-[#8b5cf6]/10 shadow-[0_0_12px_rgba(139,92,246,0.15)] border border-[#8b5cf6]/20 font-semibold"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Center-Right: Desktop Search Bar (PC & Laptop) */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-sm mx-2">
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps, source codes, websites..."
              className="w-full bg-[#141522] text-xs lg:text-sm text-white placeholder-gray-500 rounded-xl py-2 pl-9.5 pr-8 border border-[#232536] focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* Right: Notification, Cart, Login */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
          
          

          {/* Shopping Cart with count badge */}
          <button 
            onClick={handleCartClick} 
            className="relative p-2 text-gray-300 hover:text-white hover:bg-[#151622] rounded-xl transition-colors flex items-center justify-center cursor-pointer active:scale-95"
            aria-label="Shopping Cart"
            title="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 bg-[#8b5cf6] text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.6)] border border-[#0d0e15]">
              {items.length}
            </span>
          </button>

          {/* User Profile or Login Button */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-2">
              <Link 
                to="/profile"
                className="flex items-center gap-2 bg-[#151622] hover:bg-[#1f2130] text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-[#232536] transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-[#8b5cf6]/30 text-[#a78bfa] flex items-center justify-center">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <span className="max-w-[90px] truncate">{user?.name || "Account"}</span>
              </Link>
              <button 
                onClick={() => logout()} 
                title="Sign Out"
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-full transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link 
              to="/auth?tab=login"
              className="hidden md:flex items-center gap-1.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all hover:scale-105 active:scale-95"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div ref={mobileMenuRef} className="md:hidden border-b border-[#1e202c] bg-[#0d0e15] px-4 py-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {mobileNavLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-[#151622]"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 border-t border-[#1e202c]">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/profile?tab=dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 bg-[#1f2130] text-white py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-[#2d2f44] hover:bg-[#25273b] transition-all"
                  >
                    <UserIcon className="w-4 h-4 text-[#a78bfa]" /> Profile
                  </Link>
                  <Link
                    to="/profile?tab=history"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 bg-[#1f2130] text-white py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-[#2d2f44] hover:bg-[#25273b] transition-all"
                  >
                    <History className="w-4 h-4 text-[#a78bfa]" /> MY ORDERS
                  </Link>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-red-400 py-2 text-xs font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link 
                  to="/auth?tab=login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 bg-[#8b5cf6] text-white py-2.5 rounded-xl text-xs font-semibold shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                >
                  <Lock className="w-3.5 h-3.5" /> Login
                </Link>
                <Link 
                  to="/auth?tab=signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 bg-[#151622] border border-[#232536] text-white py-2.5 rounded-xl text-xs font-semibold"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
