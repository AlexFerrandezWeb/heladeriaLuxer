#!/usr/bin/env python3
"""Inyecta hreflang + og:locale en cada página ES (raíz), tras el canonical.

Idempotente: si ya existe el bloque hreflang, no lo duplica.
El slug se calcula del nombre de archivo (index -> "").
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOMAIN = "https://heladerialuxer.es"
PAGES = sorted(p for p in ROOT.glob("*.html"))

def slug_for(p: Path) -> str:
    return "" if p.stem == "index" else p.stem

def hreflang_block(slug: str) -> str:
    path = f"/{slug}" if slug else "/"
    return (
        f'    <link rel="alternate" hreflang="es" href="{DOMAIN}{path}">\n'
        f'    <link rel="alternate" hreflang="en" href="{DOMAIN}/en{path}">\n'
        f'    <link rel="alternate" hreflang="fr" href="{DOMAIN}/fr{path}">\n'
        f'    <link rel="alternate" hreflang="x-default" href="{DOMAIN}{path}">\n'
        f'    <meta property="og:locale" content="es_ES">\n'
        f'    <meta property="og:locale:alternate" content="en_GB">\n'
        f'    <meta property="og:locale:alternate" content="fr_FR">\n'
    )

def main():
    for p in PAGES:
        text = p.read_text(encoding="utf-8")
        if 'hreflang="es"' in text:
            print(f"  ya tiene hreflang  {p.name}")
            continue
        block = hreflang_block(slug_for(p))
        # insertar justo después de la etiqueta canonical
        new = re.sub(r'(<link rel="canonical"[^>]*>\n)', r'\1' + block, text, count=1)
        if new == text:
            print(f"  SIN canonical (no insertado): {p.name}")
            continue
        p.write_text(new, encoding="utf-8")
        print(f"  hreflang insertado  {p.name}")

if __name__ == "__main__":
    main()
