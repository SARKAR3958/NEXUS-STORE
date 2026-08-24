import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Banner { id: string; enabled: boolean; title: string; message: string; buttonText: string; buttonLink: string; }

export function StorePopup() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => onSnapshot(doc(db, "system_config", "admin_settings"), (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    const next = Array.isArray(data.storePopups) ? data.storePopups : data.storePopupTitle ? [{ id: "legacy", enabled: data.storePopupEnabled !== false, title: data.storePopupTitle, message: data.storePopupMessage || "", buttonText: data.storePopupButtonText || "See Now", buttonLink: data.storePopupButtonLink || "/products?category=Apps" }] : [];
    const enabled = next.filter((banner: Banner) => banner.enabled);
    setBanners(enabled);
    setIndex(0);
    setDismissed(enabled.length === 0 || localStorage.getItem(`nexus_popup_dismissed_${enabled.map((banner: Banner) => banner.id).join("_")}`) === "true");
  }, (error) => console.warn("Store popup listener warning:", error)), []);

  if (!banners.length || dismissed) return null;
  const banner = banners[index];
  const popupKey = `nexus_popup_dismissed_${banners.map((item) => item.id).join("_")}`;
  const dismiss = () => { localStorage.setItem(popupKey, "true"); setDismissed(true); };

  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
    <div className="relative w-full max-w-md rounded-3xl border border-amber-400/40 bg-[#171522] shadow-[0_25px_80px_rgba(0,0,0,0.7)] p-6 sm:p-8">
      <button onClick={dismiss} className="absolute right-4 top-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10" aria-label="Close popup"><X className="w-5 h-5" /></button>
      <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center"><AlertTriangle className="w-7 h-7 text-amber-300" /></div>
      <p className="mt-5 text-center text-[10px] uppercase tracking-[0.25em] text-amber-300 font-bold">Alert</p>
      <h2 className="mt-2 text-center text-2xl font-black text-white">{banner.title}</h2>
      <p className="mt-3 text-center text-sm leading-relaxed text-gray-300">{banner.message}</p>
      <button onClick={() => { dismiss(); navigate(banner.buttonLink); }} className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 py-3 text-sm font-bold text-white">{banner.buttonText}<ArrowRight className="w-4 h-4" /></button>
      {banners.length > 1 && <div className="mt-5 flex items-center justify-between"><button onClick={() => setIndex((current) => (current - 1 + banners.length) % banners.length)} className="p-2 text-gray-400 hover:text-white" aria-label="Previous popup"><ChevronLeft className="w-5 h-5" /></button><span className="text-xs text-gray-500">{index + 1} / {banners.length}</span><button onClick={() => setIndex((current) => (current + 1) % banners.length)} className="p-2 text-gray-400 hover:text-white" aria-label="Next popup"><ChevronRight className="w-5 h-5" /></button></div>}
    </div>
  </div>;
}
