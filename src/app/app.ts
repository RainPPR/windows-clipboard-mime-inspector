import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from './components/header';
import { ClipboardInputComponent } from './components/clipboard-input';
import { FormatSummaryComponent } from './components/format-summary';
import { FormatCardComponent } from './components/format-card';
import { ClipboardService } from './services/clipboard.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    MatIconModule,
    HeaderComponent,
    ClipboardInputComponent,
    FormatSummaryComponent,
    FormatCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly clipboardService = inject(ClipboardService);

  readonly currentSession = this.clipboardService.currentSession;
  readonly filteredFormats = this.clipboardService.filteredFormats;
}
