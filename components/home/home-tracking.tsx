"use client";
import { useEffect } from "react";
import { homeConversionParams } from "@/lib/analytics/homepage";
import { trackEvent } from "@/lib/analytics/events";
export function HomeTracking() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("main[data-homepage]");
    if (!root) return;
    function click(e: MouseEvent) {
      const link =
        e.target instanceof Element
          ? e.target.closest<HTMLAnchorElement>("a[data-home-cta]")
          : null;
      if (
        !link ||
        (!root!.contains(link) && !link.closest(".mobile-booking-bar"))
      )
        return;
      const params = homeConversionParams(
        link.dataset.homeCta || "",
        link.dataset.intent || "",
        root!.dataset.homepage || "",
      );
      if (params) trackEvent("homepage_cta_click", params);
    }
    function submit(e: SubmitEvent) {
      if (
        !(e.target instanceof HTMLFormElement) ||
        !root!.contains(e.target) ||
        !e.target.matches(".final-cta-bar")
      )
        return;
      const params = homeConversionParams(
        "final_request",
        "room",
        root!.dataset.homepage || "",
      );
      if (params) trackEvent("homepage_request_start", params);
    }
    document.addEventListener("click", click);
    document.addEventListener("submit", submit);
    return () => {
      document.removeEventListener("click", click);
      document.removeEventListener("submit", submit);
    };
  }, []);
  return null;
}
