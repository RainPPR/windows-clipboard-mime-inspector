import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ClipboardFormat } from '../models/clipboard.model';

@Component({
  selector: 'app-format-card',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg hover:border-zinc-700/80 transition-all duration-200">
      
      <!-- Card Header -->
      <div class="bg-zinc-950/80 px-4 py-3 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        
        <!-- MIME Badge & Category Tag -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <span
            [ngClass]="getMimeBadgeClass(format.mimeType, format.isBinary)"
            class="px-3 py-1 rounded-lg text-xs font-bold font-mono tracking-wide border shadow-sm flex items-center gap-1.5"
          >
            <mat-icon class="text-sm">{{ getMimeIcon(format.mimeType, format.isBinary) }}</mat-icon>
            {{ format.mimeType }}
          </span>

          <!-- Category Pill -->
          <span class="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
            {{ format.category.toUpperCase() }}
          </span>

          <!-- Custom Windows Format Indicator -->
          @if (format.isCustomWindowsFormat) {
            <span class="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <mat-icon class="text-xs">desktop_windows</mat-icon>
              Windows Native CF
            </span>
          }

          <!-- Size / Stats Badges -->
          <div class="flex items-center gap-2 text-xs text-zinc-400 font-mono">
            <span>{{ formatBytes(format.byteSize) }}</span>
            @if (!format.isBinary) {
              <span>•</span>
              <span>{{ format.charCount }} 字符</span>
              <span>•</span>
              <span>{{ format.lineCount }} 行</span>
            }
          </div>
        </div>

        <!-- Action Controls -->
        <div class="flex items-center gap-1.5 text-xs">
          <!-- Copy Raw Action -->
          <button
            type="button"
            (click)="copyPayload()"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 font-mono transition-all cursor-pointer"
            [title]="copied() ? '已复制到剪贴板！' : '复制原始数据源码'"
          >
            <mat-icon class="text-sm" [class.text-emerald-400]="copied()">
              {{ copied() ? 'check' : 'content_copy' }}
            </mat-icon>
            <span>{{ copied() ? '已复制' : '复制源码' }}</span>
          </button>

          <!-- Download File Button -->
          <button
            type="button"
            (click)="downloadFile()"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 font-mono transition-all cursor-pointer"
            title="下载为文件"
          >
            <mat-icon class="text-sm">download</mat-icon>
            <span>下载</span>
          </button>

          <!-- Toggle Expand / Collapse -->
          <button
            type="button"
            (click)="toggleExpand()"
            class="inline-flex items-center justify-center p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition-all cursor-pointer"
            [title]="isExpanded() ? '折叠面板' : '展开面板'"
          >
            <mat-icon class="text-base">
              {{ isExpanded() ? 'expand_less' : 'expand_more' }}
            </mat-icon>
          </button>
        </div>

      </div>

      <!-- Card Body Content -->
      <div class="p-4 space-y-3">

        <!-- Special Header Accordion if Windows HTML Format Headers parsed -->
        @if (format.windowsHtmlHeaders; as headers) {
          <div class="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-3 text-xs font-mono space-y-1.5">
            <div class="flex items-center justify-between text-indigo-300 font-bold border-b border-indigo-500/20 pb-1">
              <span class="flex items-center gap-1">
                <mat-icon class="text-sm">code</mat-icon>
                Windows HTML Format Clipboard Headers (Win32 API Header)
              </span>
              <span>Version: {{ headers.version || '0.9' }}</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-zinc-300 pt-1">
              <div><span class="text-zinc-500">StartHTML:</span> {{ headers.startHtml ?? 'N/A' }}</div>
              <div><span class="text-zinc-500">EndHTML:</span> {{ headers.endHtml ?? 'N/A' }}</div>
              <div><span class="text-zinc-500">StartFragment:</span> {{ headers.startFragment ?? 'N/A' }}</div>
              <div><span class="text-zinc-500">EndFragment:</span> {{ headers.endFragment ?? 'N/A' }}</div>
            </div>
            @if (headers.sourceUrl) {
              <div class="truncate text-zinc-400">
                <span class="text-zinc-500">SourceURL:</span> {{ headers.sourceUrl }}
              </div>
            }
          </div>
        }

        <!-- CASE 1: Text-Based Source Code Viewer -->
        @if (!format.isBinary) {
          <div class="space-y-2">
            
            <!-- Code View Options Bar -->
            <div class="flex items-center justify-between text-xs text-zinc-400 font-mono">
              <div class="flex items-center gap-3">
                <label class="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    [checked]="wrapLines()"
                    (change)="toggleWrap()"
                    class="rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-0 cursor-pointer"
                  />
                  <span>自动换行</span>
                </label>

                <label class="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    [checked]="showLineNumbers()"
                    (change)="toggleLineNumbers()"
                    class="rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-0 cursor-pointer"
                  />
                  <span>显示行号</span>
                </label>
              </div>

              <span class="text-zinc-500">
                纯文本编码 / Raw Source View
              </span>
            </div>

            <!-- Content Area with Dynamic Height Logic:
                 Short text -> compact box
                 Long text -> scrollable with max-h-[380px] or full expanded height if toggled -->
            <div
              [ngClass]="{
                'max-h-[380px] overflow-y-auto': !isExpanded() && (format.lineCount || 0) > 12,
                'whitespace-pre-wrap word-break-all': wrapLines(),
                'whitespace-pre overflow-x-auto': !wrapLines()
              }"
              class="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 font-mono text-xs text-zinc-200 leading-relaxed relative group transition-all"
            >
              @if (showLineNumbers() && textLines().length > 0) {
                <div class="table w-full">
                  @for (line of textLines(); track $index) {
                    <div class="table-row hover:bg-zinc-900/60">
                      <span class="table-cell select-none pr-4 text-right text-zinc-600 font-mono w-10 border-r border-zinc-800/60 shrink-0">
                        {{ $index + 1 }}
                      </span>
                      <span class="table-cell pl-4 text-zinc-200">
                        {{ line || ' ' }}
                      </span>
                    </div>
                  }
                </div>
              } @else {
                <code>{{ format.textContent }}</code>
              }
            </div>

            <!-- Dynamic Height Toggle Indicator for Long Text -->
            @if ((format.lineCount || 0) > 12 || (format.charCount || 0) > 600) {
              <div class="flex items-center justify-center pt-1">
                <button
                  type="button"
                  (click)="toggleExpand()"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-indigo-300 text-xs font-mono border border-zinc-700/60 transition-all cursor-pointer"
                >
                  <mat-icon class="text-sm">
                    {{ isExpanded() ? 'unfold_less' : 'unfold_more' }}
                  </mat-icon>
                  <span>{{ isExpanded() ? '收起长文档' : '展开显示全部 (' + format.lineCount + ' 行 / ' + format.charCount + ' 字符)' }}</span>
                </button>
              </div>
            }

          </div>
        }

        <!-- CASE 2: Binary Payload / Binary File Inspector Placeholder -->
        @if (format.isBinary) {
          <div class="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 space-y-4">
            
            <!-- Binary Magic Header Info Card -->
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <mat-icon class="text-xl">memory</mat-icon>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="text-sm font-bold text-zinc-100 font-mono">
                      {{ format.magicByteInfo?.formatName || '二进制载荷 (Binary Payload)' }}
                    </h4>
                    @if (format.magicByteInfo?.signatureHex) {
                      <span class="px-2 py-0.5 text-[10px] font-mono font-semibold bg-zinc-800 text-amber-300 border border-zinc-700 rounded">
                        魔数: {{ format.magicByteInfo?.signatureHex }}
                      </span>
                    }
                  </div>
                  <p class="text-xs text-zinc-400 mt-0.5">
                    {{ format.magicByteInfo?.description || '检测到非文本进制字节，以 Hex 结构化安全视图呈现' }}
                  </p>
                </div>
              </div>

              <!-- Binary Actions -->
              <div class="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  (click)="toggleHexMode()"
                  class="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 border border-zinc-700/60 cursor-pointer"
                >
                  {{ showHex() ? '隐藏 Hex' : '查看 Hex 内存转储' }}
                </button>
              </div>
            </div>

            <!-- Hex Dump Monospace View -->
            @if (showHex() && format.hexPreview) {
              <div class="space-y-1.5">
                <div class="text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                  <span>十六进制内存映射 (Address | Hex Bytes | ASCII)</span>
                  <span>前 256 字节 Hex</span>
                </div>
                <pre class="bg-black/90 p-3 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed border border-zinc-800/80"><code>{{ format.hexPreview }}</code></pre>
              </div>
            }

            <!-- Base64 Metadata Inspector -->
            @if (format.base64Data) {
              <div class="bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/60 space-y-1 text-xs font-mono">
                <div class="flex items-center justify-between text-zinc-400">
                  <span>Base64 编码数据预览:</span>
                  <button
                    type="button"
                    (click)="copyBase64()"
                    class="text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                  >
                    {{ copiedBase64() ? '已复制 Base64' : '复制 Base64 文本' }}
                  </button>
                </div>
                <div class="text-zinc-500 truncate text-[11px] select-all bg-black/40 p-1.5 rounded">
                  data:{{ format.mimeType }};base64,{{ format.base64Data }}
                </div>
              </div>
            }

            <!-- Optional Image Thumbnail Preview if Image format -->
            @if (isImageFormat(format.mimeType) && format.base64Data) {
              <div class="pt-2 border-t border-zinc-800/80 flex items-center gap-4">
                <div class="text-xs text-zinc-400 font-mono">图像可视化缩略图:</div>
                <div class="bg-zinc-900 p-2 rounded-lg border border-zinc-800 inline-block">
                  <img
                    [src]="'data:' + format.mimeType + ';base64,' + format.base64Data"
                    alt="Clipboard Image Preview"
                    class="max-h-32 rounded object-contain"
                  />
                </div>
              </div>
            }

          </div>
        }

      </div>
    </div>
  `,
})
export class FormatCardComponent implements OnInit {
  @Input({ required: true }) format!: ClipboardFormat;

  readonly isExpanded = signal<boolean>(false);
  readonly wrapLines = signal<boolean>(true);
  readonly showLineNumbers = signal<boolean>(true);
  readonly copied = signal<boolean>(false);
  readonly copiedBase64 = signal<boolean>(false);
  readonly showHex = signal<boolean>(true);

  ngOnInit(): void {
    if (this.format) {
      this.isExpanded.set(this.format.isExpanded ?? false);
    }
  }

  get textLines(): () => string[] {
    return () => (this.format.textContent ? this.format.textContent.split(/\r\n|\r|\n/) : []);
  }

  toggleExpand(): void {
    this.isExpanded.update((v) => !v);
  }

  toggleWrap(): void {
    this.wrapLines.update((v) => !v);
  }

  toggleLineNumbers(): void {
    this.showLineNumbers.update((v) => !v);
  }

  toggleHexMode(): void {
    this.showHex.update((v) => !v);
  }

  async copyPayload(): Promise<void> {
    const textToCopy = this.format.textContent || this.format.base64Data || '';
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch (err) {
      console.warn('Navigator writeText failed, using textarea fallback', err);
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }

  async copyBase64(): Promise<void> {
    if (!this.format.base64Data) return;
    const b64 = `data:${this.format.mimeType};base64,${this.format.base64Data}`;
    try {
      await navigator.clipboard.writeText(b64);
      this.copiedBase64.set(true);
      setTimeout(() => this.copiedBase64.set(false), 2000);
    } catch (err) {
      console.warn('Copy base64 failed:', err);
    }
  }

  downloadFile(): void {
    let blob: Blob;
    let fileName = `clipboard-${this.format.mimeType.replace('/', '-')}`;

    if (this.format.isBinary && this.format.rawBuffer) {
      blob = new Blob([this.format.rawBuffer], { type: this.format.mimeType });
      const ext = this.getExtFromMime(this.format.mimeType);
      fileName += `.${ext}`;
    } else {
      blob = new Blob([this.format.textContent || ''], { type: 'text/plain;charset=utf-8' });
      const ext = this.getExtFromMime(this.format.mimeType);
      fileName += `.${ext}`;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  getMimeBadgeClass(mimeType: string, isBinary: boolean): string {
    if (isBinary) {
      return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    }
    if (mimeType.includes('html')) {
      return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
    }
    if (mimeType.includes('json')) {
      return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    }
    if (mimeType.includes('rtf')) {
      return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
    }
    if (mimeType.includes('uri')) {
      return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
    }
    return 'bg-zinc-800 text-zinc-200 border-zinc-700';
  }

  getMimeIcon(mimeType: string, isBinary: boolean): string {
    if (isBinary) return 'memory';
    if (mimeType.includes('html')) return 'html';
    if (mimeType.includes('json')) return 'data_object';
    if (mimeType.includes('xml')) return 'code';
    if (mimeType.includes('rtf')) return 'description';
    if (mimeType.includes('uri')) return 'link';
    return 'article';
  }

  isImageFormat(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private getExtFromMime(mime: string): string {
    if (mime.includes('html')) return 'html';
    if (mime.includes('json')) return 'json';
    if (mime.includes('xml')) return 'xml';
    if (mime.includes('rtf')) return 'rtf';
    if (mime.includes('png')) return 'png';
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
    if (mime.includes('bmp')) return 'bmp';
    if (mime.includes('uri')) return 'txt';
    return 'txt';
  }
}
