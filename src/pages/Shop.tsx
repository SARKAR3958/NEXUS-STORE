import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ShoppingBag, Search, ChevronRight, Star, Heart, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { formatCurrency } from "@/lib/currency";

// Temporary Grid Icon
function Grid(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  )
}

interface Product {
  _id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  thumbnailUrl?: string;
  rating?: number;
  reviews?: number;
  sales?: number;
}

export function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("Popular");
  const { addItem } = useCartStore();

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter]);

  const fetchProducts = async (searchQuery = "") => {
    setIsLoading(true);
    try {
      const productsRef = collection(db, "products");
      let q = query(productsRef);
      
      if (categoryFilter) {
        q = query(productsRef, where("category", "==", categoryFilter));
      }

      const snapshot = await getDocs(q);
      let fetchedProducts = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() } as any));
      
      // Filter out disabled products
      fetchedProducts = fetchedProducts.filter((p: any) => p.enabled !== false);

      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        fetchedProducts = fetchedProducts.filter(p => 
          p.title.toLowerCase().includes(lowerQuery) || 
          p.description.toLowerCase().includes(lowerQuery)
        );
      }

      // Add dummy rating/sales data for UI fidelity if missing
      fetchedProducts = fetchedProducts.map(p => ({
        ...p,
        rating: p.rating || (4.5 + Math.random() * 0.5),
        reviews: p.reviews || Math.floor(Math.random() * 1000) + 100,
        sales: p.sales || Math.floor(Math.random() * 2000) + 50
      }));

      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { id: "All", name: "All Products" },
    { id: "Apps", name: "Apps" },
    { id: "Website", name: "Websites" },
    { id: "Custom", name: "Custom Apps" },
    { id: "SourceCode", name: "Source Code" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col md:flex-row gap-8 min-h-screen bg-[#0a0a0e]">
      
      {/* Sidebar Filters */}
      <aside className="hidden md:block w-full md:w-64 shrink-0 space-y-10">
        <div className="bg-[#12121a] rounded-2xl p-4 border border-[#1f1f2e]">
          <h3 className="text-[13px] font-bold text-white mb-4 uppercase tracking-wider">Browse Categories</h3>
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  if (cat.id === "All") {
                    searchParams.delete("category");
                  } else {
                    searchParams.set("category", cat.id);
                  }
                  setSearchParams(searchParams);
                }}
                className={`flex items-center justify-between w-full text-left px-3 py-2.5 rounded-xl text-[13px] transition-colors ${
                  (categoryFilter === cat.id || (!categoryFilter && cat.id === "All"))
                    ? "text-violet-400 font-medium bg-[#1a1a24]"
                    : "text-slate-400 hover:text-white hover:bg-[#1a1a24]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Grid className={`w-4 h-4 ${((categoryFilter === cat.id || (!categoryFilter && cat.id === "All"))) ? "text-violet-500" : "text-slate-500"}`} />
                  {cat.name}
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#12121a] rounded-2xl p-5 border border-[#1f1f2e]">
           <h3 className="text-[13px] font-bold text-white mb-4 uppercase tracking-wider">Filter by Price</h3>
           <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span>Rs. 0</span>
              <span>Rs. 50K+</span>
           </div>
           <div className="h-1 bg-[#1f1f2e] rounded-full overflow-hidden relative">
              <div className="absolute top-0 left-0 h-full bg-violet-600 w-2/3 rounded-full" />
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {(() => {
          const sortedProducts = [...products].sort((a, b) => {
            if (sortBy === 'Newest') {
              const idA = a._id || '';
              const idB = b._id || '';
              return idB.localeCompare(idA);
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
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {categoryFilter ? categories.find(c => c.id === categoryFilter)?.name : "All Premium Products"}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">Showing {products.length} results</p>
                </div>
                
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="relative">
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-[#12121a] border border-[#1f1f2e] text-slate-300 text-sm rounded-lg pl-4 pr-10 py-2.5 w-full sm:w-[180px] focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
                    >
                      <option value="Popular">Sort by: Popular</option>
                      <option value="Low">Sort by: Price (Low to High)</option>
                      <option value="High">Sort by: Price (High to Low)</option>
                    </select>
                    <ChevronRight className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-[280px] bg-[#12121a] animate-pulse rounded-2xl border border-[#1f1f2e]" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-24 bg-[#12121a] rounded-2xl border border-[#1f1f2e]">
                  <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white">No products found</h3>
                  <p className="text-slate-400 mt-2 text-sm">Try adjusting your filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {sortedProducts.map((product, i) => (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl overflow-hidden group hover:border-slate-600 transition-colors flex flex-col"
                    >
                      <Link to={`/product/${product._id}`} className="relative aspect-[4/3] bg-[#1a1a24] p-4 flex items-center justify-center overflow-hidden">
                        <div className="absolute top-3 left-3 bg-violet-600/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded z-10 uppercase tracking-wider">Sale</div>
                        <Heart className="absolute top-3 right-3 w-5 h-5 text-slate-400 hover:text-red-500 cursor-pointer z-10" />
                        
                        {product.thumbnailUrl ? (
                          <img src={product.thumbnailUrl} alt={product.title} className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                        ) : (
                          <MonitorSmartphone className="w-16 h-16 text-slate-700 group-hover:scale-105 transition-transform duration-500" />
                        )}
                      </Link>
                      <div className="p-4 sm:p-5 flex flex-col flex-1">
                        <Link to={`/product/${product._id}`}>
                          <h3 className="text-base font-bold text-white mb-1 hover:text-violet-400 transition-colors line-clamp-1">{product.title}</h3>
                        </Link>
                        <p className="text-[11px] text-slate-400 mb-3 line-clamp-1">{product.description}</p>
                        
                        <div className="flex items-center gap-1 mb-4">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-bold text-white">{product.rating?.toFixed(1)}</span>
                          <span className="text-[10px] text-slate-500 ml-1">{product.sales} Sales</span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-bold text-violet-400">{formatCurrency(product.price)}</span>
                            <span className="text-[10px] text-slate-500 line-through">
                              {formatCurrency(product.originalPrice || (product.price * 1.5))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
