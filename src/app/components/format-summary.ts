import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ClipboardService } from '../services/clipboard.service';

@Component({
  selector: 'app-format-summary',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (session(); as s) {
      <div class="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <!-- Top Session Meta Bar -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span class="text-sm font-semibold text-zinc-100 font-mono">剪贴板内容分析</span>
            <span class="text-xs text-zinc-400 font-mono">
              ({{ s.timestamp | date:'HH:mm:ss' }})
            </span>
          </div>

          <!-- Format Stats Pills -->
          <div class="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span class="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <mat-icon class="text-sm">view_list</mat-icon>
              总共 <strong>{{ stats().total }}</strong> 个 MIME 格式
            </span>
            <span class="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <mat-icon class="text-sm">article</mat-icon>
              文本: <strong>{{ stats().textCount }}</strong>
            </span>
            <span class="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <mat-icon class="text-sm">memory</mat-icon>
              二进制: <strong>{{ stats().binaryCount }}</strong>
            </span>
            <span class="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1.5">
              <mat-icon class="text-sm">data_object</mat-icon>
              总大小: <strong>{{ formatBytes(stats().totalBytes) }}</strong>
            </span>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <!-- Filter Tabs -->
          <div class="flex flex-wrap items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            @for (tab of filterTabs; track tab.id) {
              <button
                type="button"
                (click)="setCategory(tab.id)"
                [class.bg-indigo-600]="activeCategory() === tab.id"
                [class.text-white]="activeCategory() === tab.id"
                [class.text-zinc-400]="activeCategory() !== tab.id"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:text-white cursor-pointer"
              >
                {{ tab.label }}
              </button>
            }
          </div>

          <!-- Search Input -->
          <div class="relative min-w-[220px]">
            <mat-icon class="text-sm text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2">search</mat-icon>
            <input
              type="text"
              [value]="searchQuery()"
              (input)="onSearchInput($event)"
              placeholder="搜索 MIME 名称或文本内容..."
              class="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500/70 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
            />
            @if (searchQuery()) {
              <button
                type="button"
                (click)="clearSearch()"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <mat-icon class="text-sm">cancel</mat-icon>
              </button>
            }
          </div>

        </div>

      </div>
    }
  `,
})
export class FormatSummaryComponent {
  private readonly clipboardService = inject(ClipboardService);

  readonly session = this.clipboardService.currentSession;
  readonly stats = this.clipboardService.formatStats;
  readonly activeCategory = this.clipboardService.activeCategoryFilter;
  readonly searchQuery = this.clipboardService.searchQuery;

  readonly filterTabs = [
    { id: 'all', label: '全部格式 (All)' },
    { id: 'text', label: '文本源码 (Text)' },
    { id: 'html', label: 'HTML/Web' },
    { id: 'binary', label: '二进制/图片 (Binary)' },
    { id: 'custom', label: 'Windows 自定义格式' },
  ];

  setCategory(categoryId: string): void {
    this.clipboardService.activeCategoryFilter.set(categoryId);
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.clipboardService.searchQuery.set(val);
  }

  clearSearch(): void {
    this.clipboardService.searchQuery.set('');
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
