import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/restaurant";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/book/confirmation/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
