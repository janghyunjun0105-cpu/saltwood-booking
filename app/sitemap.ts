import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/restaurant";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  return [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/book`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/manage`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
