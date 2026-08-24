import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, KeyRound, Lock, CheckCircle2, AlertCircle, 
  ArrowRight, Sparkles, ArrowLeft, RefreshCw, Eye, EyeOff, Check
} from "lucide-react";
import { useAdminStore } from "@/store/adminStore";
import { ASSETS } from "@/assets";

export function AdminLogin() {
  const navigate = useNavigate();
  const { 
    adminUser, 
    isAdminAuthenticated, 
    signInWithGoogle, 
    verifySecretKey, 
    fetchAdminSecretKey,
    error: storeError, 
    isLoading 
  } = useAdminStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [securityKey, setSecurityKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const [localSuccess, setLocalSuccess] = useState("");

  useEffect(() => {
    // If already fully authenticated, redirect to dashboard
    if (isAdminAuthenticated) {
      navigate("/admin");
    } else if (adminUser) {
      // If signed in with Google but hasn't entered key yet, move to step 2
      setStep(2);
    }
  }, [isAdminAuthenticated, adminUser, navigate]);

  useEffect(() => {
    // Pre-fetch/initialize admin key in Firestore
    fetchAdminSecretKey();
  }, [fetchAdminSecretKey]);

  const handleGoogleAuth = async () => {
    setLocalError("");
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      setStep(2);
    } catch (err: any) {
      setLocalError(err?.message || "Google Sign-In failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityKey.trim()) {
      setLocalError("Please enter the Admin Security Key.");
      return;
    }

    setLocalError("");
    setIsSubmitting(true);

    try {
      const res = await verifySecretKey(securityKey);
      if (res.success) {
        setLocalSuccess("Access Granted! Redirecting to Admin Panel...");
        setTimeout(() => {
          navigate("/admin");
        }, 800);
      } else {
        setLocalError(res.message || "Invalid Admin Security Key. Access Denied.");
      }
    } catch (err: any) {
      setLocalError("Verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080c] text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden selection:bg-[#8b5cf6] selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8b5cf6]/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#3b82f6]/10 blur-[130px] pointer-events-none rounded-full" />

     

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#10111a]/90 border border-[#23263b] rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl relative z-10"
      >
        {/* Brand Logo & Title */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-gradient-to-b from-[#1c1d2e] to-[#10111d] border border-[#2d304a] shadow-lg mb-4">
            <img 
              src={ASSETS.headerLogo} 
              alt="Nexus Store" 
              className="h-10 max-h-11 w-auto object-contain drop-shadow-[0_0_15px_rgba(139,92,246,0.4)]" 
            />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Nexus Control Center</h1>
          <p className="text-xs text-gray-400 mt-1">Enterprise Administration & Inventory System</p>
        </div>

        {/* 2-Step Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
            step === 1 
              ? 'bg-[#8b5cf6]/20 border-[#8b5cf6] text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]' 
              : 'bg-[#181926] border-[#292c42] text-gray-400'
          }`}>
            <span className="w-4 h-4 rounded-full bg-[#8b5cf6] text-white text-[10px] flex items-center justify-center font-bold">1</span>
            <span>Google Auth</span>
          </div>
          <div className="w-4 h-px bg-[#2a2c40]" />
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
            step === 2 
              ? 'bg-[#8b5cf6]/20 border-[#8b5cf6] text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]' 
              : 'bg-[#181926] border-[#292c42] text-gray-400'
          }`}>
            <span className="w-4 h-4 rounded-full bg-[#8b5cf6] text-white text-[10px] flex items-center justify-center font-bold">2</span>
            <span>Security Key</span>
          </div>
        </div>

        {/* Error / Success Feedback */}
        <AnimatePresence mode="wait">
          {(localError || storeError) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div className="flex-1">{localError || storeError}</div>
            </motion.div>
          )}

          {localSuccess && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <div className="flex-1">{localSuccess}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 1: Google Authentication */}
        {step === 1 && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="p-4 rounded-2xl bg-[#141522] border border-[#24263a] text-center space-y-2">
              <p className="text-xs text-gray-300">
                Sign in with your authorized Google Account to verify identity.
              </p>
            </div>

            <button
              onClick={handleGoogleAuth}
              disabled={isSubmitting || isLoading}
              className="w-full h-12 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-lg active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-gray-700" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign In with Google</span>
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* STEP 2: Secret Admin Key Verification */}
        {step === 2 && (
          <motion.form 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleKeyVerification} 
            className="space-y-4"
          >
            {/* Logged in Google User Tag */}
            {adminUser && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#141624] border border-[#25283c]">
                <div className="flex items-center gap-2.5 min-w-0">
                  {adminUser.photoURL ? (
                    <img 
                      src={adminUser.photoURL} 
                      alt="Google Avatar" 
                      className="w-8 h-8 rounded-full border border-purple-500/40 shrink-0" 
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-900/50 text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                      {adminUser.displayName?.charAt(0) || "A"}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">{adminUser.displayName}</p>
                    <p className="text-[11px] text-gray-400 truncate">{adminUser.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-medium ml-2 shrink-0 underline cursor-pointer"
                >
                  Change
                </button>
              </div>
            )}

            {/* Secret Key Input Field */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                  <span>Enter Admin Security Key</span>
                </span>
              </label>

              <div className="relative">
                <input 
                  type={showKey ? "text" : "password"}
                  value={securityKey}
                  onChange={(e) => setSecurityKey(e.target.value)}
                  placeholder="Enter secret security key..." 
                  autoFocus
                  className="w-full bg-[#0a0b10] border border-[#292c42] focus:border-[#8b5cf6] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors pr-11 font-mono tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isSubmitting || !securityKey.trim()}
              className="w-full h-12 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.4)] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Unlock Admin Dashboard</span>
                </>
              )}
            </button>
          </motion.form>
        )}

        {/* Security Notice Footer */}
        <div className="mt-6 pt-5 border-t border-[#1c1e2e] text-center text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-purple-400/70" />
          <span>Real-time Admin Synchronized Access</span>
        </div>
      </motion.div>
    </div>
  );
}
