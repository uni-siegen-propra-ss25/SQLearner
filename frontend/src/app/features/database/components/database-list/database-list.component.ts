import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from 'app/features/auth/services/auth.service';
import { CreateDatabaseDialogComponent } from '../../dialogs/create-database-dialog/create-database-dialog.component';
import { EditDatabaseDialogComponent } from '../../dialogs/edit-database-dialog/edit-database-dialog.component';
import { UploadDatabaseDialogComponent } from '../../dialogs/upload-database-dialog/upload-database-dialog.component';
import { Database } from '../../models/database.model';
import { DatabaseService } from '../../services/database.service';

@Component({
    selector: 'app-database-list',
    templateUrl: './database-list.component.html',
    styleUrls: ['./database-list.component.scss']
})
export class DatabaseListComponent implements OnInit {
    databases: Database[] = [];
    isTutor = false;
    displayedColumns: string[] = ['name', 'description', 'createdAt', 'actions'];

    constructor(
        private databaseService: DatabaseService,
        private dialog: MatDialog,
        private authService: AuthService
    ) {
        this.isTutor = this.authService.isTutor();
    }

    ngOnInit(): void {
        this.loadDatabases();
    }

    loadDatabases(): void {
        this.databaseService.getAllDatabases().subscribe(
            databases => this.databases = databases,
            error => console.error('Error loading databases:', error)
        );
    }

    openUploadDialog(): void {
        const dialogRef = this.dialog.open(UploadDatabaseDialogComponent);
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadDatabases();
            }
        });
    }

    openCreateDialog(): void {
        const dialogRef = this.dialog.open(CreateDatabaseDialogComponent);
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadDatabases();
            }
        });
    }

    openEditDialog(database: Database): void {
        const dialogRef = this.dialog.open(EditDatabaseDialogComponent, {
            data: database
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadDatabases();
            }
        });
    }

    deleteDatabase(id: number): void {
        if (confirm('Are you sure you want to delete this database?')) {
            this.databaseService.deleteDatabase(id).subscribe(
                () => this.loadDatabases(),
                error => console.error('Error deleting database:', error)
            );
        }
    }

    viewDatabase(database: Database) {
        // TODO: Implement database visualization
        console.log('View database:', database);
    }
} 