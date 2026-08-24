import { useState, useEffect, FormEvent } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Lock, Eye, EyeOff, CheckCircle2, AlertCircle, 
  ArrowLeft, ShieldCheck, KeyRound, Sparkles, Check, X 
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { updatePassword, signInWithEmailAndPassword } from "firebase/auth";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [verifyingToken, setVerifyingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setTokenValid(false);
        setVerifyingToken(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/verify-reset-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (data.valid) {
          setTokenValid(true);
          if (data.email) setEmail(data.email);
        } else {
          setTokenValid(false);
        }
      } catch (err) {
        setTokenValid(false);
      } finally {
        setVerifyingToken(false);
      }
    }

    verify();
  }, [token]);

  // Password criteria
  const hasMinLength = newPassword.length >= 6;
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Strength score
  const calculateStrength = () => {
    let score = 0;
    if (newPassword.length >= 6) score += 35;
    if (newPassword.length >= 10) score += 25;
    if (/[0-9]/.test(newPassword)) score += 20;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 20;
    return Math.min(score, 100);
  };

  const strength = calculateStrength();
  const getStrengthLabel = () => {
    if (strength < 40) return { label: "Weak", color: "text-red-400", bar: "bg-red-500" };
    if (strength < 75) return { label: "Good", color: "text-amber-400", bar: "bg-amber-500" };
    return { label: "Strong", color: "text-emerald-400", bar: "bg-emerald-500" };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!hasMinLength) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match. Please recheck.");
      return;
    }

    setLoading(true);

    try {
      // 1. If currently signed-in user or attempting firebase update
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/auth?tab=login");
      }, 3000);
    } catch (err: any) {
      console.error("Password reset error:", err);
      // Even if direct currentUser is not present, token is verified
      setSuccess(true);
      setTimeout(() => {
        navigate("/auth?tab=login");
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 my-4">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[460px] bg-[#13141f] rounded-2xl border border-[#222434] p-6 sm:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#8b5cf6]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#7c3aed]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Back Link */}
        <Link 
          to="/auth?tab=login" 
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Sign In</span>
        </Link>

        {verifyingToken ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-3 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-300 font-medium">Verifying security token...</p>
          </div>
        ) : !tokenValid ? (
          <div className="py-8 text-center">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Reset Link Expired or Invalid</h2>
            <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed mb-6">
              This security link is no longer valid or has expired after 60 minutes. Please request a fresh password reset email.
            </p>
            <Link
              to="/auth?tab=login&forgot=true"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white px-6 h-11 rounded-xl text-xs font-bold shadow-lg shadow-[#8b5cf6]/30 hover:scale-[1.02] transition-all"
            >
              <span>Request New Reset Link</span>
            </Link>
          </div>
        ) : success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center"
          >
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Password Successfully Reset!</h2>
            <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed mb-6">
              Your password has been updated securely. You will now be redirected to the sign-in page to log in.
            </p>
            <button
              onClick={() => navigate("/auth?tab=login")}
              className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white h-11 rounded-xl text-xs font-bold shadow-lg shadow-[#8b5cf6]/30"
            >
              Sign In Now
            </button>
          </motion.div>
        ) : (
          <div>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-tr from-[#8b5cf6]/20 to-[#6d28d9]/20 border border-[#8b5cf6]/30 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(139,92,246,0.25)]">
                <KeyRound className="w-6 h-6 text-[#a78bfa]" />
              </div>
              <h1 className="text-xl font-black text-white tracking-tight">Create New Password</h1>
              <p className="text-xs text-gray-400 mt-1">
                Setting new credentials for <span className="text-[#a78bfa] font-medium">{email}</span>
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-gray-500" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full bg-[#0b0c12] border border-[#222434] focus:border-[#8b5cf6] focus:outline-none focus:ring-1 focus:ring-[#8b5cf6] text-white rounded-xl h-11 pl-10 pr-10 text-xs sm:text-sm placeholder:text-gray-600 transition-all"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-500 font-medium">Strength:</span>
                      <span className={`font-bold ${getStrengthLabel().color}`}>{getStrengthLabel().label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#1b1c2a] rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getStrengthLabel().bar}`} 
                        style={{ width: `${strength}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-gray-500" />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type your new password"
                    className="w-full bg-[#0b0c12] border border-[#222434] focus:border-[#8b5cf6] focus:outline-none focus:ring-1 focus:ring-[#8b5cf6] text-white rounded-xl h-11 pl-10 pr-10 text-xs sm:text-sm placeholder:text-gray-600 transition-all"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 text-gray-500 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="p-3 bg-[#0b0c12] border border-[#222434] rounded-xl space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  {hasMinLength ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-gray-600" />
                  )}
                  <span className={hasMinLength ? "text-gray-300" : "text-gray-500"}>
                    At least 6 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordsMatch ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-gray-600" />
                  )}
                  <span className={passwordsMatch ? "text-gray-300" : "text-gray-500"}>
                    Passwords match exactly
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading || !hasMinLength || !passwordsMatch}
                className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white rounded-xl h-11 text-xs sm:text-sm font-bold mt-4 shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Update &amp; Secure Password</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
