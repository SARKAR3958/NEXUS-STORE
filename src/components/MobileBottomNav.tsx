import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, Heart, User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export function MobileBottomNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const links = [
    { name: "Home", path: "/", icon: Home },
    { name: "Categories", path: "/shop", icon: LayoutGrid },
    { name: "Wishlist", path: "/wishlist", icon: Heart },
    { name: "Account", path: isAuthenticated ? "/profile" : "/auth", icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 w-full h-[72px] bg-[#0a0a0e]/90 backdrop-blur-lg border-t border-[#1f1f2e] z-40 pb-safe">
      <div className="grid grid-cols-4 h-full">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path || (link.name === "Categories" && location.pathname.startsWith("/shop"));
          
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex flex-col items-center justify-center gap-1.5 transition-colors ${
                isActive ? "text-violet-500" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-wide">{link.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
