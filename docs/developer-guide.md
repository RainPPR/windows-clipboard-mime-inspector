# Developer Guide & Testing Scenarios

## Testing Clipboard Workflows

When testing clipboard APIs in sandboxed iframe environments or cross-platform web browsers, clipboard access permissions may vary:

1. Direct Clipboard API: Clicking the primary Paste button invokes `navigator.clipboard.read()` (or fallback `readText()`), returning native ClipboardItem streams.
2. Keyboard Shortcut Listener: Pressing Ctrl+V anywhere while focused inside the application triggers native ClipboardEvent handling. By invoking `event.preventDefault()`, the browser standard text insertion is cancelled, preserving the full multi-format MIME payload without event override.
3. Drag and Drop: Dragging files from Windows Explorer or desktop into the workspace processes raw file buffers and constructs virtual path lists.
4. Test Presets: Clicking pre-built Windows test samples simulates rich Word documents, web clips, API JSON payloads, file drops, and image binaries instantly without requiring external copy actions.

## View Ergonomics & Controls

- Line Numbering & Line Wrapping: Toggle line numbers and text wrapping per format panel.
- Raw Code Copy: One-click copying of raw unrendered source streams.
- File Export: Download individual format streams as standalone files with auto-detected extensions.
- Dynamic Height Handling: Short payloads render in compact containers, while extensive code blocks utilize scrollable viewports with expand and collapse toggles.
