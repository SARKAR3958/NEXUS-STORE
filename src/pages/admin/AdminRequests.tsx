import { useState, useEffect } from "react";
import { MessageSquareCode, Search, RefreshCw, CheckCircle2, Clock, Mail, User, DollarSign, Calendar } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";

interface CustomRequest {
  id: string;
  userId?: string;
  name?: string;
  email?: string;
  phone?: string;
  projectType?: string;
  budget?: string;
  timeline?: string;
  description?: string;
  features?: string[];
  status?: "pending" | "contacted" | "in_progress" | "completed" | "rejected" | string;
  createdAt?: string;
}

export function AdminRequests() {
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CustomRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "custom_requests"), (snapshot) => {
      const list: CustomRequest[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as CustomRequest);
      });
      list.sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA;
      });
      setRequests(list);
      setIsLoading(false);
    }, (err) => {
      console.warn("Requests error:", err);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    let res = [...requests];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      res = res.filter((r) =>
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.projectType?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    }
    setFilteredRequests(res);
  }, [requests, searchQuery]);

  const handleStatusChange = async (reqId: string, newStatus: string) => {
    setUpdatingId(reqId);
    try {
      await updateDoc(doc(db, "custom_requests", reqId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to update custom request status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <MessageSquareCode className="w-6 h-6 text-[#a78bfa]" />
          <span>Custom Project Inquiries</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Bespoke software, mobile app, and SaaS quotation requests submitted through the custom build portal.
        </p>
      </div>

      {/* Search */}
      <div className="bg-[#10111a] border border-[#202234] rounded-2xl p-4 flex items-center shadow-lg">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search custom requests by client, project type, or description..."
            className="w-full bg-[#090a10] border border-[#222436] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] transition-colors"
          />
        </div>
      </div>

      {/* Requests Feed */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
          <p className="text-xs text-gray-500">Loading custom inquiries...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[#23253b] rounded-3xl p-8 bg-[#0c0d14]">
          <MessageSquareCode className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No custom requests yet</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            When users submit custom development requests from the "Custom Request" page, they will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-[#10111a] border border-[#202234] rounded-2xl p-5 shadow-xl space-y-3.5 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-[#181a2b] border border-[#272a42] text-[11px] font-bold text-[#a78bfa] font-mono">
                    {req.projectType || "Custom Project"}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "Recent"}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{req.name || "Client Lead"}</h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">{req.email || "No email"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 font-mono">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{req.budget || "Custom Budget"}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-300 bg-[#090a10] border border-[#1f2134] rounded-xl p-3 leading-relaxed">
                  {req.description || "No project description provided."}
                </p>
              </div>

              {/* Status footer */}
              <div className="pt-3 border-t border-[#1c1e2e] flex items-center justify-between gap-2">
                <span className="text-[11px] text-gray-400 font-medium">Status:</span>
                <select
                  value={req.status || "pending"}
                  disabled={updatingId === req.id}
                  onChange={(e) => handleStatusChange(req.id, e.target.value)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#090a10] border border-[#292c44] text-purple-300 focus:outline-none cursor-pointer"
                >
                  <option value="pending">Pending Review</option>
                  <option value="contacted">Contacted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Declined</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
