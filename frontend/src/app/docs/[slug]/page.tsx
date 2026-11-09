import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DocsPage from "../docs-client";
import { DOC_PAGES } from "../routes";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
    return DOC_PAGES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const page = DOC_PAGES.find(page => page.slug === slug);
    if (!page) notFound();
    const url = `/docs/${page.slug}`;
    const title = `${page.title} | Karta documentation`;
    return {
        metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://karta.my.id"),
        title,
        description: page.description,
        alternates: { canonical: url },
        openGraph: { title, description: page.description, url, type: "article", siteName: "Karta" },
        twitter: { card: "summary", title, description: page.description },
        robots: { index: true, follow: true },
    };
}

export default async function GuidePage({ params }: Props) {
    const { slug } = await params;
    const page = DOC_PAGES.find(page => page.slug === slug);
    if (!page) notFound();
    return <DocsPage key={page.slug} slug={page.slug} />;
}
