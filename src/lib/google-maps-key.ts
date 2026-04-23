const STORAGE_KEY = "vr-explorer:gmaps-key";

export function getGoogleMapsKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setGoogleMapsKey(key: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, key.trim());
}

export function clearGoogleMapsKey() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}