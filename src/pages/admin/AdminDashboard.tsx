import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ShoppingBag, ShoppingCart, Users, Package, Calendar, 
  ChevronDown, ArrowUpRight, CheckCircle2, Clock, AlertCircle
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export function AdminDashboard() {
  const navigate = useNavigate();
  const [productsCount, setProductsCount] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [timeFilter, setTimeFilter] = useState("This Week");

  const totalSalesAmount = orders.reduce((sum, ord) => {
    return sum + (Number(ord.totalAmount || ord.amount || 0));
  }, 0);

  const totalOrdersCount = orders.length;

  useEffect(() => {
    // Real-time listener for Products
    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      setProductsCount(snap.size);
    }, (err) => console.warn("Products sync err", err));

    // Real-time listener for Orders
    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({ 
          id: d.id, 
          ...data,
          totalAmount: Number(data.totalAmount || data.amount || 0)
        });
      });
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      setOrders(list);
    }, (err) => console.warn("Orders sync err", err));

    // Real-time listener for Users
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsersCount(snap.size);
    }, (err) => console.warn("Users sync err", err));

    return () => {
      unsubProducts();
      unsubOrders();
      unsubUsers();
    };
  }, []);

  // Get actual recent orders from database (up to 5 items)
  const displayOrders = orders.slice(0, 5);

  // Helper to get native Date object from firestore Timestamp or String
  const getOrderDate = (ord: any) => {
    if (!ord.createdAt) return new Date();
    if (typeof ord.createdAt.toDate === "function") {
      return ord.createdAt.toDate();
    }
    return new Date(ord.createdAt);
  };

  // Generate the last 7 days range
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  // Calculate sales per day from the orders state
  const daySales = last7Days.map(day => {
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);

    return orders
      .filter(ord => {
        const oDate = getOrderDate(ord);
        return oDate >= start && oDate <= end;
      })
      .reduce((sum, ord) => sum + (Number(ord.totalAmount || ord.amount || 0)), 0);
  });

  const maxSale = Math.max(...daySales, 10);
  
  // Calculate exact coordinates mapping to SVG viewBox 0 0 700 220
  const chartPoints = last7Days.map((day, i) => {
    const sales = daySales[i];
    const y = 210 - (sales / maxSale) * 180; // range 30 to 210
    const label = day.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const formattedVal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(sales);
    return {
      x: 30 + i * 105, // 30, 135, 240, 345, 450, 555, 660
      y,
      label,
      val: formattedVal
    };
  });

  const pathD = chartPoints.reduce((acc, pt, i) => {
    return acc + (i === 0 ? `M ${pt.x} ${pt.y}` : ` L ${pt.x} ${pt.y}`);
  }, "");

  const areaD = pathD ? `${pathD} L 660 210 L 30 210 Z` : "";

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-10">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Welcome back, Admin! Here's what's happening with your store.
          </p>
        </div>

        {/* Date Filter Pill */}
       
      </div>

      {/* 4 STAT CARDS IN A ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Total Sales */}
        <div className="bg-[#12131f] border border-[#202237] rounded-2xl p-5 shadow-lg relative flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Total Sales</span>
            <div className="w-9 h-9 rounded-xl bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#a78bfa] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalSalesAmount)}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
              <span className="text-emerald-400 font-semibold text-[11px]">Live</span>
              <span className="text-gray-500 text-[11px]">from database</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-[#12131f] border border-[#202237] rounded-2xl p-5 shadow-lg relative flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Total Orders</span>
            <div className="w-9 h-9 rounded-xl bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#a78bfa] flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              {totalOrdersCount.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
              <span className="text-emerald-400 font-semibold text-[11px]">Live</span>
              <span className="text-gray-500 text-[11px]">from database</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Users */}
        <div className="bg-[#12131f] border border-[#202237] rounded-2xl p-5 shadow-lg relative flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Total Users</span>
            <div className="w-9 h-9 rounded-xl bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#a78bfa] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              {usersCount.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
              <span className="text-emerald-400 font-semibold text-[11px]">Live</span>
              <span className="text-gray-500 text-[11px]">from database</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Products */}
        <div className="bg-[#12131f] border border-[#202237] rounded-2xl p-5 shadow-lg relative flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Total Products</span>
            <div className="w-9 h-9 rounded-xl bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#a78bfa] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              {productsCount}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
              <span className="text-emerald-400 font-semibold text-[11px]">Live</span>
              <span className="text-gray-500 text-[11px]">from database</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2-COLUMN BOTTOM GRID: Sales Analytics & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Sales Analytics Chart Card (7 cols) */}
        <div className="lg:col-span-7 bg-[#12131f] border border-[#202237] rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white tracking-tight">Sales Analytics</h2>
            
            {/* Filter Dropdown */}
            <div className="relative">
              <button 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18192a] border border-[#272942] text-xs text-gray-300 hover:text-white"
              >
                <span>{timeFilter}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Line Chart Area */}
          <div className="relative w-full pt-2">
            <div className="flex items-stretch gap-3">
              {/* Y Axis */}
              <div className="flex flex-col justify-between text-[10px] text-gray-500 font-mono py-1 pr-1 select-none">
                <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: "compact" }).format(maxSale)}</span>
                <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: "compact" }).format(maxSale * 0.8)}</span>
                <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: "compact" }).format(maxSale * 0.6)}</span>
                <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: "compact" }).format(maxSale * 0.4)}</span>
                <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: "compact" }).format(maxSale * 0.2)}</span>
                <span>$0</span>
              </div>

              {/* Chart SVG */}
              <div className="flex-1 relative overflow-hidden">
                <svg viewBox="0 0 700 220" className="w-full h-48 sm:h-56 overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="30" y1="10" x2="670" y2="10" stroke="#1f2136" strokeDasharray="3 3" />
                  <line x1="30" y1="50" x2="670" y2="50" stroke="#1f2136" strokeDasharray="3 3" />
                  <line x1="30" y1="90" x2="670" y2="90" stroke="#1f2136" strokeDasharray="3 3" />
                  <line x1="30" y1="130" x2="670" y2="130" stroke="#1f2136" strokeDasharray="3 3" />
                  <line x1="30" y1="170" x2="670" y2="170" stroke="#1f2136" strokeDasharray="3 3" />
                  <line x1="30" y1="210" x2="670" y2="210" stroke="#1f2136" />

                  {/* Area fill */}
                  <path d={areaD} fill="url(#purpleGradient)" />

                  {/* Curved Stroke Line */}
                  <path 
                    d={pathD} 
                    fill="none" 
                    stroke="#a78bfa" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_10px_rgba(167,139,250,0.8)]"
                  />

                  {/* Data Point Dots */}
                  {chartPoints.map((pt, i) => (
                    <g key={i} className="group cursor-pointer">
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r="5" 
                        fill="#0c0d15" 
                        stroke="#c4b5fd" 
                        strokeWidth="2.5"
                        className="transition-transform group-hover:scale-125" 
                      />
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r="2.5" 
                        fill="#8b5cf6" 
                      />
                    </g>
                  ))}
                </svg>

                {/* X Axis Labels */}
                <div className="flex justify-between text-[10px] text-gray-400 font-medium pt-2 px-2 select-none">
                  {chartPoints.map((pt, i) => (
                    <span key={i}>{pt.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders List Card (5 cols) */}
        <div className="lg:col-span-5 bg-[#12131f] border border-[#202237] rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white tracking-tight">Recent Orders</h2>
              <button 
                onClick={() => navigate("/admin/orders")}
                className="text-xs text-[#a78bfa] hover:text-white font-semibold cursor-pointer transition-colors"
              >
                View All
              </button>
            </div>

            <div className="space-y-3.5">
              {displayOrders.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs">
                  No recent orders found in database.
                </div>
              ) : (
                displayOrders.map((ord, idx) => {
                  const isCompleted = ord.status === "Completed" || ord.status === "completed" || ord.status === "Approved";
                  const orderId = ord.id.startsWith("ORD") || ord.id.startsWith("#ORD") ? ord.id : `#ORD-${ord.id.slice(0, 5)}`;
                  const formattedId = orderId.startsWith("#") ? orderId : `#${orderId}`;

                  return (
                    <div 
                      key={ord.id || idx}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#18192a] transition-colors border border-transparent hover:border-[#23253b]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#1a1b2e] border border-[#282a44] shrink-0">
                          <img 
                            src={ord.image || ord.paymentProof || "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=100&auto=format&fit=crop&q=80"} 
                            alt="product" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-white tracking-wide truncate">{formattedId}</p>
                          <p className="text-[10px] text-gray-400 truncate">{ord.date || (ord.createdAt ? (typeof ord.createdAt.toDate === "function" ? ord.createdAt.toDate().toLocaleDateString() : new Date(ord.createdAt).toLocaleDateString()) : "Recently")}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-black text-white">
                          ${(Number(ord.amount || ord.totalAmount) || 0).toFixed(2)}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                          isCompleted 
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50" 
                            : "bg-amber-950/60 text-amber-400 border border-amber-800/50"
                        }`}>
                          {isCompleted ? "Completed" : ord.status || "Pending"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
