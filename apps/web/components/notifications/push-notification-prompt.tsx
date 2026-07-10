"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, X } from "lucide-react";

const DISMISSED_KEY = "homeos-push-dismissed";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkShouldShow = useCallback(async () => {
    // Don't show if not in browser
    if (typeof window === "undefined") return;

    // Don't show if push not supported
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    // Don't show if previously dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Don't show if permission already denied
    if (Notification.permission === "denied") return;

    // Don't show if already subscribed
    if (Notification.permission === "granted") {
      try {
        const registration = await navigator.serviceWorker.getRegistration("/sw.js");
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) return; // Already subscribed
        }
      } catch {
        // Ignore errors, show prompt
      }
    }

    setVisible(true);
  }, []);

  useEffect(() => {
    checkShouldShow();
  }, [checkShouldShow]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setVisible(false);
        return;
      }

      // Get VAPID key
      const vapidRes = await fetch("/api/push/vapid-key");
      const vapidData = await vapidRes.json();
      if (!vapidData.success) {
        console.error("Failed to get VAPID key:", vapidData.error);
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.data.vapidPublicKey),
      });

      const subJSON = subscription.toJSON();

      // Save to server
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJSON.endpoint,
          keys: {
            p256dh: subJSON.keys?.p256dh,
            auth: subJSON.keys?.auth,
          },
          platform: "web",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setVisible(false);
      } else {
        console.error("Failed to save subscription:", data.error);
      }
    } catch (err) {
      console.error("Push subscription failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="bg-[#0A2E4D]/5 border border-[#0A2E4D]/10 rounded-lg p-4 flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">
        <Bell className="h-5 w-5 text-[#00B4A0]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#0A2E4D]">
          Enable push notifications to stay updated on maintenance reminders and
          warranty alerts.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={handleEnable}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-[#00B4A0] hover:bg-[#00A090] disabled:opacity-50 transition-colors"
          >
            {loading ? "Enabling..." : "Enable"}
          </button>
          <button
            onClick={handleDismiss}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-[#0A2E4D]/60 hover:text-[#0A2E4D] hover:bg-[#0A2E4D]/5 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-[#0A2E4D]/40 hover:text-[#0A2E4D]/60 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
