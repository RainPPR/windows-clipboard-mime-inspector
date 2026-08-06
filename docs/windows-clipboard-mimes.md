# Windows Clipboard MIME Specifications

## Windows Multi-Format Architecture

When a user copies content in Windows applications, the Windows OS Clipboard Manager (CF_CLIPBOARD) stores multiple parallel representations of the same selection to maximize cross-application compatibility.

## Key Windows Clipboard Formats

- Standard Text (CF_TEXT / CF_UNICODETEXT): Raw UTF-8 or UTF-16 text payloads without formatting.
- Windows HTML Format (HTML Format / text/html): Rich text copied from web browsers, Word, or Outlook. Begins with mandatory Win32 metadata headers detailing byte offset boundaries for fragments.
- Rich Text Format (Rich Text Format / text/rtf): Document formatting structure used by legacy Microsoft Office products and WordPad.
- Windows Drop Files (CF_HDROP / application/x-win-hdrop): Structure representing lists of files selected in Windows File Explorer.
- UniformResourceLocator: Windows shortcut link structures used when dragging or copying web links.

## Binary Magic Signature Catalog

To prevent garbled character rendering when inspecting binary payloads, the inspector evaluates file header magic bytes:

- PNG Image: Identified by 89 50 4E 47 signature.
- JPEG Image: Identified by FF D8 FF signature.
- Windows Bitmap (DIB): Identified by 42 4D (BM) signature.
- ZIP Archive / Office Document: Identified by 50 4B 03 04 signature.
- PDF Document: Identified by 25 50 44 46 (%PDF) signature.
- Executable Module: Identified by 4D 5A (MZ) signature.
