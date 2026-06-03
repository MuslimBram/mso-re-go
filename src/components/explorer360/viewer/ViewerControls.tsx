import { useEffect, useState } from "react";
import { Maximize2, Minimize2, Share2, Heart, Link as LinkIcon, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  sceneId: string;
  sceneName: string;
  lat?: number | null;
  lng?: number | null;
  thumbnailUrl?: string | null;
  currentYaw: number;
  currentPitch: number;
}

/**
 * Top-right action stack: fullscreen, share, copy gmaps link, favorite.
 * Keyboard shortcuts: F=fullscreen, S=share.
 */
export function ViewerControls({
  sceneId,
  sceneName,
  lat,
  lng,
  thumbnailUrl,
  currentYaw,
  currentPitch,
}: Props) {
  const [isFull, setIsFull] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  // Track fullscreen state
  useEffect(() => {
    const handler = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Check if scene is in favorites (silent if not logged in)
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("pano_id", sceneId)
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (active) setIsFav(!!data);
    })();
    return () => {
      active = false;
    };
  }, [sceneId]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      toast.error("Fullscreen-i nuk u mbështet nga shfletuesi.");
    }
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: sceneName, text: sceneName, url: shareUrl });
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Linku u kopjua.");
    } catch {
      toast.error("Nuk u kopjua linku.");
    }
  };

  const copyMapsLink = async () => {
    if (lat == null || lng == null) {
      toast.error("Skena nuk ka koordinata GPS.");
      return;
    }
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Linku i Google Maps u kopjua.");
    } catch {
      toast.error("Nuk u kopjua.");
    }
  };

  const openMaps = () => {
    if (lat == null || lng == null) return;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank", "noreferrer");
  };

  const toggleFavorite = async () => {
    setFavBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      toast.error("Hyr për të ruajtur skena në favorites.");
      setFavBusy(false);
      return;
    }
    if (isFav) {
      await supabase
        .from("favorites")
        .delete()
        .eq("pano_id", sceneId)
        .eq("user_id", u.user.id);
      setIsFav(false);
      toast.success("U hoq nga favorites.");
    } else {
      if (lat == null || lng == null) {
        toast.error("Skena nuk ka koordinata, s'mund ta ruajmë.");
        setFavBusy(false);
        return;
      }
      const { error } = await supabase.from("favorites").insert({
        user_id: u.user.id,
        pano_id: sceneId,
        name: sceneName,
        lat,
        lng,
        heading: (currentYaw * 180) / Math.PI,
        pitch: (currentPitch * 180) / Math.PI,
        thumbnail_url: thumbnailUrl ?? null,
      });
      if (error) {
        toast.error("Nuk u ruajt: " + error.message);
      } else {
        setIsFav(true);
        toast.success("U shtua te favorites.");
      }
    }
    setFavBusy(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      else if (e.key === "s" || e.key === "S") share();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareUrl, sceneName]);

  const btn =
    "h-10 w-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors";

  return (
    <div className="fixed right-4 top-40 z-30 flex flex-col gap-2">
      <button onClick={toggleFullscreen} className={btn} title="Fullscreen (F)">
        {isFull ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
      <button onClick={share} className={btn} title="Share (S)">
        <Share2 className="h-4 w-4" />
      </button>
      <button
        onClick={toggleFavorite}
        disabled={favBusy}
        className={btn}
        title={isFav ? "Hiq nga favorites" : "Shto te favorites"}
      >
        <Heart className={`h-4 w-4 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
      </button>
      {lat != null && lng != null && (
        <>
          <button onClick={copyMapsLink} className={btn} title="Kopjo linkun Google Maps">
            <LinkIcon className="h-4 w-4" />
          </button>
          <button onClick={openMaps} className={btn} title="Hap në Google Maps">
            <ExternalLink className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}