# Windows Clipboard MIME Inspector (Windows 剪贴板 MIME 格式调试器)

A high-performance developer debugging tool designed to inspect, analyze, and parse Windows Clipboard multi-format MIME data payloads.

## Key Features

- **Automated Clipboard Capture**: Click the "Paste" (粘贴) button to read via `navigator.clipboard.read()` or press <kbd>Ctrl + V</kbd> / drag files into the workspace.
- **Multi-Format Parsing**: Dynamically detects and renders every available MIME type (e.g., `text/plain`, `text/html`, `text/rtf`, `application/json`, `image/png`, `CF_HDROP`, `CF_UNICODETEXT`).
- **Raw Source Display**: Shows unrendered raw source code for text formats (HTML, JSON, XML, RTF) without live DOM rendering, preserving native headers like Windows `StartHTML`/`EndHTML`.
- **Binary Payload Inspector**: Inspects binary formats with Hex dumps (Address | Hex | ASCII), magic byte signature recognition (PNG, JPEG, GIF, BMP, ZIP, PDF, EXE), Base64 exports, and file downloads.
- **Dynamic Ergonomics**: Content heights adjust automatically—short payloads fit tightly, while long payloads offer scrollable containers with expand/collapse toggles and line numbers.
- **Test Presets**: Includes one-click sample presets simulating Microsoft Word copy, Web selection, API payloads, Windows File Manager drops, and PNG images.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:3000` in your browser.
