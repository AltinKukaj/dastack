/** Sitemap generator — lists public routes with priority and lastModified for SEO. */
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), priority: 1.0 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), priority: 0.8 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), priority: 0.6 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), priority: 0.3 },
  ];
}
