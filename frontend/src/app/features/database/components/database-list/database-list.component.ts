import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from 'app/features/auth/services/auth.service';
import { DatabaseCreateDialogComponent } from '../../dialogs/database-create-dialog/database-create-dialog.component';
import { DatabaseEditDialogComponent } from '../../dialogs/database-edit-dialog/database-edit-dialog.component';
import { DatabaseViewDialogComponent } from '../../dialogs/database-view-dialog/database-view-dialog.component';
import { Database } from '../../models/database.model';
import { DatabaseService } from '../../services/database.service';

@Component({
    selector: 'app-database-list',
    templateUrl: './database-list.component.html',
    styleUrls: ['./database-list.component.scss'],
})
export class DatabaseListComponent implements OnInit {
    databases: Database[] = [];
    isTutor = false;
    displayedColumns: string[] = ['name', 'description', 'createdAt', 'actions'];


    constructor(
        private databaseService: DatabaseService,
        private dialog: MatDialog,
        private authService: AuthService,
        private router: Router
    ) {
        this.isTutor = this.authService.isTutor();
    }


    ngOnInit(): void {
        this.loadDatabases();
    }

    loadDatabases(): void {
        this.databaseService.getAllDatabases().subscribe(
            (databases) => (this.databases = databases),
            (error) => console.error('Error loading databases:', error),
        );
    }

    openUploadDialog(): void {
        const dialogRef = this.dialog.open(DatabaseEditDialogComponent);
        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadDatabases();
            }
        });
    }

    openCreateDialog(): void {
        const dialogRef = this.dialog.open(DatabaseCreateDialogComponent);
        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadDatabases();
            }
        });
    }

    viewDatabase(database: Database): void {
        this.dialog.open(DatabaseViewDialogComponent, {
            data: {
                database: database
            },
            maxWidth: '90vw',
            maxHeight: '90vh',
        });
    }

    deleteDatabase(id: number): void {
        if (confirm('Are you sure you want to delete this database?')) {
            this.databaseService.deleteDatabase(id).subscribe(
                () => this.loadDatabases(),
                (error) => console.error('Error deleting database:', error),
            );
        }
    }

    openEditDialog(database: Database): void {
        const dialogRef = this.dialog.open(DatabaseEditDialogComponent, {
            data: database
        });
        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadDatabases();
            }
        });
    }
}