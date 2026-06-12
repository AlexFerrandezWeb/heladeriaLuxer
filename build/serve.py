#!/usr/bin/env python3
"""Servidor local que entiende las URLs limpias (sin .html), igual que producción.

Uso:  python build/serve.py    ->  abre http://localhost:8000/
Así puedes navegar /helados, /en/granizados, etc. en tu PC.
"""
import http.server
import socketserver
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PORT = 8000

# Asegura el tipo MIME correcto para WebP
http.server.SimpleHTTPRequestHandler.extensions_map.setdefault(".webp", "image/webp")

class CleanURLHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path):
        full = super().translate_path(path)
        # /carpeta/  -> index.html
        if os.path.isdir(full):
            index = os.path.join(full, "index.html")
            if os.path.exists(index):
                return index
        # /helados (sin extensión y no existe) -> helados.html
        if not os.path.exists(full) and not os.path.splitext(full)[1]:
            if os.path.exists(full + ".html"):
                return full + ".html"
        return full

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), CleanURLHandler) as httpd:
        print(f"Sirviendo Heladería Luxer en  http://localhost:{PORT}/")
        print("Ctrl+C para parar.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")
