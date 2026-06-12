#!/usr/bin/env python3
"""Optimiza las imágenes de assets/ generando versiones WebP redimensionadas.

- Redimensiona al lado mayor MAX_SIZE (sin ampliar imágenes pequeñas).
- Exporta a WebP con calidad QUALITY.
- No borra los originales (quedan como respaldo).
- Es idempotente: vuelve a generar siempre el .webp desde el original.
"""
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
MAX_SIZE = 1000          # px en el lado mayor
QUALITY = 80
LOGO_MAX = 400           # el logo se muestra pequeño

# Extensiones de origen que convertimos
SRC_EXTS = {".png", ".jpg", ".jpeg", ".webp"}

def target_max(name: str) -> int:
    n = name.lower()
    if n.startswith("logo") or n.startswith("logofav"):
        return LOGO_MAX
    return MAX_SIZE

def convert(path: Path) -> tuple[int, int]:
    """Devuelve (bytes_origen, bytes_webp)."""
    out = path.with_suffix(".webp")
    src_bytes = path.stat().st_size
    with Image.open(path) as im:
        # Conserva transparencia si la hay
        if im.mode in ("P", "LA"):
            im = im.convert("RGBA")
        elif im.mode == "CMYK":
            im = im.convert("RGB")
        mx = target_max(path.stem)
        w, h = im.size
        scale = min(1.0, mx / max(w, h))
        if scale < 1.0:
            im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
        has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
        save_kwargs = dict(quality=QUALITY, method=6)
        im.save(out, "WEBP", **save_kwargs)
    return src_bytes, out.stat().st_size

def main():
    images = sorted(p for p in ASSETS.iterdir()
                    if p.is_file() and p.suffix.lower() in SRC_EXTS and p.suffix.lower() != ".webp")
    # también re-optimizamos los .webp existentes (suelen venir sin redimensionar)
    webps = sorted(p for p in ASSETS.iterdir()
                   if p.is_file() and p.suffix.lower() == ".webp")
    total_src = total_out = 0
    count = 0
    for p in images:
        try:
            s, o = convert(p)
            total_src += s; total_out += o; count += 1
        except Exception as e:
            print(f"  ERROR {p.name}: {e}", file=sys.stderr)
    for p in webps:
        # re-optimiza in-place a través de un temporal
        try:
            with Image.open(p) as im:
                w, h = im.size
            if max(w, h) > MAX_SIZE:
                s, o = convert(p)  # sobreescribe el mismo .webp
                total_src += s; total_out += o; count += 1
        except Exception as e:
            print(f"  ERROR {p.name}: {e}", file=sys.stderr)
    mb = 1024 * 1024
    print(f"Convertidas {count} imágenes")
    print(f"Origen:  {total_src/mb:7.1f} MB")
    print(f"WebP:    {total_out/mb:7.1f} MB")
    if total_src:
        print(f"Ahorro:  {100*(1-total_out/total_src):5.1f} %")

if __name__ == "__main__":
    main()
