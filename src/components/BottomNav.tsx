import { Home, LayoutGrid, Heart, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export function BottomNav() {
  const location = useLocation();
  const path = location.pathname;
  const { isAuthenticated } = useAuthStore();

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Categories", path: "/products", icon: LayoutGrid },
    { name: "Wishlist", path: "/products?filter=wishlist", icon: Heart },
    { name: "Account", path: isAuthenticated ? "/profile" : "/auth", icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0d0e15]/95 backdrop-blur-xl border-t border-[#1e202c] z-50 px-4 pt-2 pb-5 shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = item.path === "/" 
            ? path === "/" 
            : path.startsWith(item.path.split("?")[0]) && path !== "/";

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
                isActive ? "text-[#a78bfa]" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" : ""}`} />
              <span className={`text-[11px] font-medium tracking-tight ${isActive ? "text-[#a78bfa] font-semibold" : ""}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
      {/* iOS Home Indicator Bar */}
      <div className="w-full flex justify-center mt-2">
        <div className="w-32 h-1 bg-gray-600/70 rounded-full"></div>
      </div>
    </div>
  );
}
