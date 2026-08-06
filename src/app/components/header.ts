import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ClipboardService } from '../services/clipboard.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bg-zinc-900 border-b border-zinc-800 text-zinc-100 sticky top-0 z-30 shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        
        <!-- Left Title & Brand -->
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-sm ring-1 ring-white/20">
            <mat-icon class="text-xl">content_paste_search</mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-lg font-bold tracking-tight text-white font-mono">
                Windows 剪贴板 MIME 调试器
              </h1>
              <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-sans">
                v1.0 Developer
              </span>
            </div>
            <p class="text-xs text-zinc-400">
              Windows Clipboard MIME Formats & Binary Inspector
            </p>
          </div>
        </div>

        <!-- Right Quick Status & Actions -->
        <div class="flex items-center space-x-3 text-xs">
          @if (session(); as s) {
            <div class="hidden sm:flex items-center gap-2 bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-zinc-700/60 font-mono text-zinc-300">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>已捕获 <strong class="text-white">{{ s.itemCount }}</strong> 个 MIME 格式</span>
              <span class="text-zinc-500">|</span>
              <span class="capitalize text-zinc-400">{{ s.source }}</span>
            </div>

            <button
              type="button"
              (click)="clearClipboard()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all font-medium cursor-pointer"
            >
              <mat-icon class="text-sm">delete_sweep</mat-icon>
              <span>清空数据</span>
            </button>
          } @else {
            <span class="text-zinc-400 text-xs flex items-center gap-1">
              <mat-icon class="text-sm text-indigo-400">info</mat-icon>
              等待读取剪贴板...
            </span>
          }
        </div>

      </div>
    </header>
  `,
})
export class HeaderComponent {
  private readonly clipboardService = inject(ClipboardService);
  readonly session = this.clipboardService.currentSession;

  clearClipboard(): void {
    this.clipboardService.clearSession();
  }
}
