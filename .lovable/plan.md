# Faza D — Publikimi i pavarur nga Google Street View

## Parimi kryesor
Panorama jeton **gjithmonë** në aplikacionin tonë. Google Street View është vetëm një **kanal shpërndarjeje opsional**. Çdo dështim, refuzim ose fshirje në anën e Google nuk ndikon në panoramen tonë.

```text
[Krijuesi ngarkon panoramen]
        │
        ▼
[Storage + DB lokale]  ◄──────── gjithmonë e disponueshme, e editueshme
        │
        ├── Publish lokalisht (default, automatik kur tour-i publikohet)
        │
        └── Publish në GSV (opsional, kanal i veçantë me status të vetin)
                  │
                  ├── pending_review → approved → publishing → published
                  ├── failed  (mund të Republish-ohet)
                  ├── rejected (nga admini ose Google)
                  └── unpublished (hequr nga GSV, mbetet lokal)
```

## Sjellja e re

1. **Ngarkimi i panoramës** ruan gjithçka në `tour_scenes` + `tour-panoramas` bucket. Asgjë nuk varet nga Google.
2. **Editimi** (riemërtim, lëvizje markeri, heading, blur shtesë, fshirje hotspot-esh) është gjithnjë i lejuar, edhe pas publikimit në GSV. Pas çdo editi që ndryshon pamjen, statusi GSV bie në `stale` dhe krijuesi mund të zgjedhë "Republish".
3. **Publish lokal**: kontrollohet nga fusha `tours.published` + një flag i ri `tour_scenes.local_published` (default `true`) që lejon fshehjen e një skene të vetme nga aplikacioni pa fshirë të dhënat.
4. **Publish në GSV**: krijues kërkon publikim → futet në `gsv_publish_queue` → admini aprovon → worker-i ngarkon → status final ruhet te skena.
5. **Unpublish nga GSV**: thirrje `photo.delete` te Google; lokali mbetet i paprekur; `gsv_pano_id`, `gsv_url`, `gsv_upload_time` zerohen; statusi → `unpublished`.
6. **Republish**: rikrijon kërkesë te radha, ri-aprovohet (ose auto-aprovohet nëse skena ka qenë publikuar më parë — vendoset me toggle adminit).
7. **Failed/Rejected**: ruajmë mesazhin e gabimit dhe një `attempt_count`; butoni "Republish" e fut sërish në radhë.
8. **Fshirja nga Google jashtë sistemit tonë**: një `gsv-sync` periodik kontrollon `photo.get`. Nëse Google kthen 404, statusi bie në `unpublished_remote` dhe panorama lokale **NUK** preket.

## Skema e të dhënave (migrim i ri)

Te `tour_scenes` shtohen:
- `local_published boolean not null default true` — kontrolli i shfaqjes lokale.
- `gsv_status text not null default 'not_published'` — vlerat:
  `not_published | pending_review | approved | publishing | published | failed | rejected | unpublished | unpublished_remote | stale`.
- `gsv_last_error text` — mesazhi i fundit i dështimit.
- `gsv_attempt_count int not null default 0`.
- `gsv_last_synced_at timestamptz`.
- `content_hash text` — hash i panoramës së pastruar; kur ndryshon → status `stale`.

Te `gsv_publish_queue` shtohen:
- `action text not null default 'publish'` — `publish | unpublish | republish`.
- `attempt_count int not null default 0`.
- `last_error text`.

Të gjitha ndryshimet me GRANT-et përkatëse (`authenticated` + `service_role`) dhe RLS si më parë (krijuesi i tour-it + admin).

## Endpoint-et (TanStack)

`createServerFn` për veprime nga UI (të mbrojtura me `requireSupabaseAuth`):
- `requestGsvPublish({ sceneId })` — fut në radhë me `action='publish'`.
- `requestGsvUnpublish({ sceneId })` — `action='unpublish'`.
- `requestGsvRepublish({ sceneId })` — `action='republish'`.
- `setLocalPublished({ sceneId, value })` — toggle lokal.
- `adminApproveQueue({ queueId })`, `adminRejectQueue({ queueId, reason })` — vetëm admin (`has_role`).
- `adminRunQueueItem({ queueId })` — admin force-run worker-it për një rresht.

