import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, Star, ShieldCheck, CheckCircle2, 
  RefreshCw, Lock, MessageCircle, Share2, ShoppingCart, Zap,
  Download, ArrowLeft, ChevronLeft, Clock
} from 'lucide-react';
import { products as fallbackProducts } from '../data';
import { useProductsStore, Product } from '../store/productsStore';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { ASSETS } from '../assets';
import { formatCurrency } from '../lib/currency';
import { redirectToSignup } from '../lib/requireAuth';

export function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, addItem, toggleCart } = useCartStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { getProductById, products } = useProductsStore();
  const product = ((id ? getProductById(id) : null) || products[0] || fallbackProducts[0]) as Product;
  const [activeTab, setActiveTab] = useState('Description');
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);

  const images = product.images && product.images.length > 0 
    ? product.images 
    : [product.image, ASSETS.ecommercePhones, ASSETS.marketplaceWeb, ASSETS.portfolioWeb].filter(Boolean);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      redirectToSignup(navigate);
      return;
    }
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      category: product.category,
      thumbnailUrl: product.image,
      image: product.image,
      description: product.description,
      images: images,
    });
  };

  const handleCartClick = () => {
    if (window.innerWidth < 768) {
      navigate('/cart');
    } else {
      toggleCart();
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      redirectToSignup(navigate);
      return;
    }
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      category: product.category,
      thumbnailUrl: product.image,
      image: product.image,
      description: product.description,
      images: images,
    });
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-[#0b0c12] text-white py-4 md:py-8 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Mobile Top App Header Bar (Matches Mobile Screen 3) */}
        <div className="md:hidden flex items-center justify-between py-2 mb-4">
          <Link to="/products" className="p-2 text-gray-300 hover:text-white rounded-lg bg-[#141520] border border-[#222434]">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="font-bold text-sm text-white">Product Details</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCartClick} 
              className="p-2 text-gray-300 hover:text-white rounded-lg bg-[#141520] border border-[#222434] relative cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#8b5cf6] text-white text-[9px] font-bold px-1 rounded-full">
                  {items.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Breadcrumb Navigation */}
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 mb-6 font-medium">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <Link to="/products" className="hover:text-white transition-colors">Products</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-[#a78bfa]">{product.title}</span>
        </div>

        {/* Main Product Showcase Section */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 mb-12">
          
          {/* Left Column: Image Showcase & Carousel */}
          <div className="lg:w-[58%] shrink-0">
            
            {/* Primary Large Image Frame */}
            <div className="relative bg-[#141520] border border-[#222434] rounded-2xl p-2 md:p-3 mb-4 group overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[#090a10] flex items-center justify-center">
                <img 
                  src={images[selectedImgIndex]} 
                  alt={product.title} 
                  className="w-full h-full object-cover"
                />
                
                {/* Sale Pill Badge */}
                {product.isSale && (
                  <span className="absolute top-3 left-3 bg-[#8b5cf6] text-white text-xs font-semibold px-3 py-1 rounded-lg shadow-md">
                    Sale
                  </span>
                )}

                {/* Mobile Image Counter Badge */}
                <span className="md:hidden absolute bottom-3 right-3 bg-[#0d0e15]/80 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-md border border-white/10">
                  {selectedImgIndex + 1}/{images.length}
                </span>

                {/* Gallery Navigation Arrows */}
                <button 
                  onClick={() => setSelectedImgIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#0d0e15]/85 hover:bg-[#8b5cf6] text-white rounded-full items-center justify-center border border-white/10 transition-all shadow-lg z-10 active:scale-95"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setSelectedImgIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  className="flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#0d0e15]/85 hover:bg-[#8b5cf6] text-white rounded-full items-center justify-center border border-white/10 transition-all shadow-lg z-10 active:scale-95"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Gallery Thumbnail Bar */}
            <div className="grid grid-cols-4 gap-2.5 md:gap-3">
              {images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setSelectedImgIndex(idx)}
                  className={`relative aspect-[16/10] rounded-xl overflow-hidden border p-1 bg-[#141520] transition-all ${
                    selectedImgIndex === idx 
                      ? 'border-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.3)] ring-1 ring-[#8b5cf6]' 
                      : 'border-[#222434] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Product Info & Actions */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              
              {/* Category Pill */}
              <div className="flex items-center gap-2 mb-4 text-xs">
                <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md font-medium border border-emerald-500/20">
                  {product.category}
                </span>
              </div>

              {/* Title & Description */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2 leading-tight tracking-tight">
                {product.title}
              </h1>
              <p className="text-gray-400 text-xs md:text-sm mb-6 leading-relaxed font-normal">
                {product.description}
              </p>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl md:text-4xl font-extrabold text-[#a78bfa] tracking-tight">
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-gray-500 line-through text-base">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Key Features Checklist */}
              <div className="mb-8 bg-[#141520] border border-[#222434] rounded-2xl p-4 md:p-5">
                <h3 className="text-white font-bold text-sm mb-3">Key Features</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-4">
                  {product.features?.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-[#a78bfa] shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop CTA Action Buttons */}
              <div className="hidden md:flex gap-4 mb-6">
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#171825] hover:bg-[#202132] text-white border border-[#282a3c] py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
                <button 
                  onClick={handleBuyNow}
                  className="flex-1 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white py-3.5 rounded-xl font-semibold text-sm transition-all shadow-[0_0_25px_rgba(139,92,246,0.4)] flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Buy Now</span>
                </button>
              </div>




            </div>
          </div>

        </div>

        {/* Bottom Tabs & Details Layout */}
        <div className="border-t border-[#1e202c] pt-8">
          
          {/* Main Tabbed Area */}
          <div className="w-full">
            
            {/* Tabs Header */}
            <div className="flex border-b border-[#222434] mb-6 overflow-x-auto hide-scrollbar gap-2">
              {['Description', 'Features & Specs'].map(tab => {
                const isActive = activeTab === tab;

                return (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-3.5 text-xs md:text-sm font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                      isActive 
                        ? 'border-[#8b5cf6] text-[#a78bfa]' 
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
            
            {/* Tab Body */}
            <div className="text-gray-300 text-xs md:text-sm leading-relaxed space-y-4">
              {activeTab === 'Description' && (
                <div className="space-y-4">
                  <h3 className="text-base md:text-lg font-bold text-white mb-2">About {product.title}</h3>
                  <p className="text-gray-300 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {activeTab === 'Features & Specifications' && (
                <div className="space-y-4">
                  <h3 className="text-base md:text-lg font-bold text-white mb-2">Technical Highlights</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {product.features?.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 bg-[#141520] p-3 rounded-xl border border-[#222434]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs text-gray-200 font-medium">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Fixed Bottom Action Bar (Mobile Only - Matches Mobile Screen 3) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0d0e15]/95 backdrop-blur-xl border-t border-[#1e202c] z-40 px-4 py-3 flex gap-3 shadow-[0_-10px_25px_rgba(0,0,0,0.6)]">
        <button 
          onClick={handleAddToCart}
          className="flex-1 bg-[#171825] border border-[#282a3c] text-white py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>
        <button 
          onClick={handleBuyNow}
          className="flex-1 bg-[#8b5cf6] text-white py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.5)] cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          <span>Buy Now</span>
        </button>
      </div>

    </div>
  );
}
