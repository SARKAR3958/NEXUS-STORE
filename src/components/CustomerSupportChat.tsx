import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  MessageSquare, Bot, UserCheck, Send, X, 
  Headphones, Sparkles, CheckCheck, Loader2, User, ShieldAlert, Image as ImageIcon, Lock
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/firebase';
import { 
  collection, doc, setDoc, addDoc, onSnapshot, query, orderBy, serverTimestamp, getDoc, getDocs 
} from 'firebase/firestore';
import { sendNtfyNotification } from '../lib/ntfy';

interface Message {
  id: string;
  text?: string;
  imageUrl?: string;
  sender: 'ai' | 'user' | 'admin';
  senderName?: string;
  timestamp?: any;
}

interface WebsiteProduct {
  id: string;
  title: string;
  description?: string;
  category?: string;
  price?: number;
  originalPrice?: number;
  features?: string[];
  version?: string;
}

function formatMessageDateTime(timestamp?: any) {
  try {
    const date = timestamp?.toDate ? timestamp.toDate() : timestamp ? new Date(timestamp) : new Date();
    return `${date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return 'Just now';
  }
}

export function CustomerSupportChat() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'ai' | 'admin'>('ai');
  const [showAdminLoginPrompt, setShowAdminLoginPrompt] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unique session ID for user
  const getUserId = () => {
    if (user?.id) return user.id;
    if (user?.email) return user.email.replace(/[^a-zA-Z0-9]/g, '_');
    let guestId = localStorage.getItem('nexus_guest_support_id');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('nexus_guest_support_id', guestId);
    }
    return guestId;
  };

  const userId = getUserId();
  const userName = user?.name || user?.email || 'Guest User';
  const userEmail = user?.email || 'guest@nexusstore.com';

  // Local state for AI chat messages
  const [aiMessages, setAiMessages] = useState<Message[]>([]);

  // AI Config & Payment states loaded from Firestore
  const [aiKnowledge, setAiKnowledge] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    paymentMethodName: 'SadaPay',
    paymentAccountTitle: 'SadaPay Digital Official',
    paymentAccountNumber: '03001234567'
  });
  const [websiteProducts, setWebsiteProducts] = useState<WebsiteProduct[]>([]);

  // Firestore messages for Admin mode
  const [adminMessages, setAdminMessages] = useState<Message[]>([]);

  // Initialize welcome message with user name and active payment method
  useEffect(() => {
    const displayName = userName !== 'Guest User' ? userName : 'Valued Customer';
    const methodName = paymentDetails.paymentMethodName || 'SadaPay';
    setAiMessages([
      {
        id: 'welcome-1',
        text: `Hello ${displayName}! 👋 Welcome to Nexus Store AI Assistant. Ask me anything about our digital products, ${methodName} payments, or custom apps!`,
        sender: 'ai',
        senderName: 'Nexus AI',
      }
    ]);
  }, [userName, paymentDetails.paymentMethodName]);

  // Load AI & Payment Settings on mount
  useEffect(() => {
    const loadAiSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'public_settings', 'storefront'));
        if (snap.exists()) {
          const data = snap.data();
          if (data.aiCustomKnowledge) setAiKnowledge(data.aiCustomKnowledge);
          setPaymentDetails({
            paymentMethodName: data.paymentMethodName || 'SadaPay',
            paymentAccountTitle: data.paymentAccountTitle || 'SadaPay Digital Official',
            paymentAccountNumber: data.paymentAccountNumber || '03001234567'
          });
        }
      } catch (err) {
        console.warn("Failed to fetch AI settings from Firestore:", err);
      }
    };
    loadAiSettings();
  }, []);

  // Keep AI answers aligned with the live Firestore product catalog.
  useEffect(() => {
    const loadWebsiteProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'products'));
        setWebsiteProducts(snapshot.docs.map((productDoc) => {
          const data = productDoc.data();
          return {
            id: productDoc.id,
            title: data.title || 'Untitled product',
            description: data.description || '',
            category: data.category || '',
            price: typeof data.price === 'number' ? data.price : undefined,
            originalPrice: typeof data.originalPrice === 'number' ? data.originalPrice : undefined,
            features: Array.isArray(data.features) ? data.features.filter((feature: unknown): feature is string => typeof feature === 'string') : [],
            version: data.version || '',
          };
        }));
      } catch (error) {
        console.warn('Failed to fetch product catalog for AI context:', error);
      }
    };
    loadWebsiteProducts();
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, adminMessages, isOpen, mode]);

  // Sync Firestore messages when in Admin mode
  useEffect(() => {
    if (!userId) return;

    try {
      const messagesRef = collection(db, 'support_chat_io', userId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() } as Message);
        });
        setAdminMessages(msgs);
      }, (error) => {
        console.warn("Firestore snapshot warning for support chat:", error);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Firestore chat listener error:", e);
    }
  }, [userId]);

  // Handle sending AI message
  const handleSendAi = async () => {
    if (!inputMessage.trim()) return;
    const text = inputMessage.trim();
    setInputMessage('');

    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      senderName: userName,
      timestamp: new Date(),
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setIsAiLoading(true);

    try {
      const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!openRouterKey) throw new Error('VITE_OPENROUTER_API_KEY is missing');

      const websiteContext = {
        store: 'Nexus Store digital marketplace',
        categories: ['Apps', 'Websites', 'Custom Apps', 'Source Code'],
        paymentDetails,
        customKnowledge: aiKnowledge,
        productCatalog: websiteProducts,
        workflows: [
          'Users must create an account before adding products to cart or placing an order.',
          'Orders are placed through checkout after payment proof upload.',
          'Order history and downloads are available in the user profile.',
          'Human support is available through Contact Admin for logged-in users; AI support is available to guests.',
        ],
      };

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openRouterKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Nexus Store AI Assistant',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [
            { role: 'system', content: `You are Nexus Store AI Support Assistant. Use only this live website data. Never invent products, prices, payment details, or policies.\n${JSON.stringify(websiteContext, null, 2)}` },
            { role: 'user', content: `${userName !== 'Guest User' ? `Customer name: ${userName}\n` : ''}${text}` },
          ],
          max_tokens: 500,
        }),
      });
      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`OpenRouter request failed with ${res.status}: ${errorBody}`);
      }
      const data = await res.json();

      const aiReplyMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: data.choices?.[0]?.message?.content || 'AI did not return a response.',
        sender: 'ai',
        senderName: 'Nexus AI',
      };

      setAiMessages((prev) => [...prev, aiReplyMsg]);
    } catch (err) {
      console.error('Error getting AI reply:', err);
      setAiMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: err instanceof Error && err.message.includes('VITE_OPENROUTER_API_KEY')
            ? 'OpenRouter API key is not configured. Add VITE_OPENROUTER_API_KEY in Netlify and redeploy.'
            : 'AI service is unavailable. Please try again in a moment.',
          sender: 'ai',
          senderName: 'Nexus AI',
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgData = event.target?.result as string;
      setSelectedImage(imgData);
    };
    reader.readAsDataURL(file);
  };

  // Handle sending Admin message (Saves to support_chat_io/{userId})
  const handleSendAdmin = async () => {
    if (!inputMessage.trim() && !selectedImage) return;
    const text = inputMessage.trim();
    const imageToSend = selectedImage;
    setInputMessage('');
    setSelectedImage(null);

    try {
      // 1. Update root document in support_chat_io
      const chatDocRef = doc(db, 'support_chat_io', userId);
      await setDoc(chatDocRef, {
        userId,
        userName,
        userEmail,
        lastMessage: text || '📷 Sent an image attachment',
        lastUpdated: serverTimestamp(),
        unreadByAdmin: true,
        unreadByUser: false,
      }, { merge: true });

      // 2. Add message to subcollection
      const messagesRef = collection(db, 'support_chat_io', userId, 'messages');
      await addDoc(messagesRef, {
        text,
        imageUrl: imageToSend || null,
        sender: 'user',
        senderName: userName,
        timestamp: serverTimestamp(),
      });

      sendNtfyNotification('New Nexus Admin Chat Message', [
        `USER NAME: ${userName}`,
        `EMAIL: ${userEmail}`,
        `MESSAGE: ${text || 'Image attachment sent'}`,
      ].join('\n')).then((sent) => {
        if (!sent) console.warn('Chat ntfy notification could not be delivered');
      });
    } catch (err) {
      console.error('Error sending message to admin:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (mode === 'ai') handleSendAi();
      else handleSendAdmin();
    }
  };

  return (
    <>
      {/* Floating Customer Support Button */}
      {!isOpen && (
        <motion.button
          key={location.pathname}
          drag
          dragMomentum={false}
          dragElastic={0.05}
          whileDrag={{ scale: 1.05 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white px-4 py-3.5 rounded-full shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all transform hover:scale-105 active:scale-95 group cursor-pointer touch-none"
          aria-label="Customer Support Chat"
        >
          <div className="relative">
            <Headphones className="w-5 h-5 transition-transform group-hover:rotate-12" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-xs font-bold tracking-wide hidden sm:inline">Support Chat</span>
        </motion.button>
      )}

      {/* Support Chat Drawer / Window */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 w-full sm:w-[380px] h-full sm:h-[520px] max-h-none sm:max-h-[85vh] bg-[#141520] border-0 sm:border sm:border-[#26283d] rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Chat Header */}
          <div className="p-4 bg-[#0d0e17] border-b border-[#222434] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#a78bfa] relative">
                {mode === 'ai' ? <Bot className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0d0e17]"></span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Nexus Customer Support
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h3>
                <span className="text-[11px] text-gray-400">
                  {mode === 'ai' ? '🤖 AI Assistant Active' : '👨‍💼 Connected with Admin'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a1c2b] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switcher Bar */}
          <div className="px-3 py-2 bg-[#090a10] border-b border-[#1c1e2e] flex items-center justify-between gap-2">
            <button
              onClick={() => setMode('ai')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'ai'
                  ? 'bg-[#8b5cf6] text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                  : 'text-gray-400 hover:text-white hover:bg-[#141522]'
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> AI Assistant
            </button>

            <button
              onClick={() => {
                if (!user) {
                  setShowAdminLoginPrompt(true);
                  return;
                }
                setMode('admin');
                setShowAdminLoginPrompt(false);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'admin'
                  ? 'bg-[#8b5cf6] text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                  : 'text-gray-400 hover:text-white hover:bg-[#141522]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" /> Contact Admin
            </button>
          </div>

          {showAdminLoginPrompt && (
            <div className="p-4 bg-[#171829] border-b border-[#2b2e47]">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">Login required</p>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Please login or create an account to continue chatting with an admin.</p>
                  <button
                    onClick={() => navigate('/auth?tab=signup')}
                    className="mt-3 px-3 py-2 rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-bold transition-colors"
                  >
                    Login / Sign Up
                  </button>
                </div>
                <button onClick={() => setShowAdminLoginPrompt(false)} className="text-gray-500 hover:text-white" aria-label="Close login prompt">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#0f1019]/50">
            {mode === 'ai' ? (
              <>
                {aiMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs md:text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#8b5cf6] text-white rounded-tr-none'
                          : 'bg-[#1a1c2e] text-gray-200 border border-[#2a2c42] rounded-tl-none'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-purple-300 mb-1 opacity-80">
                        {msg.sender === 'user' ? (
                          <span>You</span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Bot className="w-3 h-3 text-purple-400" /> Nexus AI
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <p className="mt-1 text-[9px] text-purple-200/70 text-right">{formatMessageDateTime(msg.timestamp)}</p>
                    </div>
                  </div>
                ))}

                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#1a1c2e] border border-[#2a2c42] rounded-2xl rounded-tl-none px-4 py-2.5 flex items-center gap-2 text-xs text-purple-300">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Nexus AI is typing...</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {adminMessages.length === 0 ? (
                  <div className="text-center py-8 px-4 text-gray-400">
                    <Headphones className="w-8 h-8 text-purple-400 mx-auto mb-2 opacity-80" />
                    <p className="text-xs font-semibold text-white mb-1">Direct Line to Admin</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Send your message below. Our admin team will receive your notification and reply right here in real-time!
                    </p>
                  </div>
                ) : (
                  adminMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs md:text-sm leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-[#8b5cf6] text-white rounded-tr-none'
                            : 'bg-[#1e2035] text-emerald-200 border border-[#2e3150] rounded-tl-none'
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-purple-200 mb-1 opacity-90">
                          {msg.sender === 'user' ? (
                            <span>You</span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-400 font-bold">
                              <User className="w-3 h-3" /> Admin Team
                            </span>
                          )}
                        </div>
                        {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                        {msg.imageUrl && (
                          <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
                            <img 
                              src={msg.imageUrl} 
                              alt="Attachment" 
                              className="max-w-full max-h-48 rounded-xl border border-white/10 object-cover shadow-sm hover:opacity-90 transition-opacity" 
                            />
                          </a>
                        )}
                        <p className="mt-1 text-[9px] text-emerald-300/70">{formatMessageDateTime(msg.timestamp)}</p>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attached Image Preview Bar */}
          {mode === 'admin' && selectedImage && (
            <div className="px-3 pt-2 pb-1 bg-[#0d0e17] border-t border-[#222434] flex items-center justify-between">
              <div className="flex items-center gap-2 bg-[#1a1c2b] p-1.5 rounded-lg border border-[#2a2c3d]">
                <img src={selectedImage} alt="Preview" className="w-9 h-9 object-cover rounded-md border border-[#3b3e58]" />
                <span className="text-[11px] text-purple-300 font-medium">Image attached</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-md transition-colors cursor-pointer"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="p-3 bg-[#0d0e17] border-t border-[#222434] flex items-center gap-2">
            {mode === 'admin' && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2.5 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                    selectedImage 
                      ? 'bg-[#8b5cf6]/20 border-[#8b5cf6] text-[#a78bfa]' 
                      : 'bg-[#141522] border-[#25273a] text-gray-400 hover:text-white hover:border-[#3a3c55]'
                  }`}
                  title="Attach Image / Screenshot"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </>
            )}

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={mode === 'ai' && isAiLoading}
              placeholder={
                mode === 'ai' && isAiLoading
                  ? 'AI is thinking...'
                  : mode === 'ai'
                  ? 'Ask AI assistant...'
                  : 'Message admin team...'
              }
              className="flex-1 bg-[#141522] border border-[#25273a] text-white placeholder-gray-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#8b5cf6] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={mode === 'ai' ? handleSendAi : handleSendAdmin}
              disabled={
                mode === 'ai'
                  ? (!inputMessage.trim() || isAiLoading)
                  : (!inputMessage.trim() && !selectedImage)
              }
              className="p-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </>
  );
}
