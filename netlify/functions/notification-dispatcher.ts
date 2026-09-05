// Netlify Scheduled Function — runs every 15 minutes (see netlify.toml).
// 1. Reads due, unsent rows from `notifications` (populated by DB triggers
//    such as fn_schedule_equipment_notifications).
// 2. Sends each as a push via the OneSignal REST API — no Firebase project,
//    no service-account JSON, just an App ID + REST API key.
// 3. Marks the row as sent.
//
// Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// NEXT_PUBLIC_ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY.

import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

async function sendOneSignalPush(opts: {
  title: string;
  body: string;
  playerIds?: string[];   // specific OneSignal subscription ids
  broadcastAll?: boolean; // send to every subscribed user
}) {
  const payload: Record<string, unknown> = {
    app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
    headings: { en: opts.title },
    contents: { en: opts.body },
  };

  if (opts.broadcastAll) {
    payload.included_segments = ["Subscribed Users"];
  } else {
    payload.include_subscription_ids = opts.playerIds;
  }

  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OneSignal error ${res.status}: ${text}`);
  }
  return res.json();
}

export default async () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: due, error } = await supabase
    .from("notifications")
    .select("*, users:recipient_id(fcm_token)")
    .lte("scheduled_for", new Date().toISOString())
    .eq("is_sent", false);

  if (error) {
    console.error("Failed to load due notifications:", error.message);
    return new Response("error", { status: 500 });
  }

  if (!due?.length) return new Response("no notifications due", { status: 200 });

  const sentIds: string[] = [];

  for (const n of due) {
    try {
      if (n.recipient_id) {
        // Targeted: only send if that user has a saved subscription id.
        if (n.users?.fcm_token) {
          await sendOneSignalPush({ title: n.title, body: n.body, playerIds: [n.users.fcm_token] });
        }
      } else {
        // Broadcast: no specific recipient — send to everyone subscribed.
        await sendOneSignalPush({ title: n.title, body: n.body, broadcastAll: true });
      }
      sentIds.push(n.id);
    } catch (err) {
      console.error(`Failed to send notification ${n.id}:`, err);
    }
  }

  if (sentIds.length) {
    await supabase
      .from("notifications")
      .update({ is_sent: true, sent_at: new Date().toISOString() })
      .in("id", sentIds);
  }

  return new Response(`sent ${sentIds.length}/${due.length}`, { status: 200 });
};

export const config: Config = {
  schedule: "*/15 * * * *",
};
