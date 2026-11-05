import "server-only";
import { cache } from "react";
import { publishedContent } from "./public";
import { brandingSchema } from "./branding-schema";
export const getBranding = cache(
  async () =>
    (await publishedContent("page", "branding", "en"))?.branding ||
    brandingSchema.parse({}),
);
