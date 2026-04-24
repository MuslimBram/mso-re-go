export interface StreetViewEquirectOptions {
  apiKey: string;
  panoId: string;
}

const CANVAS_WIDTH = 4096;
const CANVAS_HEIGHT = 2048;
const TILE_SIZE = 1024;
const TILE_REQUEST_SIZE = 640;

const PITCH_ROWS = [
  { pitch: 45, y: 0 },
  { pitch: 0, y: CANVAS_HEIGHT / 4 },
  { pitch: -45, y: CANVAS_HEIGHT / 2 },
] as const;

const HEADINGS = [0, 90, 180, 270] as const;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Street View tile failed to load"));
    img.src = src;
  });
}

function tileUrl(panoId: string, apiKey: string, heading: number, pitch: number) {
  return `https://maps.googleapis.com/maps/api/streetview?size=${TILE_REQUEST_SIZE}x${TILE_REQUEST_SIZE}&pano=${encodeURIComponent(
    panoId,
  )}&fov=90&heading=${heading}&pitch=${pitch}&key=${encodeURIComponent(apiKey)}`;
}

export async function buildStreetViewEquirectangular({ apiKey, panoId }: StreetViewEquirectOptions) {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tasks = HEADINGS.flatMap((heading, column) =>
    PITCH_ROWS.map(async ({ pitch, y }) => {
      const img = await loadImage(tileUrl(panoId, apiKey, heading, pitch));
      ctx.drawImage(img, column * TILE_SIZE, y, TILE_SIZE, TILE_SIZE);
    }),
  );

  await Promise.all(tasks);

  return canvas;
}