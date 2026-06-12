#!/usr/bin/env python3
"""Genera sitemap.xml con URLs limpias en es/en/fr y alternates hreflang."""
from pathlib import Path
from datetime import date

ROOT = Path(__file__).resolve().parent.parent
DOMAIN = "https://heladerialuxer.es"
LASTMOD = date.today().isoformat()

# (slug, changefreq, priority)
PAGES = [
    ("",                  "daily",  "1.0"),
    ("helados",           "weekly", "0.9"),
    ("granizados",        "weekly", "0.9"),
    ("batidos",           "weekly", "0.9"),
    ("bebidas",           "weekly", "0.8"),
    ("combinados",        "weekly", "0.8"),
    ("desayunos_postres", "weekly", "0.8"),
    ("privacidad",        "yearly", "0.3"),
    ("cookies",           "yearly", "0.3"),
    ("terminos",          "yearly", "0.3"),
]
LANGS = ["es", "en", "fr"]

def url_for(lang: str, slug: str) -> str:
    if lang == "es":
        return f"{DOMAIN}/" if slug == "" else f"{DOMAIN}/{slug}"
    return f"{DOMAIN}/{lang}/" if slug == "" else f"{DOMAIN}/{lang}/{slug}"

def alternates(slug: str) -> str:
    links = []
    for lang in LANGS:
        links.append(f'        <xhtml:link rel="alternate" hreflang="{lang}" href="{url_for(lang, slug)}"/>')
    links.append(f'        <xhtml:link rel="alternate" hreflang="x-default" href="{url_for("es", slug)}"/>')
    return "\n".join(links)

def main():
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
           '        xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for slug, cf, pr in PAGES:
        alt = alternates(slug)
        for lang in LANGS:
            out.append("    <url>")
            out.append(f"        <loc>{url_for(lang, slug)}</loc>")
            out.append(alt)
            out.append(f"        <lastmod>{LASTMOD}</lastmod>")
            out.append(f"        <changefreq>{cf}</changefreq>")
            out.append(f"        <priority>{pr}</priority>")
            out.append("    </url>")
    out.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"sitemap.xml generado: {len(PAGES) * len(LANGS)} URLs")

if __name__ == "__main__":
    main()
