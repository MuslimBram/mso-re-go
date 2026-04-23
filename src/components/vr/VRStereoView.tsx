import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { X, Headphones, Compass } from "lucide-react";
import { toast } from "sonner";

interface Props {
  panorama: google.maps.StreetViewPanorama;
  apiKey: string;
  onExit: () => void;
}

/**
 * Renders the current Street View panorama as a split 180°+180° stereo view
 * (front pane = current heading, back pane = opposite). Supports WebXR for headsets.
 */
export function VRStereoView({ panorama, apiKey, onExit }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    // Single camera used only for WebXR mode (XR manages stereo automatically)
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1100);
    camera.position.set(0, 0, 0.1);

    // Non-WebXR mode uses two exact 180° panes from the equirectangular panorama:
    // left = current heading, right = current heading + 180°.
    const splitScene = new THREE.Scene();
    const splitCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const splitGeometry = new THREE.PlaneGeometry(1, 2);
    const splitVertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;
    const splitFragmentShader = `
      uniform sampler2D uTexture;
      uniform float uHeading;
      uniform float uPitch;
      uniform float uOffset;
      varying vec2 vUv;
      const float PI = 3.141592653589793;

      void main() {
        float heading = uHeading + uOffset + ((vUv.x - 0.5) * PI);
        float latitude = clamp(uPitch + ((0.5 - vUv.y) * PI), -1.560796, 1.560796);
        float u = fract(heading / (2.0 * PI));
        if (u < 0.0) u += 1.0;
        float v = 0.5 - (latitude / PI);
        gl_FragColor = texture2D(uTexture, vec2(u, v));
      }
    `;
    const frontMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uHeading: { value: 0 },
        uPitch: { value: 0 },
        uOffset: { value: 0 },
      },
      vertexShader: splitVertexShader,
      fragmentShader: splitFragmentShader,
    });
    const backMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uHeading: { value: 0 },
        uPitch: { value: 0 },
        uOffset: { value: Math.PI },
      },
      vertexShader: splitVertexShader,
      fragmentShader: splitFragmentShader,
    });
    const frontPane = new THREE.Mesh(splitGeometry, frontMaterial);
    frontPane.position.x = -0.5;
    const backPane = new THREE.Mesh(splitGeometry, backMaterial);
    backPane.position.x = 0.5;
    splitScene.add(frontPane, backPane);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.xr.enabled = true;
    renderer.autoClear = false;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Sphere with panorama texture
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    let currentPanoId: string | null = null;
    let panoHeading = 0;
    let panoPitch = 0;

    const loadPanoTexture = (panoId: string) => {
      if (panoId === currentPanoId) return;
      currentPanoId = panoId;
      // Use Street View Image API to fetch a panorama tile
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
          frontMaterial.uniforms.uTexture.value = tex;
          backMaterial.uniforms.uTexture.value = tex;
        },
        undefined,
        () => {
          // failed
        }
      );
    };

    const syncFromPanorama = () => {
      const id = panorama.getPano();
      if (id) loadPanoTexture(id);
      const pov = panorama.getPov();
      panoHeading = THREE.MathUtils.degToRad(pov.heading || 0);
      panoPitch = THREE.MathUtils.degToRad(pov.pitch || 0);
      // rotate sphere so user sees same heading as the Street View
      sphere.rotation.y = -panoHeading;
    };

    syncFromPanorama();
    const posListener = panorama.addListener("position_changed", syncFromPanorama);
    const povListener = panorama.addListener("pov_changed", syncFromPanorama);

    // Mouse drag rotation
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
      pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
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
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    onResize();

    const animate = () => {
      if (isVrMode && renderer.xr.isPresenting) {
        // WebXR handles its own stereo rendering
        renderer.clear();
        renderer.render(scene, camera);
        return;
      }
      // Sphere mode: fixed cardinal orientation (independent of current heading)
      // Front pane = North (or East), Back pane = South (or West) via uOffset = PI
      frontMaterial.uniforms.uHeading.value = frontHeading + yaw;
      frontMaterial.uniforms.uPitch.value = pitch;
      backMaterial.uniforms.uHeading.value = frontHeading + yaw;
      backMaterial.uniforms.uPitch.value = pitch;
      renderer.clear();
      renderer.render(splitScene, splitCamera);
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
  }, [panorama, apiKey, isVrMode, frontHeading]);

  const enterXR = async () => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    if (!isVrMode) return;
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
    <div className="fixed inset-0 z-50 bg-black">
      <div ref={mountRef} className="absolute inset-0" />

      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="px-4 py-2 rounded-lg glass-panel flex items-center gap-2 pointer-events-auto">
          {isVrMode ? <Headphones className="h-4 w-4" /> : <Compass className="h-4 w-4" />}
          <span className="text-sm font-medium">
            {isVrMode ? "VR Mode" : `Sphere ${isNS ? "Veri + Jug" : "Lindje + Perëndim"}`}
          </span>
        </div>
        <div className="flex gap-2 pointer-events-auto">
          {isVrMode && xrSupported && (
            <Button onClick={enterXR} size="sm">Hyr në Headset</Button>
          )}
          <Button onClick={onExit} variant="secondary" size="sm">
            <X className="h-4 w-4 mr-1" /> Dil
          </Button>
        </div>
      </div>

      {!isVrMode && (
        <>
          <div className="absolute top-1/2 left-4 -translate-y-1/2 px-3 py-1.5 rounded-lg glass-panel text-xs font-semibold pointer-events-none">
            ← {leftLabel}
          </div>
          <div className="absolute top-1/2 right-4 -translate-y-1/2 px-3 py-1.5 rounded-lg glass-panel text-xs font-semibold pointer-events-none">
            {rightLabel} →
          </div>
        </>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg glass-panel text-xs text-center max-w-md">
        {!isVrMode && (
          <p className="text-muted-foreground">
            {isNS
              ? "Majtas sheh 180° drejt Veriut, djathtas 180° drejt Jugut — bashkë bëjnë 360°."
              : "Majtas sheh 180° drejt Lindjes, djathtas 180° drejt Perëndimit — bashkë bëjnë 360°."}
          </p>
        )}
        {isVrMode && xrSupported === false && (
          <p className="text-muted-foreground">
            WebXR nuk u zbulua. Përdor mausin për të lëvizur. Për headset të vërtetë, hape në një browser që mbështet WebXR (Quest Browser, Chrome me HTTPS).
          </p>
        )}
        {isVrMode && xrSupported && <p className="text-muted-foreground">Vendos kufjet dhe shtyp "Hyr në Headset"</p>}
      </div>
    </div>
  );
}