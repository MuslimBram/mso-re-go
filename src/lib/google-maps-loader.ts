/// <reference types="google.maps" />
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

let currentKey: string | null = null;
let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (currentKey === apiKey && loadPromise) {
    return loadPromise;
  }
  currentKey = apiKey;
  loadPromise = new Promise<void>((resolve, reject) => {
    const previousAuthFailure = typeof window !== "undefined" ? window.gm_authFailure : undefined;

    const restoreAuthFailure = () => {
      if (typeof window !== "undefined") {
        window.gm_authFailure = previousAuthFailure;
      }
    };

    if (typeof window !== "undefined") {
      window.gm_authFailure = () => {
        restoreAuthFailure();
        currentKey = null;
        loadPromise = null;
        reject(new Error("Google Maps API key është i pasaktë ose i pakonfiguruar."));
      };
    }

    setOptions({ key: apiKey, v: "weekly" });
    Promise.all([
      importLibrary("maps"),
      importLibrary("streetView"),
      importLibrary("places"),
      importLibrary("marker"),
    ])
      .then(() => {
        restoreAuthFailure();
        resolve();
      })
      .catch((error) => {
        restoreAuthFailure();
        currentKey = null;
        loadPromise = null;
        reject(error);
      });
  });
  return loadPromise;
}