#!/bin/bash

# Pigeon70 SSTV Server Startup Script
# This script starts a local web server for the SSTV application

echo "🐦 Starting Pigeon70 SSTV Server..."
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 found"
    echo "🌐 Starting server on http://localhost:8000"
    echo "📁 Serving files from: $(pwd)"
    echo ""
    echo "📋 Available pages:"
    echo "   • Main Interface: http://localhost:8000/Src/index.html"
    echo "   • Demo & Test:    http://localhost:8000/Src/demo.html"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ Python found"
    echo "🌐 Starting server on http://localhost:8000"
    echo "📁 Serving files from: $(pwd)"
    echo ""
    echo "📋 Available pages:"
    echo "   • Main Interface: http://localhost:8000/Src/index.html"
    echo "   • Demo & Test:    http://localhost:8000/Src/demo.html"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    python -m SimpleHTTPServer 8000
else
    echo "❌ Python not found!"
    echo ""
    echo "Please install Python 3 or use one of these alternatives:"
    echo ""
    echo "Node.js:"
    echo "  npx serve ."
    echo ""
    echo "PHP:"
    echo "  php -S localhost:8000"
    echo ""
    echo "Or manually start a web server in this directory"
    exit 1
fi

