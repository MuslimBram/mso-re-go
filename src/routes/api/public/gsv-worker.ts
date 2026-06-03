import { createFileRoute } from "@tanstack/react-router";

/**
 * GSV publishing worker.
 *
 * Picks up `approved` queue rows and performs the actual Street View Publish
 * API call. Until the Google OAuth secrets are configured (GOOGLE_GSV_CLIENT_ID,
 * GOOGLE_GSV_CLIENT_SECRET, GOOGLE_GSV_REFRESH_TOKEN), this route is a stub
 * that only validates the worker token and reports back what would be done.
 *
 * Auth: shared bearer secret `GSV_WORKER_TOKEN`. Never call publicly without it.
 */
export const Route = createFileRoute("/api/public/gsv-worker")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("x-gsv-worker-token");
        if (!token || token !== process.env.GSV_WORKER_TOKEN) {
          return new Response("Unauthorized", { status: 401 });
        }

        const ready =
          !!process.env.GOOGLE_GSV_CLIENT_ID &&
          !!process.env.GOOGLE_GSV_CLIENT_SECRET &&
          !!process.env.GOOGLE_GSV_REFRESH_TOKEN;

        if (!ready) {
          return Response.json({
            ok: false,
            stub: true,
            message:
              "Worker është aktiv por mungojnë sekretet e Google (GOOGLE_GSV_CLIENT_ID / _SECRET / _REFRESH_TOKEN). Asnjë skenë nuk u ngarkua në GSV.",
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: rows, error } = await supabaseAdmin
          .from("gsv_publish_queue")
          .select("id, scene_id, action, attempt_count")
          .eq("status", "approved")
          .lt("attempt_count", 5)
          .order("updated_at", { ascending: true })
          .limit(5);

        if (error) return new Response(error.message, { status: 500 });

        // Real Google API integration is wired in a follow-up step once the
        // refresh-token OAuth flow has been completed. For now we surface the
        // queue snapshot so the admin can confirm worker reachability.
        return Response.json({
          ok: true,
          stub: true,
          ready,
          pending: rows?.length ?? 0,
          message:
            "Sekretet u gjetën por integrimi real me Street View Publish API aktivizohet në hapin tjetër.",
        });
      },
    },
  },
});