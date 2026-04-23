import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { X, Headphones } from "lucide-react";
import { toast } from "sonner";

interface Props {
  panorama: google.maps.StreetViewPanorama;
  apiKey: string;
  onExit: () => void;
}

/**
 * Renders the current Street View panorama as a side-by-side stereo view (VR cardboard style).
 * Each eye renders the FULL spherical scene with a small parallax offset for 3D depth.
 * Supports WebXR for real headsets, and auto-fullscreens for immersive viewing.
 */
export function VRStereoView({ panorama, apiKey, onExit }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [xrSupported, setXrSupported] = useState<boolean | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const nav = navigator as Navigator & { xr?: { isSessionSupported(mode: string): Promise<boolean> } };
    if (nav.xr) {
      nav.xr.isSessionSupported("immersive-vr").then(setXrSupported).catch(() => setXrSupported(false));
    } else {
      setXrSupported(false);
    }
  }, []);

  // Auto-enter fullscreen on mount
  useEffect(() => {
    const enterFs = async () => {
      try {
        if (containerRef.current && !document.fullscreenElement) {
          await containerRef.current.requestFullscreen();
        }
      } catch {
        // user may block fullscreen — ignore silently
      }
    };
    enterFs();
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;

    const scene = new THREE.Scene();

    // Sphere with panorama texture (inverted to view from inside)
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Two perspective cameras (one per eye) with small horizontal offset for parallax
    const EYE_SEPARATION = 0.15; // small parallax for depth perception
    const leftCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1100);
    const rightCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1100);
    leftCamera.position.set(-EYE_SEPARATION, 0, 0);
    rightCamera.position.set(EYE_SEPARATION, 0, 0);

    // Single camera used only for WebXR mode (XR manages stereo automatically)
    const xrCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1100);
    xrCamera.position.set(0, 0, 0.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.xr.enabled = true;
    renderer.autoClear = false;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    let currentPanoId: string | null = null;
    let panoHeading = 0;

    const loadPanoTexture = (panoId: string) => {
      if (panoId === currentPanoId) return;
      currentPanoId = panoId;
      const url = `https://maps.googleapis.com/maps/api/streetview?size=2048x1024&pano=${encodeURIComponent(
        panoId
      )}&fov=120&heading=0&pitch=0&key=${encodeURIComponent(apiKey)}`;
      const loader = new THREE.TextureLoader();
      loader.crossOrigin = "anonymous";
      loader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.wrapS = THREE.RepeatWrapping;
          (sphere.material as THREE.MeshBasicMaterial).map = tex;
          (sphere.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);
          (sphere.material as THREE.MeshBasicMaterial).needsUpdate = true;
        },
        undefined,
        () => {
          // failed silently
        }
      );
    };

    const syncFromPanorama = () => {
      const id = panorama.getPano();
      if (id) loadPanoTexture(id);
      const pov = panorama.getPov();
      panoHeading = THREE.MathUtils.degToRad(pov.heading || 0);
      // rotate sphere so user sees the same heading as the Street View
      sphere.rotation.y = -panoHeading;
    };

    syncFromPanorama();
    const posListener = panorama.addListener("position_changed", syncFromPanorama);
    const povListener = panorama.addListener("pov_changed", syncFromPanorama);

    // Mouse drag rotation (acts like rotating the head)
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let yaw = 0;
    let pitch = 0;
    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      yaw -= (e.clientX - lastX) * 0.005;
      pitch -= (e.clientY - lastY) * 0.005;
      pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch));
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerUp = () => { isDragging = false; };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      // Each eye gets half the width
      const eyeAspect = (w / 2) / h;
      leftCamera.aspect = eyeAspect;
      leftCamera.updateProjectionMatrix();
      rightCamera.aspect = eyeAspect;
      rightCamera.updateProjectionMatrix();
      xrCamera.aspect = w / h;
      xrCamera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    onResize();

    const animate = () => {
      if (renderer.xr.isPresenting) {
        // WebXR handles its own stereo rendering and head tracking
        renderer.clear();
        renderer.render(scene, xrCamera);
        return;
      }

      // Apply user "head rotation" to both eye cameras
      leftCamera.rotation.order = "YXZ";
      rightCamera.rotation.order = "YXZ";
      leftCamera.rotation.y = yaw;
      leftCamera.rotation.x = pitch;
      rightCamera.rotation.y = yaw;
      rightCamera.rotation.x = pitch;

      const w = mount.clientWidth;
      const h = mount.clientHeight;
      const halfW = Math.floor(w / 2);

      renderer.setScissorTest(true);
      // Left eye — left half of screen
      renderer.setViewport(0, 0, halfW, h);
      renderer.setScissor(0, 0, halfW, h);
      renderer.clear();
      renderer.render(scene, leftCamera);
      // Right eye — right half of screen
      renderer.setViewport(halfW, 0, w - halfW, h);
      renderer.setScissor(halfW, 0, w - halfW, h);
      renderer.clear();
      renderer.render(scene, rightCamera);
      renderer.setScissorTest(false);
    };
    renderer.setAnimationLoop(animate);

    return () => {
      google.maps.event.removeListener(posListener);
      google.maps.event.removeListener(povListener);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", onResize);
      renderer.setAnimationLoop(null);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [panorama, apiKey]);

  const enterXR = async () => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const nav = navigator as Navigator & {
      xr?: { requestSession(mode: string, opts?: object): Promise<XRSession> };
    };
    if (!nav.xr) {
      toast.error("WebXR nuk mbështetet në këtë browser");
      return;
    }
    try {
      const session = await nav.xr.requestSession("immersive-vr", { optionalFeatures: ["local-floor"] });
      await renderer.xr.setSession(session as XRSession);
      toast.success("VR Mode aktiv!");
    } catch (e) {
      toast.error("Nuk u arrit të hapej VR session: " + (e as Error).message);
    }
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-black">
      <div ref={mountRef} className="absolute inset-0" />

      {/* Vertical divider line between the two eyes */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-black/60 pointer-events-none" />

      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="px-4 py-2 rounded-lg glass-panel flex items-center gap-2 pointer-events-auto">
          <Headphones className="h-4 w-4" />
          <span className="text-sm font-medium">VR Headset Mode</span>
        </div>
        <div className="flex gap-2 pointer-events-auto">
          {xrSupported && (
            <Button onClick={enterXR} size="sm">Hyr në Headset</Button>
          )}
          <Button onClick={onExit} variant="secondary" size="sm">
            <X className="h-4 w-4 mr-1" /> Dil
          </Button>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg glass-panel text-xs text-center max-w-md pointer-events-none">
        {xrSupported === false && (
          <p className="text-muted-foreground">
            Tërhiq me mausin për të rrotulluar pamjen. Vendose telefonin në syze VR (Cardboard/Google VR) ose përdor headset për përvojë të plotë.
          </p>
        )}
        {xrSupported && <p className="text-muted-foreground">Shtyp "Hyr në Headset" për WebXR</p>}
      </div>
    </div>
  );
}
