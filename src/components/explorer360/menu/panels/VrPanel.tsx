import { Button } from "@/components/ui/button";
import { Glasses } from "lucide-react";

export function VrPanel({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="space-y-3 text-center py-6">
      <Glasses className="h-12 w-12 mx-auto text-primary" />
      <h4 className="font-semibold">Hyr në VR</h4>
      <p className="text-xs text-muted-foreground">
        Stereo split-screen për Google Cardboard. WebXR i plotë për Quest/Vision Pro vjen në fazën E3.
      </p>
      <Button onClick={onEnter} className="w-full"><Glasses className="h-4 w-4 mr-1" /> Aktivizo VR</Button>
    </div>
  );
}