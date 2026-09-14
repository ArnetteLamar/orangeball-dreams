"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    async function resetPwaCache() {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();

        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      if ("caches" in window) {
        const cacheNames = await caches.keys();

        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      }
    }

    resetPwaCache().catch(() => {
      // Ignore cache cleanup errors
    });
  }, []);

  return null;
}
