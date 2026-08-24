import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingCart, Search, Eye, CheckCircle2, Clock, 
  AlertCircle, XCircle, RefreshCw, X, Download, User, 
  CreditCard, DollarSign, ChevronDown, ChevronLeft, ChevronRight, Check, 
  Image as ImageIcon, ExternalLink, ZoomIn, Phone, Mail, ArrowRight, 
  ShieldCheck, PackageCheck, Ban, CheckSquare, Layers
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { products as defaultCatalog } from "@/data";
import { ASSETS } from "@/assets";
import { formatCurrency } from "@/lib/currency";

interface OrderItem {
  id?: string;
  title: string;
  price: number;
  category?: string;
  description?: string;
  image?: string;
  thumbnailUrl?: string;
  images?: string[];
}

interface Order {
  id: string;
  rawDocId?: string;
  customerName?: string;
  customerEmail?: string;
  phoneNumber?: string;
  productName?: string;
  productDescription?: string;
  items?: OrderItem[];
  totalAmount: number;
  status: "Pending" | "Approved" | "Processing" | "Rejected" | "Completed" | "Cancelled" | "Refunded" | string;
  paymentMethod?: string;
  paymentProof?: string;
  screenshotProof?: string;
  createdAt?: string;
  formattedDate?: string;
  avatarUrl?: string;
}

interface GalleryModalState {
  isOpen: boolean;
  productTitle: string;
  productDescription?: string;
  images: string[];
  currentIndex: number;
}

const statusTabs = ["All Orders", "Pending", "Processing", "Approved", "Rejected"];

