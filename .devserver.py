import http.server
import os
import socketserver

PORT = 8000
ROOT = os.path.dirname(os.path.abspath(__file__))


class CleanURLHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Evita que el navegador cachee durante el desarrollo
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def translate_path(self, path):
        local = super().translate_path(path)
        # If it maps to an existing file or directory, serve as-is
        if os.path.isdir(local):
            return local
        if os.path.isfile(local):
            return local
        # Clean URL: no extension -> try appending .html
        root, ext = os.path.splitext(local)
        if not ext:
            html = local + ".html"
            if os.path.isfile(html):
                return html
        return local


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), CleanURLHandler) as httpd:
    os.chdir(ROOT)
    print(f"Serving {ROOT} at http://localhost:{PORT}")
    httpd.serve_forever()
