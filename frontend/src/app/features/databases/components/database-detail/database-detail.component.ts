import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Data, Router } from '@angular/router';
import { DatabaseService } from '../../services/database.service';
import { TableService } from '../../services/table.service';
import { Database, DatabaseTable } from '../../models/database.model';
import { MatDialog } from '@angular/material/dialog';
import { DatabaseEditDialogComponent } from '../../dialogs/database-edit-dialog/database-edit-dialog.component';
import { AuthService } from 'app/features/auth/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-database-detail',
    templateUrl: './database-detail.component.html',
    styleUrls: ['./database-detail.component.scss']
})
export class DatabaseDetailComponent implements OnInit {
    database: Database | null = null;
    tables: DatabaseTable[] = [];
    isTutor = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private databaseService: DatabaseService,
        private tableService: TableService,
        private dialog: MatDialog,
        private authService: AuthService,
        private snackBar: MatSnackBar
    ) {
        this.isTutor = this.authService.isTutor();
    }

    ngOnInit() {
        this.loadDatabase();
        this.loadTables();
    }

    loadDatabase() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.databaseService.getDatabaseById(Number(id)).subscribe({
                next: (database: Database) => {
                    this.database = database;
                },
                error: (error: any) => {
                    console.error('Error loading database:', error);
                    this.snackBar.open('Fehler beim Laden der Datenbank', 'OK', {
                        duration: 3000
                    });
                }
            });
        }
    }

    loadTables() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.tableService.getTables(Number(id)).subscribe({
                next: (tables: DatabaseTable[]) => {
                    this.tables = tables.map((table: DatabaseTable) => ({
                        ...table,
                        columnCount: table.columns.length
                    }));
                },
                error: (error: any) => {
                    console.error('Error loading tables:', error);
                    this.snackBar.open('Fehler beim Laden der Tabellen', 'OK', {
                        duration: 3000
                    });
                }
            });
        }
    }

    onBack() {
        this.router.navigate(['/databases']);
    }

    openEditDialog() {
        if (!this.database) return;

        const dialogRef = this.dialog.open(DatabaseEditDialogComponent, {
            width: '500px',
            data: { ...this.database }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadDatabase();
            }
        });
    }

    viewTable(table: DatabaseTable) {
        if (!this.database) return;
        this.router.navigate(['/databases', this.database.id, 'tables', table.id]);
    }
}