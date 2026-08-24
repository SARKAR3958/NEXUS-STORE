import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, CreditCard } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../lib/currency';
import { redirectToSignup } from '../lib/requireAuth';

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  sales?: string;
  image: string;
  images?: string[];
  features?: string[];
  version?: string;
  isSale?: boolean;
}

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const rating = product.rating ?? 4.9;
  const reviews = product.reviews ?? 120;
  const sales = product.sales ?? '500+';

  return (
    <Link 
      to={`/product/${product.id}`} 
      className="bg-[#14151f] border border-[#232533] rounded-2xl overflow-hidden hover:border-[#8b5cf6]/80 hover:shadow-[0_0_25px_rgba(139,92,246,0.2)] transition-all duration-300 group flex flex-col h-full"
    >
      {/* Image Showcase */}
      <div className="relative aspect-[16/11] overflow-hidden bg-[#0a0a0f]">
        <img 
          src={product.image} 
          alt={product.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        
        {/* Sale Pill Badge */}
        {product.isSale && (
          <span className="absolute top-2.5 left-2.5 bg-[#8b5cf6] text-white text-[10px] md:text-xs font-semibold px-2.5 py-0.5 rounded-md shadow-sm">
            Sale
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 md:p-4 flex flex-col flex-1">
        <h3 className="text-white font-semibold text-sm md:text-base mb-1 truncate group-hover:text-[#a78bfa] transition-colors">
          {product.title}
        </h3>
        <p className="text-gray-400 text-xs mb-3 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        
        
        {/* Price & Category */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#1e202c]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#a78bfa] font-bold text-sm md:text-base">{formatCurrency(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-gray-500 line-through text-xs">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
          <span className="text-gray-400 text-[11px] bg-[#1a1b26] px-2 py-0.5 rounded border border-[#262838]">
            {product.category}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4.5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
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
                images: product.images && product.images.length > 0 ? product.images : [product.image]
              });
            }}
            className="bg-[#1f2133] hover:bg-[#282b3d] text-gray-200 text-[11px] md:text-xs font-bold py-2.5 px-2 rounded-xl border border-[#2d3047] transition-all flex items-center justify-center gap-1 hover:border-gray-500 active:scale-[0.98]"
          >
            <ShoppingCart className="w-3 h-3 text-violet-400" />
            Add to Cart
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
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
                images: product.images && product.images.length > 0 ? product.images : [product.image]
              });
              navigate('/checkout');
            }}
            className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white text-[11px] md:text-xs font-bold py-2.5 px-2 rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.25)] flex items-center justify-center gap-1 active:scale-[0.98]"
          >
            <CreditCard className="w-3 h-3 text-white" />
            Buy Now
          </button>
        </div>
      </div>
    </Link>
  );
}
