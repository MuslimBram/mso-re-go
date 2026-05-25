# Plani i ndryshimeve

## 1. "Explorer New" si modal popup
- Hiq `<a href="/explorer-new.html" target="_blank">` dhe zëvendëso me një `Button` që vendos `showExplorerNew=true`.
- Shto një overlay full-screen (z-50) me `<iframe src="/explorer-new.html">` që mbulon faqen, me një buton `X` sipër-djathtas për mbylljen.
- Animim i lehtë fade-in (klasa `glass-panel` ekzistuese).

## 2. Hiq kërkesën e Google Maps API key për vizitorët
- Çelësi do të ruhet si **Build Secret** në Workspace Settings me emrin `VITE_GOOGLE_MAPS_API_KEY` (kodi tashmë e ka fallback-un te `src/lib/google-maps-key.ts`).
- Hapi në build mode: do të të dërgoj kërkesën `add_secret` për ta vendosur njëherë.
- Pasi të vendoset, `getGoogleMapsKey()` do ta kthejë automatikisht dhe `ApiKeyGate` nuk do shfaqet më për askënd.
- **Kujdes:** çelësi do të bundlohet në kodin e klientit. Sigurohu që në Google Cloud Console ta kesh të kufizuar me HTTP referrer (`https://rrogozhina-guide.com/*`, `https://www.rrogozhina-guide.com/*`, `https://mso.lovable.app/*`).

## 3. Kufizime për vizitorët (jo të kyçur)
Kontrolli: `if (!user) hide`. Për përdoruesin e kyçur (pronarin/ty) gjithçka mbetet siç është.

Do të fshihen për vizitorët:
- Butoni **Settings** (hiq API key) — gjithmonë i fshehur tani, sepse çelësi është global.
- Butoni **Star** (Ruaj si favorite).
- Butoni **Library** (Favoritet).
- Te `QuranPlayer`: fusha e ngarkimit (upload) të skedarëve MP3.

## 4. Forma e komenteve / sugjerimeve të vendeve
Vizitorët mund të dërgojnë sugjerime për vende të reja edhe pa u kyçur.

- **Tabelë e re** `place_suggestions` me kolonat: `id`, `name`, `place_query` (teksti i vendit), `comment`, `contact` (opsional), `lat`/`lng` (opsionale — koordinatat aktuale të pamjes), `created_at`.
- **RLS:** `insert` i lejuar për të gjithë (anon + authenticated); `select` vetëm për pronarin (ti) — do të identifikohem me një rol `admin` te tabela `user_roles` (po nuk ekziston, do ta krijoj).
- Buton i ri **"Sugjero një vend"** te shiriti i sipërm (ose poshtë butonit Kur'ani), që hap një `Dialog` me formë të thjeshtë (emër, vend, koment).

## 5. Përmirësime te Quran Player
- **Autoplay:** kur faqja ngarkohet, fillon menjëherë sura e parë (me `volume` ekzistues). Nëse browseri bllokon autoplay-in pa interaksion, do të provojë `.play()` dhe nëse dështon do të nisë në klikun e parë diku në faqe.
- **Shirit progresi nën emrin e sures:** `<progress>` ose `div` i animuar që pasqyron `audio.currentTime / audio.duration`, përditësohet me event `timeupdate`. I klikueshëm për seek.
- **Buton "Ajeti i mëparshëm":** meqë MP3-të janë për sure të plotë (jo per ajet), zbatimi praktik është një buton **skip ‑10s** (kthim 10 sekonda mbrapa). Nëse `currentTime < 3s`, kalon në suren e mëparshme. Do ta etiketoj si "↶ Mbrapa" me ikonë.
  - *Shënim:* për kthim të saktë ajet-për-ajet do duhej audio per-ajet (API tjetër) — mund ta shtoj në një fazë të dytë nëse dëshiron.

## Detajet teknike
- Skedarët që preken: `src/routes/index.tsx`, `src/components/vr/QuranPlayer.tsx`, krijim `src/components/vr/SuggestPlaceDialog.tsx`, migracion i ri SQL për `place_suggestions` (+`user_roles` nëse mungon).
- Asnjë ndryshim te `client.ts`, `types.ts`, `.env` (auto-generated).
- Build secret: `VITE_GOOGLE_MAPS_API_KEY` (do ta kërkoj në hapin e parë të build mode).

## Pyetje për konfirmim
1. Çelësin Google Maps a e ke gati ta vendosësh? (do të kërkohet sapo të kalojmë në build mode)
2. Për "Sugjero vend" — a duhet të kërkojë email/kontakt të detyrueshëm, apo opsional?
