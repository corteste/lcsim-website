import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const DEFAULT_VAPID_PUBLIC_KEY =
  "BBgz5M3yltLNyymRcWMRLlq2quSFQcNm2lK-wuwo9VV3NAICRwzbYnh8vaSLeLPAAOublJozCxc7VXELqTHDYL4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushRequestPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  target_team_id?: string | null;
  target_team_ids?: string[];
  exclude_team_id?: string | null;
  target_admin?: boolean;
  exclude_admin?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || DEFAULT_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: "Missing VAPID_PRIVATE_KEY secret on Supabase Edge Functions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    webpush.setVapidDetails("mailto:admin@lcsim.it", vapidPublicKey, vapidPrivateKey);

    const payload = (await req.json()) as PushRequestPayload;
    if (!payload?.title) {
      return new Response(JSON.stringify({ error: "Missing notification title" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let query = supabase
      .from("user_push_subscriptions")
      .select("id, endpoint, p256dh, auth, team_id")
      .eq("enabled", true)
      .not("p256dh", "is", null)
      .not("auth", "is", null);

    if (payload.target_team_id) {
      query = query.eq("team_id", payload.target_team_id);
    } else if (payload.target_team_ids && payload.target_team_ids.length > 0) {
      query = query.in("team_id", payload.target_team_ids);
    } else if (payload.target_admin) {
      query = query.is("team_id", null);
    }

    if (payload.exclude_admin) {
      query = query.not("team_id", "is", null);
    }

    if (payload.exclude_team_id) {
      query = query.neq("team_id", payload.exclude_team_id);
    }

    const { data: subs, error: fetchErr } = await query;
    if (fetchErr) {
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notificationJson = JSON.stringify({
      title: payload.title,
      body: payload.body || "",
      url: payload.url || "/inbox",
      tag: payload.tag || "lcsim-push",
    });

    let sent = 0;
    let deactivated = 0;
    const staleIds: string[] = [];

    await Promise.all(
      (subs || []).map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            notificationJson
          );
          sent += 1;
        } catch (err: any) {
          const statusCode = err?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            staleIds.push(sub.id);
          } else {
            console.error("Error sending web push to endpoint:", sub.endpoint, statusCode, err?.body || err?.message);
          }
        }
      })
    );

    if (staleIds.length > 0) {
      await supabase
        .from("user_push_subscriptions")
        .update({ enabled: false, updated_at: new Date().toISOString() })
        .in("id", staleIds);
      deactivated = staleIds.length;
    }

    return new Response(
      JSON.stringify({ ok: true, matched: subs?.length || 0, sent, deactivated }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
