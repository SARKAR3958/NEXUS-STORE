import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation, Link, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { CartDrawer } from "./components/CartDrawer";
import { CustomerSupportChat } from "./components/CustomerSupportChat";
import { NotificationModal } from "./components/NotificationModal";
import { BannedScreenModal } from "./components/BannedScreenModal";
import { useAuthStore } from "./store/authStore";
import { useProductsStore } from "./store/productsStore";
import { ASSETS } from "./assets";

// Storefront Pages
import { Home } from "./pages/Home";
import { Products } from "./pages/Products";
import { ProductDetails } from "./pages/ProductDetails";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Auth } from "./pages/Auth";
import { Profile } from "./pages/Profile";
import { ResetPassword } from "./pages/ResetPassword";

// Admin Panel Pages
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminProducts } from "./pages/admin/AdminProducts";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminRequests } from "./pages/admin/AdminRequests";
import { AdminSettings } from "./pages/admin/AdminSettings";
import { AdminSupport } from "./pages/admin/AdminSupport";
import { AdminAdmins } from "./pages/admin/AdminAdmins";
import { AdminPopups } from "./pages/admin/AdminPopups";
import { StorePopup } from "./components/StorePopup";
import { CodeTamperGuard } from "./components/CodeTamperGuard";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Footer() {
  return (
    <footer className="hidden md:block bg-[#090a0f] border-t border-[#1a1b26] py-10 text-gray-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <img 
            src={ASSETS.headerLogo} 
            alt="Nexus Store" 
            className="h-10 max-h-11 w-auto object-contain" 
          />
          <span className="text-white font-bold tracking-wider font-mono">NEXUS STORE</span>
          <span className="text-gray-600">© {new Date().getFullYear()} Nexus Store. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6 text-gray-400">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <Link to="/products" className="hover:text-white transition-colors">All Products</Link>
          <Link to="/checkout" className="hover:text-white transition-colors">Checkout</Link>
          <Link to="/auth" className="hover:text-white transition-colors">Sign In</Link>
        </div>
      </div>
    </footer>
  );
}

function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0b0c12]">
      <ScrollToTop />
      <Navbar />
      <StorePopup />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <CustomerSupportChat />
      <NotificationModal />
      <BannedScreenModal />
      <CodeTamperGuard />
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth?tab=signup" replace />;
  return <>{children}</>;
}

export default function App() {
  const { initAuth } = useAuthStore();
  const { initProducts } = useProductsStore();

  useEffect(() => {
    initAuth();
    initProducts();
  }, [initAuth, initProducts]);

  return (
    <Router>
      <Routes>
        {/* Main Storefront Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="product/:id" element={<ProductDetails />} />
          <Route path="cart" element={<RequireAuth><Cart /></RequireAuth>} />
          <Route path="checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="auth" element={<Auth />} />
          <Route path="login" element={<Navigate to="/auth?tab=login" replace />} />
          <Route path="signup" element={<Navigate to="/auth?tab=signup" replace />} />
          <Route path="profile" element={<Profile />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>

        {/* Admin Login Route */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin Protected Dashboard Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="admins" element={<AdminAdmins />} />
          <Route path="popups" element={<AdminPopups />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
