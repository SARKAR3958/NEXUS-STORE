import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Settings, KeyRound, Eye, EyeOff, Save, CheckCircle2, 
  AlertCircle, RefreshCw, UserCheck, CreditCard, Upload, Loader2, Image as ImageIcon, Sparkles,
  BarChart3, Users, Box, LayoutGrid, Zap
} from "lucide-react";
import { useAdminStore } from "@/store/adminStore";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { uploadToImgBB, setCachedImgBBApiKey } from "@/lib/imgbb";

export function AdminSettings() {
  const { adminUser, adminSecretKey, fetchAdminSecretKey, updateAdminSecretKey } = useAdminStore();
  
  const [currentKeyInput, setCurrentKeyInput] = useState(adminSecretKey);
  const [showKey, setShowKey] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ImgBB API Key States
  const [imgbbApiKey, setImgbbApiKey] = useState("");
  const [showImgbbKey, setShowImgbbKey] = useState(false);
  const [isSavingImgbb, setIsSavingImgbb] = useState(false);

  // AI Assistant States
  const [aiAssistantApiKey, setAiAssistantApiKey] = useState("");
  const [showAiKey, setShowAiKey] = useState(false);
  const [openRouterApiKey, setOpenRouterApiKey] = useState("");
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [aiCustomKnowledge, setAiCustomKnowledge] = useState("");
  const [isSavingAi, setIsSavingAi] = useState(false);

  // Payment Settings States
  const [paymentAccountNumber, setPaymentAccountNumber] = useState("");
  const [paymentAccountTitle, setPaymentAccountTitle] = useState("");
  const [paymentMethodName, setPaymentMethodName] = useState("");
  const [paymentMethodLogoText, setPaymentMethodLogoText] = useState("");
  const [paymentMethodLogoUrl, setPaymentMethodLogoUrl] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Homepage Statistics Counters States
  const [stat1Value, setStat1Value] = useState("10K+");
  const [stat1Label, setStat1Label] = useState("Happy Customers");
  const [stat2Value, setStat2Value] = useState("5K+");
  const [stat2Label, setStat2Label] = useState("Premium Products");
  const [stat3Value, setStat3Value] = useState("50+");
  const [stat3Label, setStat3Label] = useState("Categories");
  const [stat4Value, setStat4Value] = useState("99.9%");
  const [stat4Label, setStat4Label] = useState("Uptime & Support");
  const [isSavingStats, setIsSavingStats] = useState(false);

  useEffect(() => {
    fetchAdminSecretKey().then((k) => setCurrentKeyInput(k));
  }, [fetchAdminSecretKey]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "system_config", "admin_settings"));
        if (snap.exists()) {
          const data = snap.data();
          setImgbbApiKey(data.imgbbApiKey || "2d1f95c478a876793e150937a0774da3");
          setAiAssistantApiKey(data.aiAssistantApiKey || "");
          setOpenRouterApiKey(data.openRouterApiKey || "");
          setAiCustomKnowledge(data.aiCustomKnowledge || "You are Nexus Store AI Assistant. Help customers with product downloads, payment verification, custom app requests, and store orders.");
          setPaymentAccountNumber(data.paymentAccountNumber || "03001234567");
          setPaymentAccountTitle(data.paymentAccountTitle || "SadaPay Digital Official");
          setPaymentMethodName(data.paymentMethodName || "SadaPay");
          setPaymentMethodLogoText(data.paymentMethodLogoText || "Sada");
          setPaymentMethodLogoUrl(data.paymentMethodLogoUrl || "");

          setStat1Value(data.stat1Value || "10K+");
          setStat1Label(data.stat1Label || "Happy Customers");
          setStat2Value(data.stat2Value || "5K+");
          setStat2Label(data.stat2Label || "Premium Products");
          setStat3Value(data.stat3Value || "50+");
          setStat3Label(data.stat3Label || "Categories");
          setStat4Value(data.stat4Value || "99.9%");
          setStat4Label(data.stat4Label || "Uptime & Support");
        } else {
          setImgbbApiKey("2d1f95c478a876793e150937a0774da3");
          setAiAssistantApiKey("");
          setAiCustomKnowledge("You are Nexus Store AI Assistant. Help customers with product downloads, payment verification, custom app requests, and store orders.");
          setPaymentAccountNumber("03001234567");
          setPaymentAccountTitle("SadaPay Digital Official");
          setPaymentMethodName("SadaPay");
          setPaymentMethodLogoText("Sada");
          setPaymentMethodLogoUrl("");
        }
      } catch (err) {
        console.error("Failed to load admin settings:", err);
      }
    };
    loadSettings();
  }, []);

  const handleSaveAiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAi(true);
    setStatusMessage(null);

    const trimmedKey = aiAssistantApiKey.trim();
    const trimmedOpenRouterKey = openRouterApiKey.trim();

    try {
      await setDoc(doc(db, "system_config", "admin_settings"), {
        aiAssistantApiKey: trimmedKey,
        openRouterApiKey: trimmedOpenRouterKey,
        aiCustomKnowledge: aiCustomKnowledge.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email || "admin",
      }, { merge: true });

      setStatusMessage({
        type: "success",
        text: "AI Assistant configuration saved! Store AI chatbot will now use your API Key(s) & custom store training.",
      });
    } catch (err: any) {
      console.error("Failed to save AI settings:", err);
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to save AI Assistant settings.",
      });
    } finally {
      setIsSavingAi(false);
    }
  };

  const handleSaveImgbbSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imgbbApiKey.trim()) {
      setStatusMessage({ type: "error", text: "ImgBB API Key cannot be empty." });
      return;
    }

    setIsSavingImgbb(true);
    setStatusMessage(null);

    try {
      const keyToSave = imgbbApiKey.trim();
      await setDoc(doc(db, "system_config", "admin_settings"), {
        imgbbApiKey: keyToSave,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email || "admin",
      }, { merge: true });

      setCachedImgBBApiKey(keyToSave);

      setStatusMessage({
        type: "success",
        text: "ImgBB API Key saved successfully! All user and admin image uploads will now use this key.",
      });
    } catch (err: any) {
      console.error("Failed to save ImgBB API Key:", err);
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to save ImgBB API Key in Firestore.",
      });
    } finally {
      setIsSavingImgbb(false);
    }
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {

    e.preventDefault();
    if (!paymentAccountNumber.trim() || !paymentAccountTitle.trim() || !paymentMethodName.trim()) {
      setStatusMessage({ type: "error", text: "Please fill in all required payment details." });
      return;
    }

    setIsSavingPayment(true);
    setStatusMessage(null);

    try {
      await setDoc(doc(db, "system_config", "admin_settings"), {
        paymentAccountNumber: paymentAccountNumber.trim(),
        paymentAccountTitle: paymentAccountTitle.trim(),
        paymentMethodName: paymentMethodName.trim(),
        paymentMethodLogoText: paymentMethodLogoText.trim() || "Sada",
        paymentMethodLogoUrl: paymentMethodLogoUrl.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email || "admin",
      }, { merge: true });

      setStatusMessage({
        type: "success",
        text: "Payment gateway details updated successfully in Firestore!",
      });
    } catch (err: any) {
      console.error("Failed to update payment settings:", err);
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to save payment details in Firestore.",
      });
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleUpdateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentKeyInput.trim()) {
      setStatusMessage({ type: "error", text: "Security key cannot be blank." });
      return;
    }

    setIsUpdating(true);
    setStatusMessage(null);

    const res = await updateAdminSecretKey(currentKeyInput);
    setIsUpdating(false);

    if (res.success) {
      setStatusMessage({ 
        type: "success", 
        text: `Admin Security Key updated successfully!` 
      });
    } else {
      setStatusMessage({ type: "error", text: res.message || "Failed to update security key." });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto w-full px-2 py-4 sm:p-6 lg:p-8">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-[#a78bfa]" />
          <span>Security & System Settings</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Manage admin authentication key and payment method configuration.
        </p>
      </div>

      {/* Toast Feedback */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-lg ${
              statusMessage.type === "success"
                ? "bg-emerald-950/50 border-emerald-800/70 text-emerald-300"
                : "bg-red-950/50 border-red-800/70 text-red-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6 max-w-4xl">
        
        {/* ADMIN SECURITY KEY */}
        <div className="bg-[#10111a] border border-[#202234] rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#a78bfa]" />
                <span>Admin Master Security Key</span>
              </h2>
            </div>
          </div>

          <form onSubmit={handleUpdateKey} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Current Master Admin Key
              </label>

              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={currentKeyInput}
                  onChange={(e) => setCurrentKeyInput(e.target.value)}
                  placeholder="Enter master security key..."
                  className="w-full bg-[#090a10] border border-[#26283c] focus:border-[#8b5cf6] rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-gray-600 focus:outline-none transition-colors pr-11 tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 cursor-pointer"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isUpdating || !currentKeyInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white text-xs font-bold shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Key in Firestore</span>
              </button>
            </div>
          </form>
        </div>

        {/* AI ASSISTANT CONFIGURATION & API KEY */}
        <div className="bg-[#10111a] border border-[#202234] rounded-3xl p-6 shadow-xl space-y-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-300 text-[10px] font-mono font-bold uppercase mb-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Smart Support Intelligence</span>
            </div>
            <h2 className="text-base font-bold text-white">AI ASSISTANT CONFIGURATION & API KEY</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Set up your Google Gemini API key to power the customer support AI Assistant. You can also train the AI with custom store instructions.
            </p>
          </div>

          <form onSubmit={handleSaveAiSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                <span>Gemini AI API Key</span>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-[10px] text-purple-400 font-mono hover:underline flex items-center gap-1"
                >
                  <span>Get Free Key (Google AI Studio)</span>
                </a>
              </label>

              <div className="relative">
                <input
                  type={showAiKey ? "text" : "password"}
                  value={aiAssistantApiKey}
                  onChange={(e) => setAiAssistantApiKey(e.target.value)}
                  placeholder="Paste Gemini API Key from Google AI Studio"
                  className="w-full bg-[#090a10] border border-[#26283c] focus:border-[#8b5cf6] rounded-xl px-4 py-3 text-xs text-white font-mono placeholder-gray-600 focus:outline-none transition-colors pr-11 tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowAiKey(!showAiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 cursor-pointer"
                >
                  {showAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* API Key Guide Banner */}
              <div className="mt-2.5 p-3 rounded-xl bg-purple-950/30 border border-purple-800/30 text-[11px] text-gray-300 space-y-1">
                <p className="font-bold text-purple-300 flex items-center gap-1.5">
                  <span>💡 How to copy your Google AI Studio API key:</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-gray-400 pl-1">
                  <li>In Google AI Studio, click on <strong className="text-white">API Key details</strong> or the <strong className="text-white">Copy key button 📋</strong>.</li>
                  <li>Copy the full string provided in your Google AI Studio modal (e.g. <code className="text-purple-300 font-mono">AQ.Ab8RN6...</code> or <code className="text-purple-300 font-mono">AIzaSy...</code>).</li>
                  <li>Paste it above and click <strong className="text-purple-300">Save AI Configuration</strong>.</li>
                </ol>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                <span>OpenRouter API Key (Optional / Fallback)</span>
                <a 
                  href="https://openrouter.ai/keys" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-[10px] text-purple-400 font-mono hover:underline flex items-center gap-1"
                >
                  <span>Get Free Key (OpenRouter)</span>
                </a>
              </label>

              <div className="relative">
                <input
                  type={showOpenRouterKey ? "text" : "password"}
                  value={openRouterApiKey}
                  onChange={(e) => setOpenRouterApiKey(e.target.value)}
                  placeholder="Paste OpenRouter Key (e.g. sk-or-v1-...)"
                  className="w-full bg-[#090a10] border border-[#26283c] focus:border-[#8b5cf6] rounded-xl px-4 py-3 text-xs text-white font-mono placeholder-gray-600 focus:outline-none transition-colors pr-11 tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 cursor-pointer"
                >
                  {showOpenRouterKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                OpenRouter supports 100+ free AI models (Llama 3.3, Gemini 2.0 Flash, DeepSeek R1). If Gemini rate limits are hit, OpenRouter will handle chatbot responses seamlessly.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Custom Store Training & Prompt Instructions
              </label>
              <textarea
                rows={3}
                value={aiCustomKnowledge}
                onChange={(e) => setAiCustomKnowledge(e.target.value)}
                placeholder="Instruct the AI on how to answer store questions (e.g. products, payment rules, custom dev process)..."
                className="w-full bg-[#090a10] border border-[#26283c] focus:border-[#8b5cf6] rounded-xl p-3.5 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors leading-relaxed"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                The AI is automatically pre-trained with your store products, active payment method, and instant download procedures. Add custom rules above to tailor its responses further.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingAi}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save AI Configuration</span>
              </button>
            </div>
          </form>
        </div>
        <div className="bg-[#10111a] border border-[#202234] rounded-3xl p-6 shadow-xl space-y-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-300 text-[10px] font-mono font-bold uppercase mb-2">
              <ImageIcon className="w-3 h-3 text-purple-400" />
              <span>Image Hosting CDN Configuration</span>
            </div>
            <h2 className="text-base font-bold text-white">IMG UPLOAD API KEYS</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Configure your ImgBB CDN API key. This key is used for all image uploads across the store for both user and admin (products, logos, payment screenshots, profile avatars, etc.).
            </p>
          </div>

          <form onSubmit={handleSaveImgbbSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                <span>1st Input: ImgBB API Key *</span>
                <span className="text-[10px] text-purple-400 font-mono">api.imgbb.com/1/upload</span>
              </label>

              <div className="relative">
                <input
                  type={showImgbbKey ? "text" : "password"}
                  value={imgbbApiKey}
                  onChange={(e) => setImgbbApiKey(e.target.value)}
                  placeholder="Enter ImgBB API key (e.g., 2d1f95c478a...)"
                  className="w-full bg-[#090a10] border border-[#26283c] focus:border-[#8b5cf6] rounded-xl px-4 py-3 text-xs text-white font-mono placeholder-gray-600 focus:outline-none transition-colors pr-11 tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowImgbbKey(!showImgbbKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 cursor-pointer"
                >
                  {showImgbbKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5 leading-normal">
                All image uploads in Admin and User panels automatically route through this ImgBB CDN API key. Get a free key at <a href="https://api.imgbb.com/" target="_blank" rel="noreferrer" className="text-purple-400 underline font-mono">api.imgbb.com</a>.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingImgbb || !imgbbApiKey.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingImgbb ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save ImgBB API Key</span>
              </button>
            </div>
          </form>
        </div>

        {/* DYNAMIC PAYMENT METHOD SETTINGS */}
        <div className="bg-[#10111a] border border-[#202234] rounded-3xl p-6 shadow-xl space-y-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-[10px] font-mono font-bold uppercase mb-2">
              <CreditCard className="w-3 h-3" />
              <span>Firestore Configured Gateway</span>
            </div>
            <h2 className="text-base font-bold text-white">Payment Method Details</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Configure payment method name, account number, title, and logo branding served during Checkout.
            </p>
          </div>

          <form onSubmit={handleSavePaymentSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Payment Method Name *
                </label>
                <input
                  type="text"
                  required
                  value={paymentMethodName}
                  onChange={(e) => setPaymentMethodName(e.target.value)}
                  placeholder="e.g., SadaPay, Easypaisa, Bank Transfer"
                  className="w-full bg-[#090a10] border border-[#26283c] focus:border-[#8b5cf6] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Account Title *
                </label>
                <input
                  type="text"
                  required
                  value={paymentAccountTitle}
                  onChange={(e) => setPaymentAccountTitle(e.target.value)}
                  placeholder="e.g., John Doe Digital Inc."
                  className="w-full bg-[#090a10] border border-[#26283c] focus:border-[#8b5cf6] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Account / Wallet Number *
                </label>
                <input
                  type="text"
                  required
                  value={paymentAccountNumber}
                  onChange={(e) => setPaymentAccountNumber(e.target.value)}
                  placeholder="e.g., 03001234567"
                  className="w-full bg-[#090a10] border border-[#26283c] focus:border-[#8b5cf6] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors font-mono tracking-wider"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Logo / Icon Text *
                </label>
                <input
                  type="text"
                  required
                  value={paymentMethodLogoText}
                  onChange={(e) => setPaymentMethodLogoText(e.target.value)}
                  placeholder="e.g., Sada, EP, Bank"
                  className="w-full bg-[#090a10] border border-[#26283c] focus:border-[#8b5cf6] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex flex-wrap items-center justify-between gap-1">
                <span>Custom Logo Image (ImgBB CDN / URL)</span>
                <span className="text-[10px] text-purple-400">Stores on ImgBB CDN</span>
              </label>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={paymentMethodLogoUrl}
                    onChange={(e) => setPaymentMethodLogoUrl(e.target.value)}
                    placeholder="e.g., https://i.ibb.co/... or upload file"
                    className="w-full sm:flex-1 bg-[#090a10] border border-[#26283c] focus:border-[#8b5cf6] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors font-mono"
                  />
                  <label className="bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#a78bfa] hover:bg-[#8b5cf6] hover:text-white px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 font-bold cursor-pointer transition-colors text-xs shrink-0 w-full sm:w-auto">
                    {isUploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{isUploadingLogo ? "Uploading..." : "Upload Logo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingLogo}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIsUploadingLogo(true);
                          try {
                            const url = await uploadToImgBB(file);
                            setPaymentMethodLogoUrl(url);
                          } catch (err) {
                            console.error("Logo upload error:", err);
                          } finally {
                            setIsUploadingLogo(false);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                {paymentMethodLogoUrl && (
                  <div className="flex items-center gap-3 p-2 bg-[#090a10] border border-[#26283c] rounded-xl">
                    <img src={paymentMethodLogoUrl} alt="Logo Preview" className="w-10 h-10 object-contain rounded-lg bg-white/5 p-1" />
                    <span className="text-xs text-gray-400 truncate flex-1 font-mono">{paymentMethodLogoUrl}</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                If left blank, a gradient badge with the <strong>Logo / Icon Text</strong> is displayed.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingPayment}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingPayment ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Payment Settings</span>
              </button>
            </div>
          </form>
        </div>

        {/* ===================== HOMEPAGE STATISTICS COUNTERS SECTION ===================== */}
        <div className="bg-[#121322] border border-[#202238] rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#202238]">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Homepage Statistics Counters</h2>
              <p className="text-xs text-gray-400">Edit live counter metrics displayed on the storefront home banner (Happy Customers, Products, etc.).</p>
            </div>
          </div>

          {/* Live Preview Bar matching User Image */}
          <div className="mb-6 bg-[#090a10] border border-[#202238] rounded-xl p-4">
            <div className="text-[11px] font-semibold text-gray-400 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Live Banner Preview</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Preview Stat 1 */}
              <div className="bg-[#13141f] border border-[#242638] rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center text-[#a78bfa] shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black text-white truncate">{stat1Value || "10K+"}</div>
                  <div className="text-gray-400 text-[10px] truncate">{stat1Label || "Happy Customers"}</div>
                </div>
              </div>

              {/* Preview Stat 2 */}
              <div className="bg-[#13141f] border border-[#242638] rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
                  <Box className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black text-white truncate">{stat2Value || "5K+"}</div>
                  <div className="text-gray-400 text-[10px] truncate">{stat2Label || "Premium Products"}</div>
                </div>
              </div>

              {/* Preview Stat 3 */}
              <div className="bg-[#13141f] border border-[#242638] rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black text-white truncate">{stat3Value || "50+"}</div>
                  <div className="text-gray-400 text-[10px] truncate">{stat3Label || "Categories"}</div>
                </div>
              </div>

              {/* Preview Stat 4 */}
              <div className="bg-[#13141f] border border-[#242638] rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black text-white truncate">{stat4Value || "99.9%"}</div>
                  <div className="text-gray-400 text-[10px] truncate">{stat4Label || "Uptime & Support"}</div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsSavingStats(true);
            setStatusMessage(null);
            try {
              await setDoc(doc(db, "system_config", "admin_settings"), {
                stat1Value: stat1Value.trim(),
                stat1Label: stat1Label.trim(),
                stat2Value: stat2Value.trim(),
                stat2Label: stat2Label.trim(),
                stat3Value: stat3Value.trim(),
                stat3Label: stat3Label.trim(),
                stat4Value: stat4Value.trim(),
                stat4Label: stat4Label.trim(),
                updatedAt: new Date().toISOString(),
                updatedBy: auth.currentUser?.email || "admin",
              }, { merge: true });

              setStatusMessage({
                type: "success",
                text: "Homepage statistics counters saved! Store homepage is updated in real-time.",
              });
            } catch (err: any) {
              console.error("Failed to save stats settings:", err);
              setStatusMessage({
                type: "error",
                text: "Failed to save stats settings: " + (err.message || "Unknown error"),
              });
            } finally {
              setIsSavingStats(false);
            }
          }} className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stat 1 Input */}
              <div className="bg-[#090a10] border border-[#202238] rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Stat 1 (Customers)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Count Value</label>
                    <input
                      type="text"
                      value={stat1Value}
                      onChange={(e) => setStat1Value(e.target.value)}
                      placeholder="e.g. 10K+"
                      className="w-full bg-[#121320] border border-[#242638] focus:border-[#8b5cf6] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Title Label</label>
                    <input
                      type="text"
                      value={stat1Label}
                      onChange={(e) => setStat1Label(e.target.value)}
                      placeholder="e.g. Happy Customers"
                      className="w-full bg-[#121320] border border-[#242638] focus:border-[#8b5cf6] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Stat 2 Input */}
              <div className="bg-[#090a10] border border-[#202238] rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-pink-300">
                  <Box className="w-4 h-4 text-pink-400" />
                  <span>Stat 2 (Products)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Count Value</label>
                    <input
                      type="text"
                      value={stat2Value}
                      onChange={(e) => setStat2Value(e.target.value)}
                      placeholder="e.g. 5K+"
                      className="w-full bg-[#121320] border border-[#242638] focus:border-[#8b5cf6] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Title Label</label>
                    <input
                      type="text"
                      value={stat2Label}
                      onChange={(e) => setStat2Label(e.target.value)}
                      placeholder="e.g. Premium Products"
                      className="w-full bg-[#121320] border border-[#242638] focus:border-[#8b5cf6] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Stat 3 Input */}
              <div className="bg-[#090a10] border border-[#202238] rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
                  <LayoutGrid className="w-4 h-4 text-sky-400" />
                  <span>Stat 3 (Categories)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Count Value</label>
                    <input
                      type="text"
                      value={stat3Value}
                      onChange={(e) => setStat3Value(e.target.value)}
                      placeholder="e.g. 50+"
                      className="w-full bg-[#121320] border border-[#242638] focus:border-[#8b5cf6] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Title Label</label>
                    <input
                      type="text"
                      value={stat3Label}
                      onChange={(e) => setStat3Label(e.target.value)}
                      placeholder="e.g. Categories"
                      className="w-full bg-[#121320] border border-[#242638] focus:border-[#8b5cf6] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Stat 4 Input */}
              <div className="bg-[#090a10] border border-[#202238] rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Stat 4 (Support)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Count Value</label>
                    <input
                      type="text"
                      value={stat4Value}
                      onChange={(e) => setStat4Value(e.target.value)}
                      placeholder="e.g. 99.9%"
                      className="w-full bg-[#121320] border border-[#242638] focus:border-[#8b5cf6] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Title Label</label>
                    <input
                      type="text"
                      value={stat4Label}
                      onChange={(e) => setStat4Label(e.target.value)}
                      placeholder="e.g. Uptime & Support"
                      className="w-full bg-[#121320] border border-[#242638] focus:border-[#8b5cf6] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingStats}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(124,58,237,0.3)] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingStats ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Statistics Settings</span>
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
