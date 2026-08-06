import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ClipboardService } from '../services/clipboard.service';
import { WINDOWS_CLIPBOARD_PRESETS } from '../data/sample-presets';
import { SamplePreset } from '../models/clipboard.model';

@Component({
  selector: 'app-clipboard-input',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      <!-- Glow background accent -->
      <div class="absolute -right-20 -top-20 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -left-20 -bottom-20 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10">
        <!-- Top Action Bar -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 class="text-base font-semibold text-zinc-100 flex items-center gap-2 font-mono">
              <mat-icon class="text-indigo-400">paste</mat-icon>
              剪贴板输入与捕捉区
            </h2>
            <p class="text-xs text-zinc-400 mt-0.5">
              点击“粘贴”按键从系统剪贴板读取，或者直接在下方文本框中按 <kbd class="px-1.5 py-0.5 bg-zinc-800 text-zinc-200 border border-zinc-700 rounded text-[10px] font-mono">Ctrl + V</kbd> 粘贴 / 拖拽文件
            </p>
          </div>

          <!-- Primary Paste Button -->
          <div class="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              (click)="onPasteClick()"
              [disabled]="isLoading()"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-medium shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              @if (isLoading()) {
                <mat-icon class="animate-spin text-lg">sync</mat-icon>
                <span>正在解析 MIME 格式...</span>
              } @else {
                <mat-icon class="text-xl">content_paste</mat-icon>
                <span class="text-base font-bold">粘贴</span>
              }
            </button>
          </div>
        </div>

        <!-- Large Interactive Drop/Paste Box -->
        <div
          #pasteDropArea
          tabindex="0"
          role="region"
          aria-label="剪贴板粘贴与文件拖拽区"
          (click)="focusTextArea()"
          (keyup.enter)="focusTextArea()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          [class.border-indigo-500]="isDragging()"
          [class.bg-indigo-500/5]="isDragging()"
          class="relative group border-2 border-dashed border-zinc-700/80 hover:border-indigo-500/60 rounded-xl bg-zinc-950/60 transition-all p-4 sm:p-6 text-center cursor-text focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-500 focus:outline-none"
        >
          <!-- Accessible Textarea for direct native paste events -->
          <textarea
            #pasteTextArea
            (paste)="onNativePaste($event)"
            (input)="onTextInput($event)"
            rows="3"
            placeholder="此处为粘贴捕获区：按下 Ctrl + V 粘贴或在此拖入文件..."
            class="w-full bg-transparent text-zinc-200 placeholder-zinc-500 text-sm font-mono focus:outline-none resize-none leading-relaxed"
          ></textarea>

          <div class="flex flex-wrap items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800/80 mt-2">
            <span class="flex items-center gap-1.5">
              <mat-icon class="text-sm text-zinc-400">fit_screen</mat-icon>
              支持 Windows 多重 MIME (text/plain, text/html, text/rtf, image/png, CF_HDROP 等)
            </span>
            <span class="text-zinc-400 font-mono">
              所有 MIME 源码只显示不渲染
            </span>
          </div>
        </div>

        <!-- Error / Warning Banner if clipboard permission fails -->
        @if (errorMessage(); as err) {
          <div class="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
            <mat-icon class="text-base text-amber-400 shrink-0 mt-0.5">warning</mat-icon>
            <div class="leading-relaxed">
              <span>{{ err }}</span>
            </div>
          </div>
        }

        <!-- Windows Presets Toolbar (Preset Test Samples) -->
        <div class="mt-5 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <mat-icon class="text-zinc-400 text-sm">science</mat-icon>
            <span class="text-xs font-semibold text-zinc-300 font-mono">Windows 剪贴板测试预设:</span>
          </div>

          <div class="flex flex-wrap gap-2">
            @for (preset of presets; track preset.id) {
              <button
                type="button"
                (click)="loadPreset(preset)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-zinc-700/60 text-xs font-medium transition-all cursor-pointer"
                [title]="preset.description"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                <span>{{ preset.title }}</span>
              </button>
            }
          </div>
        </div>

      </div>
    </div>
  `,
})
export class ClipboardInputComponent {
  private readonly clipboardService = inject(ClipboardService);

  @ViewChild('pasteTextArea') pasteTextArea!: ElementRef<HTMLTextAreaElement>;

  readonly isLoading = this.clipboardService.isLoading;
  readonly errorMessage = this.clipboardService.errorMessage;
  readonly isDragging = signal<boolean>(false);

  readonly presets = WINDOWS_CLIPBOARD_PRESETS;

  // Global paste listener so anywhere the user presses Ctrl+V on the page captures data
  @HostListener('window:paste', ['$event'])
  onGlobalPaste(event: ClipboardEvent): void {
    this.clipboardService.processPasteEvent(event);
  }

  async onPasteClick(): Promise<void> {
    await this.clipboardService.pasteFromClipboard();
  }

  onNativePaste(event: ClipboardEvent): void {
    event.stopPropagation();
    this.clipboardService.processPasteEvent(event);
  }

  onTextInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    if (target.value) {
      this.clipboardService.processManualTextInput(target.value);
      target.value = '';
    }
  }

  focusTextArea(): void {
    this.pasteTextArea?.nativeElement?.focus();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.clipboardService.processDroppedFiles(event.dataTransfer.files);
    }
  }

  loadPreset(preset: SamplePreset): void {
    this.clipboardService.loadSamplePreset(preset);
  }
}
