## Sub-faza E2 — Floating Menu, POI, GSV-style navigim + bug-fix skanimi

### 1. Bug-fix: badge "pa skanim" mbetet i kuq edhe pas skanimit

**Shkaku i mundshëm:** PrivacyScanner ndoshta nuk shkruan `privacy_scan` jsonb te `tour_scenes` pas përfundimit, ose admin-i nuk e ri-fetch-on listën pasi mbyllet dialog-u. Do:
- Inspektoj `PrivacyScanner.tsx` + thirrjen e tij te `explorer-360.admin.tsx`
- Sigurohem që ruhet `privacy_scan` (jsonb me `detections`, `scanned_at`, `version`) **dhe** ri-fetch-on `tour_scenes` ose përditëson optimistically state-in lokal
- `GsvPublishPanel` lexon `privacy_scan != null` për badge — verifikoj logjikën dhe e bëj real-time

### 2. DB schema — POI + Routes + AI context

Migracion i ri:
```sql
-- POI (Attractions/Businesses) — bazë automatike (Google Places) + override manual
CREATE TABLE public.tour_pois (
  id uuid PK default gen_random_uuid(),
  tour_id uuid NOT NULL,           -- lidhja me tour
  scene_id uuid,                   -- opsional: lidhur me skenë
  source text NOT NULL,            -- 'google_places' | 'manual'
  google_place_id text,            -- për dedup nga Places API
  category text NOT NULL,          -- 'attraction' | 'business' | 'religious' | 'restaurant' | …
  name text NOT NULL,
  description text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  rating double precision,
  photo_url text,
  website text,
  phone text,
  metadata jsonb default '{}',     -- opening_hours, address, etc.
  manual_override boolean default false,
  hidden boolean default false,    -- admin mund t'i fshehë POI nga Places
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  UNIQUE(tour_id, google_place_id)
);
+ GRANT-et standarde + RLS (public read for published tours, admin manage)

-- Routes (tour itineraries)
CREATE TABLE public.tour_routes (
  id uuid PK,
  tour_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  scene_order jsonb NOT NULL,      -- ["scene-uuid-1","scene-uuid-2",…]
  duration_minutes int,
  difficulty text,                 -- 'easy' | 'moderate' | 'hard'
  created_at timestamptz default now()
);
+ GRANT + RLS (public read published, admin/owner manage)

-- Hotspot metadata + AI per-scene
ALTER TABLE public.tour_hotspots ADD COLUMN metadata jsonb default '{}';
ALTER TABLE public.tour_scenes
  ADD COLUMN ai_context text,
  ADD COLUMN ai_topics text[] default '{}',
  ADD COLUMN ai_cache jsonb,
  ADD COLUMN ai_cache_updated_at timestamptz;
```

### 3. GSV-style navigim (Next/Previous me shigjeta në tokë)

Komponent i ri **`SceneNavArrows.tsx`** që renderohet brenda viewer-it si overlay:
- Llogarit për çdo skenë-fqinje (lidhur me hotspot ose distancë ≤ X meter):
  - `bearing` = atan2(Δlng, Δlat) → konvertohet në yaw relative me skenën aktuale (përdor `tour_scenes.heading` si offset)
  - `distance` (Haversine)
- Vendos shigjeta floating në fund/pjesë e poshtme e ekranit në drejtimin e duhur (rrotullohen kur kamera lëviz — overlay 3D-style)
- Klik = `navigate({ to: ".../scene/$id" })` + fade transition + **auto-align yaw** te skena e re (yaw fillestar = bearing i kundërt nga ku erdhi)
- Bonus: butona `< Previous / Next >` minimaliste për fallback linear (radha order_index) në qoshe

### 4. Floating Menu (Desktop) / Bottom Sheet (Mobile)

**`ExplorerMenu.tsx`** + sub-panele në `src/components/explorer360/menu/`:
- Desktop: floating glass card majtas (re-use `useMobile` hook)
- Mobile: shadcn `<Drawer />` (bottom sheet)
- 8 butona ikonash + label:

| Buton | Panel content |
|---|---|
| Map | `<ToursMap>` mini (re-use) me të gjitha skenat |
| 360° | List me thumbnail e skenave; klik = jump |
| VR | Buton "Enter VR" (WebXR — stub, do aktivizohet në E3) |
| Favorites | Lista e skenave të preferuara nga tabela `favorites` |
| Attractions | POI ku `category IN ('attraction','religious','park',…)` |
| Businesses | POI ku `category IN ('business','restaurant','shop',…)` |
| Routes | Lista nga `tour_routes` — klik = nis itinerary |
| Search | Input qe kerkon ne skena + POI |
| AI Guide | Re-use ekzistues `AiGuide.tsx` me kontekst skenën aktuale |

### 5. Google Places auto-populim

Server fn `src/lib/pois.functions.ts`:
- `syncPoisFromPlaces({ tourId, lat, lng, radiusM })` — admin trigger nga panel
  - Përdor connector `google_maps` → `places/v1/places:searchNearby`
  - Upsert në `tour_pois` me `source='google_places'`, respekton `manual_override=true` (nuk e mbishkruan)
- `listPois({ tourId })` për frontend
- `upsertManualPoi(...)` për override admin

UI te admin-i: tab i ri "POI" me listë + buton "Sync nga Google Places" + edit/hide.

### 6. Files plan

**Krijo:**
- `src/components/explorer360/viewer/SceneNavArrows.tsx`
- `src/components/explorer360/menu/ExplorerMenu.tsx`
- `src/components/explorer360/menu/panels/{MapPanel,ScenesPanel,VrPanel,FavoritesPanel,AttractionsPanel,BusinessesPanel,RoutesPanel,SearchPanel,AiPanel}.tsx`
- `src/components/explorer360/admin/PoisAdminTab.tsx`
- `src/lib/pois.functions.ts`

**Modifiko:**
- `src/routes/explorer-360.tour.$slug.tsx` → wire `SceneNavArrows` + `ExplorerMenu`, kalo neighbors të llogaritura
- `src/routes/explorer-360.admin.tsx` → tab POI + fix re-fetch pas privacy scan
- `src/components/explorer360/PrivacyScanner.tsx` → sigurohem që ruan `privacy_scan` + bën callback `onScanComplete`
- `src/integrations/supabase/types.ts` regjenerohet automatikisht nga migracioni

### 7. Renditja e zbatimit

1. **Bug-fix** privacy_scan + re-fetch (vetëm 2 file)
2. **Migracioni** DB (POI + routes + ai cols)
3. **`SceneNavArrows`** + auto-align (kjo është "previous që del në GSV-style")
4. **`ExplorerMenu`** + 8 panele (Search & AI Guide janë funksionalë; Attractions/Businesses/Routes përdorin tabelat e reja)
5. **Google Places sync** + admin POI tab
6. Test end-to-end në preview + screenshot QA

Note: VR/WebXR i plotë mbetet për Sub-faza E3 — këtu vendos vetëm shell-in "Enter VR" me toast "po vjen në hapin tjetër" për të mos vonuar E2.

---

**Konfirmo dhe nis menjëherë me bug-fix + migracion**, ose më thuaj nëse do më parë diçka tjetër nga lista.