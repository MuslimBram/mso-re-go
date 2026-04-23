/// <reference types="google.maps" />
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

let currentKey: string | null = null;
let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (currentKey === apiKey && loadPromise) {
    return loadPromise;
  }
  currentKey = apiKey;
  setOptions({ key: apiKey, v: "weekly" });
  loadPromise = (async () => {
    await Promise.all([
      importLibrary("maps"),
      importLibrary("streetView"),
      importLibrary("places"),
      importLibrary("marker"),
    ]);
  })();
  return loadPromise;
}