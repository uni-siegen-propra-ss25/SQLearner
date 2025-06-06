import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApiKeyDialogComponent } from '../dialogs/api-key-dialog.component';
import { SettingsService } from '../services/settings.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-settings-page',
  template: `
    <div class="settings-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Systemeinstellungen</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <section>
            <h3>OpenAI API-Key</h3>
            <p>API-Key für die KI-Funktionalitäten des Systems.</p>
            <button mat-raised-button color="primary" (click)="openApiKeyDialog()">
              {{ hasApiKey ? 'API-Key ändern' : 'API-Key hinzufügen' }}
            </button>
          </section>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    section {
      margin: 1.5rem 0;
    }
    h3 {
      margin-bottom: 0.5rem;
    }
    p {
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 1rem;
    }
  `]
})
export class SettingsPageComponent implements OnInit {
  hasApiKey = false;

  constructor(
    private dialog: MatDialog,
    private settingsService: SettingsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.checkApiKey();
  }

  checkApiKey() {
    this.settingsService.getSetting('OPENAI_API_KEY').subscribe({
      next: (response) => {
        this.hasApiKey = !!response.value;
      },
      error: () => {
        this.hasApiKey = false;
      }
    });
  }

  openApiKeyDialog() {
    this.settingsService.getSetting('OPENAI_API_KEY').subscribe({
      next: (response) => {
        const dialogRef = this.dialog.open(ApiKeyDialogComponent, {
          width: '500px',
          data: { apiKey: response.value || '' }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.settingsService.setSetting('OPENAI_API_KEY', result).subscribe({
              next: () => {
                this.snackBar.open('API-Key erfolgreich gespeichert', 'OK', { duration: 3000 });
                this.checkApiKey();
              },
              error: () => {
                this.snackBar.open('Fehler beim Speichern des API-Keys', 'OK', { duration: 3000 });
              }
            });
          }
        });
      }
    });
  }
}
