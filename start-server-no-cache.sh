#!/bin/bash

# Pigeon70 SSTV Server Startup Script (No Cache Version)
# This script starts a local web server with cache-busting headers

echo "🐦 Starting Pigeon70 SSTV Server (No Cache)..."
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 found"
    echo "🌐 Starting server on http://localhost:8000"
    echo "📁 Serving files from: $(pwd)"
    echo "🚫 Cache disabled for development"
    echo ""
    echo "📋 Available pages:"
    echo "   • Main Interface: http://localhost:8000/Src/index.html"
    echo "   • Demo & Test:    http://localhost:8000/Src/demo.html"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Create a simple HTTP server with no-cache headers
    python3 -c "
import http.server
import socketserver
import os

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

PORT = 8000
with socketserver.TCPServer(('', PORT), NoCacheHTTPRequestHandler) as httpd:
    print(f'Serving at http://localhost:{PORT}')
    httpd.serve_forever()
"
elif command -v python &> /dev/null; then
    echo "✅ Python found"
    echo "🌐 Starting server on http://localhost:8000"
    echo "📁 Serving files from: $(pwd)"
    echo "🚫 Cache disabled for development"
    echo ""
    echo "📋 Available pages:"
    echo "   • Main Interface: http://localhost:8000/Src/index.html"
    echo "   • Demo & Test:    http://localhost:8000/Src/demo.html"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Create a simple HTTP server with no-cache headers
    python -c "
import http.server
import socketserver
import os

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

PORT = 8000
with socketserver.TCPServer(('', PORT), NoCacheHTTPRequestHandler) as httpd:
    print(f'Serving at http://localhost:{PORT}')
    httpd.serve_forever()
"
else
    echo "❌ Python not found!"
    echo ""
    echo "Please install Python 3 or use one of these alternatives:"
    echo ""
    echo "Node.js:"
    echo "  npx serve . --no-cache"
    echo ""
    echo "PHP:"
    echo "  php -S localhost:8000"
    echo ""
    echo "Or manually start a web server in this directory"
    exit 1
fi


