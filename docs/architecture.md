# System Architecture

## Overview

The Windows Clipboard MIME Inspector is engineered as a zero-dependency client-side analyzer. It leverages modern Web Clipboard APIs alongside synthetic fallback handlers to process high-volume Windows clipboard formats seamlessly.

## Core Component Hierarchy

- Header Module: Displays real-time capture metrics, active session statistics, and session cleanup controls.
- Input & Capture Module: Integrates a primary paste action button, native event interceptors for keyboard events, and drag-and-drop file targets.
- Session Summary & Filter Bar: Offers multi-category filtering, keyword search, and format inventory totals.
- Format Cards List: Dynamically instantiates individual inspector panels for every detected MIME type.

## Data Processing Pipeline

1. Ingestion Stage: Captures items from Clipboard API streams, paste events, or dropped file buffers.
2. Event Isolation: Uses `event.preventDefault()` on native paste events to prevent standard browser DOM text insertion and secondary `(input)` event collision.
3. Multi-Format Extraction: Queries `clipboardData.items`, `clipboardData.types`, and candidate MIME types (`text/plain`, `text/html`, `text/rtf`, `HTML Format`, `text/uri-list`, etc.) for every text payload and file blob.
4. Binary Heuristic Analysis: Evaluates byte distributions, null-byte presence, and MIME headers to classify payloads into text versus binary streams.
5. Metadata Extraction: Parses Windows Win32 API clipboard headers for HTML fragments, calculates UTF byte lengths, and identifies magic byte signatures for binary archives and images.
6. Smart Format Derivation: Automatically identifies valid JSON structures, RTF tags (`{\rtf`), or Windows HTML fragment headers embedded within primary text streams.
7. Reactive View Dispatch: Updates signals-based store models, triggering smooth list rerendering without layout reflows.
