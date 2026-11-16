"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LiveListings({ revision }) {
  const router = useRouter();
  useEffect(() => {
    const controller = new AbortController();
    let checking = false;
    async function check() {
      if (document.visibilityState !== "visible" || checking) return;
      checking = true;
      try {
        const response = await fetch("/api/listings/revision", {
          cache: "no-store", signal: controller.signal,
        });
        if (response.ok) {
          const latest = await response.json();
          if (latest.revision && latest.revision !== revision && !controller.signal.aborted) router.refresh();
        }
      } catch {
        // A temporary connection failure is retried on focus or the next interval.
      } finally {
        checking = false;
      }
    }
    check();
    const timer = window.setInterval(check, 30_000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    window.addEventListener("pageshow", check);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
      window.removeEventListener("pageshow", check);
    };
  }, [revision, router]);
  return null;
}
