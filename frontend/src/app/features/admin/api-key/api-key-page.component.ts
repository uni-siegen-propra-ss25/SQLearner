
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApiKeyDialogComponent } from './api-key-dialog.component';
import { ApiKeyService } from './api-key.service';

@Component({
  selector: 'app-api-key-page',
  template: `
    <div class="api-key-page-container">
      <h1>API-Key verwalten</h1>
      <button mat-raised-button color="primary" (click)="openDialog()">API-Key eingeben/ändern</button>
    </div>
  `,
  styles: [`.api-key-page-container { padding: 2rem; }`]
})
export class ApiKeyPageComponent {
  constructor(private dialog: MatDialog, private apiKeyService: ApiKeyService) {}

  openDialog() {
    this.apiKeyService.getApiKey().subscribe(({ apiKey }) => {
      const dialogRef = this.dialog.open(ApiKeyDialogComponent, {
        width: '400px',
        data: { apiKey: apiKey || '' }
      });
      dialogRef.afterClosed().subscribe((result: string | undefined) => {
        if (result !== undefined) {
          this.apiKeyService.setApiKey(result).subscribe();
        }
      });
    });
  }
}
