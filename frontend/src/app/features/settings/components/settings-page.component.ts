import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApiKeyDialogComponent } from '../dialogs/api-key-dialog.component';
import { SettingsService } from '../services/settings.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-settings-page',
    templateUrl: './settings-page.component.html',
    styleUrls: ['./settings-page.component.scss'],
})
export class SettingsPageComponent implements OnInit {
    hasApiKey = false;

    constructor(
        private dialog: MatDialog,
        private settingsService: SettingsService,
        private snackBar: MatSnackBar,
        private translate: TranslateService,
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
            },
        });
    }

    openApiKeyDialog() {
        this.settingsService.getSetting('OPENAI_API_KEY').subscribe({
            next: (response) => {
                const dialogRef = this.dialog.open(ApiKeyDialogComponent, {
                    width: '500px',
                    data: { apiKey: response.value || '' },
                });

                dialogRef.afterClosed().subscribe((result) => {
                    if (result) {
                        this.settingsService.setSetting('OPENAI_API_KEY', result).subscribe({
                            next: () => {
                                this.snackBar.open(
                                    this.translate.instant('SETTINGS.API_KEY_SAVED'), 
                                    'OK', 
                                    { duration: 3000 }
                                );
                                this.checkApiKey();
                            },
                            error: () => {
                                this.snackBar.open(
                                    this.translate.instant('SETTINGS.API_KEY_ERROR'), 
                                    'OK', 
                                    { duration: 3000 }
                                );
                            },
                        });
                    }
                });
            },
        });
    }
}