// High-fidelity fallback sample orders with complete image arrays
const defaultOrders: Order[] = [
  {
    id: "ORD-00125",
    customerName: "Alex Johnson",
    customerEmail: "alex.johnson@gmail.com",
    phoneNumber: "+1 (555) 234-5678",
    productName: "Food Delivery Complete System",
    productDescription: "Full-stack food ordering, customer mobile app, restaurant dashboard & rider tracking dispatch app with real-time GPS.",
    items: [
      {
        id: "2",
        title: "Food Delivery Mobile App & Web Admin",
        price: 59.99,
        category: "Apps",
        description: "Complete iOS & Android app built with React Native + Express API backend. Includes real-time live order tracking, rider dispatch system, restaurant partner portal, push notifications, and payment gateway integration.",
        image: ASSETS.foodDelivery,
        images: [
          ASSETS.foodDelivery,
          ASSETS.ecommercePhones,
          ASSETS.realEstate,
          ASSETS.chatApp
        ]
      }
    ],
    totalAmount: 59.99,
    status: "Approved",
    paymentMethod: "SadaPay",
    paymentProof: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    formattedDate: "May 17, 2025 10:30 AM",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: "ORD-00124",
    customerName: "Sarah Wilson",
    customerEmail: "sarah.wilson@yahoo.com",
    phoneNumber: "+92 300 9876543",
    productName: "Real-time AI Chatting App",
    productDescription: "Secure instant messaging platform with end-to-end encryption, Gemini AI chat bots, and media sharing.",
    items: [
      {
        id: "4",
        title: "Real-time AI Chatting App",
        price: 34.99,
        category: "Apps",
        description: "Production ready chat application with WebSockets and Firebase Auth. Includes direct messaging, group channels, voice message attachments, typing indicators, and Gemini AI companion bot integration.",
        image: ASSETS.chatApp,
        images: [
          ASSETS.chatApp,
          ASSETS.ecommercePhones,
          ASSETS.portfolioWeb
        ]
      }
    ],
    totalAmount: 34.99,
    status: "Pending",
    paymentMethod: "EasyPaisa",
    paymentProof: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=80",
    formattedDate: "May 17, 2025 09:15 AM",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: "ORD-00123",
    customerName: "Michael Brown",
    customerEmail: "mike.brown@gmail.com",
    phoneNumber: "+1 (555) 789-0123",
    productName: "Real Estate Marketplace Portal",
    productDescription: "Multi-vendor property listing portal with 3D virtual tour support, mortgage calculator, and booking agent appointments.",
    items: [
      {
        id: "3",
        title: "Real Estate Marketplace Portal",
        price: 39.99,
        category: "Websites",
        description: "React 18 + Tailwind CSS portal with integrated CRM, dynamic filter maps, automated inquiry routing, mortgage estimation tool, and broker listing management.",
        image: ASSETS.realEstate,
        images: [
          ASSETS.realEstate,
          ASSETS.marketplaceWeb,
          ASSETS.portfolioWeb
        ]
      }
    ],
    totalAmount: 39.99,
    status: "Processing",
    paymentMethod: "JazzCash",
    paymentProof: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80",
    formattedDate: "May 16, 2025 08:45 PM",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
  }
];

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All Orders");
  const [statusDropdown, setStatusDropdown] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Expanded Image Lightbox (Single Image e.g. Payment Proof)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Multi-Image Product Gallery Modal with Next / Prev buttons
  const [galleryModal, setGalleryModal] = useState<GalleryModalState | null>(null);

  // Proceed Dropdown State inside Modal
  const [showProceedMenu, setShowProceedMenu] = useState(false);

  // Keyboard navigation for image gallery modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!galleryModal || !galleryModal.isOpen) return;

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setGalleryModal(prev => {
        if (!prev) return null;
        const newIndex = prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1;
        return { ...prev, currentIndex: newIndex };
      });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setGalleryModal(prev => {
        if (!prev) return null;
        const newIndex = prev.currentIndex === prev.images.length - 1 ? 0 : prev.currentIndex + 1;
        return { ...prev, currentIndex: newIndex };
      });
    } else if (e.key === "Escape") {
      setGalleryModal(null);
    }
  }, [galleryModal]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const customerName = data.customerName || data.fullName || data.userName || "Customer";
        const customerEmail = data.customerEmail || data.userEmail || data.email || "user@example.com";
        const phoneNumber = data.phoneNumber || data.phone || "";
        
        let rawItems: any[] = [];
        if (Array.isArray(data.items) && data.items.length > 0) {
          rawItems = data.items;
        } else {
          rawItems = [{
            title: data.productTitle || data.productName || "Digital Software Package",
            price: Number(data.totalAmount || data.amount || 49.99),
            category: data.category || "Digital Product",
            description: data.productDescription || data.description || "Full source code, lifetime updates, and documentation included.",
            image: data.productImage || data.image || ASSETS.ecommercePhones,
            images: data.images || []
          }];
        }

        const items: OrderItem[] = rawItems.map((it: any) => {
          const itemTitle = it.title || it.name || "Software Item";
          const matchingCatalog = defaultCatalog.find(
            p => (it.id && String(p.id) === String(it.id)) || 
                 p.title.toLowerCase() === itemTitle.toLowerCase()
          );

          let resolvedImages: string[] = [];
          if (Array.isArray(it.images) && it.images.length > 0) {
            resolvedImages = it.images;
          } else if (matchingCatalog?.images && matchingCatalog.images.length > 0) {
            resolvedImages = matchingCatalog.images;
          } else if (it.image || it.thumbnailUrl) {
            resolvedImages = [it.image || it.thumbnailUrl];
            if (matchingCatalog?.image && !resolvedImages.includes(matchingCatalog.image)) {
              resolvedImages.push(matchingCatalog.image);
            }
          } else {
            resolvedImages = [
              matchingCatalog?.image || ASSETS.ecommercePhones,
              ASSETS.foodDelivery,
              ASSETS.realEstate
            ];
          }

          return {
            id: it.id || matchingCatalog?.id || "",
            title: itemTitle,
            price: Number(it.price || matchingCatalog?.price || 0),
            category: it.category || matchingCatalog?.category || "Digital Product",
            description: it.description || matchingCatalog?.description || "Complete source code, lifetime updates, and comprehensive setup documentation included.",
            image: it.image || it.thumbnailUrl || resolvedImages[0] || ASSETS.ecommercePhones,
            thumbnailUrl: it.thumbnailUrl || it.image || resolvedImages[0] || ASSETS.ecommercePhones,
            images: resolvedImages
          };
        });

        const productName = items[0]?.title || "Digital Software Package";
        const productDescription = items[0]?.description || data.description || "Full source code and installation guide included.";
        const formattedDate = data.createdAt 
          ? (typeof data.createdAt?.toDate === "function" 
              ? data.createdAt.toDate().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
              : new Date(data.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }))
          : "May 17, 2025 10:30 AM";
        
        let status = data.status || "Pending";
        const lowStatus = status.toLowerCase();
        if (lowStatus.includes("approve") || lowStatus.includes("completed")) status = "Approved";
        else if (lowStatus.includes("process")) status = "Processing";
        else if (lowStatus.includes("reject") || lowStatus.includes("cancel")) status = "Rejected";
        else if (lowStatus.includes("refund")) status = "Refunded";
        else status = "Pending";

        const paymentProof = data.paymentProof || data.screenshotProof || data.screenshotUrl || data.depositProof || null;

        list.push({
          id: docSnap.id.startsWith("ORD") ? docSnap.id : `ORD-${docSnap.id.slice(0, 6)}`,
          rawDocId: docSnap.id,
          customerName,
          customerEmail,
          phoneNumber,
          productName,
          productDescription,
          items,
          totalAmount: Number(data.totalAmount || data.amount || 49.99),
          status,
          paymentMethod: data.paymentMethod || "SadaPay",
          paymentProof,
          formattedDate,
          avatarUrl: data.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${customerName}`
        });
      });

      if (list.length > 0) {
        setOrders(list);
      } else {
        setOrders(defaultOrders);
      }
    }, (err) => {
      console.warn("Orders listener error:", err);
      setOrders(defaultOrders);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    let res = [...orders];

    // Status Tab Filter
    if (activeTab !== "All Orders") {
      res = res.filter((o) => o.status.toLowerCase() === activeTab.toLowerCase());
    }

    // Status Dropdown filter
    if (statusDropdown !== "All Status") {
      res = res.filter((o) => o.status.toLowerCase() === statusDropdown.toLowerCase());
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      res = res.filter((o) => 
        o.id.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.customerEmail?.toLowerCase().includes(q) ||
        o.productName?.toLowerCase().includes(q)
      );
    }

    setFilteredOrders(res);
    setCurrentPage(1);
  }, [orders, activeTab, statusDropdown, searchQuery]);

  const handleUpdateStatus = async (order: Order, newStatus: "Approved" | "Processing" | "Rejected") => {
    const docId = order.rawDocId || order.id.replace(/^ORD-/, "");
    setUpdatingId(order.id);
    setShowProceedMenu(false);

    try {
      if (docId) {
        await updateDoc(doc(db, "orders", docId), {
          status: newStatus,
          updatedAt: new Date().toISOString()
        });
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
      );

      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      setToastMessage({
        type: "success",
        text: `Order #${order.id} has been marked as "${newStatus}" successfully!`
      });
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      console.error("Update status error:", err);
      setToastMessage({
        type: "error",
        text: "Failed to update order status. Please try again."
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const openProductGallery = (item: OrderItem, initialIndex = 0) => {
    const images = (item.images && item.images.length > 0)
      ? item.images
      : [item.image || item.thumbnailUrl || ASSETS.ecommercePhones];

    setGalleryModal({
      isOpen: true,
      productTitle: item.title,
      productDescription: item.description,
      images,
      currentIndex: Math.min(initialIndex, images.length - 1)
    });
  };

  const handlePrevImage = () => {
    if (!galleryModal) return;
    setGalleryModal(prev => {
      if (!prev) return null;
      const newIndex = prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1;
      return { ...prev, currentIndex: newIndex };
    });
  };

  const handleNextImage = () => {
    if (!galleryModal) return;
    setGalleryModal(prev => {
      if (!prev) return null;
      const newIndex = prev.currentIndex === prev.images.length - 1 ? 0 : prev.currentIndex + 1;
      return { ...prev, currentIndex: newIndex };
    });
  };

  // Pagination (8 per page)
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-10">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
              toastMessage.type === "success"
                ? "bg-emerald-950/90 border border-emerald-800 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                : "bg-red-950/90 border border-red-800 text-red-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{toastMessage.text}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Orders Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            View customer purchases, inspect product description & multi-image showcases, verify deposit proofs, and approve/reject orders.
          </p>
        </div>

        {/* Right Search + Status Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#12131f] border border-[#22243a] text-gray-200 text-xs rounded-xl pl-8 pr-4 py-2 placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] transition-colors w-48 sm:w-60"
            />
          </div>

          <div className="relative">
            <select
              value={statusDropdown}
              onChange={(e) => setStatusDropdown(e.target.value)}
              className="appearance-none bg-[#12131f] border border-[#22243a] text-gray-300 text-xs rounded-xl pl-3 pr-8 py-2 outline-none focus:border-[#8b5cf6] cursor-pointer"
            >
              <option value="All Status">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* TABS ROW */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {statusTabs.map((tab) => {
          const isActive = activeTab === tab;
          const count = 
            tab === "All Orders" ? orders.length :
            orders.filter(o => o.status.toLowerCase() === tab.toLowerCase()).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "bg-[#8b5cf6] text-white shadow-[0_0_15px_rgba(139,92,246,0.35)]"
                  : "bg-[#12131f] border border-[#202237] text-gray-400 hover:text-white hover:bg-[#18192a]"
              }`}
            >
              <span>{tab}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive ? "bg-white/20 text-white" : "bg-[#1e2035] text-gray-400"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ORDERS TABLE CARD */}
      <div className="bg-[#12131f] border border-[#202237] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="text-[11px] text-gray-400 border-b border-[#1f2136] bg-[#0e0f18]/60">
              <tr>
                <th className="py-3.5 px-5 font-semibold">Order ID</th>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Product</th>
                <th className="py-3.5 px-4 font-semibold">Amount</th>
                <th className="py-3.5 px-4 font-semibold">Payment Proof</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Date</th>
                <th className="py-3.5 px-5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b1c2e]">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500">
                    No orders found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const formattedId = order.id.startsWith("#") ? order.id : `#${order.id}`;
                  const isApproved = order.status === "Approved";
                  const isProcessing = order.status === "Processing";
                  const isRejected = order.status === "Rejected";

                  return (
                    <tr key={order.id} className="hover:bg-[#18192a]/70 transition-colors group">
                      
                      {/* Order ID */}
                      <td className="py-3.5 px-5 font-mono text-[#a78bfa] font-bold text-xs">
                        {formattedId}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={order.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"} 
                            alt="avatar" 
                            className="w-7 h-7 rounded-full object-cover border border-purple-500/30 shrink-0" 
                          />
                          <div className="truncate max-w-[150px]">
                            <p className="font-bold text-white text-xs truncate">{order.customerName}</p>
                            <p className="text-[10px] text-gray-500 truncate">{order.customerEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Product Name */}
                      <td className="py-3.5 px-4 text-gray-200 font-medium text-xs max-w-[200px] truncate">
                        {order.productName || "Digital Software Package"}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 font-black text-[#a78bfa] text-xs">
                        ${(Number(order.totalAmount) || 0).toFixed(2)}
                      </td>

                      {/* Payment Proof Badge */}
                      <td className="py-3.5 px-4">
                        {order.paymentProof ? (
                          <button
                            onClick={() => setLightboxImage(order.paymentProof!)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-semibold bg-purple-950/40 text-purple-300 border border-purple-800/40 hover:bg-purple-900/60 transition-colors cursor-pointer"
                          >
                            <ImageIcon className="w-3 h-3 text-[#c084fc]" />
                            <span>Proof Attached</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-500 italic">No receipt</span>
                        )}
                      </td>

                      {/* Status Pill */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          isApproved
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                            : isProcessing
                            ? "bg-blue-950/60 text-blue-400 border border-blue-800/50"
                            : isRejected
                            ? "bg-red-950/60 text-red-400 border border-red-800/50"
                            : "bg-amber-950/60 text-amber-400 border border-amber-800/50"
                        }`}>
                          {isApproved && <Check className="w-2.5 h-2.5" />}
                          {isProcessing && <Clock className="w-2.5 h-2.5 animate-spin" />}
                          {isRejected && <Ban className="w-2.5 h-2.5" />}
                          {order.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-gray-400 text-[11px] whitespace-nowrap">
                        {order.formattedDate}
                      </td>

                      {/* Actions: View Details Button */}
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowProceedMenu(false);
                          }}
                          className="w-8 h-8 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#a78bfa] hover:bg-[#8b5cf6] hover:text-white inline-flex items-center justify-center transition-colors cursor-pointer shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                          title="View order details & products"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION ROW */}
        <div className="p-4 border-t border-[#1f2136] bg-[#0e0f18]/40 flex items-center justify-between text-xs">
          <span className="text-gray-400 text-[11px]">
            Showing {filteredOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-3 py-1.5 rounded-lg bg-[#18192a] border border-[#272942] text-gray-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((pg) => (
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
      </div>

      {/* RICH ORDER DETAILS MODAL */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12131f] border border-[#25283f] rounded-2xl p-6 w-full max-w-3xl shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#202237]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Order Details</h3>
                    <span className="font-mono text-xs text-[#a78bfa] font-bold">#{selectedOrder.id}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Placed on {selectedOrder.formattedDate}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1c1e30] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Info Box */}
              <div className="bg-[#18192a] p-4 rounded-xl border border-[#272942] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider mb-0.5">CUSTOMER</span>
                  <p className="font-bold text-white">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider mb-0.5">EMAIL</span>
                  <p className="text-gray-300 font-mono truncate">{selectedOrder.customerEmail}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider mb-0.5">PHONE / PAYMENT</span>
                  <p className="text-[#c084fc] font-medium">{selectedOrder.phoneNumber || selectedOrder.paymentMethod || "Direct Transfer"}</p>
                </div>
              </div>

              {/* PRODUCT NAME, DESCRIPTION, AND ALL CLICKABLE IMAGES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-[#a78bfa] block">
                    Purchased Products & Image Galleries ({selectedOrder.items?.length || 1})
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Click any image or button to browse all product screenshots
                  </span>
                </div>

                <div className="space-y-4">
                  {(selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items : [
                    {
                      title: selectedOrder.productName || "Digital Software Package",
                      price: selectedOrder.totalAmount,
                      category: "Digital Item",
                      description: selectedOrder.productDescription || "Full source code, lifetime updates, and comprehensive setup documentation included.",
                      image: ASSETS.ecommercePhones,
                      images: [ASSETS.ecommercePhones, ASSETS.foodDelivery, ASSETS.realEstate, ASSETS.chatApp]
                    }
                  ]).map((item, idx) => {
                    const itemImages = (item.images && item.images.length > 0)
                      ? item.images
                      : [item.image || item.thumbnailUrl || ASSETS.ecommercePhones];

                    return (
                      <div key={idx} className="bg-[#0e0f18] border border-[#222437] rounded-xl p-4 sm:p-5 space-y-4">
                        
                        {/* Top: Product Header & Price */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-2 border-b border-[#1b1d2e]">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-white font-bold text-base tracking-tight">{item.title}</h4>
                              <span className="text-[10px] font-semibold bg-[#1f2136] text-[#c084fc] px-2 py-0.5 rounded-md border border-[#2e3250]">
                                {item.category || "Digital Product"}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1">
                              Digital asset package • {itemImages.length} showcase screenshot{itemImages.length > 1 ? "s" : ""} available
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-black text-[#a78bfa]">{formatCurrency(item.price)}</span>
                          </div>
                        </div>

                        {/* Middle: Full Product Description */}
                        <div className="bg-[#141522] p-3.5 rounded-xl border border-[#24263a] space-y-1">
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                            PRODUCT DESCRIPTION
                          </span>
                          <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-line">
                            {item.description || selectedOrder.productDescription || "Complete source code, lifetime updates, and comprehensive setup documentation included."}
                          </p>
                        </div>

                        {/* Bottom: Interactive Product Images Showcase with Left/Right View */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10.5px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-[#a78bfa]" />
                              <span>Product Images & Screenshots ({itemImages.length})</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => openProductGallery(item, 0)}
                              className="text-xs font-bold text-[#a78bfa] hover:text-white bg-[#8b5cf6]/15 hover:bg-[#8b5cf6] border border-[#8b5cf6]/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>Click to view all {itemImages.length} images</span>
                            </button>
                          </div>

                          {/* Image Grid / Thumbnails Preview */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                            {itemImages.map((imgUrl, imgIdx) => (
                              <div
                                key={imgIdx}
                                onClick={() => openProductGallery(item, imgIdx)}
                                className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-[#282b42] hover:border-[#8b5cf6] bg-[#12131f] cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`${item.title} - ${imgIdx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 text-[10px] font-bold p-1 text-center">
                                  <ZoomIn className="w-4 h-4 text-purple-300" />
                                  <span>View Image {imgIdx + 1}</span>
                                </div>
                                <span className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-sm text-[9px] font-mono font-bold text-gray-300 px-1.5 py-0.5 rounded">
                                  #{imgIdx + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TOTAL AMOUNT & PAYMENT PROOF SCREENSHOT */}
              <div className="space-y-3 pt-2">
                {/* Total Amount Box */}
                <div className="bg-[#18192a] border border-[#272942] p-4 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">TOTAL AMOUNT</span>
                    <span className="text-xs text-gray-400">Payment via {selectedOrder.paymentMethod || "Bank Transfer"}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-400">${selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Screenshot Proof Section (Displayed after Total Amount) */}
                <div className="bg-[#0e0f18] border border-[#272942] p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#a78bfa]" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Deposit / Payment Screenshot Proof</span>
                    </div>
                    {selectedOrder.paymentProof && (
                      <button
                        type="button"
                        onClick={() => setLightboxImage(selectedOrder.paymentProof!)}
                        className="text-[11px] text-[#a78bfa] hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Enlarge Proof</span>
                      </button>
                    )}
                  </div>

                  {selectedOrder.paymentProof ? (
                    <div 
                      onClick={() => setLightboxImage(selectedOrder.paymentProof!)}
                      className="relative group rounded-xl overflow-hidden border border-[#2e3150] bg-[#12131f] cursor-pointer max-h-60 flex items-center justify-center"
                    >
                      <img
                        src={selectedOrder.paymentProof}
                        alt="Payment Screenshot Proof"
                        className="w-full max-h-56 object-contain p-2 rounded-xl group-hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-bold text-xs">
                        <ZoomIn className="w-5 h-5" />
                        <span>Click to view full screenshot proof</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed border-[#282a3d] rounded-xl text-center text-gray-500 text-xs">
                      No deposit screenshot proof was uploaded for this order.
                    </div>
                  )}
                </div>
              </div>

              {/* MODAL ACTIONS: PROCEED BUTTON WITH OPTIONS (REJECT, APPROVED, PROCESSING) */}
              <div className="pt-4 border-t border-[#202237] flex flex-col sm:flex-row items-center justify-between gap-3">
                
                {/* Current Status Display */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Current Status:</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    selectedOrder.status === "Approved"
                      ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800/60"
                      : selectedOrder.status === "Processing"
                      ? "bg-blue-950/70 text-blue-300 border border-blue-800/60"
                      : selectedOrder.status === "Rejected"
                      ? "bg-red-950/70 text-red-300 border border-red-800/60"
                      : "bg-amber-950/70 text-amber-300 border border-amber-800/60"
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>

                {/* Proceed Button & Options */}
                <div className="flex items-center gap-2 relative w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 rounded-xl bg-[#18192a] border border-[#2b2e46] text-gray-300 hover:text-white text-xs font-medium cursor-pointer"
                  >
                    Close
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowProceedMenu(!showProceedMenu)}
                      className="flex items-center gap-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.4)] cursor-pointer"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>Proceed Order</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showProceedMenu ? "rotate-180" : ""}`} />
                    </button>

                    {/* Proceed Options Menu: Approved, Processing, Reject */}
                    <AnimatePresence>
                      {showProceedMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute right-0 bottom-full mb-2 w-48 bg-[#18192a] border border-[#2f3252] rounded-xl shadow-2xl p-1.5 z-50 space-y-1"
                        >
                          <button
                            onClick={() => handleUpdateStatus(selectedOrder, "Approved")}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-emerald-300 hover:bg-emerald-950/60 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Approved</span>
                          </button>

                          <button
                            onClick={() => handleUpdateStatus(selectedOrder, "Processing")}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-blue-300 hover:bg-blue-950/60 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span>Processing</span>
                          </button>

                          <button
                            onClick={() => handleUpdateStatus(selectedOrder, "Rejected")}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-red-300 hover:bg-red-950/60 flex items-center gap-2 cursor-pointer transition-colors border-t border-[#252840] pt-1.5"
                          >
                            <XCircle className="w-4 h-4 text-red-400" />
                            <span>Reject</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MULTI-IMAGE PRODUCT GALLERY LIGHTBOX WITH PREV / NEXT ICONS */}
      <AnimatePresence>
        {galleryModal && galleryModal.isOpen && (
          <div 
            onClick={() => setGalleryModal(null)}
            className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/92 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="relative w-full max-w-5xl max-h-[94vh] bg-[#12131f] border border-[#2f3252] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Gallery Header Bar */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222438] bg-[#0c0d15]">
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">{galleryModal.productTitle}</h3>
                    <span className="bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#c084fc] text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0">
                      {galleryModal.currentIndex + 1} / {galleryModal.images.length}
                    </span>
                  </div>
                  {galleryModal.productDescription && (
                    <p className="text-[11px] text-gray-400 truncate mt-0.5 max-w-xl">
                      {galleryModal.productDescription}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={galleryModal.images[galleryModal.currentIndex]}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-[#18192a] hover:bg-[#222438] border border-[#2b2e46] rounded-xl text-gray-300 hover:text-white transition-colors"
                    title="Open original in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setGalleryModal(null)}
                    className="p-2 bg-[#18192a] hover:bg-red-950/80 hover:border-red-800 border border-[#2b2e46] rounded-xl text-gray-300 hover:text-red-300 transition-colors cursor-pointer"
                    title="Close gallery"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Image Stage with Left & Right Switch Icons */}
              <div className="relative flex-1 min-h-[300px] sm:min-h-[460px] max-h-[65vh] bg-[#07080e] flex items-center justify-center p-4 select-none">
                
                {/* Active Image */}
                <AnimatePresence mode="wait">
                  <motion.img
                    key={galleryModal.currentIndex}
                    src={galleryModal.images[galleryModal.currentIndex]}
                    alt={`Screenshot ${galleryModal.currentIndex + 1}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="max-w-full max-h-[58vh] object-contain rounded-xl shadow-2xl"
                  />
                </AnimatePresence>

                {/* Left Switch Button (<) */}
                {galleryModal.images.length > 1 && (
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/75 hover:bg-[#8b5cf6] border border-white/20 hover:border-[#8b5cf6] text-white flex items-center justify-center transition-all cursor-pointer shadow-2xl group hover:scale-110 active:scale-95 z-20"
                    title="Previous Image (Left Arrow)"
                  >
                    <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* Right Switch Button (>) */}
                {galleryModal.images.length > 1 && (
                  <button
                    onClick={handleNextImage}
                    className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/75 hover:bg-[#8b5cf6] border border-white/20 hover:border-[#8b5cf6] text-white flex items-center justify-center transition-all cursor-pointer shadow-2xl group hover:scale-110 active:scale-95 z-20"
                    title="Next Image (Right Arrow)"
                  >
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* Floating Bottom Pill Indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-y-0 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-white/10 px-3.5 py-1 rounded-full text-[11px] text-gray-300 font-medium z-10 flex items-center gap-2">
                  <span>Image {galleryModal.currentIndex + 1} of {galleryModal.images.length}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400 text-[10px]">Use ◄ ► keys to switch</span>
                </div>

              </div>

              {/* Bottom Thumbnail Strip */}
              {galleryModal.images.length > 1 && (
                <div className="p-3 bg-[#0c0d15] border-t border-[#222438] flex items-center justify-center gap-2.5 overflow-x-auto">
                  {galleryModal.images.map((thumbUrl, idx) => {
                    const isSelected = idx === galleryModal.currentIndex;
                    return (
                      <button
                        key={idx}
                        onClick={() => setGalleryModal({ ...galleryModal, currentIndex: idx })}
                        className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                          isSelected 
                            ? "border-[#8b5cf6] ring-2 ring-[#8b5cf6]/40 scale-105" 
                            : "border-[#222436] opacity-60 hover:opacity-100 hover:border-gray-500"
                        }`}
                      >
                        <img src={thumbUrl} alt="thumbnail" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-white bg-black/70 px-1 rounded">
                          {idx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SINGLE IMAGE LIGHTBOX (FOR PAYMENT PROOFS) */}
      <AnimatePresence>
        {lightboxImage && (
          <div 
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] bg-[#12131f] border border-[#2f3252] rounded-2xl p-2 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/90 rounded-full text-white cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={lightboxImage}
                alt="Enlarged Preview"
                className="max-w-full max-h-[82vh] rounded-xl object-contain"
              />
              <div className="p-3 text-center text-xs text-gray-300 flex items-center justify-center gap-2">
                <a
                  href={lightboxImage}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#a78bfa] hover:text-white underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open original in new tab</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
