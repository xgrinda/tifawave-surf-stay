import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

const publicRoutes = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1
  },
  {
    path: "/stay",
    changeFrequency: "monthly",
    priority: 0.8
  },
  {
    path: "/surf/packages",
    changeFrequency: "monthly",
    priority: 0.8
  },
  {
    path: "/surf-camp-tamraght",
    changeFrequency: "monthly",
    priority: 0.85
  },
  {
    path: "/gallery",
    changeFrequency: "monthly",
    priority: 0.7
  },
  {
    path: "/about",
    changeFrequency: "monthly",
    priority: 0.7
  },
  {
    path: "/faq",
    changeFrequency: "monthly",
    priority: 0.6
  },
  {
    path: "/book",
    changeFrequency: "weekly",
    priority: 0.9
  }
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: route.path === "/" ? siteUrl : `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));
}
