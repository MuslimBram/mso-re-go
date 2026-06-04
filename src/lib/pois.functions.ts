import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

const CATEGORY_MAP: Record<string, string> = {
  tourist_attraction: "attraction",
  museum: "attraction",
  park: "attraction",
  zoo: "attraction",
  art_gallery: "attraction",
  mosque: "religious",
  church: "religious",
  hindu_temple: "religious",
  synagogue: "religious",
  restaurant: "restaurant",
  cafe: "restaurant",
  bar: "restaurant",
  bakery: "restaurant",
  food: "restaurant",
  lodging: "lodging",
  hotel: "lodging",
  shopping_mall: "business",
  store: "business",
  pharmacy: "business",
};

function categoryFor(types: string[] | undefined): string {
  if (!types) return "business";
  for (const t of types) if (CATEGORY_MAP[t]) return CATEGORY_MAP[t];
  return "business";
}

/** Sync POIs from Google Places (nearby) for a given tour, respecting manual_override. */
export const syncPoisFromPlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        tourId: z.string().uuid(),
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        radiusM: z.number().min(50).max(5000).default(800),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const gmapsKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!lovableKey || !gmapsKey) {
      throw new Error("Google Maps konektori nuk është konfiguruar.");
    }

    const includedTypes = [
      "tourist_attraction", "museum", "park", "mosque", "church",
      "restaurant", "cafe", "shopping_mall", "store", "lodging",
    ];

    const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchNearby`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": gmapsKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.types,places.websiteUri,places.nationalPhoneNumber,places.photos",
      },
      body: JSON.stringify({
        includedTypes,
        maxResultCount: 20,
        locationRestriction: {
          circle: { center: { latitude: data.lat, longitude: data.lng }, radius: data.radiusM },
        },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Google Places: ${res.status} ${txt.slice(0, 200)}`);
    }
    const json = (await res.json()) as { places?: Array<Record<string, unknown>> };
    const places = json.places ?? [];

    const { supabase } = context;
    const rows = places.map((p) => {
      const loc = (p.location as { latitude?: number; longitude?: number } | undefined) ?? {};
      const dn = (p.displayName as { text?: string } | undefined)?.text ?? "POI";
      const photo = (p.photos as Array<{ name?: string }> | undefined)?.[0]?.name;
      return {
        tour_id: data.tourId,
        source: "google_places",
        google_place_id: p.id as string,
        category: categoryFor(p.types as string[] | undefined),
        name: dn,
        description: (p.formattedAddress as string | undefined) ?? null,
        lat: loc.latitude ?? data.lat,
        lng: loc.longitude ?? data.lng,
        rating: (p.rating as number | undefined) ?? null,
        photo_url: photo ? `https://places.googleapis.com/v1/${photo}/media?maxHeightPx=400&key=${gmapsKey}` : null,
        website: (p.websiteUri as string | undefined) ?? null,
        phone: (p.nationalPhoneNumber as string | undefined) ?? null,
        metadata: JSON.parse(JSON.stringify({ types: (p.types as string[] | undefined) ?? [] })),
      };
    });

    if (rows.length === 0) return { synced: 0, skipped: 0 };

    // Upsert but skip rows with manual_override=true (do not clobber admin edits).
    let synced = 0;
    let skipped = 0;
    for (const r of rows) {
      const { data: existing } = await supabase
        .from("tour_pois")
        .select("id, manual_override")
        .eq("tour_id", r.tour_id)
        .eq("google_place_id", r.google_place_id!)
        .maybeSingle();
      if (existing?.manual_override) {
        skipped++;
        continue;
      }
      const { error } = await supabase
        .from("tour_pois")
        .upsert([r], { onConflict: "tour_id,google_place_id" });
      if (!error) synced++;
    }
    return { synced, skipped, total: rows.length };
  });

/** Public list (used by viewer panels). */
export const listTourPois = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ tourId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("tour_pois")
      .select("id,category,name,description,lat,lng,rating,photo_url,website,phone,source")
      .eq("tour_id", data.tourId)
      .eq("hidden", false)
      .order("rating", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });