import { supabase } from "@/lib/supabaseClient";

// OneSignal Web SDK — loaded via CDN script tag (see app/layout.tsx),
// no server credentials needed on the client, no Firebase project required.
declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
  }
}

// Call once after login. Prompts the browser for notification permission,
// then saves the OneSignal subscription id against the signed-in user so
// the notification-dispatcher function can target it later.
export function registerPushSubscription(userId: string) {
  if (typeof window === "undefined") return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.Notifications.requestPermission();

    // Tag the subscription with our internal user id so OneSignal can also
    // target by external_id if you prefer that over storing the raw id.
    await OneSignal.login(userId);

    const subscriptionId = OneSignal.User.PushSubscription.id;
    if (subscriptionId) {
      await supabase.from("users").update({ fcm_token: subscriptionId }).eq("id", userId);
      // Note: column is still named `fcm_token` in the schema for backward
      // compatibility — it now stores the OneSignal Subscription ID.
    }
  });
}
