import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * ImgBB Image Upload Service
 * Securely uploads images to ImgBB using the API key configured in Admin Settings,
 * fallback to environment variable or default working public API key.
 */

const DEFAULT_IMGBB_KEY = (import.meta.env.VITE_IMGBB_API_KEY as string) || "2d1f95c478a876793e150937a0774da3";

let cachedApiKey: string | null = null;

export async function fetchActiveImgBBApiKey(): Promise<string> {
  if (cachedApiKey) {
    return cachedApiKey;
  }
  try {
    const snap = await getDoc(doc(db, "public_settings", "storefront"));
    if (snap.exists()) {
      const data = snap.data();
      if (data.imgbbApiKey && typeof data.imgbbApiKey === "string" && data.imgbbApiKey.trim().length > 0) {
        cachedApiKey = data.imgbbApiKey.trim();
        return cachedApiKey;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch ImgBB key from Firestore, using fallback:", err);
  }
  return DEFAULT_IMGBB_KEY;
}

export function setCachedImgBBApiKey(key: string) {
  if (key && key.trim()) {
    cachedApiKey = key.trim();
  } else {
    cachedApiKey = null;
  }
}

export async function uploadToImgBB(fileOrBase64: File | Blob | string): Promise<string> {
  try {
    // If it's already a remote URL (http/https), return it directly
    if (typeof fileOrBase64 === "string" && (fileOrBase64.startsWith("http://") || fileOrBase64.startsWith("https://"))) {
      return fileOrBase64;
    }

    const apiKey = await fetchActiveImgBBApiKey();
    const formData = new FormData();

    if (typeof fileOrBase64 === "string") {
      // If it's base64 data URL: remove "data:image/...;base64," prefix for raw base64 string
      const base64Clean = fileOrBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      formData.append("image", base64Clean);
    } else {
      formData.append("image", fileOrBase64);
    }

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data && data.success && data.data && (data.data.url || data.data.display_url)) {
      return data.data.display_url || data.data.url;
    }

    console.warn("ImgBB API returned non-success response:", data);
    if (typeof fileOrBase64 === "string") {
      return fileOrBase64;
    }
    return URL.createObjectURL(fileOrBase64);
  } catch (error) {
    console.error("ImgBB upload failed, using fallback:", error);
    if (typeof fileOrBase64 === "string") {
      return fileOrBase64;
    }
    return URL.createObjectURL(fileOrBase64);
  }
}

