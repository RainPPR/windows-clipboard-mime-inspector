import { Injectable, signal, computed } from '@angular/core';
import {
  ClipboardFormat,
  ClipboardSession,
  FormatCategory,
  MagicByteInfo,
  SamplePreset,
  WindowsHtmlHeaders,
} from '../models/clipboard.model';

@Injectable({
  providedIn: 'root',
})
export class ClipboardService {
  readonly currentSession = signal<ClipboardSession | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly activeCategoryFilter = signal<string>('all');
  readonly searchQuery = signal<string>('');

  readonly filteredFormats = computed(() => {
    const session = this.currentSession();
    if (!session) return [];

    const category = this.activeCategoryFilter();
    const query = this.searchQuery().toLowerCase().trim();

    return session.formats.filter((format) => {
      // Category filter
      let matchesCategory = true;
      if (category === 'text') {
        matchesCategory = !format.isBinary;
      } else if (category === 'binary') {
        matchesCategory = format.isBinary;
      } else if (category === 'html') {
        matchesCategory = format.category === 'html' || format.mimeType.includes('html');
      } else if (category === 'custom') {
        matchesCategory = format.isCustomWindowsFormat || !format.mimeType.includes('/');
      }

      if (!matchesCategory) return false;

      // Search query filter
      if (!query) return true;

      const mimeMatch = format.mimeType.toLowerCase().includes(query);
      const textMatch = format.textContent?.toLowerCase().includes(query) ?? false;
      const hexMatch = format.hexPreview?.toLowerCase().includes(query) ?? false;
      const magicMatch = format.magicByteInfo?.formatName.toLowerCase().includes(query) ?? false;

      return mimeMatch || textMatch || hexMatch || magicMatch;
    });
  });

  readonly formatStats = computed(() => {
    const session = this.currentSession();
    if (!session) return { total: 0, textCount: 0, binaryCount: 0, totalBytes: 0 };

    const textCount = session.formats.filter((f) => !f.isBinary).length;
    const binaryCount = session.formats.filter((f) => f.isBinary).length;
    const totalBytes = session.formats.reduce((acc, f) => acc + f.byteSize, 0);

    return {
      total: session.formats.length,
      textCount,
      binaryCount,
      totalBytes,
    };
  });

