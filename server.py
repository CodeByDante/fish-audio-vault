import sys
sys.dont_write_bytecode = True
import http.server
import socketserver
import json
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class SyncHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        try:
            self.send_response(200)
            self.end_headers()
        except Exception:
            pass

    def do_POST(self):
        if self.path == '/api/save':
            success = False
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                voices_path = os.path.join(DIRECTORY, 'voices.json')
                with open(voices_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                
                print(" -> [SERVIDOR] voices.json actualizado exitosamente en disco duro.")
                success = True
            except Exception as e:
                print(f" -> [ERROR] Error al guardar en disco: {e}")

            try:
                if success:
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
                else:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False}).encode('utf-8'))
            except Exception:
                # Silenciar errores de conexión interrumpida (WinError 10053) cuando el navegador cierra rápido el socket
                pass
        else:
            try:
                self.send_error(404, "Endpoint no encontrado")
            except Exception:
                pass

    def log_error(self, format, *args):
        # Evitar imprimir rastros feos por cierres abruptos de conexión del navegador
        pass

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), SyncHandler) as httpd:
        print("===================================================")
        print(f"  Servidor Web con Sincronizacion activa (http://localhost:{PORT})")
        print("===================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")
