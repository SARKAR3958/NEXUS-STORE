import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

const SENTINEL_ID = "nexus-integrity-sentinel";
const SENTINEL_VALUE = "nexus-store-integrity-v1";

export function CodeTamperGuard() {
  const [isTampered, setIsTampered] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById(SENTINEL_ID);
    if (!sentinel) {
      setIsTampered(true);
      return;
    }

    const markTampered = () => setIsTampered(true);
    const observer = new MutationObserver(() => {
      const currentSentinel = document.getElementById(SENTINEL_ID);
      if (!currentSentinel || currentSentinel.getAttribute("data-integrity") !== SENTINEL_VALUE) {
        markTampered();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-integrity"] });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div id={SENTINEL_ID} data-integrity={SENTINEL_VALUE} hidden aria-hidden="true" />
      {isTampered && (
        <div className="fixed inset-0 z-[100000] bg-black flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-md rounded-2xl border border-red-600/60 bg-[#11121b] p-7 text-center shadow-[0_0_60px_rgba(220,38,38,0.3)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-950/70 border border-red-500/60">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-xl font-black text-white">Page Was Modified</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              The page code or interface was changed. Refresh the page to restore the original version.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-500"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </button>
          </div>
        </div>
      )}
    </>
  );
}