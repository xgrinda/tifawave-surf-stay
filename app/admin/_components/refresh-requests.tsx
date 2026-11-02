"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
/** Only mount on read-only queues; never discard unsaved detail-form edits. */
export function RefreshRequests() {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const interval = window.setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);
  return (
    <p className="ops-refresh-status">
      Queue updates every 30 seconds while this page is visible.
    </p>
  );
}
