# How to View the Web Documentation

This documentation is built using Docsify, which requires a web server to function properly due to browser security restrictions.

## Quick Start Options

### Option 1: VS Code Live Server (Recommended)
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"
4. Your browser will open with the documentation

### Option 2: Python HTTP Server
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```
Then open http://localhost:8000 in your browser

### Option 3: Node.js HTTP Server
```bash
# Install globally (one time)
npm install -g http-server

# Run in this directory
http-server -p 8000
```
Then open http://localhost:8000 in your browser

### Option 4: NPX (No installation needed)
```bash
npx http-server -p 8000
```
Then open http://localhost:8000 in your browser

## Why is this needed?

Modern browsers block loading local files via JavaScript for security reasons (CORS policy). Docsify needs to load Markdown files dynamically, which requires serving the files through a web server.

## Documentation Contents

This documentation includes:
- **DAT File Format Reference**: Complete specification of all sections
- **Scripting Guide**: How to write scripts for Manic Miners maps  
- **Tile Reference**: All tile types and their IDs
- **Classes Reference**: Buildings, vehicles, miners, creatures, etc.
- **Examples**: Sample scripts and common patterns

## Alternative Viewing

If you can't run a local server, you can also:
1. View the markdown files directly in VS Code or any text editor
2. Browse the `_pages/` directory for individual documentation files
3. Check if this documentation is hosted online