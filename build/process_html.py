#!/usr/bin/env python3
"""Cambios mecánicos SEO/rendimiento sobre las páginas ES (raíz).

- Enlaces internos .html -> URL limpia (/slug, index -> /)
- canonical / og:url / twitter:url .html -> URL limpia
- <img src> assets/*.png|jpg -> .webp
- favicon -> /assets/logo.webp
- og:image / twitter:image -> /assets/og-image.jpg
- añade loading="lazy" decoding="async" a imágenes de producto/categoría
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = sorted(p for p in ROOT.glob("*.html"))

DOMAIN = "https://heladerialuxer.es"

def process(text: str) -> str:
    # 1) Enlaces internos relativos .html -> limpios
    text = re.sub(r'href="index\.html"', 'href="/"', text)
    text = re.sub(r'href="([a-z_]+)\.html"', r'href="/\1"', text)

    # 2) URLs absolutas .html -> limpias (canonical, og:url, twitter:url)
    text = re.sub(r'(https://heladerialuxer\.es/)([a-z_]+)\.html', r'\1\2', text)

    # 3) Imágenes relativas png/jpg -> webp (no toca URLs absolutas http)
    text = re.sub(r'(src=")(/?assets/[A-Za-z0-9_-]+)\.(?:png|jpe?g)(")',
                  r'\1\2.webp\3', text)

    # 4) favicon -> webp del logo
    text = re.sub(r'(<link rel="icon"[^>]*href=")(?:/?assets/[A-Za-z0-9_.-]+)(")',
                  r'\1/assets/logo.webp\2', text)
    # asegura type correcto del icono
    text = re.sub(r'(<link rel="icon" type=")image/(?:jpeg|png)(")',
                  r'\1image/webp\2', text)

    # 5) og:image / twitter:image -> foto OG dedicada
    text = text.replace(f"{DOMAIN}/assets/logo.jpg", f"{DOMAIN}/assets/og-image.jpg")

    # 6) loading lazy en imágenes de producto y categoría
    def add_lazy(m):
        tag = m.group(0)
        if "loading=" in tag:
            return tag
        if "product-card__img" in tag or "category-card__img" in tag:
            return tag[:4] + ' loading="lazy" decoding="async"' + tag[4:]
        return tag
    text = re.sub(r'<img\b[^>]*>', add_lazy, text)

    return text

def main():
    for p in PAGES:
        original = p.read_text(encoding="utf-8")
        updated = process(original)
        if updated != original:
            p.write_text(updated, encoding="utf-8")
            print(f"  actualizado {p.name}")
        else:
            print(f"  sin cambios  {p.name}")

if __name__ == "__main__":
    main()
