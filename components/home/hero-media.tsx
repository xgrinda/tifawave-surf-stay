"use client";
import { getImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { focalPositionToCss, type FocalPosition } from "@/lib/image-position";
import { isOptimizedCloudinaryImage } from "@/lib/cloudinary-image";
export function HeroMedia({
  image,
  alt,
  video,
  locale,
  position = "center",
  mobileImage = "",
  mobilePosition = "center",
}: {
  image: string;
  alt: string;
  video: string;
  locale: Locale;
  position?: FocalPosition;
  mobileImage?: string;
  mobilePosition?: FocalPosition;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const fr = locale === "fr";
  useEffect(() => {
    if (!video) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const small = matchMedia("(max-width: 767px)");
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const eligible = !motion.matches && !small.matches && !connection?.saveData;
    if (!eligible) return;
    const el = ref.current;
    if (!el) return;
    el.src = video;
    el.load();
    el.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
    const stop = () => {
      if (motion.matches || document.hidden) {
        el.pause();
        setPlaying(false);
      }
    };
    motion.addEventListener("change", stop);
    document.addEventListener("visibilitychange", stop);
    return () => {
      motion.removeEventListener("change", stop);
      document.removeEventListener("visibilitychange", stop);
      el.pause();
    };
  }, [video]);
  async function toggle() {
    const el = ref.current;
    if (!el) return;
    if (!el.paused) {
      el.pause();
      setPlaying(false);
      return;
    }
    if (!el.getAttribute("src")) {
      el.src = video;
      el.load();
    }
    try {
      await el.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }
  return (
    <>
      <div className="hero-property-media">
        <picture>
          {mobileImage && (
            <source
              media="(max-width:767px)"
              srcSet={
                getImageProps({
                  src: mobileImage,
                  alt,
                  width: 1080,
                  height: 1350,
                  sizes: "100vw",
                  quality: 80,
                  unoptimized: isOptimizedCloudinaryImage(mobileImage),
                }).props.srcSet || mobileImage
              }
            />
          )}
          {/* Retain Cloudinary optimization; Next optimizes ordinary originals. */}
          <img
            {...getImageProps({
              src: image,
              unoptimized: isOptimizedCloudinaryImage(image),
              alt,
              width: 2400,
              height: 1350,
              sizes: "100vw",
              quality: 80,
              loading: "eager",
              fetchPriority: "high",
            }).props}
            alt={alt}
            style={
              {
                objectPosition: focalPositionToCss(position),
                "--hero-mobile-position": focalPositionToCss(mobilePosition),
              } as import("react").CSSProperties
            }
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
            }}
          />
        </picture>
        {video && (
          <video
            ref={ref}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            className={loaded ? "is-loaded" : ""}
            onCanPlay={() => setLoaded(true)}
            onError={() => {
              setLoaded(false);
              setPlaying(false);
            }}
          />
        )}
      </div>
      {video && (
        <button
          className="hero-video-toggle"
          type="button"
          aria-pressed={playing}
          onClick={toggle}
        >
          {playing
            ? fr
              ? "Pause vidéo"
              : "Pause video"
            : fr
              ? "Lire la vidéo"
              : "Play video"}
        </button>
      )}
    </>
  );
}
