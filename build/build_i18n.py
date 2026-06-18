#!/usr/bin/env python3
"""Genera las versiones /en/ y /fr/ a partir de las páginas ES (raíz).

- Traduce el contenido marcado con data-i18n (desde translations.json).
- Aplica title/description/og optimizados por idioma (META).
- Ajusta canonical, og:url, twitter:url, og:locale y <html lang>.
- Prefija los enlaces internos con /en o /fr (no toca assets ni recursos).
- Mantiene el bloque hreflang (idéntico en los 3 idiomas).
"""
import re
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOMAIN = "https://heladerialuxer.es"
T = json.loads((ROOT / "build" / "translations.json").read_text(encoding="utf-8"))

LOCALE = {"es": "es_ES", "en": "en_GB", "fr": "fr_FR"}

# title/description optimizados por idioma y por slug ('' = portada)
META = {
 "en": {
  "":                 ("Luxer Ice Cream Parlour in Lo Pagán & San Pedro del Pinatar | Murcia Coast",
                        "Luxer ice cream parlour in Lo Pagán, San Pedro del Pinatar (Murcia, Spain). Artisan ice cream, slushies, milkshakes, cocktails and desserts by the beach. Open all summer."),
  "helados":          ("Artisan Ice Cream in Lo Pagán & San Pedro del Pinatar | Luxer",
                        "The best artisan ice cream in Lo Pagán and San Pedro del Pinatar. Over 20 unique flavours, sugar-free and lactose-free options. Open all summer on the Murcia coast."),
  "granizados":       ("Refreshing Slushies in Lo Pagán & San Pedro del Pinatar | Luxer",
                        "Refreshing slushies in Lo Pagán and San Pedro del Pinatar: lemon, strawberry, mint and more. Perfect for summer on the Murcia coast."),
  "batidos":          ("Milkshakes & Waffles in Lo Pagán & San Pedro del Pinatar | Luxer",
                        "Delicious milkshakes and homemade waffles in Lo Pagán and San Pedro del Pinatar. Natural fruit milkshakes and sweet treats on the Murcia coast."),
  "bebidas":          ("Refreshing Drinks in Lo Pagán & San Pedro del Pinatar | Luxer",
                        "Refreshing drinks in Lo Pagán and San Pedro del Pinatar: soft drinks, natural juices and coffee for summer on the Murcia coast."),
  "combinados":       ("Cocktails & Drinks in Lo Pagán & San Pedro del Pinatar | Luxer",
                        "Cocktails and mixed drinks in Lo Pagán and San Pedro del Pinatar. Enjoy a drink by the beach on the Murcia coast."),
  "desayunos_postres":("Breakfast & Desserts in Lo Pagán & San Pedro del Pinatar | Luxer",
                        "Breakfast and desserts at Luxer in Lo Pagán and San Pedro del Pinatar: toasts, croissants, coffee, tea and homemade sweets on the Murcia coast."),
  "privacidad":       ("Privacy Policy | Luxer Ice Cream",
                        "Privacy policy for Luxer Ice Cream. Information about how we process your personal data."),
  "cookies":          ("Cookie Policy | Luxer Ice Cream",
                        "Cookie policy for Luxer Ice Cream. Information about the use of cookies on our website."),
  "terminos":         ("Terms & Conditions | Luxer Ice Cream",
                        "Terms and conditions of use for the Luxer Ice Cream website."),
 },
 "fr": {
  "":                 ("Glacier Luxer à Lo Pagán & San Pedro del Pinatar | Côte de Murcie",
                        "Glacier Luxer à Lo Pagán, San Pedro del Pinatar (Murcie, Espagne). Glaces artisanales, granités, milk-shakes, cocktails et desserts au bord de la plage. Ouvert tout l'été."),
  "helados":          ("Glaces Artisanales à Lo Pagán & San Pedro del Pinatar | Luxer",
                        "Les meilleures glaces artisanales à Lo Pagán et San Pedro del Pinatar. Plus de 20 parfums, options sans sucre et sans lactose. Ouvert tout l'été sur la côte de Murcie."),
  "granizados":       ("Granités Rafraîchissants à Lo Pagán & San Pedro del Pinatar | Luxer",
                        "Granités rafraîchissants à Lo Pagán et San Pedro del Pinatar : citron, fraise, menthe et plus. Parfaits pour l'été sur la côte de Murcie."),
  "batidos":          ("Milk-shakes & Gaufres à Lo Pagán & San Pedro del Pinatar | Luxer",
                        "Délicieux milk-shakes et gaufres maison à Lo Pagán et San Pedro del Pinatar. Milk-shakes aux fruits naturels sur la côte de Murcie."),
  "bebidas":          ("Boissons Rafraîchissantes à Lo Pagán & San Pedro del Pinatar | Luxer",
                        "Boissons rafraîchissantes à Lo Pagán et San Pedro del Pinatar : sodas, jus naturels et cafés pour l'été sur la côte de Murcie."),
  "combinados":       ("Cocktails & Boissons à Lo Pagán & San Pedro del Pinatar | Luxer",
                        "Cocktails et boissons à Lo Pagán et San Pedro del Pinatar. Profitez d'un verre au bord de la plage sur la côte de Murcie."),
  "desayunos_postres":("Petit-déjeuner & Desserts à Lo Pagán & San Pedro del Pinatar | Luxer",
                        "Petit-déjeuner et desserts chez Luxer à Lo Pagán et San Pedro del Pinatar : tartines, croissants, café, thé et douceurs maison sur la côte de Murcie."),
  "privacidad":       ("Politique de Confidentialité | Glacier Luxer",
                        "Politique de confidentialité du Glacier Luxer. Informations sur le traitement de vos données personnelles."),
  "cookies":          ("Politique de Cookies | Glacier Luxer",
                        "Politique de cookies du Glacier Luxer. Informations sur l'utilisation des cookies sur notre site web."),
  "terminos":         ("Conditions Générales | Glacier Luxer",
                        "Conditions générales d'utilisation du site web du Glacier Luxer."),
 },
}

