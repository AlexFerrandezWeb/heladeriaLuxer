# Build / SEO — Heladería Luxer

Scripts para optimizar imágenes y generar las versiones multiidioma del sitio.
El **español es la fuente** (archivos `.html` de la raíz). Las carpetas `en/` y
`fr/` se **generan** a partir de la raíz: no las edites a mano.

## Flujo completo (orden recomendado)

```bash
# 1. Optimizar imágenes a WebP (solo si añades/cambias fotos en assets/)
python build/optimize_images.py

# 2. Exportar las traducciones de translations.js a JSON
node -e "const fs=require('fs'),vm=require('vm');const s=fs.readFileSync('translations.js','utf8');const c={};vm.createContext(c);vm.runInContext(s+';__t=translations;',c);fs.writeFileSync('build/translations.json',JSON.stringify(c.__t));"

# 3. Generar /en/ y /fr/ desde las páginas ES
python build/build_i18n.py

# 4. Regenerar el sitemap
python build/generate_sitemap.py
```

`process_html.py` e `inject_head.py` fueron transformaciones de una sola vez sobre
la raíz ES (URLs limpias, WebP, lazy-load, hreflang). Ya están aplicadas; no hace
falta volver a ejecutarlas salvo que crees una página ES nueva desde cero.

## Si editas contenido

- **Texto traducible**: edita `translations.js` (claves `data-i18n`) y repite pasos 2-3.
- **Títulos/descripciones/H1 de en y fr**: edita los diccionarios `META` y `H1`
  dentro de `build_i18n.py` y repite el paso 3.
- **Nueva página ES**: créala en la raíz siguiendo el patrón de las existentes
  (URLs limpias, canonical, bloque hreflang, recursos con ruta `/...`),
  añádela a `generate_sitemap.py` y a `PAGES`, y repite pasos 3-4.

## Notas de despliegue

- Los originales `.png/.jpg` en `assets/` ya **no se usan** (solo `.webp`). Son
  respaldo; conviene **no subirlos** al hosting para no inflar el despliegue.
- El hosting sirve URLs limpias (sin `.html`). `/en/helados` -> `/en/helados.html`.
