import { useState } from "react";
import { Globe2, Map, Glasses, Box, Store, Package, Route as RouteIcon, Calendar, Sparkles, Search, X, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";

const items = [
  { icon: Map, label: "Map", to: "/explorer-360", color: "from-sky-500 to-blue-600" },
  { icon: Globe2, label: "360°", to: "/explorer-360", color: "from-emerald-500 to-teal-600" },
  { icon: Glasses, label: "VR", to: "/explorer-360", color: "from-violet-500 to-fuchsia-600" },
  { icon: Box, label: "3D", to: "/explorer-360/showcase", color: "from-amber-500 to-orange-600" },
  { icon: Store, label: "Biznese", to: "/", color: "from-pink-500 to-rose-600" },
  { icon: Package, label: "Produkte", to: "/explorer-360/showcase", color: "from-indigo-500 to-blue-600" },
  { icon: RouteIcon, label: "Rrugë", to: "/", color: "from-cyan-500 to-sky-600" },
  { icon: Calendar, label: "Evente", to: "/", color: "from-red-500 to-orange-600" },
  { icon: Sparkles, label: "AI Guide", to: "/explorer-360", color: "from-yellow-500 to-amber-600" },
  { icon: Search, label: "Kërko", to: "/explorer-360", color: "from-slate-500 to-slate-700" },
  { icon: Settings, label: "Admin", to: "/explorer-360/admin", color: "from-zinc-600 to-zinc-800" },
];

export function ExploreFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Explore options"
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>

      {open && (
        <>
          {/* Desktop popover */}
          <div className="hidden sm:grid fixed bottom-24 right-6 z-40 grid-cols-2 gap-3 p-4 rounded-2xl bg-background/85 backdrop-blur-xl border shadow-2xl animate-in fade-in slide-in-from-bottom-4 w-[320px]">
            {items.map((it) => (
              <Link
                key={it.label}
                to={it.to}
                onClick={() => setOpen(false)}
                className={`group flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-br ${it.color} text-white shadow-lg hover:scale-105 transition-transform`}
              >
                <it.icon className="h-6 w-6" />
                <span className="text-xs font-semibold">{it.label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile bottom sheet */}
          <div
            className="sm:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 rounded-t-3xl bg-background border-t shadow-2xl p-6 pb-10 animate-in slide-in-from-bottom">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
            <h3 className="text-lg font-bold mb-4 text-center">Explore Options</h3>
            <div className="grid grid-cols-3 gap-3">
              {items.map((it) => (
                <Link
                  key={it.label}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-br ${it.color} text-white`}
                >
                  <it.icon className="h-5 w-5" />
                  <span className="text-[11px] font-semibold">{it.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}