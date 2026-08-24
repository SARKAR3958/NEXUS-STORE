import { useCartStore } from "../store/cartStore";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2, ArrowLeft, ShieldCheck, CreditCard, ChevronRight } from "lucide-react";
import { formatCurrency } from "../lib/currency";
import { useAuthStore } from "../store/authStore";
import { redirectToSignup } from "../lib/requireAuth";

export function Cart() {
  const { items, removeItem, getTotals, clearCart } = useCartStore();
  const { subtotal } = getTotals();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      redirectToSignup(navigate);
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-[#0b0c12] text-gray-200 pb-24 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8 border-b border-[#1f2030] pb-5">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1b2e] rounded-xl transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Your Cart</h1>
              <p className="text-xs text-gray-400 font-medium">
                {items.length} {items.length === 1 ? "item" : "items"} ready for checkout
              </p>
            </div>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-2 hover:bg-red-950/20 rounded-xl transition-colors cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty State */
          <div className="bg-[#141520] border border-[#222434] rounded-2xl p-8 md:p-12 text-center max-w-md mx-auto space-y-6 shadow-xl animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-violet-600/10 border border-violet-500/20 rounded-full flex items-center justify-center mx-auto text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.15)] animate-bounce">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Your Cart is Empty</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Looks like you haven't added any premium source codes or development services to your cart yet.
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all cursor-pointer"
            >
              <span>Explore Products</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Cart List & Summary Grid */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Cart Items List */}
            <div className="space-y-4">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-[#141520] border border-[#222434] p-4 rounded-2xl flex items-center gap-4 shadow-md hover:border-[#2a2d42] transition-all"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-[#0d0e15] border border-[#222434] overflow-hidden shrink-0 flex items-center justify-center">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-purple-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white text-sm md:text-base font-bold truncate leading-snug">{item.title}</h4>
                    <span className="text-violet-400 text-[10px] md:text-xs font-bold uppercase tracking-wider block mt-0.5">
                      {item.category}
                    </span>
                  </div>

                  {/* Price & Action */}
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-white font-black text-sm md:text-lg">
                      {formatCurrency(item.price)}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-gray-500 hover:text-red-400 bg-[#0d0e15] hover:bg-red-950/30 rounded-xl border border-[#222434] hover:border-red-950/50 transition-colors cursor-pointer"
                      title="Remove from Cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary Box */}
            <div className="bg-[#141520] border border-[#222434] rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-center bg-[#0d0e15] p-4 rounded-xl border border-[#222434]">
                <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Total Amount</span>
                <span className="text-white font-black text-xl md:text-2xl">{formatCurrency(subtotal)}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  to="/products"
                  className="flex-1 border border-[#222434] bg-[#0d0e15] hover:bg-[#12131f] text-gray-300 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Continue Shopping</span>
                </Link>
                <button
                  onClick={handleCheckout}
                  className="flex-1 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white py-3.5 rounded-xl font-black text-sm md:text-base transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Proceed to Checkout</span>
                </button>
              </div>

              {/* Badges */}
              <div className="grid grid-cols-2 gap-4 border-t border-[#222434] pt-4 text-[11px] text-gray-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>SadaPay Payment Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#8b5cf6]" />
                  <span>Instant digital access delivery</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
