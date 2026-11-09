import type { MetadataRoute } from "next";
import { DOC_PAGES } from "./routes";

export default function sitemap(): MetadataRoute.Sitemap {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://karta.my.id";
    return DOC_PAGES.map(page => ({ url: new URL(`/docs/${page.slug}`, base).href }));
}