  /**
   * Main Paste Action triggered by User "粘贴" button
   */
  async pasteFromClipboard(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      if (navigator.clipboard && 'read' in navigator.clipboard) {
        try {
          const items = await navigator.clipboard.read();
          const parsedFormats: ClipboardFormat[] = [];

          for (const item of items) {
            for (const type of item.types) {
              try {
                const blob = await item.getType(type);
                const format = await this.processBlobToFormat(blob, type);
                parsedFormats.push(format);
              } catch (err) {
                console.warn(`Could not read MIME type ${type}:`, err);
              }
            }
          }

          if (parsedFormats.length > 0) {
            this.setSession('clipboard-api', parsedFormats);
            this.isLoading.set(false);
            return;
          }
        } catch (apiErr: unknown) {
          console.log('navigator.clipboard.read() constrained or denied, trying readText() fallback', apiErr);
        }
      }

      // Fallback 1: navigator.clipboard.readText()
      if (navigator.clipboard && 'readText' in navigator.clipboard) {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            this.processManualTextInput(text);
            this.isLoading.set(false);
            return;
          }
        } catch (readTextErr: unknown) {
          console.warn('readText fallback failed:', readTextErr);
        }
      }

      this.errorMessage.set(
        '浏览器拒绝剪贴板读取权限或剪贴板为空。请直接在下方文本框按 Ctrl+V 粘贴，或加载测试预设。'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.errorMessage.set(`读取剪贴板失败: ${msg}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Process paste event (e.clipboardData)
   */
  async processPasteEvent(event: ClipboardEvent): Promise<void> {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const parsedFormats: ClipboardFormat[] = [];
      const types = Array.from(clipboardData.types || []);

      // 1. Process files from items first
      if (clipboardData.items && clipboardData.items.length > 0) {
        for (const item of Array.from(clipboardData.items)) {
          if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) {
              const mime = file.type || item.type || 'application/octet-stream';
              const format = await this.processBlobToFormat(file, mime);
              parsedFormats.push(format);
            }
          }
        }
      }

      // 2. Extract all string types from clipboardData.types and standard Windows format strings
      const standardFormats = ['text/plain', 'text/html', 'text/rtf', 'text/uri-list', 'text/x-moz-url', 'HTML Format'];
      const candidateTypes = Array.from(new Set([...types, ...standardFormats]));

      for (const t of candidateTypes) {
        if (!t) continue;
        try {
          const data = clipboardData.getData(t);
          if (data && !parsedFormats.some((f) => f.mimeType === t)) {
            parsedFormats.push(this.createStringFormat(data, t));
          }
        } catch {
          // format access error ignored
        }
      }

      // 3. Extract items string content if any type was missing
      if (clipboardData.items && clipboardData.items.length > 0) {
        for (const item of Array.from(clipboardData.items)) {
          if (item.kind === 'string' && item.type) {
            if (!parsedFormats.some((f) => f.mimeType === item.type)) {
              await new Promise<void>((resolve) => {
                item.getAsString((str) => {
                  if (str) {
                    parsedFormats.push(this.createStringFormat(str, item.type));
                  }
                  resolve();
                });
              });
            }
          }
        }
      }

      // 4. Smart derivation of rich formats if primary text contains embedded format structures
      const htmlFmt = parsedFormats.find((f) => f.mimeType === 'text/html' || f.mimeType === 'HTML Format');
      const plainFmt = parsedFormats.find((f) => f.mimeType === 'text/plain');
      const primaryText = htmlFmt?.textContent || plainFmt?.textContent || '';

      // Auto derive JSON format if valid JSON string
      if (primaryText && !parsedFormats.some((f) => f.mimeType === 'application/json')) {
        try {
          JSON.parse(primaryText.trim());
          parsedFormats.push(this.createStringFormat(primaryText, 'application/json'));
        } catch (jsonErr: unknown) {
          console.debug('Not a valid JSON string:', jsonErr);
        }
      }

      // Auto derive RTF format if text begins with {\rtf
      if (primaryText && primaryText.trim().startsWith('{\\rtf') && !parsedFormats.some((f) => f.mimeType === 'text/rtf')) {
        parsedFormats.push(this.createStringFormat(primaryText, 'text/rtf'));
      }

      // Auto derive HTML format if plain text contains HTML tag structure
      if (primaryText && primaryText.includes('<') && primaryText.includes('>') && !parsedFormats.some((f) => f.mimeType.includes('html'))) {
        parsedFormats.push(this.createStringFormat(primaryText, 'text/html'));
      }

      // If text/html contains Windows HTML headers (Version:0.9 / StartHTML:...), make sure HTML Format is present
      if (htmlFmt?.textContent && htmlFmt.textContent.includes('StartHTML:') && !parsedFormats.some((f) => f.mimeType === 'HTML Format')) {
        parsedFormats.push(this.createStringFormat(htmlFmt.textContent, 'HTML Format'));
      }

      if (parsedFormats.length > 0) {
        this.setSession('paste-event', parsedFormats);
      } else {
        this.errorMessage.set('剪贴板中未提取到有效 MIME 数据。');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.errorMessage.set(`处理粘贴数据异常: ${msg}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Process dropped files or raw data
   */
  async processDroppedFiles(files: FileList | File[]): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const parsedFormats: ClipboardFormat[] = [];
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        const type = file.type || 'application/octet-stream';
        const format = await this.processBlobToFormat(file, type);
        parsedFormats.push(format);
      }

      // Add a virtual uri-list or file list
      const uriListText = fileArray.map((f) => `file:///${f.name}`).join('\r\n');
      parsedFormats.unshift(this.createStringFormat(uriListText, 'text/uri-list'));

      this.setSession('drag-drop', parsedFormats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.errorMessage.set(`读取拖拽文件失败: ${msg}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Process manual raw text input
   */
  processManualTextInput(rawText: string): void {
    if (!rawText.trim()) return;

    const parsedFormats: ClipboardFormat[] = [];
    parsedFormats.push(this.createPlainTextFormat(rawText));

    // Auto detect if valid JSON
    try {
      JSON.parse(rawText);
      parsedFormats.push(this.createStringFormat(rawText, 'application/json'));
    } catch {
      // Ignored if not valid JSON
    }

    // Auto detect if HTML
    if (rawText.includes('<') && rawText.includes('>')) {
      parsedFormats.push(this.createStringFormat(rawText, 'text/html'));
    }

    // Auto detect if RTF
    if (rawText.trim().startsWith('{\\rtf')) {
      parsedFormats.push(this.createStringFormat(rawText, 'text/rtf'));
    }

    this.setSession('manual-input', parsedFormats);
  }

  /**
   * Load Sample Preset for Windows Clipboard testing
   */
  loadSamplePreset(preset: SamplePreset): void {
    const parsedFormats: ClipboardFormat[] = [];

    for (const f of preset.formats) {
      if (f.isBinary && f.binaryBytes) {
        const uint8 = new Uint8Array(f.binaryBytes);
        const buffer = uint8.buffer;
        const hexPreview = this.generateHexDump(uint8);
        const magicByteInfo = this.detectMagicBytes(uint8);
        const base64Data = this.uint8ToBase64(uint8);

        parsedFormats.push({
          id: this.generateId(),
          mimeType: f.mimeType,
          category: this.categorizeMimeType(f.mimeType, true),
          isBinary: true,
          rawBuffer: buffer,
          byteSize: uint8.byteLength,
          hexPreview,
          base64Data,
          magicByteInfo,
          isCustomWindowsFormat: !f.mimeType.includes('/'),
          isExpanded: false,
          wrapLines: false,
          showLineNumbers: true,
        });
      } else if (f.textContent) {
        parsedFormats.push(this.createStringFormat(f.textContent, f.mimeType));
      }
    }

    this.setSession('sample-preset', parsedFormats);
  }

  clearSession(): void {
    this.currentSession.set(null);
    this.errorMessage.set(null);
  }

  private setSession(source: ClipboardSession['source'], formats: ClipboardFormat[]): void {
    const sorted = [...formats].sort((a, b) => {
      const order = ['text/plain', 'text/html', 'text/rtf', 'application/json', 'text/uri-list', 'image/png'];
      const indexA = order.indexOf(a.mimeType);
      const indexB = order.indexOf(b.mimeType);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.mimeType.localeCompare(b.mimeType);
    });

    this.currentSession.set({
      timestamp: new Date(),
      source,
      itemCount: formats.length,
      formats: sorted,
    });
  }

  private async processBlobToFormat(blob: Blob, mimeType: string): Promise<ClipboardFormat> {
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const isBinary = this.checkIsBinary(uint8Array, mimeType);

    const category = this.categorizeMimeType(mimeType, isBinary);
    const byteSize = uint8Array.byteLength;
    const isCustomWindowsFormat = !mimeType.includes('/') || mimeType.startsWith('application/x-win');

    if (isBinary) {
      const hexPreview = this.generateHexDump(uint8Array);
      const magicByteInfo = this.detectMagicBytes(uint8Array);
      const base64Data = this.uint8ToBase64(uint8Array);

      return {
        id: this.generateId(),
        mimeType,
        category,
        isBinary: true,
        rawBuffer: arrayBuffer,
        byteSize,
        hexPreview,
        base64Data,
        magicByteInfo,
        isCustomWindowsFormat,
        isExpanded: false,
        wrapLines: false,
        showLineNumbers: true,
      };
    } else {
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const textContent = textDecoder.decode(uint8Array);
      const lines = textContent.split(/\r\n|\r|\n/);

      let windowsHtmlHeaders: WindowsHtmlHeaders | undefined;
      if (mimeType.includes('html')) {
        windowsHtmlHeaders = this.parseWindowsHtmlHeaders(textContent);
      }

      return {
        id: this.generateId(),
        mimeType,
        category,
        isBinary: false,
        textContent,
        charCount: textContent.length,
        lineCount: lines.length,
        byteSize,
        windowsHtmlHeaders,
        isCustomWindowsFormat,
        isExpanded: textContent.length < 500,
        wrapLines: true,
        showLineNumbers: true,
      };
    }
  }

  private createStringFormat(text: string, mimeType: string): ClipboardFormat {
    const encoder = new TextEncoder();
    const uint8 = encoder.encode(text);
    const lines = text.split(/\r\n|\r|\n/);
    const isBinary = false;
    const category = this.categorizeMimeType(mimeType, isBinary);

    let windowsHtmlHeaders: WindowsHtmlHeaders | undefined;
    if (mimeType.includes('html')) {
      windowsHtmlHeaders = this.parseWindowsHtmlHeaders(text);
    }

    return {
      id: this.generateId(),
      mimeType,
      category,
      isBinary: false,
      textContent: text,
      charCount: text.length,
      lineCount: lines.length,
      byteSize: uint8.byteLength,
      windowsHtmlHeaders,
      isCustomWindowsFormat: !mimeType.includes('/') || mimeType.startsWith('application/x-win'),
      isExpanded: text.length < 500,
      wrapLines: true,
      showLineNumbers: true,
    };
  }

  private createPlainTextFormat(text: string): ClipboardFormat {
    return this.createStringFormat(text, 'text/plain');
  }

  private checkIsBinary(uint8: Uint8Array, mimeType: string): boolean {
    const lower = mimeType.toLowerCase();

    if (
      lower.startsWith('text/') ||
      lower.includes('json') ||
      lower.includes('xml') ||
      lower.includes('javascript') ||
      lower.includes('html') ||
      lower.includes('uri-list') ||
      lower.includes('rtf')
    ) {
      return false;
    }

    if (
      lower.startsWith('image/') ||
      lower.startsWith('audio/') ||
      lower.startsWith('video/') ||
      lower.startsWith('font/') ||
      lower.includes('octet-stream') ||
      lower.includes('zip') ||
      lower.includes('pdf')
    ) {
      return true;
    }

    const sampleSize = Math.min(uint8.length, 512);
    if (sampleSize === 0) return false;

    let unprintableCount = 0;
    for (let i = 0; i < sampleSize; i++) {
      const byte = uint8[i];
      if (byte === 0) return true;
      if (byte < 9 || (byte > 13 && byte < 32)) {
        unprintableCount++;
      }
    }

    return unprintableCount / sampleSize > 0.1;
  }

  generateHexDump(uint8: Uint8Array, maxBytes = 256): string {
    const limit = Math.min(uint8.length, maxBytes);
    const lines: string[] = [];

    for (let i = 0; i < limit; i += 16) {
      const offsetHex = i.toString(16).padStart(8, '0').toUpperCase();
      const chunk = uint8.subarray(i, Math.min(i + 16, limit));

      const hexParts: string[] = [];
      const asciiParts: string[] = [];

      for (let j = 0; j < 16; j++) {
        if (j < chunk.length) {
          const byte = chunk[j];
          hexParts.push(byte.toString(16).padStart(2, '0').toUpperCase());
          asciiParts.push(byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.');
        } else {
          hexParts.push('  ');
          asciiParts.push(' ');
        }
      }

      const leftHex = hexParts.slice(0, 8).join(' ');
      const rightHex = hexParts.slice(8, 16).join(' ');
      lines.push(`${offsetHex}  ${leftHex}  ${rightHex}  |${asciiParts.join('')}|`);
    }

    if (uint8.length > maxBytes) {
      lines.push(`\n... (${uint8.length - maxBytes} bytes truncated from display)`);
    }

    return lines.join('\n');
  }

  detectMagicBytes(uint8: Uint8Array): MagicByteInfo | undefined {
    if (uint8.length < 2) return undefined;

    const b0 = uint8[0];
    const b1 = uint8[1];
    const b2 = uint8[2] || 0;
    const b3 = uint8[3] || 0;

    if (b0 === 0x89 && b1 === 0x50 && b2 === 0x4e && b3 === 0x47) {
      return {
        formatName: 'PNG Image',
        mimeType: 'image/png',
        signatureHex: '89 50 4E 47',
        description: 'Portable Network Graphics lossless image format',
      };
    }

    if (b0 === 0xff && b1 === 0xd8 && b2 === 0xff) {
      return {
        formatName: 'JPEG Image',
        mimeType: 'image/jpeg',
        signatureHex: 'FF D8 FF',
        description: 'Joint Photographic Experts Group compressed image format',
      };
    }

    if (b0 === 0x42 && b1 === 0x4d) {
      return {
        formatName: 'Windows Bitmap (DIB)',
        mimeType: 'image/bmp',
        signatureHex: '42 4D',
        description: 'Standard Windows Device-Independent Bitmap format',
      };
    }

    if (b0 === 0x47 && b1 === 0x49 && b2 === 0x46) {
      return {
        formatName: 'GIF Image',
        mimeType: 'image/gif',
        signatureHex: '47 49 46',
        description: 'Graphics Interchange Format animated/static image',
      };
    }

    if (b0 === 0x50 && b1 === 0x4b && b2 === 0x03 && b3 === 0x04) {
      return {
        formatName: 'ZIP Archive / OpenXML',
        mimeType: 'application/zip',
        signatureHex: '50 4B 03 04',
        description: 'ZIP compressed archive or Microsoft Office OpenXML container',
      };
    }

    if (b0 === 0x25 && b1 === 0x50 && b2 === 0x44 && b3 === 0x46) {
      return {
        formatName: 'PDF Document',
        mimeType: 'application/pdf',
        signatureHex: '25 50 44 46',
        description: 'Portable Document Format file',
      };
    }

    if (b0 === 0x4d && b1 === 0x5a) {
      return {
        formatName: 'Windows Executable (MZ)',
        mimeType: 'application/x-msdownload',
        signatureHex: '4D 5A',
        description: 'Windows PE Executable or DLL binary module',
      };
    }

    if (b0 === 0x7b && b1 === 0x5c && b2 === 0x72 && b3 === 0x74) {
      return {
        formatName: 'Rich Text Format (RTF)',
        mimeType: 'text/rtf',
        signatureHex: '7B 5C 72 74',
        description: 'Microsoft Rich Text Format document structure',
      };
    }

    return {
      formatName: 'Binary Blob',
      mimeType: 'application/octet-stream',
      signatureHex: `${b0.toString(16).padStart(2, '0')} ${b1.toString(16).padStart(2, '0')}`.toUpperCase(),
      description: 'Raw unclassified binary payload',
    };
  }

  parseWindowsHtmlHeaders(htmlText: string): WindowsHtmlHeaders | undefined {
    if (!htmlText.includes('StartHTML:')) return undefined;

    const headers: WindowsHtmlHeaders = {};
    const versionMatch = htmlText.match(/Version:([0-9.]+)/i);
    const startHtmlMatch = htmlText.match(/StartHTML:([0-9]+)/i);
    const endHtmlMatch = htmlText.match(/EndHTML:([0-9]+)/i);
    const startFragMatch = htmlText.match(/StartFragment:([0-9]+)/i);
    const endFragMatch = htmlText.match(/EndFragment:([0-9]+)/i);
    const sourceUrlMatch = htmlText.match(/SourceURL:(.+)/i);

    if (versionMatch) headers.version = versionMatch[1];
    if (startHtmlMatch) headers.startHtml = parseInt(startHtmlMatch[1], 10);
    if (endHtmlMatch) headers.endHtml = parseInt(endHtmlMatch[1], 10);
    if (startFragMatch) headers.startFragment = parseInt(startFragMatch[1], 10);
    if (endFragMatch) headers.endFragment = parseInt(endFragMatch[1], 10);
    if (sourceUrlMatch) headers.sourceUrl = sourceUrlMatch[1].trim();

    return headers;
  }

  private categorizeMimeType(mimeType: string, isBinary: boolean): FormatCategory {
    const lower = mimeType.toLowerCase();
    if (isBinary || lower.startsWith('image/')) return 'binary';
    if (lower.includes('html')) return 'html';
    if (lower.includes('json')) return 'json';
    if (lower.includes('xml')) return 'xml';
    if (lower.includes('rtf')) return 'rtf';
    if (lower.includes('uri-list')) return 'uri';
    if (!lower.includes('/')) return 'custom';
    return 'text';
  }

  private uint8ToBase64(uint8: Uint8Array): string {
    let binary = '';
    const len = uint8.byteLength;
    const maxLen = Math.min(len, 64 * 1024);
    for (let i = 0; i < maxLen; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const b64 = btoa(binary);
    return len > maxLen ? `${b64}...[truncated]` : b64;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}
