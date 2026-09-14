"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    async function clearPwaCache() {
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

    clearPwaCache().catch(() => {
      // Ignore cache cleanup errors
    });
  }, []);

  return null;
}
