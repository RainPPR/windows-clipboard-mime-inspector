# AGENTS.md

This file provides guidance and instructions for AI coding agents working on the **Windows Clipboard MIME Inspector** repository.

## Project Overview

Windows Clipboard MIME Inspector is a single-screen Angular application built to analyze and debug Windows clipboard payloads. When users copy content in Windows applications (e.g., Microsoft Word, Chrome, Outlook, File Explorer), the clipboard holds multiple concurrent MIME formats. This tool captures all formats, displaying raw source code for text types and Hex/Binary inspector cards for binary blobs.

## Tech Stack & Architecture

- **Framework**: Angular 21 (Zoneless, Standalone Components, Signals state management)
- **Styling**: Tailwind CSS v4 with Angular Material icons (`<mat-icon>`)
- **Clipboard API**: `navigator.clipboard.read()`, `ClipboardItem`, `ClipboardEvent` interceptors, and drag-and-drop file readers
- **State Flow**: Reactive signals in `src/app/services/clipboard.service.ts`

## Build & Test Commands

- **Development Server**: `npm run dev` (Runs Angular dev server on port 3000)
- **Production Build**: `npm run build`
- **Linting**: `npm run lint`

## Code Conventions & Guidelines

1. **No Live Rendering**: Always show raw source code (`<code>`, `<pre>`) for HTML/XML/JSON payloads. Do NOT render untrusted HTML as DOM elements.
2. **Binary Safety**: Non-text bytes must be passed through the Hex dump generator (`generateHexDump`) and magic signature analyzer rather than decoded as garbled strings.
3. **Zoneless Signals**: Do NOT import `zone.js`. Use Angular `signal()`, `computed()`, and `effect()`.
4. **Standalone Components**: Do NOT set `standalone: true` (default in Angular 20+). Place imports directly inside the `@Component` decorator's `imports` array.
5. **No NgModel**: Use reactive signals or native event handlers (`(input)`, `(paste)`).
6. **Documentation Maintenance**: Always update `README.md`, `AGENTS.md`, and files under `docs/` whenever project features or architectures are updated.

## Security Considerations

- All pasted content is processed locally within the user's browser runtime. No clipboard data is transmitted to remote servers.
- Text decoding uses standard `TextDecoder` with non-fatal safety fallback to prevent crashes on malformed byte streams.
