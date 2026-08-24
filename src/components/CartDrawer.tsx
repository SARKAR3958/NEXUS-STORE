import { useCartStore } from "@/store/cartStore";
import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/currency";
import { useAuthStore } from "@/store/authStore";
import { redirectToSignup } from "@/lib/requireAuth";

export function CartDrawer() {
  const { items, isOpen, setCartOpen, removeItem, getTotals } = useCartStore();
  const { subtotal } = getTotals();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleCheckout = () => {
    setCartOpen(false);
    if (!isAuthenticated) {
      redirectToSignup(navigate);
      return;
    }
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cart-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          onClick={() => setCartOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
        />
      )}

      {isOpen && (
        <motion.div
          key="cart-drawer"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 w-full max-w-sm md:max-w-md bg-[#0a0a0e] shadow-2xl z-[101] flex flex-col border-l border-[#1f1f2e]"
        >
          <div className="flex items-center justify-between p-5 border-b border-[#1f1f2e]">
            <h2 className="text-base font-bold flex items-center gap-2 text-white">
              <ShoppingBag className="w-4 h-4 text-violet-500" /> Your Cart
            </h2>
            <button
              onClick={() => setCartOpen(false)}
              className="p-2 hover:bg-[#12121a] rounded-full transition-colors text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                <div className="w-16 h-16 bg-[#12121a] border border-[#1f1f2e] rounded-full flex items-center justify-center mb-2">
                  <ShoppingBag className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-[13px]">Your cart is empty.</p>
                <Button 
                  variant="outline" 
                  className="border-[#1f1f2e] bg-[#12121a] hover:bg-[#1a1a24] text-slate-300 rounded-lg mt-4 text-xs font-bold uppercase tracking-wider"
                  onClick={() => { setCartOpen(false); navigate('/shop'); }}
                >
                  Continue Shopping
                </Button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-3 items-center bg-[#12121a] p-3 rounded-xl border border-[#1f1f2e]">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt={item.title} className="w-14 h-14 object-cover rounded-lg border border-[#1a1a24]" />
                  ) : (
                    <div className="w-14 h-14 bg-[#1a1a24] rounded-lg flex items-center justify-center text-slate-600 border border-[#1f1f2e]">
                      <ShoppingBag className="w-5 h-5 opacity-50" />
                    </div>
                  )}
                  <div className="flex-1 py-1">
                    <h3 className="font-bold text-[13px] text-white line-clamp-1">{item.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">{item.category}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="font-bold text-sm text-violet-400">{formatCurrency(item.price)}</p>
                      <span className="text-[10px] text-slate-400 bg-[#1c1c28] px-2 py-0.5 rounded-md border border-[#2a2a3e] font-medium font-mono">Qty: 1</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="p-4 border-t border-[#1f1f2e] bg-[#0a0a0e]">
              <div className="bg-[#12121a] p-4 rounded-xl mb-4 border border-[#1f1f2e] flex justify-between items-center">
                <span className="text-slate-400 text-[13px] font-bold uppercase tracking-wider">Total</span>
                <span className="text-lg font-bold text-white">{formatCurrency(subtotal)}</span>
              </div>
              <Button 
                className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-12 text-sm font-bold border-0 shadow-[0_4px_14px_0_rgba(124,58,237,0.39)]" 
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
