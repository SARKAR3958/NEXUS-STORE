import { useState, useEffect } from 'react';
import { 
  ChevronRight, Filter, Search, 
  Smartphone, Globe, Code, FileCode,
  LayoutGrid, SlidersHorizontal, ChevronDown
} from 'lucide-react';
import { products as fallbackProducts, categories } from '../data';
import { useProductsStore, Product } from '../store/productsStore';
import { ProductCard } from '../components/ProductCard';
import { Link, useSearchParams } from 'react-router-dom';

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('cat') || 'all';
  const urlSearch = searchParams.get('search') || searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [sortBy, setSortBy] = useState('Popular');

  useEffect(() => {
    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [urlSearch]);

  const { products: storeProducts, isLoading } = useProductsStore();
  const rawProducts = (storeProducts && storeProducts.length > 0 ? storeProducts : fallbackProducts) as Product[];
  const products = rawProducts.filter(p => p.enabled !== false);

  const categoryIconMap: Record<string, any> = {
    all: LayoutGrid,
    apps: Smartphone,
    websites: Globe,
    custom: Code,
    source: FileCode,
  };

  const filteredProducts = products.filter(product => {
    if (activeCategory !== 'all') {
      const matchCat = categories.find(c => c.id === activeCategory);
      if (matchCat) {
        if (activeCategory === 'apps') {
          if (product.category !== 'Apps' && product.category !== 'Android Apps' && product.category !== 'iOS Apps') return false;
        } else if (activeCategory === 'websites') {
          if (product.category !== 'Websites') return false;
        } else if (activeCategory === 'custom') {
          if (product.category !== 'Custom Apps') return false;
        } else if (activeCategory === 'source') {
          if (product.category !== 'Source Code') return false;
        }
      }
    }
    if (searchQuery) {
      return product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
             product.description.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Apply sorting logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'Newest') {
      const idA = parseInt(a.id) || 0;
      const idB = parseInt(b.id) || 0;
      return idB - idA;
    }
    if (sortBy === 'Low') {
      return (a.price || 0) - (b.price || 0);
    }
    if (sortBy === 'High') {
      return (b.price || 0) - (a.price || 0);
    }
    // Default: 'Popular'
    if (b.rating !== a.rating) {
      return (b.rating || 0) - (a.rating || 0);
    }
    return (b.reviews || 0) - (a.reviews || 0);
  });

  return (
    <div className="min-h-screen bg-[#0b0c12] text-white py-6 lg:py-10">
      <div className="w-full max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Mobile Search & Filter Header (Matches Screen 2) */}
        <div className="lg:hidden mb-6 space-y-4">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for premium products..."
              className="w-full bg-[#141520] text-sm text-white placeholder-gray-500 rounded-xl py-3 pl-10 pr-11 border border-[#222434] focus:outline-none focus:border-[#8b5cf6]"
            />
            <button 
              className="absolute right-2.5 p-1.5 bg-[#1e202e] text-gray-300 hover:text-white rounded-lg"
              aria-label="Filter"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Category Grid (4x2) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">Categories</h3>
              
            </div>
            
            <div className="grid grid-cols-6 sm:grid-cols-5 gap-2">
              {categories.map((cat, index) => {
                const IconComponent = categoryIconMap[cat.id] || LayoutGrid;
                const isSelected = activeCategory === cat.id;
                const isSecondRow = index >= 3;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSearchParams({ cat: cat.id })}
                    className={`flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl border transition-all text-center ${
                      isSecondRow ? 'col-span-3 sm:col-span-1' : 'col-span-2 sm:col-span-1'
                    } ${
                      isSelected 
                        ? 'bg-[#8b5cf6]/15 border-[#8b5cf6] shadow-[0_0_12px_rgba(139,92,246,0.25)]' 
                        : 'bg-[#141520] border-[#222434] hover:border-[#32354c]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#1a1b2a] flex items-center justify-center">
                      <IconComponent className={`w-5 h-5 ${cat.color || 'text-[#a78bfa]'}`} />
                    </div>
                    <span className="text-xs text-gray-200 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-1">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Desktop Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ================= Sidebar (Desktop) ================= */}
          <div className="hidden lg:block w-72 shrink-0 space-y-6">
            
            {/* Browse Categories Card */}
            <div className="bg-[#141520] border border-[#222434] rounded-2xl p-5 shadow-lg">
              <h3 className="text-white font-bold text-base mb-4 tracking-tight">Browse Categories</h3>
              <div className="space-y-1">
                {categories.map((cat) => {
                  const IconComponent = categoryIconMap[cat.id] || LayoutGrid;
                  const isSelected = activeCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSearchParams({ cat: cat.id })}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isSelected 
                          ? 'bg-[#8b5cf6]/15 text-[#a78bfa] font-semibold border border-[#8b5cf6]/30' 
                          : 'text-gray-400 hover:text-white hover:bg-[#1b1c2b]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <IconComponent className={`w-4 h-4 ${isSelected ? 'text-[#a78bfa]' : 'text-gray-400'}`} />
                        <span>{cat.name}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-[#a78bfa]' : 'text-gray-600'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ================= Main Products Catalog ================= */}
          <div className="flex-1">
            
            {/* Products Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1e202c]">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">All Premium Products</h1>
                <p className="text-gray-400 text-xs md:text-sm mt-0.5">
                  Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
                  {searchQuery && <span> for &ldquo;<span className="text-purple-300 font-medium">{searchQuery}</span>&rdquo;</span>}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Sort Selector */}
                <div className="bg-[#141520] border border-[#222434] rounded-xl px-3.5 py-2 flex items-center gap-2 text-xs">
                  <span className="text-gray-400 font-medium">Sort by:</span>
                  <div className="relative flex items-center">
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent text-white font-semibold focus:outline-none appearance-none pr-5 cursor-pointer"
                    >
                      <option value="Popular" className="bg-[#141520]">Popular</option>
                      <option value="Low" className="bg-[#141520]">Price: Low to High</option>
                      <option value="High" className="bg-[#141520]">Price: High to Low</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-0 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid (Spacious responsive columns on PC & Laptop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {sortedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
