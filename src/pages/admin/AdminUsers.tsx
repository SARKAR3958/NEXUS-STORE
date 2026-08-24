import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Search, Plus, Edit2, Trash2, CheckCircle2, 
  AlertCircle, X, Shield, Mail, Calendar, User as UserIcon,
  Globe, Key, Lock, Eye, EyeOff, ShieldAlert, AlertTriangle
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, setDoc, addDoc } from "firebase/firestore";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "Administrator" | "User" | string;
  authType: "google" | "manual";
  ordersCount: number;
  joinedDate: string;
  status: "Active" | "Banned" | "Inactive" | string;
  banReason?: string;
  password?: string;
  avatarUrl?: string;
  provider?: string;
}

const userTabs = ["All Users", "Google Users", "Manual Users", "Admins"];

const defaultUsers: AppUser[] = [
  {
    id: "usr-1",
    name: "Alex Johnson",
    email: "alex.johnson@gmail.com",
    role: "User",
    authType: "google",
    ordersCount: 12,
    joinedDate: "May 17, 2025",
    status: "Active",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-2",
    name: "Sarah Wilson",
    email: "sarah.wilson@yahoo.com",
    role: "User",
    authType: "manual",
    password: "Password@123",
    ordersCount: 8,
    joinedDate: "May 17, 2025",
    status: "Active",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-3",
    name: "Sarkar Admin",
    email: "sarkar48274@gmail.com",
    role: "Administrator",
    authType: "google",
    ordersCount: 0,
    joinedDate: "May 01, 2025",
    status: "Active",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-4",
    name: "Mike Brown",
    email: "mike.brown@gmail.com",
    role: "User",
    authType: "google",
    ordersCount: 15,
    joinedDate: "May 16, 2025",
    status: "Active",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-5",
    name: "Emma Davis",
    email: "emma.davis@hotmail.com",
    role: "User",
    authType: "manual",
    password: "UserEmma#2025",
    ordersCount: 6,
    joinedDate: "May 15, 2025",
    status: "Banned",
    banReason: "Suspicious unauthorized chargeback attempt",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-6",
    name: "Zubair Khan",
    email: "zubair.nexus@gmail.com",
    role: "Administrator",
    authType: "google",
    ordersCount: 3,
    joinedDate: "May 14, 2025",
    status: "Active",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-7",
    name: "Lisa Anderson",
    email: "lisa.anderson@gmail.com",
    role: "User",
    authType: "google",
    ordersCount: 9,
    joinedDate: "May 14, 2025",
    status: "Active",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-8",
    name: "Tom Wilson",
    email: "tom.wilson@outlook.com",
    role: "User",
    authType: "manual",
    password: "WilsonSecure99",
    ordersCount: 4,
    joinedDate: "May 13, 2025",
    status: "Active",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80"
  }
];

