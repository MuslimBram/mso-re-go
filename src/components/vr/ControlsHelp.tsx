import { useState } from "react";
import { Keyboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ControlsHelp() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-11 w-11 glass-panel"
        title="Kontrollet"
      >
        <Keyboard className="h-5 w-5" />
      </Button>
    );
  }

  const Key = ({ children }: { children: React.ReactNode }) => (
    <kbd className="px-2 py-1 rounded-md bg-foreground/10 border border-foreground/20 font-mono text-xs">
      {children}
    </kbd>
  );

  return (
    <div className="p-4 rounded-xl glass-panel hud-glow w-72 text-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Kontrollet</h3>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="space-y-2 text-muted-foreground">
        <li className="flex items-center justify-between"><span>Ec përpara/prapa</span><span><Key>W</Key> <Key>S</Key></span></li>
        <li className="flex items-center justify-between"><span>Rrotullo majtas/djathtas</span><span><Key>A</Key> <Key>D</Key></span></li>
        <li className="flex items-center justify-between"><span>Lart / poshtë</span><span><Key>R</Key> <Key>F</Key></span></li>
        <li className="flex items-center justify-between"><span>Zoom +/-</span><span><Key>+</Key> <Key>-</Key></span></li>
        <li className="flex items-center justify-between"><span>Maus</span><span>Zvarrit për 360°</span></li>
      </ul>
    </div>
  );
}