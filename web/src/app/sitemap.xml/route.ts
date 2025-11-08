// src/app/sitemap.xml/route.ts
export const dynamic = "force-static";

export async function GET(req: Request) {
  // Prefer a configured base URL in prod, fall back to the request host in dev
  const envBase = process.env.NEXT_PUBLIC_SITE_URL; // e.g. https://contractheaven.co.uk
  const origin = envBase ?? new URL(req.url).origin;

  const paths = ["/", "/contracts", "/letters", "/tools", "/litigation", "/about", "/pricing", "/privacy", "/terms", "/dashboard"];
  const urls = paths.map(p => `
  <url>
    <loc>${origin}${p}</loc>
    <changefreq>weekly</changefreq>
    <priority>${p === "/" ? "1.0" : "0.7"}</priority>
  </url>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml.trim(), {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=0, s-maxage=3600" }
  });
}