export function AdminUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AppUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All Users");
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userAuthType, setUserAuthType] = useState<"google" | "manual">("manual");
  const [userStatus, setUserStatus] = useState<"Active" | "Banned">("Active");
  const [userBanReason, setUserBanReason] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const list: AppUser[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const name = data.name || data.displayName || data.fullName || "User";
        const email = data.email || "user@example.com";
        const isAdmin = (data.role === "admin" || data.role === "Administrator" || email === "sarkar48274@gmail.com");
        let role = isAdmin ? "Administrator" : "User";

        const provider = (data.provider || data.authProvider || "").toLowerCase();
        const isGoogle = 
          provider === "google.com" || 
          provider === "google" || 
          (data.photoURL && data.photoURL.includes("googleusercontent.com")) ||
          (data.avatarUrl && data.avatarUrl.includes("googleusercontent.com"));

        const authType: "google" | "manual" = isGoogle ? "google" : (data.authType === "google" ? "google" : "manual");
        
        let status = data.status || "Active";
        if (status.toLowerCase() === "ban" || status.toLowerCase() === "banned") {
          status = "Banned";
        }

        list.push({
          id: docSnap.id,
          name,
          email,
          role,
          authType,
          password: data.password || "",
          banReason: data.banReason || "",
          ordersCount: data.ordersCount || 0,
          joinedDate: data.createdAt ? new Date(data.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "May 17, 2025",
          status,
          avatarUrl: data.photoURL || data.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
        });
      });

      if (list.length > 0) {
        setUsers(list);
      } else {
        setUsers(defaultUsers);
      }
    }, (err) => {
      console.warn("Users listener error:", err);
      setUsers(defaultUsers);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    let res = [...users];

    // Filter by Tab: All Users, Google Users, Manual Users, Admins
    if (activeTab === "Google Users") {
      res = res.filter((u) => u.authType === "google");
    } else if (activeTab === "Manual Users") {
      res = res.filter((u) => u.authType === "manual");
    } else if (activeTab === "Admins") {
      res = res.filter((u) => u.role.toLowerCase() === "administrator" || u.role.toLowerCase() === "admin");
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      res = res.filter((u) => 
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.authType.toLowerCase().includes(q) ||
        (u.banReason && u.banReason.toLowerCase().includes(q))
      );
    }

    setFilteredUsers(res);
    setCurrentPage(1);
  }, [users, activeTab, searchQuery]);

  const openCreateModal = () => {
    setEditingUser(null);
    setUserName("");
    setUserEmail("");
    setUserPassword("");
    setShowPassword(false);
    setUserAuthType("manual");
    setUserStatus("Active");
    setUserBanReason("");
    setIsModalOpen(true);
  };

  const openEditModal = (user: AppUser) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserPassword(user.password || "");
    setShowPassword(false);
    setUserAuthType(user.authType);
    setUserStatus(user.status === "Banned" || user.status === "Ban" ? "Banned" : "Active");
    setUserBanReason(user.banReason || "");
    setIsModalOpen(true);
  };

  const isEditingUserAdmin = Boolean(
    editingUser && (
      editingUser.role === "Administrator" || 
      editingUser.role === "admin" || 
      editingUser.email === "sarkar48274@gmail.com" ||
      editingUser.email.includes("admin@")
    )
  );

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      setMessage({ type: "error", text: "Please enter name and email." });
      return;
    }

    if (userStatus === "Banned" && isEditingUserAdmin) {
      setMessage({ type: "error", text: "Administrator accounts cannot be banned!" });
      return;
    }

    if (userStatus === "Banned" && !userBanReason.trim()) {
      setMessage({ type: "error", text: "Please enter a reason for banning this user." });
      return;
    }

    try {
      if (editingUser?.id) {
        await updateDoc(doc(db, "users", editingUser.id), {
          name: userName.trim(),
          email: userEmail.trim(),
          ...(userAuthType === "manual" && userPassword ? { password: userPassword } : {}),
          status: userStatus,
          banReason: userStatus === "Banned" ? userBanReason.trim() : "",
          updatedAt: new Date().toISOString()
        });
        setMessage({ type: "success", text: `Updated user "${userName}" successfully!` });
      } else {
        await addDoc(collection(db, "users"), {
          name: userName.trim(),
          email: userEmail.trim(),
          role: "user",
          authType: userAuthType,
          provider: userAuthType === "google" ? "google.com" : "password",
          password: userAuthType === "manual" ? (userPassword || "User@12345") : "",
          status: userStatus,
          banReason: userStatus === "Banned" ? userBanReason.trim() : "",
          createdAt: new Date().toISOString(),
          ordersCount: 0
        });
        setMessage({ type: "success", text: `User "${userName}" created successfully!` });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Save user error:", err);
      setMessage({ type: "error", text: "Failed to save user. Please try again." });
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, "users", id));
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setDeleteConfirmId(null);
      setMessage({ type: "success", text: "User removed successfully." });
    } catch (err) {
      console.error("Delete user error:", err);
      setMessage({ type: "error", text: "Failed to delete user." });
    }
  };

  // Pagination (8 per page)
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-10">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
              message.type === "success"
                ? "bg-emerald-950/80 border border-emerald-800 text-emerald-300"
                : "bg-red-950/80 border border-red-800 text-red-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Users Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage your store customers, auth types, accounts, and system access.
          </p>
        </div>

        {/* Right Search + Add User Button */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#12131f] border border-[#22243a] text-gray-200 text-xs rounded-xl pl-8 pr-4 py-2 placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] transition-colors w-48 sm:w-60"
            />
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.35)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* TABS ROW */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {userTabs.map((tab) => {
          const isActive = activeTab === tab;
          const count = 
            tab === "All Users" ? users.length :
            tab === "Google Users" ? users.filter(u => u.authType === "google").length :
            tab === "Manual Users" ? users.filter(u => u.authType === "manual").length :
            users.filter(u => u.role.toLowerCase() === "administrator" || u.role.toLowerCase() === "admin").length;

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

      {/* USERS TABLE CARD */}
      <div className="bg-[#12131f] border border-[#202237] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="text-[11px] text-gray-400 border-b border-[#1f2136] bg-[#0e0f18]/60">
              <tr>
                <th className="py-3.5 px-5 font-semibold">User</th>
                <th className="py-3.5 px-4 font-semibold">Auth Type</th>
                <th className="py-3.5 px-4 font-semibold">Role</th>
                <th className="py-3.5 px-4 font-semibold">Orders</th>
                <th className="py-3.5 px-4 font-semibold">Joined Date</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b1c2e]">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isGoogle = user.authType === "google";
                  const isAdmin = user.role === "Administrator" || user.role === "admin";
                  const isBanned = user.status === "Banned" || user.status === "Ban";

                  return (
                    <tr key={user.id} className="hover:bg-[#18192a]/70 transition-colors group">
                      {/* User Info */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover border border-[#323654] shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-white text-xs">{user.name}</p>
                              {isAdmin && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Auth Type Badge */}
                      <td className="py-3 px-4">
                        {isGoogle ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-800/60 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                            </svg>
                            Google User
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold bg-[#18192a] text-purple-300 border border-[#2e3150]">
                            <Key className="w-3 h-3 text-[#a78bfa] shrink-0" />
                            Manual Sign In
                          </span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#8b5cf6]/20 text-[#c084fc] border border-[#8b5cf6]/40">
                            <Shield className="w-3 h-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs font-medium">User</span>
                        )}
                      </td>

                      {/* Orders Count */}
                      <td className="py-3 px-4 text-gray-300 text-xs font-mono">
                        {user.ordersCount}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-gray-400 text-[11px]">
                        {user.joinedDate}
                      </td>

                      {/* Status Pill */}
                      <td className="py-3 px-4">
                        {isBanned ? (
                          <span 
                            title={user.banReason ? `Reason: ${user.banReason}` : "Banned account"}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-800/60 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                          >
                            <ShieldAlert className="w-2.5 h-2.5" />
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="w-8 h-8 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#a78bfa] hover:bg-[#8b5cf6] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Edit user"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            disabled={isAdmin}
                            onClick={() => setDeleteConfirmId(user.id)}
                            className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-800/40 text-red-400 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                            title={isAdmin ? "Admins cannot be deleted" : "Delete user"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
            Showing {filteredUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
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

      {/* ADD / EDIT USER MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12131f] border border-[#25283f] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#202237]">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingUser ? "Edit User" : "Add New User"}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {editingUser ? `Account ID: ${editingUser.id}` : "Create a new user account"}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1c1e30] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
                {/* Full Name */}
                <div>
                  <label className="block text-gray-400 mb-1 font-medium">Full Name</label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Sarkar"
                    className="w-full bg-[#18192a] border border-[#2b2e46] text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-[#8b5cf6]"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-gray-400 mb-1 font-medium">Email Address</label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="e.g. sarkar48274@gmail.com"
                    className="w-full bg-[#18192a] border border-[#2b2e46] text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-[#8b5cf6]"
                  />
                </div>

                {/* Password Input (Replacing Auth Provider & Role) */}
                <div>
                  <label className="block text-gray-400 mb-1 font-medium flex items-center justify-between">
                    <span>Password</span>
                    {userAuthType === "manual" && (
                      <span className="text-[10px] text-purple-400 font-normal">Manual User Password</span>
                    )}
                  </label>

                  {userAuthType === "manual" ? (
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        placeholder="Enter or view user password..."
                        className="w-full bg-[#18192a] border border-[#2b2e46] text-white rounded-xl pl-3.5 pr-10 py-2.5 outline-none focus:border-[#8b5cf6] font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[#18192a]/80 border border-[#2b2e46] rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-gray-400 text-xs">
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span className="font-mono text-[11px] text-gray-300">Google OAuth Account (No Password)</span>
                    </div>
                  )}
                </div>

                {/* Status Selection: Active & Ban */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-gray-400 font-medium">Status</label>
                    {isEditingUserAdmin && (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1 font-semibold">
                        <Shield className="w-2.5 h-2.5" />
                        Admin Account Protected
                      </span>
                    )}
                  </div>

                  <select
                    value={userStatus}
                    onChange={(e) => {
                      if (isEditingUserAdmin && e.target.value === "Banned") {
                        setMessage({ type: "error", text: "Administrator accounts cannot be banned." });
                        return;
                      }
                      setUserStatus(e.target.value as "Active" | "Banned");
                    }}
                    className="w-full bg-[#18192a] border border-[#2b2e46] text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-[#8b5cf6] cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Banned" disabled={isEditingUserAdmin}>
                      {isEditingUserAdmin ? "Ban (Disabled for Admin)" : "Ban"}
                    </option>
                  </select>
                </div>

                {/* Ban Reason Input (Shows only when user status is Banned) */}
                {userStatus === "Banned" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 p-3.5 bg-red-950/40 border border-red-800/60 rounded-xl"
                  >
                    <label className="block text-red-300 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      Ban Reason (Will be shown to user on their screen)
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={userBanReason}
                      onChange={(e) => setUserBanReason(e.target.value)}
                      placeholder="e.g. Violation of website terms, fraudulent payment proof, or unauthorized chargeback..."
                      className="w-full bg-[#12131f] border border-red-800/70 text-gray-200 rounded-lg p-2.5 outline-none focus:border-red-500 text-xs"
                    />
                    <p className="text-[10.5px] text-red-400/90 leading-tight">
                      When this user visits the site, their entire screen will display: <span className="font-bold">"YOU HAVE BEEN BANNED FROM THIS WEBSITE DUE TO: [reason]"</span>.
                    </p>
                  </motion.div>
                )}

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#202237]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#18192a] border border-[#2b2e46] text-gray-300 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold transition-all shadow-[0_0_15px_rgba(139,92,246,0.4)] cursor-pointer"
                  >
                    {editingUser ? "Save Changes" : "Create User"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM MODAL */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12131f] border border-red-900/60 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-base font-bold text-white">Delete User</h3>
              <p className="text-xs text-gray-400 mt-2">
                Are you sure you want to delete this user from the system?
              </p>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl bg-[#18192a] border border-[#2b2e46] text-gray-300 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteConfirmId)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
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
