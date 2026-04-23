const STORAGE_KEY = "vr-explorer:gmaps-key";
const PUBLIC_FALLBACK_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || null;

export function getGoogleMapsKey(): string | null {
  if (typeof window === "undefined") return PUBLIC_FALLBACK_KEY;
  const storedKey = localStorage.getItem(STORAGE_KEY)?.trim();
  return storedKey || PUBLIC_FALLBACK_KEY;
}

export function setGoogleMapsKey(key: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, key.trim());
}

export function clearGoogleMapsKey() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}