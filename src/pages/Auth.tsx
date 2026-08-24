import { useState, useEffect, type FormEvent } from "react";
import { useSearchParams, Navigate, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/store/authStore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { 
  ArrowLeft, Mail, Lock, User, Phone, Eye, EyeOff, 
  CheckCircle2, AlertCircle, Sparkles, KeyRound, X, Send
} from "lucide-react";
import { ASSETS } from "@/assets";

export function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  const [tab, setTab] = useState<"login" | "signup">(initialTab);
  
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(searchParams.get("forgot") === "true");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState("");

  useEffect(() => {
    if (searchParams.get("forgot") === "true") {
      setShowForgotModal(true);
    }
  }, [searchParams]);

  if (isAuthenticated) return <Navigate to="/profile" />;

  const handleTabChange = (newTab: "login" | "signup") => {
    setTab(newTab);
    setError("");
    setSearchParams({ tab: newTab });
  };

  const getFirebaseErrorMessage = (errCode: string, defaultMsg: string) => {
    switch (errCode) {
      case "auth/email-already-in-use":
        return "This email is already registered. Please sign in instead.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/operation-not-allowed":
        return "This sign-in method is not enabled. Please contact support.";
      case "auth/weak-password":
        return "Password is too weak. Please use at least 6 characters.";
      case "auth/user-disabled":
        return "This user account has been disabled.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password. Please try again.";
      case "auth/popup-closed-by-user":
        return "Google sign-in popup was closed before completing.";
      case "auth/cancelled-popup-request":
        return "Sign-in request was cancelled. Please try again.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a moment and try again.";
      default:
        return defaultMsg || "Authentication failed. Please check your credentials.";
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check and update profile in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || "Google User",
          email: user.email || "",
          phone: user.phoneNumber || "",
          photoURL: user.photoURL || "",
          role: "user",
          createdAt: new Date().toISOString(),
          provider: "google.com"
        });
      } else {
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || userDoc.data().name || "User",
          email: user.email || userDoc.data().email || "",
          photoURL: user.photoURL || userDoc.data().photoURL || "",
          lastLoginAt: new Date().toISOString()
        }, { merge: true });
      }

      navigate("/profile");
    } catch (err: any) {
      console.error("Google Auth error:", err);
      const friendlyMsg = getFirebaseErrorMessage(err?.code, err?.message);
      setError(friendlyMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validations
    if (tab === "signup") {
      if (!formData.name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (!formData.email.trim()) {
        setError("Please enter your email address.");
        return;
      }
      if (!formData.phone.trim()) {
        setError("Please enter your phone number.");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match. Please confirm your password.");
        return;
      }
    } else {
      if (!formData.email.trim()) {
        setError("Please enter your email address.");
        return;
      }
      if (!formData.password) {
        setError("Please enter your password.");
        return;
      }
    }

    setLoading(true);

    try {
      if (tab === "signup") {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email.trim(), 
          formData.password
        );

        if (formData.name.trim()) {
          await updateProfile(userCredential.user, { 
            displayName: formData.name.trim() 
          });
        }
        
        // Save user profile to Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          role: "user",
          status: "Active",
          banReason: "",
          createdAt: new Date().toISOString(),
          authType: "manual",
          provider: "password"
        });
      } else {
        await signInWithEmailAndPassword(
          auth, 
          formData.email.trim(), 
          formData.password
        );
      }
      navigate("/profile");
    } catch (err: any) {
      console.error("Auth error:", err);
      const friendlyMsg = getFirebaseErrorMessage(err?.code, err?.message);
      setError(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError("");

    const targetEmail = forgotEmail.trim();

    if (!targetEmail || !targetEmail.includes("@")) {
      setForgotError("Please enter a valid email address.");
      return;
    }

    setForgotLoading(true);

    try {
      let accountExists = false;

      // 1. Check in Firestore 'users' collection
      try {
        const usersRef = collection(db, "users");
        
        // Check exact match
        const q1 = query(usersRef, where("email", "==", targetEmail));
        const snap1 = await getDocs(q1);
        if (!snap1.empty) {
          accountExists = true;
        } else {
          // Check lowercase match
          const q2 = query(usersRef, where("email", "==", targetEmail.toLowerCase()));
          const snap2 = await getDocs(q2);
          if (!snap2.empty) {
            accountExists = true;
          }
        }
      } catch (firestoreErr) {
        console.warn("Firestore lookup warning:", firestoreErr);
      }

      // 2. Also check with Firebase Auth fetchSignInMethodsForEmail
      if (!accountExists) {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, targetEmail);
          if (methods && methods.length > 0) {
            accountExists = true;
          }
        } catch (authErr: any) {
          console.warn("fetchSignInMethodsForEmail warning:", authErr);
        }
      }

      // 3. If account does NOT exist, show explicit error and stop
      if (!accountExists) {
        setForgotError(`No account found on this Gmail (${targetEmail}). Please check your email or Sign Up.`);
        setForgotLoading(false);
        return;
      }

      // 4. Account confirmed to exist -> Send official Firebase password reset email
      await sendPasswordResetEmail(auth, targetEmail);
      setForgotSuccess(true);
    } catch (err: any) {
      console.error("Firebase Password Reset Error:", err);
      if (err?.code === "auth/user-not-found" || err?.message?.includes("EMAIL_NOT_FOUND")) {
        setForgotError(`No account found on this Gmail (${targetEmail}). Please check your email or Sign Up.`);
      } else if (err?.code === "auth/invalid-email" || err?.message?.includes("INVALID_EMAIL")) {
        setForgotError("Please enter a valid email address format.");
      } else if (err?.code === "auth/too-many-requests" || err?.message?.includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
        setForgotError("Too many attempts. Please wait a few minutes before trying again.");
      } else {
        setForgotError(err?.message || "Failed to send reset link. Please try again.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 bg-[#0b0c12] relative overflow-hidden">
      
      {/* Background Neon Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#7c3aed]/15 blur-[140px] pointer-events-none rounded-full"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-[#13141f]/95 backdrop-blur-2xl p-6 sm:p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-[#242638] relative z-10"
      >
        {/* Back Link */}
        <button 
          onClick={() => {
            if (tab === "signup") {
              handleTabChange("login");
            } else {
              navigate("/");
            }
          }} 
          className="absolute top-5 left-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6 mt-2">
          <div className="flex justify-center mb-3">
            <img 
              src={ASSETS.headerLogo} 
              alt="Nexus Store" 
              className="h-20 w-auto object-contain drop-shadow-[0_0_20px_rgba(139,92,246,0.4)] rounded-lg"
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {tab === "login" ? "Login In to Nexus Store" : "Create Account"}
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            {tab === "login" 
              ? "Enter your credentials to access your purchases and dashboard." 
              : "Register today for exclusive apps,webs,and sources."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-[#0b0c12] rounded-xl mb-5 border border-[#222434]">
          <button
            type="button"
            onClick={() => handleTabChange("login")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === "login" 
                ? "bg-[#8b5cf6] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]" 
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("signup")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === "signup" 
                ? "bg-[#8b5cf6] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]" 
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3 bg-red-500/10 text-red-300 text-xs rounded-xl border border-red-500/25 flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* Sign Up Fields: Full Name & Phone Number */}
          <AnimatePresence mode="popLayout">
            {tab === "signup" && (
              <motion.div
                key="signup-extra-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3.5 overflow-hidden"
              >
                {/* 1. Full Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                    <span>Full Name <span className="text-[#a78bfa]">*</span></span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      required
                      placeholder="Your Name" 
                      className="w-full h-11 pl-10 pr-4 bg-[#0b0c12] border border-[#222434] rounded-xl text-xs sm:text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                {/* 2. Phone Number */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1.5">
                    Phone Number <span className="text-[#a78bfa]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="tel" 
                      required
                      placeholder="+92xxxxxxxxxx" 
                      className="w-full h-11 pl-10 pr-4 bg-[#0b0c12] border border-[#222434] rounded-xl text-xs sm:text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Address (Common for both Login and Signup) */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1.5">
              Email Address <span className="text-[#a78bfa]">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="email" 
                required
                placeholder="your@example.com" 
                className="w-full h-11 pl-10 pr-4 bg-[#0b0c12] border border-[#222434] rounded-xl text-xs sm:text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          {/* Password (Common for both Login and Signup) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-gray-300">
                Password <span className="text-[#a78bfa]">*</span>
              </label>
              {tab === "login" && (
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotEmail(formData.email || "");
                    setForgotSuccess(false);
                    setForgotError("");
                  }}
                  className="text-[11px] text-[#a78bfa] hover:text-white transition-colors"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                placeholder="Enter pass (min 6 chars)" 
                className="w-full h-11 pl-10 pr-11 bg-[#0b0c12] border border-[#222434] rounded-xl text-xs sm:text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Sign Up Only) */}
          <AnimatePresence mode="popLayout">
            {tab === "signup" && (
              <motion.div
                key="confirmPassword"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-gray-300">
                    Confirm Password <span className="text-[#a78bfa]">*</span>
                  </label>
                  {formData.confirmPassword && (
                    <span className={`text-[10px] font-medium flex items-center gap-1 ${
                      formData.password === formData.confirmPassword 
                        ? "text-emerald-400" 
                        : "text-amber-400"
                    }`}>
                      {formData.password === formData.confirmPassword ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Passwords match
                        </>
                      ) : (
                        "Passwords must match"
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    required
                    placeholder="Re-enter password" 
                    className={`w-full h-11 pl-10 pr-11 bg-[#0b0c12] border rounded-xl text-xs sm:text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? "border-amber-500/50 focus:border-amber-500 focus:ring-amber-500"
                        : "border-[#222434] focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
                    }`}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading || googleLoading}
            className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white rounded-xl h-11 text-xs sm:text-sm font-bold mt-5 shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{tab === "login" ? "Sign In to Account" : "Create Account & Continue"}</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="border-t border-[#222434] w-full"></div>
          <span className="bg-[#13141f] px-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold absolute">
            Or continue with
          </span>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 bg-[#181926] hover:bg-[#202234] border border-[#2a2c42] hover:border-[#8b5cf6]/50 text-white rounded-xl h-11 px-4 text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.7 0 3 .7 3.9 1.5l2.9-2.9C17 1.9 14.7 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9c-.2-.8-.4-1.6-.4-2.4z"
              />
              <path
                fill="#34A853"
                d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
              />
            </svg>
          )}
          <span>{tab === "login" ? "Sign in with Google" : "Sign up with Google"}</span>
        </button>

        {/* Alternate Action prompt */}
        <div className="text-center mt-5 text-xs text-gray-400">
          {tab === "login" ? (
            <p>
              Don't have an account?{" "}
              <button 
                onClick={() => handleTabChange("signup")}
                className="text-[#a78bfa] font-bold hover:underline"
              >
                Sign Up Now
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button 
                onClick={() => handleTabChange("login")}
                className="text-[#a78bfa] font-bold hover:underline"
              >
                Login
              </button>
            </p>
          )}
        </div>

      </motion.div>

      {/* Forgot Password Luxury Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="relative w-full max-w-md bg-[#13141f] border border-[#26283b] rounded-2xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.9)] z-10 overflow-hidden"
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Glow Accent */}
              <div className="absolute -top-16 -left-16 w-32 h-32 bg-[#8b5cf6]/25 rounded-full blur-2xl pointer-events-none" />

              {!forgotSuccess ? (
                <div>
                  {/* Header */}
                  <div className="text-center mb-5">
                    <div className="w-12 h-12 bg-gradient-to-tr from-[#8b5cf6]/20 to-[#6d28d9]/20 border border-[#8b5cf6]/30 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(139,92,246,0.25)]">
                      <KeyRound className="w-6 h-6 text-[#a78bfa]" />
                    </div>
                    <h3 className="text-lg font-black text-white tracking-tight">Reset Your Password</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                      Enter your account email to receive an official password reset link directly in your inbox.
                    </p>
                  </div>

                  {/* Error banner */}
                  {forgotError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{forgotError}</span>
                    </motion.div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-300 mb-1.5">
                        Registered Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="w-full h-11 pl-10 pr-4 bg-[#0b0c12] border border-[#222434] rounded-xl text-xs sm:text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white rounded-xl h-11 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(139,92,246,0.45)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {forgotLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Reset Link</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Security Note */}
                  <p className="text-[11px] text-gray-500 text-center mt-4">
                    Nexus Store will securely email you a link to choose a new password.
                  </p>
                </div>
              ) : (
                /* Success View */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-2"
                >
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-black text-white tracking-tight">Check Your Email!</h3>
                  <p className="text-xs text-gray-300 mt-2 leading-relaxed max-w-sm mx-auto">
                    We've sent a password reset link to: <br/>
                    <strong className="text-[#a78bfa]">{forgotEmail}</strong>
                  </p>

                  <div className="mt-5 p-3.5 bg-[#0b0c12] border border-[#222434] rounded-xl text-left text-xs text-gray-400 space-y-1.5">
                    <p className="text-gray-300 font-semibold text-[11px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
                      Instructions:
                    </p>
                    <p>1. Open your email inbox (also check Spam / Promotions folder).</p>
                    <p>2. Click on the password reset link sent by Firebase.</p>
                    <p>3. Set your new password and return here to log in.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-full bg-[#181926] hover:bg-[#222438] text-white border border-[#292b3e] rounded-xl h-10 text-xs font-semibold mt-5 transition-colors"
                  >
                    Done &amp; Back to Login
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


