import { useEffect, useState } from "react";
import { Megaphone, Save, RefreshCw, CheckCircle2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface Banner { id: string; enabled: boolean; title: string; message: string; buttonText: string; buttonLink: string; }
const newBanner = (): Banner => ({ id: crypto.randomUUID(), enabled: true, title: "20% off on all apps", message: "Upgrade your workflow with our premium apps.", buttonText: "See Now", buttonLink: "/products?category=Apps" });

export function AdminPopups() {
  const [banners, setBanners] = useState<Banner[]>([newBanner()]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    getDoc(doc(db, "system_config", "admin_settings")).then((snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (Array.isArray(data.storePopups) && data.storePopups.length) setBanners(data.storePopups);
      else if (data.storePopupTitle) setBanners([{ id: "legacy", enabled: data.storePopupEnabled !== false, title: data.storePopupTitle, message: data.storePopupMessage || "", buttonText: data.storePopupButtonText || "See Now", buttonLink: data.storePopupButtonLink || "/products?category=Apps" }]);
    }).catch(() => setStatus({ type: "error", text: "Failed to load popup settings." })).finally(() => setIsLoading(false));
  }, []);

  const updateBanner = (id: string, changes: Partial<Banner>) => setBanners((items) => items.map((banner) => banner.id === id ? { ...banner, ...changes } : banner));
  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (banners.some((banner) => !banner.title.trim() || !banner.message.trim() || !banner.buttonText.trim() || !banner.buttonLink.trim())) { setStatus({ type: "error", text: "Please complete every banner field." }); return; }
    setIsSaving(true); setStatus(null);
    try {
      await setDoc(doc(db, "system_config", "admin_settings"), { storePopups: banners, storePopupUpdatedAt: new Date().toISOString(), updatedBy: auth.currentUser?.email || "admin" }, { merge: true });
      setStatus({ type: "success", text: "Popups published successfully." });
    } catch (error: any) { setStatus({ type: "error", text: error?.message || "Failed to save popup settings." }); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="p-8 text-sm text-gray-400">Loading popup settings...</div>;
  return <div className="space-y-6 max-w-4xl mx-auto w-full px-2 py-4 sm:p-6 lg:p-8">
    <div><h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5"><Megaphone className="w-6 h-6 text-[#a78bfa]" /> Store Popups</h1><p className="text-xs text-gray-400 mt-1">Create multiple promotional banners and enable or disable each one.</p></div>
    {status && <div className={`p-4 rounded-2xl border text-xs flex items-center gap-2 ${status.type === "success" ? "bg-emerald-950/50 border-emerald-800/70 text-emerald-300" : "bg-red-950/50 border-red-800/70 text-red-300"}`}>{status.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{status.text}</div>}
    <form onSubmit={handleSave} className="space-y-4">
      {banners.map((banner, index) => <div key={banner.id} className="bg-[#10111a] border border-[#202234] rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-sm font-bold text-white">Banner {index + 1}</h2><div className="flex items-center gap-3"><label className="flex items-center gap-2 text-xs text-gray-300">Enabled <input type="checkbox" checked={banner.enabled} onChange={(event) => updateBanner(banner.id, { enabled: event.target.checked })} className="h-4 w-4 accent-violet-600" /></label>{banners.length > 1 && <button type="button" onClick={() => setBanners((items) => items.filter((item) => item.id !== banner.id))} className="p-2 text-gray-400 hover:text-red-400" aria-label="Remove banner"><Trash2 className="w-4 h-4" /></button>}</div></div>
        <Field label="Alert title" value={banner.title} onChange={(value) => updateBanner(banner.id, { title: value })} placeholder="20% off on all apps" />
        <div><label className="block text-xs font-semibold text-gray-300 mb-2">Message</label><textarea value={banner.message} onChange={(event) => updateBanner(banner.id, { message: event.target.value })} rows={2} className="w-full bg-[#090a10] border border-[#26283c] focus:border-[#8b5cf6] rounded-xl px-4 py-3 text-sm text-white focus:outline-none resize-y" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Field label="Button text" value={banner.buttonText} onChange={(value) => updateBanner(banner.id, { buttonText: value })} placeholder="See Now" /><Field label="Button link" value={banner.buttonLink} onChange={(value) => updateBanner(banner.id, { buttonLink: value })} placeholder="/products?category=Apps" /></div>
      </div>)}
      <div className="flex flex-wrap justify-between gap-3"><button type="button" onClick={() => setBanners((items) => [...items, newBanner()])} className="px-4 py-2.5 rounded-xl border border-[#343750] text-gray-200 text-xs font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Add Banner</button><button type="submit" disabled={isSaving} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50">{isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Publish Popups</button></div>
    </form>
  </div>;
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div><label className="block text-xs font-semibold text-gray-300 mb-2">{label}</label><input value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-[#090a10] border border-[#26283c] focus:border-[#8b5cf6] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none" placeholder={placeholder} /></div>;
}
