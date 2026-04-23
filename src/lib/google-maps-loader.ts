import { Loader } from "@googlemaps/js-api-loader";

let loaderInstance: Loader | null = null;
let currentKey: string | null = null;
let loadPromise: Promise<typeof google> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<typeof google> {
  if (loaderInstance && currentKey === apiKey && loadPromise) {
    return loadPromise;
  }
  currentKey = apiKey;
  loaderInstance = new Loader({
    apiKey,
    version: "weekly",
    libraries: ["places", "streetView"],
  });
  loadPromise = loaderInstance.load();
  return loadPromise;
}