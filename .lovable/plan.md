## Çfarë do të shtohet në "360° Explorer"

Përveç pjesës që ekziston tashmë (ngarkim panorame, hotspot-e, harta), do të shtohen 3 module që mungojnë krahasuar me referencën:

### 1. AI Privacy Scan (Gemini Vision) — para çdo ngarkimi

Hapi i ri detyrues mes "Zgjedh foton 360°" dhe "Ruaj në storage":

```
Skedari → Preview → [Skanim AI] → Raport → [Aprovo / Blur më shumë / Refuzo] → Upload
```

- Pasi përdoruesi zgjedh panoramen, ajo dërgohet te një server function i ri që e thërret Gemini 2.5 Flash (vision) me prompt:
  *"Identifiko të gjitha fytyrat e njerëzve, targat e makinave, dokumentet me të dhëna personale dhe ekranet me përmbajtje të lexueshme. Kthe një JSON me bounding box-e normalizuara (0–1) dhe llojin për secilën."*
- Përgjigja e strukturuar përmes `Output.object` me Zod schema: `{ detections: [{ type: "face"|"plate"|"document"|"screen", x, y, w, h, confidence }] }`.
- Në klient, mbi panoramen vizatohen kutitë e propozuara dhe aplikohet **gaussian blur** automatikisht në canvas mbi to.
- Përdoruesi mund të: shtojë kuti me dorë, fshijë kuti false-positive, ndryshojë intensitetin e blur.
- Vetëm panorama e re (me blur të aplikuar dhe rikoduar si JPEG) ngarkohet në storage — origjinali NUK ruhet.
- Nëse AI gjen >0 detektime me confidence ≥0.7 dhe përdoruesi nuk ka aplikuar blur, butoni "Ngarko" bllokohet me mesazh paralajmërues.

### 2. Modul i ri "Publikim në Google Street View"

Çdo tour fiton një tab të ri **"Street View"** me:
- Listën e skenave të tour-it me statusin: `Pa ngarkuar` / `Në pritje` / `E publikuar në GSV` / `Refuzuar`.
- Fushat e reja për skenë: `gsv_pano_id`, `gsv_url`, `gsv_upload_time`, `gsv_thumbnail`, `heading`, `floor`, `floor_name`.
- Lidhjet (graph) mes panoramave: `gsv_connections` — Anchor/Target — që krijojnë navigim mes panoramave brenda Street View.
- Butoni **"Publiko në Street View"** thërret një server route që përdor **Google Street View Publish API** me një llogari të vetme qendrore (OAuth refresh token i jotji i ruajtur si secret).
- Butoni **"Sync from GSV"** merr metadatat nga Google dhe i ruan në DB.
- Hartë e re mini-Google-Maps për çdo skenë me dragable marker + shigjetë headingu (si në screenshot-in tënd), me butonin "Save Location & Heading".

### 3. Roli dhe lejet

- Çdo vizitor i regjistruar mund të krijojë tour-in e tij dhe ta dërgojë për publikim në GSV, por kërkesa kalon në një radhë `gsv_publish_queue` që e aprovon admin (që mos abuzohet llogaria qendrore).
- Statuset: `draft → pending_review → approved → publishing → published / rejected`.

---

## Detaje teknike

### Tabela të reja / kolona të reja

Migrim i ri që shton:
- Te `tour_scenes`: `gsv_pano_id text`, `gsv_url text`, `gsv_upload_time timestamptz`, `gsv_thumbnail text`, `heading double precision default 0`, `floor int default 0`, `floor_name text`, `privacy_scan jsonb` (raporti i fundit i AI), `privacy_approved boolean default false`.
- Tabelë e re `gsv_connections (id, from_scene_id, to_scene_id, gsv_anchor_pano, gsv_target_pano, created_at)` me RLS sipas pronësisë së tour-it.
- Tabelë e re `gsv_publish_queue (id, scene_id, status, requested_by, reviewed_by, error, created_at, updated_at)`.

### Server functions / routes të reja
- `src/lib/privacy-scan.functions.ts` — `scanPanorama({ imageUrl })` → thërret Lovable AI Gateway (`google/gemini-2.5-pro` ose `gemini-3-flash-preview` vision) me `Output.object` schema, kthen detektimet.
- `src/routes/api/gsv-publish.ts` — server route që pranon scene_id, merr panoramen e pastruar nga storage, e ngarkon në Street View Publish API me access token të rifreskuar nga refresh token-i qendror, pastaj ruan `gsv_pano_id` në DB.
- `src/routes/api/gsv-sync.ts` — për sinkronizimin e metadatave.
- `src/routes/api/gsv-connect.ts` — për krijimin e lidhjeve (BatchUpdate `connections`).

### Komponentë të rinj
- `src/components/explorer360/PrivacyScanner.tsx` — kanvasi me overlay të kutive, kontrollet manual.
- `src/components/explorer360/GsvPublishPanel.tsx` — tab-i i ri me listën e skenave dhe butonat.
- `src/components/explorer360/SceneMapEditor.tsx` — Google Maps mini me marker + heading.
- Te `explorer-360.admin.tsx`: integrim i `PrivacyScanner` para `uploadPanorama()` ekzistuese.

### Secrets që duhen
- `GOOGLE_STREETVIEW_OAUTH_CLIENT_ID`
- `GOOGLE_STREETVIEW_OAUTH_CLIENT_SECRET`
- `GOOGLE_STREETVIEW_REFRESH_TOKEN` (e llogarisë qendrore "Rrogozhina Guide")

Këto do t'i kërkoj me `add_secret` pasi të aprovohet plani. Llogaria Google qendrore duhet:
1. Të ketë Street View Publish API të aktivizuar në Google Cloud Console.
2. Të bëjë OAuth një herë në një web flow lokal për të nxjerrë refresh token-in me scope `https://www.googleapis.com/auth/streetviewpublish`.

### LOVABLE_API_KEY
Tashmë ekziston në secrets — s'duhet shtuar.

---

## Rendi i punës (fazat)

1. **Faza A** — Migrim DB (kolonat e reja + 2 tabelat e reja + RLS).
2. **Faza B** — AI Privacy Scan: server function + `PrivacyScanner.tsx` + integrimi në admin upload flow.
3. **Faza C** — UI për Street View tab + harta për-skenë me heading.
4. **Faza D** — Pasi të jepen secrets-at e Google, server route për publikim + sync.
5. **Faza E** — Radha e aprovimit nga admin.

Pas planit dhe miratimit, fillimi me Fazën A + B (pjesa që nuk pret secrets-at e Google).
