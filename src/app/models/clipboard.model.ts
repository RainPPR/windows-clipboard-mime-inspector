export type FormatCategory = 'text' | 'html' | 'json' | 'xml' | 'rtf' | 'binary' | 'image' | 'custom' | 'uri';

export interface MagicByteInfo {
  formatName: string;
  mimeType: string;
  signatureHex: string;
  description: string;
}

export interface WindowsHtmlHeaders {
  version?: string;
  startHtml?: number;
  endHtml?: number;
  startFragment?: number;
  endFragment?: number;
  sourceUrl?: string;
}

export interface ClipboardFormat {
  id: string;
  mimeType: string; // e.g. "text/plain", "text/html", "image/png", "text/rtf"
  category: FormatCategory;
  isBinary: boolean;
  
  // Text payload
  textContent?: string;
  charCount?: number;
  lineCount?: number;
  
  // Binary / Blob payload
  rawBuffer?: ArrayBuffer;
  byteSize: number;
  hexPreview?: string; // Formatted hex dump (addresses, bytes, ascii)
  base64Data?: string;
  magicByteInfo?: MagicByteInfo;
  
  // Windows specific metadata
  windowsHtmlHeaders?: WindowsHtmlHeaders;
  isCustomWindowsFormat?: boolean;
  
  // View states
  isExpanded?: boolean;
  wrapLines?: boolean;
  showLineNumbers?: boolean;
  isHexView?: boolean;
}

export interface ClipboardSession {
  timestamp: Date;
  source: 'clipboard-api' | 'paste-event' | 'drag-drop' | 'sample-preset' | 'manual-input';
  itemCount: number;
  formats: ClipboardFormat[];
}

export interface SamplePreset {
  id: string;
  title: string;
  description: string;
  badge: string;
  formats: {
    mimeType: string;
    textContent?: string;
    binaryBytes?: number[];
    isBinary?: boolean;
  }[];
}
