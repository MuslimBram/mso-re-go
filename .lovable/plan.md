## 1) Rregullimi i figurës (HAPI I PARË)

Problemi: në `public/explorer-new.html` sfondi 360° ka `filter: brightness(0.35) blur(1.5px)` mbi iframe + dy gradient të errët mbi të. Kjo bën që pamja të duket si "kamera nate" (foto #31). Në mobile + në preview të Lovable kjo del edhe më keq sepse iframe i Street View nuk ngarkon dot dhe del me artefakte ngjyrash (foto #32 – pamja violet/inverted vjen nga iframe i papërfunduar i Google nën gradient blu).

Ndryshime:
- Heq filtrin e errët nga `.bg360 iframe` (asnjë `brightness` / `blur`).
- Zëvendësoj `transform: scale(1.25)` me `scale(1.05)` (më e qartë në mobile).
- Ul errësirën e `.overlay`: gradient i butë `rgba(0,0,0,0.15) → rgba(0,0,0,0.55)`, që teksti të lexohet pa "fshehur" foton.
- Shtoj `@media (max-width: 640px)` ku overlay-i bie edhe më shumë dhe iframe `scale(1)`.

Asgjë tjetër në explorer-new nuk preket → dialogët "Shto vend / Edito" mbeten siç janë.

## 2) Moduli i ri "360° Explorer" – i pavarur

Buton i ri në top bar të faqes kryesore: **🌐 360° Explorer**. Hap routën `/explorer-360`. Asnjë faqe ekzistuese nuk preket veç shtimit të butonit.

### Faqet (rrugë të reja)
```
/explorer-360                 – Hub: hartë + listë + kategori + kërkim + featured
/explorer-360/tour/$slug      – Viewer i një tour-i (Marzipano + hotspots + minimap + VR + audio + galeri + video)
/explorer-360/showcase        – Showcase 3D (Sketchfab embed + rotate/zoom/fullscreen)
/_authenticated/admin/tours   – Admin: upload panorama, lidh skena, hotspots, publiko
/_authenticated/admin/showcase – Admin: upload modele 3D & produkte
```

### Hub (/explorer-360)
- Hartë interaktive (**Leaflet + OpenStreetMap**) me marker për çdo tour.
- Listë me karta (cover, titull, përshkrim, GPS, butona "Hapu në Google Maps" & "Fillo Tour-in").
- Kërkim + chips për kategori (Histori, Natyrë, Biznes, Atraksion…).
- Seksion "Featured" sipër.
- Floating Action Button në kënd poshtë-djathtas: **Explore Options** → hap menu (desktop: popover me karta të animuara; mobile: bottom-sheet) me: Map, 360 Tour, VR, Atraksione, Biznese, Produkte, 3D, Rrugë, Evente, Kërko, AI Guide.

### Tour Viewer (/explorer-360/tour/$slug)
- **Marzipano** për panoramë fullscreen (mbështet edhe Street View pano nga Google si fallback kur tour-i s'ka foto të vetën).
- Hotspots: info, audio, video, foto, produkt – konfigurueshme nga admin.
- Next / Previous scene + minimap me shigjetë drejtimi.
- Buton VR Mode (WebXR; fallback stereo i thjeshtë).
- Audio guide player + galeri thumbnail + video embed.
- Gyroscope në mobile (DeviceOrientationEvent).

### Showcase 3D (/explorer-360/showcase)
- Faza 1: integrim me **Sketchfab embed** (model URL nga admin) – rotate, zoom, fullscreen out-of-the-box, mobile-friendly.
- Kategori produkte + filter.

### Admin
- `/_authenticated/admin/tours`: krijoji/editoji tour, ngarko panorama (Supabase Storage), shto skena, lidhe me hotspots, vendos GPS, publish/draft.
- `/_authenticated/admin/showcase`: krijoji produkte 3D me Sketchfab URL ose ngarko `.glb`, kategori, thumbnail.
- Aksesi vetëm për rolin `admin` (përdorim tabelën ekzistuese `user_roles` + `has_role`).

### Database (migracion i ri)
Tabela të reja, të gjitha me RLS + GRANTs:
- `tours` (id, slug, title, description, cover_url, category, lat, lng, featured, published, created_by, created_at)
- `tour_scenes` (id, tour_id, name, panorama_url, source: 'upload'|'streetview', street_view_pano_id, initial_yaw, initial_pitch, order)
- `tour_hotspots` (id, scene_id, type: info|audio|video|image|product|link, yaw, pitch, title, body, media_url, target_scene_id)
- `tour_media` (id, tour_id, type: gallery|audio|video, url, caption)
- `showcase_products` (id, slug, title, description, category, sketchfab_url, model_url, thumbnail_url, published, created_at)

RLS: publik `SELECT` për rreshtat `published=true`; admin (nëpërmjet `has_role`) bën të gjitha. Bucket-e të reja Storage: `tour-panoramas` (publik), `tour-media` (publik), `showcase-models` (publik).

### Si "modul" i izoluar
- Gjithçka jeton nën `src/routes/explorer-360/*` dhe `src/components/explorer360/*`.
- Asnjë import në komponentët ekzistues `vr/*`.
- Mund të çaktivizohet duke fshirë butonin e ri nga top bar dhe foldrin – pjesa tjetër mbetet e paprekur.

## 3) Çfarë do bëj në këtë rraund (deri sa të thuash "Vazhdo")

Hap pas hapi, "end-to-end" sa maksimum, por do ndaloj para se të kalojmë te admin & tabelat e mëdha që duan miratim:

1. **Fix CSS** në `public/explorer-new.html` (pika 1 më sipër).
2. **Shtoj butonin** "🌐 360° Explorer" në top bar të `src/routes/index.tsx`.
3. **Krijoj migracion** për 5 tabelat + 3 bucket-e + politika RLS + GRANTs (do të kërkoj miratim).
4. **Faqja Hub** `/explorer-360` me: Leaflet hartë, listë kartash, kërkim, kategori, FAB "Explore Options" me bottom-sheet/popover.
5. **Viewer** `/explorer-360/tour/$slug` me Marzipano + skena + hotspots bazikë (info/foto) + minimap + buton VR + audio.
6. Instalim varësish: `marzipano`, `leaflet`, `react-leaflet`.

Ndaloj këtu dhe pres komandën **"Vazhdo"**. Pastaj në raundin tjetër:
7. Showcase 3D + integrimi Sketchfab.
8. Admin panel për tours + showcase.
9. Hotspots audio/video/produkt + galeri + WebXR i plotë + gyroscope + AI Guide.

## Shënime teknike
- Marzipano + Leaflet janë libra të pavarur, pa varësi në Three.js – mbahen të lehta.
- WebXR përdor `navigator.xr` me fallback në stereo split-screen (e kemi tashmë te `VRStereoView`).
- Google Street View vazhdon të punojë me çelësin ekzistues `VITE_GOOGLE_MAPS_API_KEY`.
- Asnjë skedar i mbrojtur (`client.ts`, `types.ts`, `.env`, `config.toml` projekt-level) nuk preket.
