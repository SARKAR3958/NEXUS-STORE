import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Package, Plus, Search, Edit2, Trash2, Check, 
  X, Image as ImageIcon, CheckCircle2, AlertCircle, Upload, Loader2
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc } from "firebase/firestore";
import { Product } from "@/store/productsStore";
import { products as defaultCatalog } from "@/data";
import { ASSETS } from "@/assets";
import { uploadToImgBB } from "@/lib/imgbb";
import { formatCurrency } from "@/lib/currency";

const productTabs = ["All Products", "Apps", "Websites", "Custom Apps", "Source Code", "DISABLED"];

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All Products");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Apps");
  const [price, setPrice] = useState<number | string>(49.99);
  const [originalPrice, setOriginalPrice] = useState<number | string>(99.99);
  const [image, setImage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("https://github.com/nexus-store/demo.zip");
  const [version, setVersion] = useState("v1.0.0");
  const [isSale, setIsSale] = useState(false);
  const [featuresInput, setFeaturesInput] = useState("");
  const [license, setLicense] = useState("Standard Commercial License (Full Rights)");
  const [showcaseImages, setShowcaseImages] = useState<string[]>([]);
  const [newShowcaseUrl, setNewShowcaseUrl] = useState("");
  const [editingShowcaseIndex, setEditingShowcaseIndex] = useState<number | null>(null);
  const [editingShowcaseUrl, setEditingShowcaseUrl] = useState("");
  const [isUploadingShowcase, setIsUploadingShowcase] = useState(false);
  const [enabled, setEnabled] = useState(true);

  // Real-time Firestore sync
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      const list: Product[] = [];
      snap.forEach((d) => {
        const data = d.data() as Product;
        list.push({ ...data, id: d.id });
      });
      if (list.length > 0) {
        setProducts(list);
      } else {
        // Use default rich items
        setProducts(defaultCatalog as Product[]);
      }
      setIsLoading(false);
    }, (err) => {
      console.warn("Products sync error:", err);
      setProducts(defaultCatalog as Product[]);
      setIsLoading(false);
    });

    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      setOrders(list);
    }, (err) => {
      console.warn("Orders sync error:", err);
    });

    return () => {
      unsub();
      unsubOrders();
    };
  }, []);

  // Filter products by search and tabs
  useEffect(() => {
    let result = [...products];
    if (activeTab === "DISABLED") {
      result = result.filter((p) => p.enabled === false);
    } else if (activeTab !== "All Products") {
      const tabKey = activeTab.toLowerCase();
      result = result.filter((p) => {
        const cat = (p.category || "").toLowerCase();
        if (tabKey === "apps") return cat.includes("app") && !cat.includes("web") && !cat.includes("custom");
        if (tabKey === "websites") return (cat.includes("web") || cat.includes("site")) && !cat.includes("custom");
        if (tabKey === "custom apps") return cat.includes("custom");
        if (tabKey === "source code") return cat.includes("source") || cat.includes("code");
        return cat.includes(tabKey);
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => 
        p.title.toLowerCase().includes(q) || 
        p.category?.toLowerCase().includes(q)
      );
    }
    setFilteredProducts(result);
    setCurrentPage(1);
  }, [products, activeTab, searchQuery]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setTitle("");
    setDescription("");
    setCategory("Apps");
    setPrice(49.99);
    setOriginalPrice(89.99);
    setImage(ASSETS.marketplaceWeb);
    setDownloadUrl("https://github.com/nexus-store/demo-release.zip");
    setVersion("v1.0.0");
    setLicense("Standard Commercial License (Full Rights)");
    setIsSale(false);
    setFeaturesInput("Full Source Code, Responsive Design, Lifetime Updates, 24/7 Support");
    setShowcaseImages([]);
    setNewShowcaseUrl("");
    setEditingShowcaseIndex(null);
    setEnabled(true);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setTitle(product.title || "");
    setDescription(product.description || "");
    setCategory(product.category || "Apps");
    setPrice(product.price || 0);
    setOriginalPrice(product.originalPrice || 0);
    setImage(product.image || "");
    setDownloadUrl((product as any).downloadUrl || "");
    setVersion(product.version || "v1.0.0");
    setLicense(product.license || "Standard Commercial License (Full Rights)");
    setIsSale(!!product.isSale);
    setFeaturesInput(product.features ? product.features.join(", ") : "");
    setShowcaseImages(product.images || []);
    setNewShowcaseUrl("");
    setEditingShowcaseIndex(null);
    setEnabled(product.enabled !== false);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category) {
      setMessage({ type: "error", text: "Please enter product title and category." });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const parsedFeatures = featuresInput
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);

      const productPayload = {
        title: title.trim(),
        description: description.trim() || "Full features included with complete documentation.",
        category,
        price: Number(price) || 0,
        originalPrice: Number(originalPrice) || Number(price) * 1.5,
        image: image.trim() || ASSETS.marketplaceWeb,
        downloadUrl: downloadUrl.trim() || "https://github.com/nexus-store/demo.zip",
        version: version.trim() || "v1.0.0",
        license: license.trim() || "Standard Commercial License (Full Rights)",
        isSale: Boolean(isSale),
        features: parsedFeatures.length > 0 ? parsedFeatures : ["Full Source Code", "Updates Included"],
        images: showcaseImages.length > 0 ? showcaseImages : [image.trim()].filter(Boolean),
        enabled: Boolean(enabled),
        salesCount: (editingProduct as any)?.salesCount || 0,
        updatedAt: new Date().toISOString(),
      };

      if (editingProduct?.id) {
        await setDoc(doc(db, "products", editingProduct.id), productPayload, { merge: true });
        setMessage({ type: "success", text: `Updated "${title}" successfully!` });
      } else {
        await addDoc(collection(db, "products"), {
          ...productPayload,
          createdAt: new Date().toISOString(),
          salesCount: Math.floor(Math.random() * 80) + 20,
        });
        setMessage({ type: "success", text: `Created product "${title}" successfully!` });
      }

      setIsModalOpen(false);
      setTimeout(() => setMessage(null), 3500);
    } catch (err: any) {
      console.error("Save product error:", err);
      setMessage({ type: "error", text: err.message || "Failed to save product." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, "products", id));
      setDeleteConfirmId(null);
      setMessage({ type: "success", text: "Product deleted from Firestore." });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error("Delete error:", err);
      setMessage({ type: "error", text: "Failed to delete product." });
    }
  };

  // Pagination (8 per page)
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-10">
      
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Product Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage all your digital products, apps, websites & source codes.
          </p>
        </div>

        {/* Right Search + Add Product Button */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#12131f] border border-[#22243a] text-gray-200 text-xs rounded-xl pl-8 pr-4 py-2 placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] transition-colors w-48 sm:w-60"
            />
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold text-xs shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK MESSAGE */}
      {message && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
          message.type === "success" 
            ? "bg-emerald-950/50 border-emerald-800 text-emerald-300" 
            : "bg-red-950/50 border-red-800 text-red-300"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* TABS ROW */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {productTabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-[#8b5cf6] text-white shadow-[0_0_15px_rgba(139,92,246,0.35)]"
                  : "bg-[#12131f] border border-[#202237] text-gray-400 hover:text-white hover:bg-[#18192a]"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* PRODUCTS TABLE CARD */}
      <div className="bg-[#12131f] border border-[#202237] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="text-[11px] text-gray-400 border-b border-[#1f2136] bg-[#0e0f18]/60">
              <tr>
                <th className="py-3.5 px-5 font-semibold">Product</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Price</th>
                <th className="py-3.5 px-4 font-semibold">Sales</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b1c2e]">
              {paginatedProducts.map((product) => {
                // Real sales counting based on Approved/Completed/Unlocked orders
                const realSalesCount = orders.filter((order) => {
                  const isApproved = order.status?.toLowerCase() === 'approved' || 
                                     order.status?.toLowerCase() === 'completed' || 
                                     order.status?.toLowerCase() === 'unlocked' ||
                                     order.isApproved === true;
                  if (!isApproved) return false;

                  // Check inside order items/products/productName
                  let containsProduct = false;
                  
                  if (order.items && Array.isArray(order.items)) {
                    containsProduct = order.items.some((item: any) => 
                      item.id === product.id || 
                      item._id === product.id || 
                      item.title?.toLowerCase() === product.title?.toLowerCase()
                    );
                  }
                  
                  if (!containsProduct && order.products && Array.isArray(order.products)) {
                    containsProduct = order.products.some((p: any) => 
                      p === product.id || 
                      (p && typeof p === 'object' && (p.id === product.id || p._id === product.id || p.title?.toLowerCase() === product.title?.toLowerCase()))
                    );
                  }

                  if (!containsProduct && order.productName) {
                    containsProduct = order.productName.toLowerCase() === product.title?.toLowerCase();
                  }

                  return containsProduct;
                }).length;

                const sales = realSalesCount;
                const isProductActive = product.enabled !== false;

                return (
                  <tr key={product.id} className={`hover:bg-[#18192a]/70 transition-all group ${!isProductActive ? "opacity-50 bg-[#12131f]/40" : ""}`}>
                    
                    {/* Product image & title */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#18192a] border border-[#282a44] shrink-0">
                          <img 
                            src={product.image || ASSETS.marketplaceWeb} 
                            alt={product.title}
                            className={`w-full h-full object-cover ${!isProductActive ? "grayscale" : ""}`} 
                          />
                        </div>
                        <span className={`font-bold text-xs ${!isProductActive ? "text-gray-400 line-through" : "text-white"}`}>
                          {product.title}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {product.category || "Apps"}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-bold text-white text-xs">
                      {formatCurrency(product.price)}
                    </td>

                    {/* Sales */}
                    <td className="py-3 px-4 text-gray-300 font-mono text-xs">
                      {sales}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {isProductActive ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-950/50 text-red-400 border border-red-900/30">
                          Disabled
                        </span>
                      )}
                    </td>

                    {/* Actions: Enable/Disable Switch, Edit, Delete */}
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        {/* Interactive Toggle Switch */}
                        <div className="flex items-center gap-1.5 mr-1 select-none">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const docRef = doc(db, "products", product.id);
                                await setDoc(docRef, { enabled: !isProductActive }, { merge: true });
                              } catch (err) {
                                console.error("Toggle active status error:", err);
                              }
                            }}
                            className={`w-11 h-6 rounded-full p-0.5 transition-all duration-200 focus:outline-none shrink-0 cursor-pointer flex items-center ${
                              isProductActive ? "bg-emerald-500" : "bg-[#25273c]"
                            }`}
                            title={isProductActive ? "Click to Hide & Disable product" : "Click to Enable & Show product"}
                          >
                            <div
                              className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                                isProductActive ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(product)}
                          className="w-8 h-8 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#a78bfa] hover:bg-[#8b5cf6] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteConfirmId(product.id)}
                          className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-800/40 text-red-400 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION ROW */}
        <div className="p-4 border-t border-[#1f2136] bg-[#0e0f18]/40 flex items-center justify-end gap-2 text-xs">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="px-3 py-1.5 rounded-lg bg-[#18192a] border border-[#272942] text-gray-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            Previous
          </button>

          {[1, 2, 3].slice(0, totalPages || 1).map((pg) => (
            <button
              key={pg}
              onClick={() => setCurrentPage(pg)}
              className={`w-8 h-8 rounded-lg font-bold transition-all cursor-pointer ${
                currentPage === pg
                  ? "bg-[#8b5cf6] text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                  : "bg-[#18192a] border border-[#272942] text-gray-400 hover:text-white"
              }`}
            >
              {pg}
            </button>
          ))}

          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="px-3 py-1.5 rounded-lg bg-[#18192a] border border-[#272942] text-gray-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12131f] border border-[#25283f] rounded-2xl p-6 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#202237]">
                <h3 className="text-lg font-bold text-white">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1c1e30]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4 mt-4 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1 font-medium">Product Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Food Delivery App"
                    className="w-full bg-[#18192a] border border-[#2b2e46] text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-[#8b5cf6]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-1 font-medium">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#18192a] border border-[#2b2e46] text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-[#8b5cf6]"
                    >
                      <option value="Apps">Apps</option>
                      <option value="Websites">Websites</option>
                      <option value="Source Code">Source Code</option>
                      <option value="Custom Apps">Custom Apps</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 mb-1 font-medium text-[10px] sm:text-xs">Price (Rs.)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full bg-[#18192a] border border-[#2b2e46] text-white rounded-xl px-2.5 py-2.5 outline-none focus:border-[#8b5cf6]"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 font-medium text-[10px] sm:text-xs">Original (Rs.)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        className="w-full bg-[#18192a] border border-[#2b2e46] text-white rounded-xl px-2.5 py-2.5 outline-none focus:border-[#8b5cf6]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-medium">Key Features Checklist Points (comma-separated list)</label>
                  <input
                    type="text"
                    value={featuresInput}
                    onChange={(e) => setFeaturesInput(e.target.value)}
                    placeholder="e.g. Full Source Code, Complete Admin Panel, Responsive Layout"
                    className="w-full bg-[#18192a] border border-[#2b2e46] text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-[#8b5cf6]"
                  />
                </div>

                {/* Put on Sale & Product Status Option */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 bg-[#141522] border border-[#222436] p-3 rounded-xl">
                    <input
                      type="checkbox"
                      id="isSale"
                      checked={isSale}
                      onChange={(e) => setIsSale(e.target.checked)}
                      className="w-4 h-4 rounded border-[#2b2e46] text-[#8b5cf6] focus:ring-[#8b5cf6] bg-[#18192a] cursor-pointer"
                    />
                    <label htmlFor="isSale" className="text-gray-300 text-xs font-bold select-none cursor-pointer">
                      Enable Sale Badge (Discounted Offer)
                    </label>
                  </div>

                  <div className="flex items-center gap-2.5 bg-[#141522] border border-[#222436] p-3 rounded-xl">
                    <input
                      type="checkbox"
                      id="isEnabled"
                      checked={enabled}
                      onChange={(e) => setEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-[#2b2e46] text-[#8b5cf6] focus:ring-[#8b5cf6] bg-[#18192a] cursor-pointer"
                    />
                    <label htmlFor="isEnabled" className="text-gray-300 text-xs font-bold select-none cursor-pointer">
                      Product Active & Visible
                    </label>
                  </div>
                </div>

                {/* Custom Interactive Showcase Images Box */}
                <div className="bg-[#10111a] border border-[#222436] p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300 font-bold text-xs">
                      Product Showcase Gallery ({showcaseImages.length} Images)
                    </label>
                    <span className="text-[10px] text-gray-500">Users swipe these on details page</span>
                  </div>

                  {/* List of Showcase URLs */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {showcaseImages.length === 0 ? (
                      <p className="text-xs text-gray-500 italic py-2 text-center">No additional showcase images added yet.</p>
                    ) : (
                      showcaseImages.map((imgUrl, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-[#18192a] border border-[#222436] p-3 rounded-xl">
                          <div className="flex items-center gap-3 flex-1 overflow-hidden">
                            <img 
                              src={imgUrl} 
                              alt="" 
                              className="w-10 h-10 object-cover rounded-lg border border-[#2b2e46] shrink-0 bg-black/40"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = ASSETS.marketplaceWeb;
                              }}
                            />
                            <span className="flex-1 text-[11px] text-gray-300 truncate font-mono">{imgUrl}</span>
                          </div>
                          
                          {editingShowcaseIndex === index ? (
                            <div className="w-full sm:w-auto flex gap-1.5 mt-1 sm:mt-0">
                              <input
                                type="text"
                                value={editingShowcaseUrl}
                                onChange={(e) => setEditingShowcaseUrl(e.target.value)}
                                className="flex-1 bg-[#10111a] border border-[#8b5cf6] text-white rounded-lg px-2.5 py-1.5 text-xs outline-none min-w-0"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (editingShowcaseUrl.trim()) {
                                    const updated = [...showcaseImages];
                                    updated[index] = editingShowcaseUrl.trim();
                                    setShowcaseImages(updated);
                                  }
                                  setEditingShowcaseIndex(null);
                                }}
                                className="bg-[#8b5cf6] text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingShowcaseIndex(null)}
                                className="bg-[#222436] text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingShowcaseIndex(index);
                                  setEditingShowcaseUrl(imgUrl);
                                }}
                                className="flex-1 sm:flex-none text-[#a78bfa] hover:text-[#c084fc] text-[10px] font-bold uppercase border border-[#222436] px-3 py-2 rounded-lg bg-[#141522] hover:bg-[#1a1b2d] cursor-pointer transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = showcaseImages.filter((_, i) => i !== index);
                                  setShowcaseImages(updated);
                                }}
                                className="flex-1 sm:flex-none text-red-400 hover:text-red-300 text-[10px] font-bold uppercase border border-[#222436] px-3 py-2 rounded-lg bg-[#141522] hover:bg-red-950/20 cursor-pointer transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add New Image Controls */}
                  <div className="border-t border-[#222436]/50 pt-2.5 mt-2 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newShowcaseUrl}
                        onChange={(e) => setNewShowcaseUrl(e.target.value)}
                        placeholder="Paste showcase image URL..."
                        className="flex-1 bg-[#18192a] border border-[#2b2e46] text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-[#8b5cf6]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newShowcaseUrl.trim()) {
                            setShowcaseImages([...showcaseImages, newShowcaseUrl.trim()]);
                            setNewShowcaseUrl("");
                          }
                        }}
                        className="bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#a78bfa] hover:bg-[#8b5cf6] hover:text-white px-3 py-2 rounded-xl font-bold transition-colors text-xs shrink-0 cursor-pointer"
                      >
                        Add URL
                      </button>
                    </div>

                    {/* ImgBB upload tool for showcase images */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">Or pick an image file to upload:</span>
                      <label className="text-[10.5px] text-[#a78bfa] hover:text-white font-bold cursor-pointer flex items-center gap-1 bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 px-3 py-1.5 rounded-lg transition-colors">
                        {isUploadingShowcase ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        <span>{isUploadingShowcase ? "Uploading..." : "Upload File"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingShowcase}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setIsUploadingShowcase(true);
                              try {
                                const uploadedUrl = await uploadToImgBB(file);
                                if (uploadedUrl) {
                                  setShowcaseImages(prev => [...prev, uploadedUrl]);
                                }
                              } catch (err: any) {
                                alert("CDN upload failed. Try pasting URL directly.");
                              } finally {
                                setIsUploadingShowcase(false);
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-medium flex items-center justify-between">
                    <span>Product Image</span>
                    <span className="text-[10px] text-purple-400">Stores on ImgBB CDN</span>
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="Paste image URL or upload below..."
                        className="flex-1 bg-[#18192a] border border-[#2b2e46] text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-[#8b5cf6] text-xs"
                      />
                      <label className="bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#a78bfa] hover:bg-[#8b5cf6] hover:text-white px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 font-bold cursor-pointer transition-colors text-xs shrink-0">
                        {isUploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>{isUploadingImage ? "Uploading..." : "Upload"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingImage}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setIsUploadingImage(true);
                              try {
                                const url = await uploadToImgBB(file);
                                setImage(url);
                              } catch (err) {
                                console.error("Upload error:", err);
                              } finally {
                                setIsUploadingImage(false);
                              }
                            }
                          }}
                        />
                      </label>
                    </div>

                    {image && (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[#2b2e46] bg-[#0f101a]">
                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImage("")}
                          className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-black text-white rounded-lg cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-medium">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe product highlights..."
                    className="w-full bg-[#18192a] border border-[#2b2e46] text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-[#8b5cf6]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#202237]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#18192a] border border-[#2b2e46] text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold transition-all shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                  >
                    {isSaving ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12131f] border border-red-900/60 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-base font-bold text-white">Delete Product</h3>
              <p className="text-xs text-gray-400 mt-2">
                Are you sure you want to permanently remove this product from your store catalog?
              </p>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl bg-[#18192a] border border-[#2b2e46] text-gray-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProduct(deleteConfirmId)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
