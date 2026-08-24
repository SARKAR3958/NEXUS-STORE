import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, KeyRound, UserCheck, Plus, Trash2, Edit3, 
  Eye, EyeOff, Copy, Check, Search, AlertCircle, 
  CheckCircle2, AlertTriangle, RefreshCw, X,
  LayoutDashboard, Package, ShoppingCart, Users,
  FileQuestion, MessageSquare, Settings, Sparkles, Filter, Megaphone
} from "lucide-react";
import { 
  useAdminStore, 
  AdminRecord, 
  AdminPermission, 
  ALL_ADMIN_PERMISSIONS 
} from "@/store/adminStore";

const PERMISSION_CONFIG: { id: AdminPermission; label: string; description: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", description: "View analytics, revenue graphs, and store metrics", icon: LayoutDashboard },
  { id: "products", label: "Products", description: "Create, edit, and manage store product catalog", icon: Package },
  { id: "orders", label: "Orders", description: "View orders, verify payment proofs, and approve transactions", icon: ShoppingCart },
  { id: "users", label: "Users", description: "Manage customer accounts, roles, and ban status", icon: Users },
  { id: "requests", label: "Requests", description: "Manage custom development and project requests", icon: FileQuestion },
  { id: "support", label: "Support Chat", description: "Live customer support inquiries and messaging", icon: MessageSquare },
  { id: "admins", label: "Admins Control", description: "Create admins, generate keys, and set tab visibility", icon: Shield },
  { id: "popups", label: "Popups", description: "Create and publish storefront promotional alerts", icon: Megaphone },
  { id: "settings", label: "Settings", description: "Configure payment gateways and system security", icon: Settings },
];

function generateRandomKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segment1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const segment2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `NX-${segment1}-${segment2}`;
}

function formatLastSeen(dateStr?: string): { text: string; isOnline: boolean } {
  if (!dateStr) return { text: "Never", isOnline: false };
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 3) {
    return { text: "Active Now", isOnline: true };
  }
  if (diffMinutes < 60) {
    return { text: `${diffMinutes}m ago`, isOnline: false };
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return { text: `${diffHours}h ago`, isOnline: false };
  }
  const diffDays = Math.floor(diffHours / 24);
  return { text: `${diffDays}d ago`, isOnline: false };
}

