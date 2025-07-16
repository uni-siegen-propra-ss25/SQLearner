import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DatabaseService } from '../../services/database.service';
import { Database } from '../../models/database.model';
import { DatabaseCreateDialogComponent } from '../../dialogs/database-create-dialog/database-create-dialog.component';
import { AuthService } from 'app/features/auth/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';
import { DatabaseEditDialogComponent } from '../../dialogs/database-edit-dialog/database-edit-dialog.component';
import { DatabaseUploadDialogComponent } from '../../dialogs/database-upload-dialog/database-upload-dialog.component';
import { Subscription } from 'rxjs';
import { Role } from 'app/features/users/models/role.model';

@Component({
    selector: 'app-database-list',
    templateUrl: './database-list.component.html',
    styleUrls: ['./database-list.component.scss'],
})
export class DatabaseListComponent implements OnInit, OnDestroy {
    databases: Database[] = [];
    isTutor: boolean = false;
    private userSubscription: Subscription | undefined;

    constructor(
        private databaseService: DatabaseService,
        private dialog: MatDialog,
        private authService: AuthService,
        private router: Router,
        private snackBar: MatSnackBar,
    ) {}

    ngOnInit(): void {
        this.userSubscription = this.authService.user$.subscribe((user) => {
            this.isTutor = user?.role === Role.TUTOR;
        });
        this.loadDatabases();
    }

    ngOnDestroy(): void {
        this.userSubscription?.unsubscribe();
    }

    loadDatabases(): void {
        this.databaseService.getAllDatabases().subscribe(
            (databases: Database[]) => (this.databases = databases),
            (error: any) => console.error('Error loading databases:', error),
        );
    }

    openCreateDialog(): void {
        const dialogRef = this.dialog.open(DatabaseCreateDialogComponent, {
            width: '600px',
            data: {},
        });

        dialogRef.afterClosed().subscribe((result: any) => {
            if (result) {
                this.loadDatabases();
                this.snackBar.open('Datenbank erfolgreich erstellt!', 'OK', { duration: 3000 });
            }
        });
    }

    openEditDialog(database: Database): void {
        console.log('=== DEBUG: Opening edit dialog ===');
        console.log('Database to edit:', database);

        const dialogRef = this.dialog.open(DatabaseEditDialogComponent, {
            width: '500px',
            data: { ...database },
        });

        dialogRef.afterClosed().subscribe((result: any) => {
            console.log('=== DEBUG: Edit dialog closed ===');
            console.log('Result:', result);
            if (result) {
                console.log('=== DEBUG: Reloading databases ===');
                this.loadDatabases();
            }
        });
    }

    openDatabase(database: Database): void {
        this.router.navigate(['/databases', database.id]);
    }

    openDeleteDialog(databaseId: number): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Datenbank löschen',
                message:
                    'Möchten Sie diese Datenbank wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
            },
        });

        dialogRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.databaseService.deleteDatabase(databaseId).subscribe({
                    next: () => {
                        this.snackBar.open('Datenbank erfolgreich gelöscht.', 'OK', {
                            duration: 3000,
                        });
                        this.loadDatabases();
                    },
                    error: (error: any) => {
                        console.error('Error deleting database', error);
                        this.snackBar.open('Fehler beim Löschen der Datenbank.', 'OK', {
                            duration: 3000,
                        });
                    },
                });
            }
        });
    }

    openUploadDialog(): void {
        const dialogRef = this.dialog.open(DatabaseUploadDialogComponent, {
            width: '500px',
            data: {},
        });
        dialogRef.afterClosed().subscribe((result: any) => {
            if (result) {
                this.loadDatabases();
                this.snackBar.open('SQL-Datei erfolgreich hochgeladen.', 'OK', { duration: 3000 });
            }
        });
    }

    deleteDatabase(databaseId: number): void {
        this.openDeleteDialog(databaseId);
    }
}
