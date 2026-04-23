/// <reference types="google.maps" />
import { Loader } from "@googlemaps/js-api-loader";

let loaderInstance: Loader | null = null;
let currentKey: string | null = null;
let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (loaderInstance && currentKey === apiKey && loadPromise) {
    return loadPromise;
  }
  currentKey = apiKey;
  loaderInstance = new Loader({
    apiKey,
    version: "weekly",
    libraries: ["places", "streetView", "maps", "marker"],
  });
  loadPromise = (async () => {
    await Promise.all([
      loaderInstance!.importLibrary("maps"),
      loaderInstance!.importLibrary("streetView"),
      loaderInstance!.importLibrary("places"),
      loaderInstance!.importLibrary("marker"),
    ]);
  })();
  return loadPromise;
}