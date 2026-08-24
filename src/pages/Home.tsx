import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Download, Headphones, Lock, 
  Users, Box, LayoutGrid, Zap, ArrowRight,
  Smartphone, Globe, Code, FileCode,
  CheckCircle2, Clock
} from 'lucide-react';
import { MobileAppAnimation } from '../components/MobileAppAnimation';
import { products as fallbackProducts } from '../data';
import { useProductsStore, Product } from '../store/productsStore';
import { ProductCard } from '../components/ProductCard';
import { ASSETS } from '../assets';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// Preload the main hero image immediately to cache it in the browser and prevent loading flicker
if (typeof window !== 'undefined') {
  const preloadHeroImage = new Image();
  preloadHeroImage.src = ASSETS.pcHero;
}

export function Home() {
  const { products } = useProductsStore();
  const rawProducts = (products && products.length > 0 ? products : fallbackProducts) as Product[];
  const displayProducts = rawProducts.filter(p => p.enabled !== false);

  const [stats, setStats] = useState({
    stat1Value: "10K+",
    stat1Label: "Happy Customers",
    stat2Value: "5K+",
    stat2Label: "Premium Products",
    stat3Value: "50+",
    stat3Label: "Categories",
    stat4Value: "99.9%",
    stat4Label: "Uptime & Support"
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system_config", "admin_settings"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStats({
          stat1Value: data.stat1Value || "10K+",
          stat1Label: data.stat1Label || "Happy Customers",
          stat2Value: data.stat2Value || "5K+",
          stat2Label: data.stat2Label || "Premium Products",
          stat3Value: data.stat3Value || "50+",
          stat3Label: data.stat3Label || "Categories",
          stat4Value: data.stat4Value || "99.9%",
          stat4Label: data.stat4Label || "Uptime & Support"
        });
      }
    }, (err) => {
      console.warn("Failed to subscribe to stats settings:", err);
    });
    return () => unsub();
  }, []);

  const mobileCategories = [
    { name: 'All Products', icon: LayoutGrid, path: '/products', color: 'text-[#a78bfa]', bg: 'bg-[#8b5cf6]/10' },
    { name: 'Apps', icon: Smartphone, path: '/products?cat=apps', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { name: 'Websites', icon: Globe, path: '/products?cat=websites', color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { name: 'Custom Apps', icon: Code, path: '/products?cat=custom', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { name: 'Source Code', icon: FileCode, path: '/products?cat=source', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  ];

  return (
    <div className="min-h-screen bg-[#0b0c12] text-white">
      
      {/* ===================== HERO SECTION ===================== */}
      <section className="relative pt-6 pb-12 lg:pt-14 lg:pb-20 overflow-hidden border-b border-[#1c1e2b]">
        
        {/* Background Ambient Purple Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[600px] bg-[#7c3aed]/15 blur-[150px] pointer-events-none rounded-full"></div>
        <div className="absolute top-16 right-16 w-[450px] h-[450px] bg-[#8b5cf6]/15 blur-[130px] pointer-events-none rounded-full hidden lg:block"></div>

        <div className="w-full max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-8">
            
            {/* Left Content Column */}
            <div className="flex-1 w-full text-center lg:text-left lg:max-w-[560px]">
              
              {/* Top Badge: #1 Premium Marketplace */}
              <div className="w-full flex justify-center lg:justify-start mb-4">
                <div className="inline-flex items-center gap-2 bg-[#171825] border border-[#282a3c] text-gray-200 text-xs font-medium px-3.5 py-1.5 rounded-full shadow-sm">
                  <span className="text-[#a78bfa] font-bold text-xs">#1</span>
                  <span>Premium Marketplace</span>
                </div>
              </div>

              {/* Mobile Apps Lottie Animation (Without Box / Border) */}
              <div className="w-full flex justify-center mb-4 lg:hidden">
                <div className="w-65 h-65 sm:w-72 sm:h-72 md:w-80 md:h-80 flex items-center justify-center">
                  <MobileAppAnimation 
                    className="w-full h-full drop-shadow-[0_10px_25px_rgba(139,92,246,0.3)]"
                  />
                </div>
              </div>
              
              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold text-white mb-4 lg:mb-5 tracking-tight leading-[1.12]">
                Premium Digital <br />
                Products <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a78bfa] via-[#8b5cf6] to-[#c084fc] drop-shadow-[0_0_25px_rgba(139,92,246,0.5)]">Marketplace</span>
              </h1>
              
              {/* Subheading */}
              <p className="text-gray-400 mb-8 text-sm sm:text-base lg:text-[15px] leading-relaxed font-normal">
                Buy Premium Apps, Websites, Custom Apps &amp; Source Code with Exclusive Quality and Lifetime Value.
              </p>
              
              {/* Desktop 4 Key Features (2x2 Grid with precise pill cards) */}
              <div className="hidden lg:grid grid-cols-2 gap-3 mb-8 text-xs text-gray-300">
                <div className="flex items-center gap-2.5 bg-[#141521]/80 border border-[#222434] px-3.5 py-2.5 rounded-xl hover:border-[#8b5cf6]/40 transition-colors">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-medium">100% Premium Quality Products</span>
                </div>
                <div className="flex items-center gap-2.5 bg-[#141521]/80 border border-[#222434] px-3.5 py-2.5 rounded-xl hover:border-[#8b5cf6]/40 transition-colors">
                  <Clock className="w-4 h-4 text-[#a78bfa] shrink-0" />
                  <span className="font-medium">100% Trusted &amp; Full Secure</span>
                </div>
                <div className="flex items-center gap-2.5 bg-[#141521]/80 border border-[#222434] px-3.5 py-2.5 rounded-xl hover:border-[#8b5cf6]/40 transition-colors">
                  <Headphones className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-medium">Lifetime Update &amp; Support</span>
                </div>
                <div className="flex items-center gap-2.5 bg-[#141521]/80 border border-[#222434] px-3.5 py-2.5 rounded-xl hover:border-[#8b5cf6]/40 transition-colors">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-medium">Secure Payment &amp; Safe Checkout</span>
                </div>
              </div>

              {/* Mobile 4 Key Features (Compact List) */}
              <div className="lg:hidden flex flex-wrap justify-center gap-x-4 gap-y-2 mb-6 text-xs text-gray-300">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% Premium Quality</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#a78bfa]" />
                  <span>Fast Delivery</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Custom Apps</span>
                </div>
              </div>
              
              {/* Action CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3.5 justify-center lg:justify-start mb-6">
                <Link 
                  to="/products" 
                  className="w-full sm:w-auto bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-[0_0_25px_rgba(139,92,246,0.5)] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Box className="w-4 h-4" />
                  <span>Explore Products</span>
                </Link>
              </div>

              {/* ===================== MOBILE STATS (2x2 Grid right after Explore Products) ===================== */}
              <div className="md:hidden mt-2 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#141520] border border-[#222434] rounded-2xl p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center text-[#a78bfa] shrink-0">
                      <Users className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-white leading-none">{stats.stat1Value}</div>
                      <div className="text-gray-400 text-[10px] mt-1 leading-tight">{stats.stat1Label}</div>
                    </div>
                  </div>
                  
                  <div className="bg-[#141520] border border-[#222434] rounded-2xl p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 shrink-0">
                      <Box className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-white leading-none">{stats.stat2Value}</div>
                      <div className="text-gray-400 text-[10px] mt-1 leading-tight">{stats.stat2Label}</div>
                    </div>
                  </div>
                  
                  <div className="bg-[#141520] border border-[#222434] rounded-2xl p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0">
                      <LayoutGrid className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-white leading-none">{stats.stat3Value}</div>
                      <div className="text-gray-400 text-[10px] mt-1 leading-tight">{stats.stat3Label}</div>
                    </div>
                  </div>
                  
                  <div className="bg-[#141520] border border-[#222434] rounded-2xl p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                      <Zap className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-white leading-none">{stats.stat4Value}</div>
                      <div className="text-gray-400 text-[10px] mt-1 leading-tight">{stats.stat4Label}</div>
                    </div>
                  </div>
                </div>
              </div>



            </div>

            {/* Right PC Hero Image Showcase with Monitor in 3D Perspective (Desktop) */}
            <div className="hidden lg:block flex-1 relative w-full max-w-[620px]">
              <div className="relative group">
                
                {/* Glowing Aura around Monitor */}
                <div className="absolute -inset-4 bg-gradient-to-r from-[#8b5cf6]/35 via-[#7c3aed]/25 to-[#a78bfa]/35 rounded-3xl blur-3xl opacity-85 group-hover:opacity-100 transition duration-700 pointer-events-none"></div>

                <div className="relative rounded-2xl overflow-hidden border border-[#2d2f44] bg-[#0f1019] shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
                  <img 
                    src={ASSETS.pcHero} 
                    alt="Nexus Store Desktop Workstation Monitor" 
                    className="w-full h-auto object-cover object-center transform hover:scale-[1.01] transition-transform duration-700"
                    loading="eager"
                    fetchPriority="high"
                  />
                  {/* Bottom Purple Ground Reflection Glow */}
                  <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#8b5cf6]/25 to-transparent pointer-events-none"></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===================== PC STATS BANNER (Desktop) ===================== */}
      <section className="hidden md:block max-w-7xl mx-auto px-4 lg:px-8 -mt-7 relative z-20 mb-14">
        <div className="bg-[#13141f]/95 backdrop-blur-xl border border-[#242638] rounded-2xl p-6 lg:p-7 shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
          <div className="grid grid-cols-4 divide-x divide-[#242638]">
            
            {/* Stat 1 */}
            <div className="flex items-center gap-4 pl-4 pr-6">
              <div className="w-12 h-12 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center text-[#a78bfa] shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white tracking-tight">{stats.stat1Value}</div>
                <div className="text-gray-400 text-xs font-medium">{stats.stat1Label}</div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex items-center gap-4 px-6">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white tracking-tight">{stats.stat2Value}</div>
                <div className="text-gray-400 text-xs font-medium">{stats.stat2Label}</div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex items-center gap-4 px-6">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white tracking-tight">{stats.stat3Value}</div>
                <div className="text-gray-400 text-xs font-medium">{stats.stat3Label}</div>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="flex items-center gap-4 px-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white tracking-tight">{stats.stat4Value}</div>
                <div className="text-gray-400 text-xs font-medium">{stats.stat4Label}</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===================== MOBILE CATEGORIES SECTION (Mobile) ===================== */}
      <section className="md:hidden px-4 mt-6 mb-8">
        <div className="mb-4">
          <h2 className="text-white font-bold text-base tracking-tight">Categories</h2>
        </div>
        
        <div className="grid grid-cols-6 gap-2.5">
          {mobileCategories.map((cat, i) => {
            const isSecondRow = i >= 3;
            return (
              <Link 
                key={i} 
                to={cat.path} 
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-[#141520] border border-[#222434] hover:border-[#32354c] active:scale-95 transition-all ${
                  isSecondRow ? 'col-span-3' : 'col-span-2'
                }`}
              >
                <div className={`w-11 h-11 ${cat.bg} rounded-xl flex items-center justify-center border border-white/5`}>
                  <cat.icon className={`w-5 h-5 ${cat.color}`} />
                </div>
                <span className="text-xs text-gray-200 text-center font-medium leading-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-1">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===================== FEATURED PRODUCTS (4 Columns on Desktop matching Screenshot 2) ===================== */}
      <section className="w-full max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Featured Products</h2>
            <p className="text-gray-400 text-xs md:text-sm hidden sm:block">Hand-picked top tier digital items for your business</p>
          </div>
          <Link 
            to="/products" 
            className="text-gray-400 hover:text-white text-xs md:text-sm flex items-center gap-1 transition-colors group"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        
        {/* Products Grid: 4 columns on desktop, 1 column on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {displayProducts.slice(0, 8).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

    </div>
  );
}