export function AdminAdmins() {
  const { 
    adminsList, 
    fetchAdmins, 
    createAdmin, 
    updateAdmin, 
    deleteAdmin, 
    adminUser 
  } = useAdminStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminRecord | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<AdminRecord | null>(null);

  // Form States for Add / Edit
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formKey, setFormKey] = useState("");
  const [formRole, setFormRole] = useState<"superadmin" | "admin" | "manager" | "support">("admin");
  const [formPermissions, setFormPermissions] = useState<AdminPermission[]>([...ALL_ADMIN_PERMISSIONS]);
  const [showFormKey, setShowFormKey] = useState(false);

  // UI helpers
  const [revealedKeys, setRevealedKeys] = useState<{ [id: string]: boolean }>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const unsub = fetchAdmins();
    return () => unsub();
  }, [fetchAdmins]);

  const showNotification = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const toggleKeyVisibility = (id: string) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddModal = () => {
    setFormName("");
    setFormEmail("");
    setFormKey(generateRandomKey());
    setFormRole("admin");
    setFormPermissions([...ALL_ADMIN_PERMISSIONS]);
    setShowFormKey(true);
    setIsAddModalOpen(true);
  };

  const openEditModal = (admin: AdminRecord) => {
    setEditingAdmin(admin);
    setFormName(admin.name || "");
    setFormEmail(admin.email || "");
    setFormKey(admin.secretKey || "");
    setFormRole(admin.role || "admin");
    setFormPermissions(admin.permissions && admin.permissions.length > 0 ? [...admin.permissions] : [...ALL_ADMIN_PERMISSIONS]);
    setShowFormKey(false);
  };

  const handleTogglePermission = (permId: AdminPermission) => {
    setFormPermissions(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleSelectAllPermissions = () => {
    setFormPermissions([...ALL_ADMIN_PERMISSIONS]);
  };

  const handleClearAllPermissions = () => {
    setFormPermissions(["dashboard"]);
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formKey.trim()) {
      showNotification("error", "Please fill in all required fields (Name, Email, Security Key).");
      return;
    }

    if (formPermissions.length === 0) {
      showNotification("error", "Admin must have at least one assigned tab permission.");
      return;
    }

    setIsSaving(true);

    if (editingAdmin) {
      // Update existing admin
      const res = await updateAdmin(editingAdmin.id, {
        name: formName.trim(),
        email: formEmail.trim(),
        secretKey: formKey.trim(),
        role: formRole,
        permissions: formPermissions,
      });
      setIsSaving(false);

      if (res.success) {
        showNotification("success", res.message || "Admin updated successfully!");
        setEditingAdmin(null);
      } else {
        showNotification("error", res.message || "Failed to update admin.");
      }
    } else {
      // Create new admin
      const res = await createAdmin({
        name: formName.trim(),
        email: formEmail.trim(),
        secretKey: formKey.trim(),
        role: formRole,
        permissions: formPermissions,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(formName.trim())}`,
      });
      setIsSaving(false);

      if (res.success) {
        showNotification("success", res.message || "New admin created successfully in Firestore!");
        setIsAddModalOpen(false);
      } else {
        showNotification("error", res.message || "Failed to create admin in Firestore.");
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingAdmin) return;
    setIsSaving(true);
    const res = await deleteAdmin(deletingAdmin.id);
    setIsSaving(false);

    if (res.success) {
      showNotification("success", `Admin "${deletingAdmin.name}" deleted and removed from Firestore.`);
      setDeletingAdmin(null);
    } else {
      showNotification("error", res.message || "Failed to delete admin.");
    }
  };

  // Filtered Admins
  const filteredAdmins = adminsList.filter((admin) => {
    const matchesSearch = 
      admin.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.secretKey?.toLowerCase().includes(searchQuery.toLowerCase());

    const { isOnline } = formatLastSeen(admin.lastSeen);
    const matchesStatus = 
      statusFilter === "all" ? true :
      statusFilter === "online" ? (admin.status === "online" || isOnline) :
      (admin.status !== "online" && !isOnline);

    const matchesRole = roleFilter === "all" || admin.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const onlineCount = adminsList.filter(a => a.status === "online" || formatLastSeen(a.lastSeen).isOnline).length;
  const offlineCount = adminsList.length - onlineCount;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-[#8b5cf6]" />
            <span>Admin Management & Security</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Generate custom admin keys, configure panel permissions, track live online status, and manage administrators.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white text-xs font-bold shadow-[0_0_20px_rgba(139,92,246,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Admin Key</span>
        </button>
      </div>

      {/* TOAST FEEDBACK */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-xl ${
              toast.type === "success"
                ? "bg-emerald-950/70 border-emerald-800 text-emerald-300"
                : "bg-red-950/70 border-red-800 text-red-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#10111a] border border-[#202234] rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[11px] text-gray-400 font-medium">Total Registered</span>
          <div className="text-2xl font-black text-white">{adminsList.length}</div>
          <span className="text-[10px] text-purple-400 font-mono">Firestore Document Records</span>
        </div>

        <div className="bg-[#10111a] border border-[#202234] rounded-2xl p-4 shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400 font-medium">Active Admins</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400">{onlineCount}</div>
          <span className="text-[10px] text-emerald-500 font-mono">Online in Session</span>
        </div>

        <div className="bg-[#10111a] border border-[#202234] rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[11px] text-gray-400 font-medium">Offline Admins</span>
          <div className="text-2xl font-black text-gray-300">{offlineCount}</div>
          <span className="text-[10px] text-gray-500 font-mono">Inactive or Logged Out</span>
        </div>

        <div className="bg-[#10111a] border border-[#202234] rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[11px] text-gray-400 font-medium">Access Control</span>
          <div className="text-sm font-bold text-purple-300 flex items-center gap-1.5 pt-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Granular RBAC</span>
          </div>
          <span className="text-[10px] text-purple-400/80 font-mono">8 Panel Tabs Secured</span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#10111a] border border-[#202234] p-3 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search admins by name, email, role, or key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#090a10] border border-[#26283c] focus:border-[#8b5cf6] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center bg-[#090a10] border border-[#26283c] rounded-xl p-1 text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === "all" ? "bg-[#8b5cf6] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              All ({adminsList.length})
            </button>
            <button
              onClick={() => setStatusFilter("online")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "online" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Online ({onlineCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter("offline")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === "offline" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Offline ({offlineCount})
            </button>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#090a10] border border-[#26283c] text-xs text-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#8b5cf6]"
          >
            <option value="all">All Roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="support">Support</option>
          </select>
        </div>
      </div>

      {/* ADMINS LIST / CARDS */}
      {filteredAdmins.length === 0 ? (
        <div className="bg-[#10111a] border border-[#202234] rounded-3xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-purple-950/40 border border-purple-800/40 text-purple-400 flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Administrators Found</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
              {adminsList.length === 0
                ? "There are no separate admin records created yet. Click 'Generate New Admin Key' above to grant access."
                : "No admins match your current search or filter criteria."}
            </p>
          </div>
          {adminsList.length === 0 && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-bold rounded-xl shadow-lg inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Admin</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAdmins.map((admin) => {
            const { text: lastSeenText, isOnline } = formatLastSeen(admin.lastSeen);
            const activeStatus = admin.status === "online" || isOnline;
            const isSelf = admin.id === adminUser?.adminRecordId || admin.email === adminUser?.email;
            const isKeyShown = revealedKeys[admin.id];
            const isCopied = copiedKeyId === admin.id;

            return (
              <div 
                key={admin.id}
                className="bg-[#10111a] border border-[#202234] hover:border-[#2e314a] rounded-3xl p-5 shadow-xl space-y-4 transition-all"
              >
                {/* TOP ROW: AVATAR, NAME, ONLINE BADGE, ROLE */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      {admin.avatarUrl ? (
                        <img
                          src={admin.avatarUrl}
                          alt={admin.name}
                          className="w-12 h-12 rounded-2xl bg-[#171828] border border-[#282a40] object-cover p-1"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8b5cf6] to-[#a78bfa] text-white flex items-center justify-center font-black text-lg">
                          {admin.name?.charAt(0) || "A"}
                        </div>
                      )}
                      
                      {/* LIVE ONLINE/OFFLINE STATUS PIN */}
                      <span 
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#10111a] ${
                          activeStatus ? "bg-emerald-500 animate-pulse" : "bg-gray-600"
                        }`}
                        title={activeStatus ? "Online" : `Offline (Last seen: ${lastSeenText})`}
                      />
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white truncate">{admin.name}</h3>
                        {isSelf && (
                          <span className="px-2 py-0.2 rounded-full bg-purple-950/80 border border-purple-700/60 text-purple-300 text-[9px] font-mono font-bold uppercase">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate font-mono mt-0.5">{admin.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {/* Status Badge */}
                    <span 
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 border ${
                        activeStatus
                          ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                          : "bg-[#161724] border-[#26283d] text-gray-400"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${activeStatus ? "bg-emerald-400" : "bg-gray-500"}`} />
                      <span>{activeStatus ? "Online" : `Offline (${lastSeenText})`}</span>
                    </span>

                    {/* Role Badge */}
                    <span className="px-2.5 py-0.5 rounded-full bg-[#8b5cf6]/15 border border-[#8b5cf6]/35 text-[#a78bfa] text-[10px] font-mono font-bold uppercase">
                      {admin.role || "Admin"}
                    </span>
                  </div>
                </div>

                {/* SECURITY KEY SECTION */}
                <div className="bg-[#090a10] border border-[#222436] rounded-2xl p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-gray-400 block font-medium">Security Access Key</span>
                    <div className="font-mono text-xs text-purple-300 tracking-wider truncate font-semibold mt-0.5">
                      {isKeyShown ? admin.secretKey : "••••••••••••••••"}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleKeyVisibility(admin.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#161726] transition-colors cursor-pointer"
                      title={isKeyShown ? "Hide Key" : "Reveal Key"}
                    >
                      {isKeyShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleCopyKey(admin.secretKey, admin.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-purple-300 hover:bg-[#161726] transition-colors cursor-pointer"
                      title="Copy Key"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* PERMISSIONS CHIPS */}
                <div>
                  <span className="text-[10px] text-gray-400 block font-medium mb-1.5">
                    Assigned Admin Permissions ({admin.permissions?.length || 0}/8)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {admin.permissions && admin.permissions.length === ALL_ADMIN_PERMISSIONS.length ? (
                      <span className="px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-800/40 text-purple-300 text-[10px] font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>Full Master Access (All 8 Tabs)</span>
                      </span>
                    ) : (
                      admin.permissions?.map((p) => {
                        const conf = PERMISSION_CONFIG.find(c => c.id === p);
                        const Icon = conf?.icon || Shield;
                        return (
                          <span
                            key={p}
                            className="px-2 py-0.5 rounded-lg bg-[#141524] border border-[#25283c] text-gray-300 text-[10px] font-medium flex items-center gap-1"
                          >
                            <Icon className="w-3 h-3 text-purple-400" />
                            <span>{conf?.label || p}</span>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* BOTTOM ACTIONS: EDIT & DELETE */}
                <div className="pt-2 border-t border-[#1c1d2e] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-gray-500 font-mono">
                    Created {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "System"}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(admin)}
                      className="px-3 py-1.5 rounded-xl bg-[#18192a] hover:bg-[#202238] border border-[#2b2d44] text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#a78bfa]" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeletingAdmin(admin)}
                      className="px-3 py-1.5 rounded-xl bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT ADMIN MODAL */}
      <AnimatePresence>
        {(isAddModalOpen || editingAdmin) && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#10111a] border border-[#26283c] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#202234] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-300">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      {editingAdmin ? `Edit Administrator (${editingAdmin.name})` : "Generate New Admin Access"}
                    </h2>
                    <p className="text-xs text-gray-400">
                      Configure login credentials, security key, and tab permissions.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingAdmin(null);
                  }}
                  className="text-gray-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAdmin} className="space-y-5">
                {/* Name and Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Admin Username / Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g., Alex Johnson"
                      className="w-full bg-[#090a10] border border-[#26283c] focus:border-[#8b5cf6] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Admin Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g., alex.admin@nexus.io"
                      className="w-full bg-[#090a10] border border-[#26283c] focus:border-[#8b5cf6] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Role and Secret Key */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Administrative Role *
                    </label>
                    <select
                      value={formRole}
                      onChange={(e: any) => setFormRole(e.target.value)}
                      className="w-full bg-[#090a10] border border-[#26283c] focus:border-[#8b5cf6] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-colors"
                    >
                      <option value="superadmin">Super Administrator</option>
                      <option value="admin">Administrator</option>
                      <option value="manager">Store Operations Manager</option>
                      <option value="support">Customer Support Lead</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-300">
                        Admin Security Key *
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormKey(generateRandomKey())}
                        className="text-[11px] text-purple-400 hover:text-purple-300 font-mono font-medium underline cursor-pointer"
                      >
                        ⚡ Generate Random
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showFormKey ? "text" : "password"}
                        required
                        value={formKey}
                        onChange={(e) => setFormKey(e.target.value)}
                        placeholder="Enter or generate key..."
                        className="w-full bg-[#090a10] border border-[#26283c] focus:border-[#8b5cf6] rounded-xl px-4 py-2.5 text-xs text-white font-mono tracking-wider placeholder-gray-600 focus:outline-none transition-colors pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormKey(!showFormKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                      >
                        {showFormKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* GRANULAR PERMISSIONS SECTION */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#090a10] border border-[#202234] p-3 rounded-2xl">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                        <span>Visible Admin Panel Tabs & Access Controls</span>
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Select which tabs this administrator can see and operate.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] shrink-0 whitespace-nowrap pt-1 sm:pt-0">
                      <button
                        type="button"
                        onClick={handleSelectAllPermissions}
                        className="px-2.5 py-1 rounded-lg bg-purple-950/70 border border-purple-800/60 text-purple-300 hover:text-white hover:bg-purple-900/60 font-semibold transition-colors cursor-pointer"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllPermissions}
                        className="px-2.5 py-1 rounded-lg bg-[#141524] border border-[#26283d] text-gray-300 hover:text-white hover:bg-[#1f2136] font-semibold transition-colors cursor-pointer"
                      >
                        Minimal (Dashboard Only)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PERMISSION_CONFIG.map((perm) => {
                      const isChecked = formPermissions.includes(perm.id);
                      const Icon = perm.icon;
                      return (
                        <label
                          key={perm.id}
                          className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                            isChecked
                              ? "bg-purple-950/30 border-[#8b5cf6]/60 shadow-[0_0_10px_rgba(139,92,246,0.15)]"
                              : "bg-[#090a10] border-[#222436] hover:border-[#31334c] opacity-75"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(perm.id)}
                            className="mt-0.5 rounded border-gray-700 text-[#8b5cf6] focus:ring-[#8b5cf6] bg-black"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                              <Icon className={`w-3.5 h-3.5 ${isChecked ? "text-[#a78bfa]" : "text-gray-400"}`} />
                              <span>{perm.label}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-tight mt-0.5 truncate">
                              {perm.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* MODAL ACTION BUTTONS */}
                <div className="pt-4 border-t border-[#202234] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingAdmin(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-[#2b2d42] text-gray-300 hover:bg-[#161726] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white text-xs font-bold shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{editingAdmin ? "Save Changes in Firestore" : "Create Administrator"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingAdmin && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#10111a] border border-red-900/60 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-800 text-red-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Administrator</h3>
                  <p className="text-xs text-red-300/80">Irreversible Firestore Action</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-red-950/20 border border-red-900/40 text-xs space-y-2 text-gray-300">
                <p>
                  Are you sure you want to permanently delete admin account <strong className="text-white">"{deletingAdmin.name}"</strong> (<span className="font-mono text-purple-300">{deletingAdmin.email}</span>)?
                </p>
                <p className="text-red-300 font-medium">
                  This will delete their admin record from Firestore, invalidate their security key, and terminate their access immediately.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeletingAdmin(null)}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl border border-[#2b2d42] text-gray-300 hover:bg-[#161726] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirmDelete}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Yes, Delete Admin</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
