import { useEffect, useRef } from "react";

interface Props {
  lat: number;
  lng: number;
  heading: number;
  onClick: (lat: number, lng: number) => void;
}

export function MiniMap({ lat, lng, heading, onClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new google.maps.Map(containerRef.current, {
      center: { lat, lng },
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1a1f2e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a1f2e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8b95a8" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a3142" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1421" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
      ],
    });

    const svLayer = new google.maps.StreetViewCoverageLayer();
    svLayer.setMap(map);

    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) onClick(e.latLng.lat(), e.latLng.lng());
    });

    mapRef.current = map;
  }, [lat, lng, onClick]);

  useEffect(() => {
    if (!mapRef.current) return;
    const pos = { lat, lng };
    mapRef.current.panTo(pos);
    const iconSymbol: google.maps.Symbol = {
      path: "M 0,-8 L 6,6 L 0,3 L -6,6 Z",
      fillColor: "#3b82f6",
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
      scale: 1.2,
      rotation: heading,
    };
    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        position: pos,
        map: mapRef.current,
        icon: iconSymbol,
      });
    } else {
      markerRef.current.setPosition(pos);
      markerRef.current.setIcon(iconSymbol);
    }
  }, [lat, lng, heading]);

  return (
    <div className="rounded-xl overflow-hidden glass-panel hud-glow">
      <div ref={containerRef} className="w-64 h-48" />
    </div>
  );
}