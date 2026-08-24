import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CreditCard, ShieldCheck, Download, RefreshCw, 
  Lock, CheckCircle2, ArrowLeft, Shield, Copy, Check, Upload, Image, Trash2, Loader2 
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { uploadToImgBB } from '../lib/imgbb';
import { formatCurrency } from '../lib/currency';
import { sendNtfyNotification } from '../lib/ntfy';

export function Checkout() {
  const { items, getTotals, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { subtotal } = getTotals();
  const total = subtotal;

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [copied, setCopied] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Dynamic Payment States with defaults
  const [accountTitle, setAccountTitle] = useState("SadaPay Digital Official");
  const [accountNumber, setAccountNumber] = useState("03001234567");
  const [paymentMethodName, setPaymentMethodName] = useState("SadaPay");
  const [paymentMethodLogoText, setPaymentMethodLogoText] = useState("Sada");
  const [paymentMethodLogoUrl, setPaymentMethodLogoUrl] = useState("");

  // Empty inputs by default as requested by user
  useEffect(() => {
    // Keep empty by default for fresh user entry
    setFullName('');
    setPhoneNumber('');
  }, []);

  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "public_settings", "storefront"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.paymentAccountTitle) setAccountTitle(data.paymentAccountTitle);
          if (data.paymentAccountNumber) setAccountNumber(data.paymentAccountNumber);
          if (data.paymentMethodName) setPaymentMethodName(data.paymentMethodName);
          if (data.paymentMethodLogoText) setPaymentMethodLogoText(data.paymentMethodLogoText);
          if (data.paymentMethodLogoUrl !== undefined) setPaymentMethodLogoUrl(data.paymentMethodLogoUrl);
        }
      } catch (err) {
        console.warn("Failed to fetch payment details from Firestore, using defaults:", err);
      }
    };
    fetchPaymentSettings();
  }, []);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [isUploadingProof, setIsUploadingProof] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Image size must be less than 10MB');
        return;
      }
      setErrorMessage('');
      setIsUploadingProof(true);
      try {
        const cdnUrl = await uploadToImgBB(file);
        setProofImage(cdnUrl);
      } catch (err) {
        console.error("ImgBB upload error:", err);
        // Fallback to local base64 preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setProofImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingProof(false);
      }
    }
  };

  const [step, setStep] = useState<1 | 2>(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleNextStep = () => {
    if (!fullName.trim()) {
      setErrorMessage('Please enter your FULL NAME');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMessage('Please enter your Phone Number');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Your cart is empty');
      return;
    }
    setErrorMessage('');
    setStep(2);
  };

  const handlePlaceOrderClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmOrder = async () => {
    setShowConfirmModal(false);
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const orderData = {
        userId: user?.id || 'guest',
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        userEmail: user?.email || '',
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          category: item.category,
          description: item.description || '',
          image: item.image || item.thumbnailUrl || '',
          thumbnailUrl: item.thumbnailUrl || item.image || '',
          images: item.images && item.images.length > 0 ? item.images : [item.image || item.thumbnailUrl || ''].filter(Boolean),
        })),
        totalAmount: total,
        paymentMethod: paymentMethodName,
        paymentProof: proofImage || null,
        status: 'Pending',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);

      sendNtfyNotification('New Nexus Store Order', [
        `ORDER ID: ${docRef.id}`,
        `USER NAME: ${fullName.trim()}`,
        `PHONE: ${phoneNumber.trim()}`,
        `EMAIL: ${user?.email || 'N/A'}`,
        `PRODUCTS: ${items.map((item) => `${item.title} (${formatCurrency(item.price)})`).join(', ')}`,
        `TOTAL AMOUNT: ${formatCurrency(total)}`,
      ].join('\n')).then((sent) => {
        if (!sent) console.warn('Order ntfy notification could not be delivered');
      });
      
      setOrderConfirmed({
        id: docRef.id,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        totalAmount: total,
        itemCount: items.length,
      });

      clearCart();
    } catch (err: any) {
      console.error('Error placing order:', err);
      setErrorMessage('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderConfirmed) {
    return (
      <div className="min-h-screen bg-[#0b0c12] text-white py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#141520] border border-[#222434] rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold block mb-1">
              Order Placed Successfully!
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white">Thank You for Your Order</h1>
            <p className="text-xs text-gray-400 mt-2">
              Your order ID is <span className="text-purple-300 font-mono font-bold">#{orderConfirmed.id.substring(0, 8)}</span>
            </p>
          </div>

          <div className="bg-[#0d0e15] border border-[#222434] rounded-2xl p-4 text-left space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Customer:</span>
              <span className="font-bold text-white">{orderConfirmed.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Phone:</span>
              <span className="font-bold text-white">{orderConfirmed.phoneNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Paid:</span>
              <span className="font-bold text-[#a78bfa] text-sm">${orderConfirmed.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Payment Status:</span>
              <span className="text-amber-400 font-semibold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                Pending
              </span>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <Link
              to="/products"
              className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white py-3.5 rounded-xl font-bold text-xs md:text-sm block transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)]"
            >
              Continue Shopping
            </Link>
            <Link
              to="/profile"
              className="w-full bg-[#1e202e] hover:bg-[#282a3c] text-gray-300 py-3 text-xs font-semibold rounded-xl block transition-all"
            >
              View Order History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c12] text-white py-6 md:py-10 pb-20">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/products" className="p-2 text-gray-300 hover:text-white rounded-xl bg-[#141520] border border-[#222434]">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Checkout</h1>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-950/60 border border-red-800/60 rounded-2xl text-red-200 text-xs md:text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
          
          {/* Left Column: Form & Payment Details */}
          <div className="flex-1 min-w-0 w-full space-y-6">
            
            {step === 1 && (
              <div className="bg-[#141520] border border-[#222434] rounded-2xl p-5 md:p-7 shadow-xl space-y-5">
                <h2 className="text-base md:text-lg font-bold text-white tracking-tight border-b border-[#222434] pb-3">
                  1. Customer Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      FULL NAME <span className="text-red-400">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name" 
                      className="w-full bg-[#0d0e15] border border-[#222434] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] text-xs md:text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      PHONE NUMBER <span className="text-red-400">*</span>
                    </label>
                    <input 
                      type="tel" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 03001234567" 
                      className="w-full bg-[#0d0e15] border border-[#222434] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] text-xs md:text-sm transition-all"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full mt-4 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white py-3.5 rounded-xl font-bold text-sm md:text-base transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center cursor-pointer"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-[#141520] border border-[#222434] rounded-2xl p-5 md:p-7 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-[#222434] pb-3">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setStep(1)}
                      className="text-gray-400 hover:text-white p-1 hover:bg-[#1f2133] rounded-lg transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                      2. Payment Method
                    </h2>
                  </div>
                  <span className="text-xs bg-[#8b5cf6]/20 text-[#a78bfa] border border-[#8b5cf6]/30 font-bold px-3 py-1 rounded-full">
                    {paymentMethodName}
                  </span>
                </div>

                {/* Dynamic Box with Logo | Vertical Line | Details */}
                <div className="bg-[#0d0e15] border border-[#222434] rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-center gap-5 sm:gap-6 shadow-lg w-full">
                  
                  {/* Left: Custom image logo OR Styled text logo */}
                  <div className="flex flex-col items-center justify-center shrink-0">
                    {paymentMethodLogoUrl ? (
                      <img 
                        src={paymentMethodLogoUrl} 
                        alt={paymentMethodName} 
                        className="w-16 h-16 rounded-2xl object-cover border border-[#222434] bg-white/5 p-1 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as any).style.display = 'none';
                          const fallbackSpan = (e.target as any).nextSibling;
                          if (fallbackSpan) fallbackSpan.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    
                    <div 
                      style={{ display: paymentMethodLogoUrl ? 'none' : 'flex' }}
                      className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#8b5cf6] to-pink-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] text-white font-black text-xl tracking-tighter"
                    >
                      {paymentMethodLogoText}
                    </div>
                    <span className="text-[10px] font-bold text-[#a78bfa] tracking-widest uppercase mt-1">{paymentMethodName}</span>
                  </div>

                  {/* Vertical Line Divider */}
                  <div className="hidden sm:block w-px h-24 bg-[#282a3d] shrink-0" />
                  <div className="sm:hidden w-full h-px bg-[#282a3d]" />

                  {/* Right: Account Title & Account Number */}
                  <div className="flex-1 space-y-3.5 text-center sm:text-left min-w-0 w-full">
                    
                    <div className="bg-[#161826] p-3 rounded-xl border border-[#26283c] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-0.5">ACCOUNT TITLE</span>
                        <h4 className="text-sm font-bold text-white truncate">{accountTitle}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(accountTitle);
                        }}
                        className="p-2 bg-[#1f2133] hover:bg-[#8b5cf6] text-gray-300 hover:text-white rounded-lg transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shrink-0 border border-[#2a2d42] hover:border-[#8b5cf6]"
                      >
                        <Copy className="w-4 h-4" />
                        <span className="sm:hidden">Copy Title</span>
                      </button>
                    </div>

                    <div className="bg-[#161826] p-3 rounded-xl border border-[#26283c] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-0.5">ACCOUNT NUMBER</span>
                        <h4 className="text-sm font-bold text-white tracking-widest truncate">{accountNumber}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyNumber}
                        className="p-2 bg-[#1f2133] hover:bg-[#8b5cf6] text-gray-300 hover:text-white rounded-lg transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shrink-0 border border-[#2a2d42] hover:border-[#8b5cf6]"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span className="sm:hidden">{copied ? 'Copied!' : 'Copy Number'}</span>
                      </button>
                    </div>

                  </div>
                </div>

                {/* Upload Proof Section */}
                <div className="pt-2 flex flex-col items-center">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 text-center w-full">
                    UPLOAD PAYMENT PROOF (SCREENSHOT / RECEIPT)
                  </label>

                  {isUploadingProof ? (
                    <div className="bg-[#0d0e15] border border-[#8b5cf6]/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center w-full space-y-3">
                      <Loader2 className="w-8 h-8 text-[#8b5cf6] animate-spin" />
                      <span className="text-xs font-bold text-white">Uploading payment proof to secure CDN...</span>
                    </div>
                  ) : proofImage ? (
                    <div className="relative bg-[#0d0e15] border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between gap-4 w-full">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={proofImage} alt="Payment Proof" className="w-14 h-14 object-cover rounded-xl border border-[#222434]" />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-emerald-400 block">Payment Proof Uploaded</span>
                          
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProofImage(null)}
                        className="p-2 text-gray-400 hover:text-red-400 bg-[#1a1b2a] rounded-xl hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-[#282a3d] hover:border-[#8b5cf6] bg-[#0d0e15] hover:bg-[#12131f] rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center w-full">
                      <Upload className="w-9 h-9 text-[#a78bfa] mb-2" />
                      <span className="text-sm font-bold text-white mb-1">Click to Upload Proof</span>
                      <span className="text-[11px] text-gray-400">Attach screenshot of {paymentMethodName} transfer (PNG, JPG up to 10MB)</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>

                {/* Warning Notice */}
                <div className="bg-amber-950/25 border border-amber-500/30 rounded-2xl p-3.5 flex gap-3 text-left w-full shadow-lg">
                  <span className="text-amber-400 text-lg shrink-0 select-none">⚠️</span>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 block tracking-wider uppercase font-mono">Warning Notice</span>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed font-medium">
                      Fake payment proof upload karne par aapke khilaf legal action lya ja sakta hai. Payment proofs are strictly verified before order approval.
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Right Column: Order Items & Total Summary */}
          <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 space-y-6">
            
            <div className="bg-[#141520] border border-[#222434] rounded-2xl p-5 md:p-6 shadow-xl space-y-5 sticky top-24">
              
              {/* Product List */}
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block border-b border-[#222434] pb-2">
                  Order Items ({items.length})
                </span>

                {items.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-xs">
                    No items in cart. Go to products to add items!
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div key={item.id} className="bg-[#0d0e15] border border-[#222434] p-3 rounded-xl flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-[#1a1b26] border border-[#2a2c42] overflow-hidden shrink-0 flex items-center justify-center">
                          {item.thumbnailUrl ? (
                            <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <Download className="w-5 h-5 text-purple-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-xs font-bold truncate leading-snug">{item.title}</h4>
                          <div className="text-[#a78bfa] text-xs font-black mt-0.5">
                            {formatCurrency(item.price)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Amount */}
              <div className="border-t border-[#222434] pt-4">
                <div className="flex justify-between items-center bg-[#0d0e15] p-3.5 rounded-xl border border-[#222434]">
                  <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Total Amount</span>
                  <span className="text-white font-black text-xl md:text-2xl">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Place Order Button (Only on Step 2) */}
              {step === 2 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handlePlaceOrderClick}
                    disabled={isSubmitting || !proofImage}
                    className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] disabled:opacity-50 text-white py-3.5 rounded-xl font-black text-sm md:text-base transition-all shadow-[0_0_25px_rgba(139,92,246,0.5)] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wide"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isSubmitting ? 'Placing Order...' : `Place Order Now`}</span>
                  </button>
                  {!proofImage && (
                    <p className="text-[11px] text-amber-400 text-center mt-2.5 font-semibold">
                      Please upload payment proof to place the order.
                    </p>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-[#141520] border border-[#222434] rounded-2xl p-6 md:p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto text-amber-400">
              <Shield className="w-8 h-8" />
            </div>
            
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Are you sure?</h3>
              <p className="text-sm text-gray-400">
                You are about to place this order for <strong className="text-white">{formatCurrency(total)}</strong>.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-[#1e202e] hover:bg-[#282a3c] text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmOrder}
                className="flex-1 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(139,92,246,0.4)] cursor-pointer"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
