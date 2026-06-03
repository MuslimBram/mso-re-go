# Plan — 360° Explorer: Faza E (Viewer + Menu + VR + Hotspots + AI Guide)

Po e ndajmë në **5 sub-faza** të dorëzueshme veçmas. Pas çdo sub-faze ti teston dhe pastaj kalojmë te tjetra.

---

## Sub-faza E1 — Viewer i avancuar (PRIORITET 1)

Zgjeron `PanoramaViewer.tsx` ekzistues. Pa ndryshime DB.

**Veçoritë e reja:**
- **Compass** lart-djathtas që rrotullohet sipas yaw aktual (N/S/E/W me shenjën e veriut të vërtetë, llogaritet nga `initial_yaw` + heading aktual).
- **Mini-map** poshtë-majtas: harta Google e vogël me pin-in e skenës aktuale + skena fqinje (klikohen për të kaluar).
- **Fullscreen toggle** (Fullscreen API native).
- **Favorites button** — ruan skenën te tabela ekzistuese `favorites` (pano_id = scene.id, lat/lng/heading).
- **Share Location** — Web Share API + fallback "Copy link".
- **Copy Google Maps Link** — `https://www.google.com/maps?q={lat},{lng}`.
- **GPS Coordinates badge** — shfaq lat/lng me precizion 5 dhjetorë + buton kopjimi.
- **Përmirësime UX**: tastet `F` (fullscreen), `S` (share), `M` (toggle minimap).

---

## Sub-faza E2 — Floating Menu (Desktop) / Bottom Sheet (Mobile)

Komponent i ri `ExplorerMenu.tsx` — overlay mbi viewer dhe mbi hartën kryesore.

**Veprimet (8 butona):**
- Map → kalon te pamja `/explorer-360` (lista + harta).
- 360° → hap viewer-in panoramik për skenën aktuale.
- VR → aktivizon VR mode (sub-faza E3).
- Favorites → drawer me skenat e ruajtura.
- Attractions → drawer me atraksionet pranë (sub-faza E2b).
- Businesses → drawer me bizneset pranë (sub-faza E2b).
- Routes → drawer me itinerare (sub-faza E2b).
- Search → input me autocomplete (skenat + Google Places).
- AI Guide → hap panelin AI (sub-faza E5).

**Layout:**
- Desktop: floating panel djathtas, ikona vertikale, hapet me hover/click.
- Mobile: bottom sheet (`Sheet` nga shadcn) që ngrihet nga poshtë.

### Sub-faza E2b — të dhënat për Attractions/Businesses/Routes

Strategjia hibrid (sipas zgjedhjes tënde):

**Tabela të reja:**
- `tour_pois` — atraksione & biznese të kuruara nga admini (override).
  - kolona: `id`, `tour_id` ose `scene_id`, `type` (`attraction` | `business` | `religious`), `name`, `description`, `lat`, `lng`, `photo_url`, `external_url`, `phone`, `created_by`.
- `tour_routes` — itinerare midis skenave.
  - kolona: `id`, `tour_id`, `name`, `description`, `scene_order` (jsonb me array uuid-sh).

**Automatik:**
- Server-fn `getNearbyPois(lat, lng, type)` thërret Google Places (New) `searchNearby` përmes connector-it Google Maps ekzistues. Cache 24h në memorie.
- Në UI: bashkohen rezultatet (override admin sipër + auto poshtë me badge "Google").

---

## Sub-faza E3 — Sphere / VR / WebXR

Zgjeron `PanoramaViewer.tsx`. Kërkon paketa të reja: `three`, `@types/three`.

**3 mode që ndërrohen me një toggle:**
- **Panorama** (default, Marzipano siç është tani).
- **Sphere** — three.js `SphereGeometry` me texture equirectangular dhe orbit controls.
- **VR** — three.js + WebXR (`renderer.xr.enabled = true` + `VRButton`).
  - Quest / Vision Pro: WebXR i plotë (immersive-vr).
  - Telefon pa WebXR: fallback Cardboard split-screen (StereoEffect).
- **Gyroscope** — `DeviceOrientationEvent` për rrotullim me kokë në mobile.

**Note:** Marzipano nuk mbështet WebXR — prandaj three.js paralel për sphere/VR. Të dy renderuesit ndajnë të njëjtin URL panorame dhe heading.

---

## Sub-faza E4 — Hotspots të zgjeruar + Scene Navigation

**Tipet e hotspot-eve** (extend `tour_hotspots.type`):
- `info` (ekziston) — modal me tekst.
- `audio` — luan audio file (i ngarkuar te `tour-media`).
- `video` — luan video inline.
- `image` — galeri foto.
- `product` — kartë produkti (link + foto + çmim).
- `external` — hap URL të jashtëm.
- `business` — kartë biznesi (lidhet me `tour_pois`).

