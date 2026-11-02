import { getActiveRooms } from "@/lib/rooms";
import { getActiveSurfPackages } from "@/lib/surf-packages";
import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

const publicRoutes = [
  {
    path: "/",
    frPath: "/fr",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/stay",
    frPath: "/fr/stay",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/surf/packages",
    frPath: "/fr/surf/packages",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/surf-camp-tamraght",
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    path: "/gallery",
    frPath: "/fr/gallery",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/about",
    frPath: "/fr/about",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/faq",
    frPath: "/fr/faq",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/book",
    frPath: "/fr/book",
    changeFrequency: "weekly",
    priority: 0.9,
  },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [rooms, packages] = await Promise.all([
    getActiveRooms(),
    getActiveSurfPackages(),
  ]);

  const entries: MetadataRoute.Sitemap = publicRoutes.flatMap((route) => {
    const englishRoute = {
      url: route.path === "/" ? siteUrl : `${siteUrl}${route.path}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    };

    if (!("frPath" in route)) {
      return [englishRoute];
    }

    return [
      englishRoute,
      {
        url: `${siteUrl}${route.frPath}`,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      },
    ];
  });
  for (const path of [
    "/groups",
    "/partners",
    "/collaborate",
    "/contact",
    "/policies",
    ...rooms.map((r) => "/stay/" + r.slug),
    ...packages.map((p) => "/surf/packages/" + p.slug),
  ])
    for (const prefix of ["", "/fr"])
      entries.push({
        url: siteUrl + prefix + path,
        changeFrequency: "monthly",
        priority: 0.6,
      });
  return entries;
}