I18N_RE = re.compile(r'(<(\w+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>)(.*?)(</\2>)', re.DOTALL)
META_RE = lambda attr: re.compile(r'(<meta (?:name|property)="' + re.escape(attr) + r'" content=")[^"]*(">)')
LINK_RE = re.compile(r'href="/(?!assets/)([a-z_]*)"')

# Texto de respaldo (estático) del overlay de bienvenida. script.js lo sustituye
# en runtime según la hora del día; aquí dejamos un saludo NEUTRO en el idioma
# correcto para que el HTML renderizado no contenga español (señal de idioma).
WELCOME_FALLBACK = {
 "en": ("Hello!", "Welcome to Heladería Luxer"),
 "fr": ("Bonjour !", "Bienvenue chez Heladería Luxer"),
}
WELCOME_GREETING_RE = re.compile(r'(<h2\b[^>]*\bid="welcome-greeting"[^>]*>).*?(</h2>)', re.DOTALL)
WELCOME_SUB_RE = re.compile(r'(<p\b[^>]*\bid="welcome-sub"[^>]*>).*?(</p>)', re.DOTALL)

def slug_for(p: Path) -> str:
    return "" if p.stem == "index" else p.stem

def translate_body(text: str, table: dict) -> str:
    def repl(m):
        key = m.group(3)
        val = table.get(key)
        if val is None:
            return m.group(0)
        return m.group(1) + html.escape(val) + m.group(5)
    return I18N_RE.sub(repl, text)

def set_meta(text: str, attr: str, value: str) -> str:
    return META_RE(attr).sub(lambda m: m.group(1) + html.escape(value, quote=True) + m.group(2), text)

def set_welcome_fallback(text: str, lang: str) -> str:
    """Traduce el saludo estático del overlay (#welcome-greeting / #welcome-sub).
    Solo afecta a la portada; en el resto de páginas el regex no encuentra nada."""
    fb = WELCOME_FALLBACK.get(lang)
    if not fb:
        return text
    greet, sub = fb
    text = WELCOME_GREETING_RE.sub(lambda m: m.group(1) + html.escape(greet) + m.group(2), text, count=1)
    text = WELCOME_SUB_RE.sub(lambda m: m.group(1) + html.escape(sub) + m.group(2), text, count=1)
    return text