**Skema:**
- `tour_hotspots` ka tashmë `title`, `body`, `media_url`, `link_url`, `target_scene_id`. Mjafton.
- Shtohet `metadata jsonb` për fusha të personalizuara (çmim, telefon, etj.).

**Scene Navigation Hotspots (Next/Prev/Auto Align):**
- Komponent `SceneNavArrows.tsx` — shigjeta floating mbi viewer.
- **Next/Previous Scene** — sipas `order_index`.
- **Distance** — llogaritet nga lat/lng me Haversine.
- **Direction** — bearing midis dy skenave → shigjeta drejtohet drejt dest.
- **Auto Align** — kur kalon në skenë të re, yaw fillestar përputhet me drejtimin nga skena e mëparshme (smooth transition).

---

## Sub-faza E5 — AI Guide per-scene

**Skema:** shton në `tour_scenes`:
- `ai_context text` — kontekst manual i admin-it (histori, info biznesi, info fetar).
- `ai_topics text[]` — tag-e (`history`, `tourism`, `business`, `religious`) për të orientuar AI-në.

**Flow sipas zgjedhjes sate:**
1. Admin shkruan info-n bazë (opsionale) në panelin e skenës.
2. Server-fn `enrichSceneAi(sceneId)` (createServerFn) bën:
   - Merr `ai_context`, `name`, `lat`, `lng` nga skena.
   - Bën `web_search` (Lovable AI tool calling me Gemini) për info shtesë nga interneti.
   - Kthen tekst i sintetizuar + burime.
3. Cache result në `tour_scenes.ai_cache jsonb` + `ai_cache_updated_at` (rifreskohet automatikisht çdo 7 ditë ose kur ndryshon `ai_context`).
4. UI: panel AI Guide në viewer me streaming chat (`useChat` + `/api/chat`) ku përdoruesi mund të pyesë vazhdimisht, me kontekstin e skenës injektuar në system prompt.

**AI Settings (drawer për përdoruesin):**
- Gjuha (Shqip / English / Italiano).
- Toni (Formal / Miqësor / Akademik).
- Auto-play voice (Web Speech API TTS).
- Vetëm tema specifike (history / business / religious).

---

## Detaje teknike (tabela & paketa të reja)

**Migrime SQL:**
```sql
-- E2b
CREATE TABLE public.tour_pois (...);
GRANT ... + RLS;
CREATE TABLE public.tour_routes (...);
GRANT ... + RLS;

-- E4
ALTER TABLE public.tour_hotspots ADD COLUMN metadata jsonb;

-- E5
ALTER TABLE public.tour_scenes
  ADD COLUMN ai_context text,
  ADD COLUMN ai_topics text[] DEFAULT '{}',
  ADD COLUMN ai_cache jsonb,
  ADD COLUMN ai_cache_updated_at timestamptz;
```

**Paketa npm:**
- `three`, `@types/three` (sphere + WebXR)

**Connector-a:**
- Google Maps Platform — ekziston, përdoret për Places (New) `searchNearby` (Attractions/Businesses) dhe MiniMap.
- Lovable AI Gateway — ekziston (`LOVABLE_API_KEY`), përdoret për AI Guide + web search tool.

**Skedarë të rinj kryesorë:**
- `src/components/explorer360/viewer/CompassOverlay.tsx`
- `src/components/explorer360/viewer/MiniMapOverlay.tsx`
- `src/components/explorer360/viewer/GpsBadge.tsx`
- `src/components/explorer360/viewer/SceneNavArrows.tsx`
- `src/components/explorer360/ExplorerMenu.tsx` (+ DesktopFloating / MobileSheet)
- `src/components/explorer360/panels/{Favorites,Attractions,Businesses,Routes,Search,AiGuidePanel}.tsx`
- `src/components/explorer360/viewer/SphereViewer.tsx` (three.js)
- `src/components/explorer360/viewer/VrViewer.tsx` (WebXR)
- `src/components/explorer360/HotspotRenderer.tsx` (rendering polimorfik sipas tipit)
- `src/lib/pois.functions.ts`, `src/lib/scene-ai.functions.ts`
- `src/routes/api/chat.ts` (për AI Guide streaming)

---

## Radha e ekzekutimit (çfarë do bëj fillimisht)

Sipas prioritetit tënd:

1. **E1 — Viewer i avancuar** *(pa DB, ndryshim vetëm i viewer-it; ~1 dorëzim)*
2. **E2 + E2b — Menu + Drawer-ët + tabelat POI/Routes**
3. **E3 — Sphere / WebXR**
4. **E4 — Hotspots polimorfik + Scene Nav arrows**
5. **E5 — AI Guide per-scene me web search**

Pas miratimit, fillojmë me **Sub-fazën E1**.