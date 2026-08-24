import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ShieldAlert, LogOut, MessageCircleQuestion, AlertOctagon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function BannedScreenModal() {
  const { user, logout } = useAuthStore();

  // If not logged in, or user is admin, or user is not banned, do not show
  const isBanned = Boolean(
    user && 
    user.role !== 'admin' && 
    (user.status === 'Banned' || user.status === 'Ban' || (user.status && user.status.toLowerCase() === 'banned'))
  );

  useEffect(() => {
    if (!isBanned) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isBanned]);

  if (!isBanned) return null;

  const banReason = user?.banReason?.trim() || "Violation of Website Terms of Service & Security Guidelines";

  return (
    <AnimatePresence>
      <div 
        id="banned-lockout-overlay" 
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black select-none overscroll-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative max-w-lg w-full bg-[#12131f] border-2 border-red-600/70 rounded-3xl p-7 sm:p-9 text-center shadow-[0_0_80px_rgba(220,38,38,0.4)] overflow-hidden"
        >
          {/* Neon warning backdrop glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-600/20 blur-[90px] pointer-events-none rounded-full" />

          {/* Ban Icon with pulsing badge */}
          <div className="relative mx-auto w-20 h-20 rounded-2xl bg-red-950/80 border-2 border-red-600/60 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(220,38,38,0.5)]">
            <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
            <div className="absolute -bottom-2 -right-2 bg-red-600 text-white rounded-full p-1 border-2 border-[#12131f]">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-snug">
            YOU HAVE BEEN BANNED FROM THIS WEBSITE
          </h1>

          {/* Reason Section */}
          <div className="my-6 p-4.5 bg-red-950/40 border border-red-800/50 rounded-2xl text-left">
            <p className="text-[11px] font-bold tracking-wider text-red-400 uppercase mb-1">
              DUE TO:
            </p>
            <p className="text-sm font-semibold text-gray-100 bg-[#0e0f18]/80 p-3 rounded-xl border border-red-900/40 break-words leading-relaxed font-mono">
              "{banReason}"
            </p>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed mb-6">
            Your access to digital products, orders, and account dashboard has been permanently suspended by administrator. If you believe this is a mistake, please reach out to our support team.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://wa.me/919999999999?text=Hello%20Admin,%20my%20account%20was%20banned.%20Please%20review."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#1a1c2e] hover:bg-[#252842] border border-[#34385a] text-gray-200 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              <MessageCircleQuestion className="w-4 h-4 text-[#a78bfa]" />
              Contact Support
            </a>

            <button
              onClick={() => logout()}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          <div className="mt-5 pt-4 border-t border-[#1f2136] text-[11px] text-gray-500">
            Account: <span className="text-gray-300 font-mono">{user?.email}</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