def og_locale_block(lang: str) -> str:
    main = LOCALE[lang]
    alts = [LOCALE[l] for l in ("es", "en", "fr") if l != lang]
    return (f'<meta property="og:locale" content="{main}">\n'
            f'    <meta property="og:locale:alternate" content="{alts[0]}">\n'
            f'    <meta property="og:locale:alternate" content="{alts[1]}">')

ES_LOCALE_BLOCK = ('<meta property="og:locale" content="es_ES">\n'
                   '    <meta property="og:locale:alternate" content="en_GB">\n'
                   '    <meta property="og:locale:alternate" content="fr_FR">')

def build_page(src: Path, lang: str):
    text = src.read_text(encoding="utf-8")
    slug = slug_for(src)
    cp = "/" if slug == "" else f"/{slug}"
    lp = f"/{lang}/" if slug == "" else f"/{lang}/{slug}"

    # 1) idioma del documento
    text = text.replace('<html lang="es">', f'<html lang="{lang}">', 1)
    # 2) cuerpo traducido
    text = translate_body(text, T[lang])
    # 2b) saludo estático del overlay de bienvenida (sin data-i18n; lo pone JS)
    text = set_welcome_fallback(text, lang)
    # 3) title + meta (solo si hay META para el slug)
    if slug in META[lang]:
        title, desc = META[lang][slug]
        text = re.sub(r'<title>.*?</title>', f'<title>{html.escape(title)}</title>', text, count=1, flags=re.DOTALL)
        text = set_meta(text, "description", desc)
        text = set_meta(text, "og:title", title)
        text = set_meta(text, "og:description", desc)
        text = set_meta(text, "twitter:title", title)
        text = set_meta(text, "twitter:description", desc)
    # 4) canonical / og:url / twitter:url -> versión de idioma
    text = text.replace(f'rel="canonical" href="{DOMAIN}{cp}"', f'rel="canonical" href="{DOMAIN}{lp}"')
    text = text.replace(f'property="og:url" content="{DOMAIN}{cp}"', f'property="og:url" content="{DOMAIN}{lp}"')
    text = text.replace(f'property="twitter:url" content="{DOMAIN}{cp}"', f'property="twitter:url" content="{DOMAIN}{lp}"')
    # 5) og:locale del idioma
    text = text.replace(ES_LOCALE_BLOCK, og_locale_block(lang), 1)
    # 6) enlaces internos con prefijo de idioma
    text = LINK_RE.sub(lambda m: f'href="/{lang}/{m.group(1)}"', text)

    out = ROOT / lang / src.name
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, encoding="utf-8")
    return out.relative_to(ROOT)

TITLE_RE = re.compile(r'<title>(.*?)</title>', re.DOTALL)
DESC_RE = re.compile(r'<meta name="description" content="(.*?)">', re.DOTALL)

def _extract_meta(path: Path):
    """Devuelve (title, description) de un HTML, sin entidades HTML."""
    t = path.read_text(encoding="utf-8")
    tm = TITLE_RE.search(t)
    dm = DESC_RE.search(t)
    return (html.unescape(tm.group(1).strip()) if tm else "",
            html.unescape(dm.group(1)) if dm else "")

def generate_meta_js(pages):
    """Genera meta_i18n.js con title/description por idioma y por slug, leídos
    de las páginas ES (raíz) y de las generadas en /en y /fr. Lo usa el cliente
    para cambiar <title> y meta description al cambiar de idioma sin recargar."""
    meta = {"es": {}, "en": {}, "fr": {}}
    for p in pages:
        slug = slug_for(p)
        title, desc = _extract_meta(p)
        meta["es"][slug] = {"title": title, "description": desc}
        for lang in ("en", "fr"):
            lp = ROOT / lang / p.name
            if lp.exists():
                lt, ld = _extract_meta(lp)
                meta[lang][slug] = {"title": lt, "description": ld}
    out = ROOT / "meta_i18n.js"
    out.write_text("window.META_I18N = " + json.dumps(meta, ensure_ascii=False) + ";\n",
                   encoding="utf-8")
    print("  generado meta_i18n.js")

def main():
    pages = sorted(p for p in ROOT.glob("*.html"))
    for lang in ("en", "fr"):
        for p in pages:
            rel = build_page(p, lang)
            print(f"  generado {rel}")
    generate_meta_js(pages)

if __name__ == "__main__":
    main()