Server route për punët e gjata / të jashtme (`src/routes/api/public/`):
- `gsv-worker.ts` — POST, kërkon header sekret `x-gsv-worker-token`; merr rreshtat `approved`, bën `photo.startUpload → photo.create / photo.delete` me access token të rifreskuar nga refresh token-i, përditëson skenën dhe radhën.
- `gsv-sync.ts` — POST cron, kontrollon `photo.get` për të gjitha skenat `published`.
- `gsv-oauth-callback.ts` — i përdorur **vetëm një herë** për të nxjerrë refresh token-in e llogarisë qendrore (nuk publikohet në UI).

Worker thirret nga:
- `adminApproveQueue` (fire-and-forget pas aprovimit), dhe
- një cron `pg_cron` çdo 2 min që POST-on në `/api/public/gsv-worker` për retry të dështuara me `attempt_count < 5` (exponential backoff).

## Sekretat që duhen
- `GOOGLE_GSV_CLIENT_ID`
- `GOOGLE_GSV_CLIENT_SECRET`
- `GOOGLE_GSV_REFRESH_TOKEN` (nxirret pas një OAuth flow-i të vetëm përmes callback-ut)
- `GSV_WORKER_TOKEN` (mbron `/api/public/gsv-worker` dhe `/api/public/gsv-sync` nga thirrjet publike)

Do të kërkohen me `add_secret` pas miratimit të planit.

## UI — `GsvPublishPanel` (zëvendëson versionin aktual)

Për çdo skenë:
- Badge statusi (jeshile `published`, blu `pending_review`, e verdhë `stale`/`failed`, gri `not_published`/`unpublished`, e kuqe `rejected`).
- Meta: `gsv_pano_id`, link `gsv_url`, datë publikimi, attempt count, mesazhi i fundit i gabimit.
- Butona kontekstualë:
  - `not_published` → **Publish në GSV**, **Publish vetëm lokalisht** (toggle `local_published`).
  - `pending_review` / `approved` / `publishing` → **Anulo kërkesën**.
  - `published` → **Unpublish nga GSV**, **Republish (sinkronizo)**.
  - `failed` / `rejected` / `unpublished_remote` → **Republish**, **Shih gabimin**.
  - `stale` → **Republish me ndryshimet e reja**, **Mbaj versionin aktual në GSV**.
- Toggle "Shfaqe në aplikacion" për `local_published`.
- Butoni "Edito skenën" gjithmonë i hapur — hap editorin ekzistues (emër, hartë/heading, blur shtesë, hotspot-e).

## Paneli i adminit (`/admin/gsv-queue`, route i ri i mbrojtur)

Tab-et: **Pending review · Approved · Publishing · Published · Failed · Rejected · Unpublished**.
Çdo rresht: miniaturë + emër skene, tour, krijues, statusi, attempts, gabim, kohë. Veprime: **Aprovo / Refuzo (me arsye) / Re-run worker / Force unpublish / Hap skenën**.

## Rendi i implementimit pas miratimit
1. Migrim DB (kolonat + radha e re).
2. ServerFn-të për veprimet e UI (pa Google ende) + komponentët e rinj UI që funksionojnë me `not_published`/`pending_review`/`approved` (mock worker).
3. Paneli i adminit me veprimet aprovim/refuzim.
4. OAuth callback një-përdorimësh + ruajtja e refresh token-it si secret.
5. Worker real (`/api/public/gsv-worker`) që flet me Street View Publish API.
6. Sync periodik + cron retry.
7. Dokument i shkurtër operacional (si rifreskohet refresh-token, si rinisë worker-i, si trajtohet 404 nga Google).

## Garanca përfundimtare
- Asnjë rrugë në kod nuk fshin objekte nga `tour-panoramas` bucket apo rreshtat e `tour_scenes` si pjesë e flow-it të GSV.
- Çdo veprim drejt Google është **shtesë**, kurrë **zëvendësues**.
- Edhe pa GSV fare, aplikacioni vazhdon të funksionojë identik me sot.
