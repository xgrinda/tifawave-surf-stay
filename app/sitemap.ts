import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

const publicRoutes = [
  {
    path: "/",
    frPath: "/fr",
    changeFrequency: "weekly",
    priority: 1
  },
  {
    path: "/stay",
    frPath: "/fr/stay",
    changeFrequency: "monthly",
    priority: 0.8
  },
  {
    path: "/surf/packages",
    frPath: "/fr/surf/packages",
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
    frPath: "/fr/gallery",
    changeFrequency: "monthly",
    priority: 0.7
  },
  {
    path: "/about",
    frPath: "/fr/about",
    changeFrequency: "monthly",
    priority: 0.7
  },
  {
    path: "/faq",
    frPath: "/fr/faq",
    changeFrequency: "monthly",
    priority: 0.6
  },
  {
    path: "/book",
    frPath: "/fr/book",
    changeFrequency: "weekly",
    priority: 0.9
  }
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  return publicRoutes.flatMap((route) => {
    const englishRoute = {
      url: route.path === "/" ? siteUrl : `${siteUrl}${route.path}`,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority
    };

    if (!("frPath" in route)) {
      return [englishRoute];
    }

    return [
      englishRoute,
      {
        url: `${siteUrl}${route.frPath}`,
        lastModified,
        changeFrequency: route.changeFrequency,
        priority: route.priority
      }
    ];
  });
}
