import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DatabaseService } from '../../services/database.service';
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
    queryResult: any = null;
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
            description: [data.description],
            schemaSql: ['', Validators.required],
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
            // First update the schema in the database
            this.databaseService.runQuery(this.data.id, this.form.get('schemaSql')?.value).subscribe({
                next: () => {
                    // Then update the record in the Database table
                    this.databaseService.updateDatabase(this.data.id, this.form.value).subscribe({
                        next: (database: Database) => {
                            this.snackBar.open('Database updated successfully', 'Close', {
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
                },
                error: (error: any) => {
                    console.error('Error updating schema:', error);
                    this.snackBar.open(error.error.message || 'Error updating schema', 'Close', {
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
