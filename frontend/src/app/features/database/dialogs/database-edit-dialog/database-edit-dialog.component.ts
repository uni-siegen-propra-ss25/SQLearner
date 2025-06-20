import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DatabaseService, QueryResult } from '../../services/database.service';
import { Database } from '../../models/database.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-edit-database-dialog',
    templateUrl: './database-edit-dialog.component.html',
    styleUrls: ['./database-edit-dialog.component.scss'],
})
export class DatabaseEditDialogComponent {
    form: FormGroup;
    queryForm: FormGroup;
    queryResult: QueryResult | null = null;
    isExecutingQuery = false;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<DatabaseEditDialogComponent>,
        private databaseService: DatabaseService,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public data: Database,
    ) {
        this.form = this.fb.group({
            name: [data.name, Validators.required],
        });

        this.queryForm = this.fb.group({
            query: ['', Validators.required]
        });
    }

    executeQuery() {
        if (this.queryForm.valid) {
            this.isExecutingQuery = true;
            const query = this.queryForm.get('query')?.value;

            this.databaseService.runQuery(this.data.id, query).subscribe({
                next: (result) => {
                    this.queryResult = result;
                    this.snackBar.open('Query executed successfully', 'Close', {
                        duration: 3000
                    });
                },
                error: (error) => {
                    console.error('Error executing query:', error);
                    this.snackBar.open(error.error.message || 'Error executing query', 'Close', {
                        duration: 5000
                    });
                },
                complete: () => {
                    this.isExecutingQuery = false;
                }
            });
        }
    }

    onSubmit() {
        if (this.form.valid) {
            this.databaseService.updateDatabase(this.data.id, { name: this.form.value.name }).subscribe({
                next: (database: Database) => {
                    this.snackBar.open('Database name updated successfully', 'Close', {
                        duration: 3000
                    });
                    this.dialogRef.close(database);
                },
                error: (error: any) => {
                    console.error('Error updating database:', error);
                    this.snackBar.open(error.error.message || 'Error updating database', 'Close', {
                        duration: 5000
                    });
                }
            });
        }
    }

    onCancel() {
        this.dialogRef.close();
    }

    clearQueryResult() {
        this.queryResult = null;
    }
}
